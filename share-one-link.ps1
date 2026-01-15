[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int]$BackendPort = 4000,

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int]$AppPort = 8081,

    [Parameter(Mandatory = $false)]
    [int]$WaitSeconds = 60,

    [Parameter(Mandatory = $false)]
    [switch]$SmokeTest

    ,
    [Parameter(Mandatory = $false)]
    [switch]$DetachTunnel
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

$rootDir = Split-Path -Parent $PSCommandPath
$backendDir = Join-Path $rootDir 'admin-backend'
$frontendDir = Join-Path $rootDir 'fastsewafronted'
$tunnelScript = Join-Path $rootDir 'cloudflare-tunnel.ps1'

if (!(Test-Path -Path $backendDir)) { throw "Backend folder not found: $backendDir" }
if (!(Test-Path -Path $frontendDir)) { throw "Frontend folder not found: $frontendDir" }
if (!(Test-Path -Path $tunnelScript)) { throw "Tunnel script not found: $tunnelScript" }

$npmCmd = Resolve-ExePath -Names @('npm.cmd', 'npm')
if (!$npmCmd) { throw "npm not found. Install Node.js (includes npm) and try again." }

$nodeCmd = Resolve-ExePath -Names @('node.exe', 'node')
if (!$nodeCmd) { throw "node not found. Install Node.js and try again." }

$backendStdout = Join-Path $env:TEMP "backend-one-link-$PID.stdout.log"
$backendStderr = Join-Path $env:TEMP "backend-one-link-$PID.stderr.log"
if (Test-Path $backendStdout) { Remove-Item $backendStdout -Force -ErrorAction SilentlyContinue }
if (Test-Path $backendStderr) { Remove-Item $backendStderr -Force -ErrorAction SilentlyContinue }

Write-Host "Starting backend (port $BackendPort) in: $backendDir"
$backendProc = Start-Process -FilePath $npmCmd -ArgumentList @('run', 'dev') -WorkingDirectory $backendDir -PassThru -NoNewWindow -RedirectStandardOutput $backendStdout -RedirectStandardError $backendStderr

Write-Host "Waiting for backend to listen on port $BackendPort (timeout: ${WaitSeconds}s)..."
$backendReady = Wait-ForPort -PortToCheck $BackendPort -TimeoutSeconds $WaitSeconds
if (!$backendReady) {
    try { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    $errText = ''
    if (Test-Path $backendStderr) { $errText = (Get-Content -Path $backendStderr -Raw -ErrorAction SilentlyContinue) }
    throw "Backend did not start listening on port $BackendPort. Logs: $backendStdout and $backendStderr. Error output: $errText"
}

$appStdout = Join-Path $env:TEMP "app-one-link-$PID.stdout.log"
$appStderr = Join-Path $env:TEMP "app-one-link-$PID.stderr.log"
if (Test-Path $appStdout) { Remove-Item $appStdout -Force -ErrorAction SilentlyContinue }
if (Test-Path $appStderr) { Remove-Item $appStderr -Force -ErrorAction SilentlyContinue }

$proxyScript = Join-Path $rootDir 'tools\frontend-backend-proxy.js'

Write-Host "Starting combined app server (port $AppPort)"
$argString = "`"$proxyScript`" --root `"$frontendDir`" --port $AppPort --host 127.0.0.1 --api-target http://127.0.0.1:$BackendPort"
$appProc = Start-Process -FilePath $nodeCmd -ArgumentList $argString -WorkingDirectory $rootDir -PassThru -NoNewWindow -RedirectStandardOutput $appStdout -RedirectStandardError $appStderr

Write-Host "Waiting for combined app to listen on port $AppPort (timeout: ${WaitSeconds}s)..."
$appReady = Wait-ForPort -PortToCheck $AppPort -TimeoutSeconds $WaitSeconds
if (!$appReady) {
    try { Stop-Process -Id $appProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    try { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    $appErrText = ''
    if (Test-Path $appStderr) { $appErrText = (Get-Content -Path $appStderr -Raw -ErrorAction SilentlyContinue) }
    throw "Combined app did not start listening on port $AppPort. Logs: $appStdout and $appStderr. Error output: $appErrText"
}

Write-Host "Combined app is up. Starting Cloudflare Tunnel... (Ctrl+C to stop)"

try {
    if ($DetachTunnel) {
        powershell -NoProfile -ExecutionPolicy Bypass -File $tunnelScript -Port $AppPort -Detach
        Write-Host "Tunnel detached. Backend PID: $($backendProc.Id) | App PID: $($appProc.Id)"
        Write-Host "Backend logs: $backendStdout , $backendStderr"
        Write-Host "App logs: $appStdout , $appStderr"
        Write-Host "To stop: Stop-Process -Id $($backendProc.Id),$($appProc.Id) -Force"
        return
    }

    if ($SmokeTest) {
        powershell -NoProfile -ExecutionPolicy Bypass -File $tunnelScript -Port $AppPort -SmokeTest
    }
    else {
        powershell -NoProfile -ExecutionPolicy Bypass -File $tunnelScript -Port $AppPort
    }
}
finally {
    if (-not $DetachTunnel) {
        try { Stop-Process -Id $appProc.Id -Force -ErrorAction SilentlyContinue } catch {}
        try { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
}
