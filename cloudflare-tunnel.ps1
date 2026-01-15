[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int]$Port = 3000,

    [Parameter(Mandatory = $false)]
    [string]$Url,

    [Parameter(Mandatory = $false)]
    [string]$CloudflaredPath,

    [Parameter(Mandatory = $false)]
    [switch]$SmokeTest

    ,
    [Parameter(Mandatory = $false)]
    [switch]$Detach
)

$ErrorActionPreference = 'Stop'

function Resolve-CloudflaredPath {
    param(
        [string]$PreferredPath
    )

    if ($PreferredPath) {
        $resolvedPreferred = Resolve-Path -Path $PreferredPath -ErrorAction SilentlyContinue
        if ($resolvedPreferred) {
            return $resolvedPreferred.Path
        }
        throw "CloudflaredPath not found: $PreferredPath"
    }

    $cmd = Get-Command -Name 'cloudflared' -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) {
        return $cmd.Source
    }

    $scriptDir = Split-Path -Parent $PSCommandPath
    $localExe = Join-Path $scriptDir 'cloudflared.exe'
    if (Test-Path -Path $localExe) {
        return $localExe
    }

    # Common download name variants
    $localDownloaded = @(
        (Join-Path $scriptDir 'cloudflared-windows-amd64.exe'),
        (Join-Path $scriptDir 'cloudflared-windows-amd64')
    )

    foreach ($candidate in $localDownloaded) {
        if (Test-Path -Path $candidate) {
            Copy-Item -Path $candidate -Destination $localExe -Force
            return $localExe
        }
    }

    # If user downloaded to Downloads, copy it in.
    $downloadsDir = Join-Path $env:USERPROFILE 'Downloads'
    if (Test-Path -Path $downloadsDir) {
        $downloadHit = Get-ChildItem -Path $downloadsDir -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like 'cloudflared-windows-amd64*' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

        if ($downloadHit) {
            Copy-Item -Path $downloadHit.FullName -Destination $localExe -Force
            return $localExe
        }
    }

    throw "cloudflared not found. Install it (winget: 'winget install --id Cloudflare.cloudflared') or place cloudflared.exe next to this script."
}

function Get-TunnelUrl {
    param(
        [int]$DefaultPort,
        [string]$ExplicitUrl
    )

    if ($ExplicitUrl -and $ExplicitUrl.Trim()) {
        return $ExplicitUrl
    }

    # Use IPv4 loopback by default to avoid 'localhost' resolving to IPv6 ::1 on Windows,
    # which can break when the origin service only listens on 127.0.0.1.
    return "http://127.0.0.1:$DefaultPort"
}

function Extract-TryCloudflareUrl {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Text
    )

    $m = [regex]::Match($Text, 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')
    if ($m.Success) { return $m.Value }
    return $null
}

$cloudflaredExe = Resolve-CloudflaredPath -PreferredPath $CloudflaredPath
$tunnelUrl = Get-TunnelUrl -DefaultPort $Port -ExplicitUrl $Url

Write-Host "Using cloudflared: $cloudflaredExe"
Write-Host "Tunneling: $tunnelUrl"

$args = @('tunnel', '--url', $tunnelUrl, '--no-autoupdate')

if ($Detach) {
    $stdout = Join-Path $env:TEMP "cloudflared-$PID.stdout.log"
    $stderr = Join-Path $env:TEMP "cloudflared-$PID.stderr.log"

    if (Test-Path $stdout) { Remove-Item $stdout -Force }
    if (Test-Path $stderr) { Remove-Item $stderr -Force }

    $proc = Start-Process -FilePath $cloudflaredExe -ArgumentList $args -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr

    $publicUrl = $null
    $deadline = (Get-Date).AddSeconds(15)
    while ((Get-Date) -lt $deadline -and -not $publicUrl) {
        Start-Sleep -Milliseconds 500
        $output = ''
        if (Test-Path $stdout) { $output += (Get-Content -Path $stdout -Raw -ErrorAction SilentlyContinue) }
        if (Test-Path $stderr) { $output += ("`n" + (Get-Content -Path $stderr -Raw -ErrorAction SilentlyContinue)) }
        $publicUrl = Extract-TryCloudflareUrl -Text $output
    }

    if ($publicUrl) {
        Write-Host "Public URL: $publicUrl"
    }
    else {
        Write-Warning "Tunnel started but URL not detected in first 15s. Check logs: $stdout and $stderr"
    }

    Write-Host "Tunnel PID: $($proc.Id)"
    Write-Host "Logs: $stdout , $stderr"
    exit 0
}

if ($SmokeTest) {
    $stdout = Join-Path $env:TEMP "cloudflared-$PID.stdout.log"
    $stderr = Join-Path $env:TEMP "cloudflared-$PID.stderr.log"

    if (Test-Path $stdout) { Remove-Item $stdout -Force }
    if (Test-Path $stderr) { Remove-Item $stderr -Force }

    $proc = Start-Process -FilePath $cloudflaredExe -ArgumentList $args -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    Start-Sleep -Seconds 8

    $output = ''
    if (Test-Path $stdout) { $output += (Get-Content -Path $stdout -Raw -ErrorAction SilentlyContinue) }
    if (Test-Path $stderr) { $output += ("`n" + (Get-Content -Path $stderr -Raw -ErrorAction SilentlyContinue)) }

    $publicUrl = Extract-TryCloudflareUrl -Text $output

    if ($publicUrl) {
        Write-Host "Public URL detected: $publicUrl"
    }
    else {
        Write-Warning "Tunnel started but URL not detected in first 8s. Try running without -SmokeTest to see live output."
    }

    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    exit 0
}

& $cloudflaredExe @args
