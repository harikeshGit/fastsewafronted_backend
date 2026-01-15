[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int]$Port = 8080,

    [Parameter(Mandatory = $false)]
    [int]$WaitSeconds = 30,

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
            $candidate = $null
            if ($cmd.PSObject.Properties.Match('Path').Count -gt 0 -and $cmd.Path) { $candidate = $cmd.Path }
            elseif ($cmd.PSObject.Properties.Match('Source').Count -gt 0 -and $cmd.Source) { $candidate = $cmd.Source }
            elseif ($cmd.Definition) { $candidate = $cmd.Definition }

            if ($candidate) {
                # If it looks like a filesystem path, ensure it exists.
                if ($candidate -match '^[A-Za-z]:\\' -or $candidate -like '*.exe') {
                    if (Test-Path -Path $candidate) { return $candidate }
                }
                else {
                    return $candidate
                }
            }
        }
    }

    return $null
}

$rootDir = Split-Path -Parent $PSCommandPath
$frontendDir = Join-Path $rootDir 'fastsewafronted'
$tunnelScript = Join-Path $rootDir 'cloudflare-tunnel.ps1'

if (!(Test-Path -Path $frontendDir)) {
    throw "Frontend folder not found: $frontendDir"
}
if (!(Test-Path -Path $tunnelScript)) {
    throw "Tunnel script not found: $tunnelScript"
}

Write-Host "Starting frontend static server in: $frontendDir"
$stdout = Join-Path $env:TEMP "frontend-$PID.stdout.log"
$stderr = Join-Path $env:TEMP "frontend-$PID.stderr.log"
if (Test-Path $stdout) { Remove-Item $stdout -Force -ErrorAction SilentlyContinue }
if (Test-Path $stderr) { Remove-Item $stderr -Force -ErrorAction SilentlyContinue }

$nodeCmd = Resolve-ExePath -Names @('node.exe', 'node')
$serverScript = Join-Path $rootDir 'tools\static-server.js'

if ($nodeCmd -and (Test-Path -Path $serverScript)) {
    Write-Host "Using Node static server: $nodeCmd"
    $argString = "`"$serverScript`" --root `"$frontendDir`" --port $Port --host 127.0.0.1"
    $frontendProc = Start-Process -FilePath $nodeCmd -ArgumentList $argString -WorkingDirectory $rootDir -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
}
else {
    $pythonCmd = Resolve-ExePath -Names @('py.exe', 'py', 'python')
    if (!$pythonCmd) {
        throw "Neither Node nor Python found. Install Node.js or Python 3, then try again."
    }

    Write-Host "Using Python static server: $pythonCmd"
    $argString = "-m http.server $Port --bind 127.0.0.1"
    $frontendProc = Start-Process -FilePath $pythonCmd -ArgumentList $argString -WorkingDirectory $frontendDir -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
}

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

Write-Host "Waiting for frontend to listen on port $Port (timeout: ${WaitSeconds}s)..."
$ready = Wait-ForPort -PortToCheck $Port -TimeoutSeconds $WaitSeconds
if (!$ready) {
    $stillRunning = $false
    try { $stillRunning = (Get-Process -Id $frontendProc.Id -ErrorAction SilentlyContinue) -ne $null } catch {}

    if (!$stillRunning) {
        $errText = ''
        if (Test-Path $stderr) { $errText = (Get-Content -Path $stderr -Raw -ErrorAction SilentlyContinue) }
        throw "Frontend process exited before port $Port opened. See logs: $stdout and $stderr. Error output: $errText"
    }

    try { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    throw "Frontend did not start listening on port $Port within ${WaitSeconds}s. Logs: $stdout and $stderr."
}

Write-Host "Frontend is up. Starting Cloudflare Tunnel... (Ctrl+C to stop)"

try {
    if ($SmokeTest) {
        powershell -NoProfile -ExecutionPolicy Bypass -File $tunnelScript -Port $Port -SmokeTest
    }
    else {
        powershell -NoProfile -ExecutionPolicy Bypass -File $tunnelScript -Port $Port
    }
}
finally {
    try { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
}
