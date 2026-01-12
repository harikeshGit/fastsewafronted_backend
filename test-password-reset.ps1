# Test Password Reset Flow

$testEmail = "pwtest$(Get-Random)@example.com"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PASSWORD RESET TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Create User
Write-Host "[1/4] Creating test user..." -ForegroundColor Yellow
$signupData = @{
    firstName       = "Password"
    lastName        = "Test"
    email           = $testEmail
    password        = "oldpassword123"
    confirmPassword = "oldpassword123"
    role            = "user"
    userType        = "customer"
} | ConvertTo-Json

try {
    $signup = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/signup" -Method POST -ContentType "application/json" -Body $signupData
    Write-Host "✓ User created: $testEmail" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to create user: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 1

# Step 2: Request Password Reset
Write-Host "`n[2/4] Requesting password reset..." -ForegroundColor Yellow
$forgotData = @{
    email = $testEmail
} | ConvertTo-Json

try {
    $forgot = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/forgot-password" -Method POST -ContentType "application/json" -Body $forgotData
    $token = $forgot.token
    Write-Host "✓ Reset token received" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to request reset: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 1

# Step 3: Reset Password
Write-Host "`n[3/4] Resetting password to 'newpassword456'..." -ForegroundColor Yellow
$resetData = @{
    token    = $token
    password = "newpassword456"
} | ConvertTo-Json

try {
    $reset = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/reset-password" -Method POST -ContentType "application/json" -Body $resetData
    Write-Host "✓ Password reset successful" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to reset password: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2

# Step 4: Test Login with New Password
Write-Host "`n[4/4] Testing login with NEW password..." -ForegroundColor Yellow
$loginData = @{
    email    = $testEmail
    password = "newpassword456"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginData
    Write-Host "✓✓✓ SUCCESS! Login works with new password ✓✓✓" -ForegroundColor Green
    Write-Host "`nLogin token: $($login.token.Substring(0,40))..." -ForegroundColor Cyan
}
catch {
    $errorMsg = $_.ErrorDetails.Message
    Write-Host "✗✗✗ FAILED! Cannot login with new password ✗✗✗" -ForegroundColor Red
    Write-Host "Error: $errorMsg" -ForegroundColor Red
    Write-Host "`nCheck backend terminal for debug logs" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
