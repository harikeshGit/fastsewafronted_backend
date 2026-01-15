[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int]$Port = 4000,

    [Parameter(Mandatory = $false)]
    [int]$WaitSeconds = 60,

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
$npmCmd = Resolve-ExePath -Names @('npm.cmd', 'npm')
if (!$npmCmd) {
    throw "npm not found. Install Node.js (includes npm) and try again."
}

$backendProc = Start-Process -FilePath $npmCmd -ArgumentList @('run', 'dev') -WorkingDirectory $backendDir -PassThru

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
    try { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    throw "Backend did not start listening on port $Port within ${WaitSeconds}s."
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
}
