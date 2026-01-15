[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int]$Port = 4000,

    [Parameter(Mandatory = $false)]
    [int]$WaitSeconds = 60,

    [Parameter(Mandatory = $false)]
    [string]$EmailDomainAllowlist,

    [Parameter(Mandatory = $false)]
    [string]$EmailDomainBlocklist,

    [Parameter(Mandatory = $false)]
    [switch]$BlockFreeEmails,

    [Parameter(Mandatory = $false)]
    [switch]$SmokeTest
)

$ErrorActionPreference = 'Stop'

function Resolve-ExePath {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Names
    )

    foreach ($name in $Names) {
        $cmd = Get-Command -Name $name -ErrorAction SilentlyContinue
        if ($cmd) {
            if ($cmd.PSObject.Properties.Match('Path').Count -gt 0 -and $cmd.Path) { return $cmd.Path }
            if ($cmd.PSObject.Properties.Match('Source').Count -gt 0 -and $cmd.Source) { return $cmd.Source }
            if ($cmd.Definition) { return $cmd.Definition }
        }
    }

    return $null
}

$rootDir = Split-Path -Parent $PSCommandPath
$backendDir = Join-Path $rootDir 'admin-backend'
$tunnelScript = Join-Path $rootDir 'cloudflare-tunnel.ps1'

if (!(Test-Path -Path $backendDir)) {
    throw "Backend folder not found: $backendDir"
}
if (!(Test-Path -Path $tunnelScript)) {
    throw "Tunnel script not found: $tunnelScript"
}

Write-Host "Starting backend in: $backendDir"
$oldAllow = $env:EMAIL_DOMAIN_ALLOWLIST
$oldBlock = $env:EMAIL_DOMAIN_BLOCKLIST
$oldFree = $env:BLOCK_FREE_EMAILS

if ($EmailDomainAllowlist) { $env:EMAIL_DOMAIN_ALLOWLIST = $EmailDomainAllowlist }
if ($EmailDomainBlocklist) { $env:EMAIL_DOMAIN_BLOCKLIST = $EmailDomainBlocklist }
if ($BlockFreeEmails) { $env:BLOCK_FREE_EMAILS = 'true' }
$npmCmd = Resolve-ExePath -Names @('npm.cmd', 'npm')
if (!$npmCmd) {
    throw "npm not found. Install Node.js (includes npm) and try again."
}

$stdout = Join-Path $env:TEMP "backend-$PID.stdout.log"
$stderr = Join-Path $env:TEMP "backend-$PID.stderr.log"
if (Test-Path $stdout) { Remove-Item $stdout -Force -ErrorAction SilentlyContinue }
if (Test-Path $stderr) { Remove-Item $stderr -Force -ErrorAction SilentlyContinue }

$backendProc = Start-Process -FilePath $npmCmd -ArgumentList @('run', 'dev') -WorkingDirectory $backendDir -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr

function Wait-ForPort {
    param(
        [int]$PortToCheck,
        [int]$TimeoutSeconds
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $ok = Test-NetConnection -ComputerName '127.0.0.1' -Port $PortToCheck -WarningAction SilentlyContinue
            if ($ok.TcpTestSucceeded) {
                return $true
            }
        }
        catch {}
        Start-Sleep -Seconds 1
    }
    return $false
}

Write-Host "Waiting for backend to listen on port $Port (timeout: ${WaitSeconds}s)..."
$ready = Wait-ForPort -PortToCheck $Port -TimeoutSeconds $WaitSeconds
if (!$ready) {
    $stillRunning = $false
    try { $stillRunning = (Get-Process -Id $backendProc.Id -ErrorAction SilentlyContinue) -ne $null } catch {}

    if (!$stillRunning) {
        $errText = ''
        if (Test-Path $stderr) { $errText = (Get-Content -Path $stderr -Raw -ErrorAction SilentlyContinue) }
        throw "Backend process exited before port $Port opened. See logs: $stdout and $stderr. Error output: $errText"
    }

    try { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    $errText2 = ''
    if (Test-Path $stderr) { $errText2 = (Get-Content -Path $stderr -Raw -ErrorAction SilentlyContinue) }
    throw "Backend did not start listening on port $Port within ${WaitSeconds}s. Logs: $stdout and $stderr. Error output: $errText2"
}

Write-Host "Backend is up. Starting Cloudflare Tunnel... (Ctrl+C to stop)"

try {
    if ($SmokeTest) {
        powershell -NoProfile -ExecutionPolicy Bypass -File $tunnelScript -Port $Port -SmokeTest
    }
    else {
        powershell -NoProfile -ExecutionPolicy Bypass -File $tunnelScript -Port $Port
    }
}
finally {
    try { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue } catch {}

    # Restore environment to avoid surprising the parent PowerShell session
    $env:EMAIL_DOMAIN_ALLOWLIST = $oldAllow
    $env:EMAIL_DOMAIN_BLOCKLIST = $oldBlock
    $env:BLOCK_FREE_EMAILS = $oldFree
}
