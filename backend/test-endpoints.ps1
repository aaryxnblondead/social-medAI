# Test script for backend endpoints
Write-Host "🧪 Testing Backend Endpoints" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

# Test 1: Health check
Write-Host "1️⃣ Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET
    Write-Host "✅ Health check passed: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

Write-Host "`n"

# Test 2: Register new user
Write-Host "2️⃣ Testing user registration..." -ForegroundColor Yellow
$registerBody = @{
    email = "test-$(Get-Random)@example.com"
    password = "SecurePass123!"
    name = "Test User"
    accountType = "brand"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    $registerData = $response.Content | ConvertFrom-Json
    Write-Host "✅ Registration successful: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ($registerData | ConvertTo-Json -Depth 3)
    
    $global:token = $registerData.token
    Write-Host "`nToken saved for subsequent requests" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Registration failed: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host ($_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 3)
    }
}

Write-Host "`n"

# Test 3: Get account info
Write-Host "3️⃣ Testing account info endpoint..." -ForegroundColor Yellow
if ($global:token) {
    try {
        $headers = @{
            Authorization = "Bearer $global:token"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/api/account/me" -Method GET -Headers $headers
        Write-Host "✅ Account info retrieved: $($response.StatusCode)" -ForegroundColor Green
        Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3)
    } catch {
        Write-Host "❌ Account info failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️ Skipping - no token available" -ForegroundColor Gray
}

Write-Host "`n"

# Test 4: Get social auth status
Write-Host "4️⃣ Testing social auth status..." -ForegroundColor Yellow
if ($global:token) {
    try {
        $headers = @{
            Authorization = "Bearer $global:token"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/api/social-auth/status" -Method GET -Headers $headers
        Write-Host "✅ Social status retrieved: $($response.StatusCode)" -ForegroundColor Green
        Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3)
    } catch {
        Write-Host "❌ Social status failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️ Skipping - no token available" -ForegroundColor Gray
}

Write-Host "`n"

# Test 5: Get trends
Write-Host "5️⃣ Testing trends endpoint..." -ForegroundColor Yellow
if ($global:token) {
    try {
        $headers = @{
            Authorization = "Bearer $global:token"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/api/trends" -Method GET -Headers $headers
        $trends = $response.Content | ConvertFrom-Json
        Write-Host "✅ Trends retrieved: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "📊 Found $($trends.Count) trends"
        if ($trends.Count -gt 0) {
            Write-Host "First trend: $($trends[0].name)"
        }
    } catch {
        Write-Host "❌ Trends failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️ Skipping - no token available" -ForegroundColor Gray
}

Write-Host "`n"

# Test 6: Test rate limiting
Write-Host "6️⃣ Testing rate limiting (auth endpoint)..." -ForegroundColor Yellow
$loginBody = @{
    email = "nonexistent@example.com"
    password = "wrongpass"
} | ConvertTo-Json

$attempts = 0
$rateLimited = $false

for ($i = 1; $i -le 6; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        $attempts++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            Write-Host "✅ Rate limiting working! Blocked after $attempts attempts" -ForegroundColor Green
            $rateLimited = $true
            break
        }
        $attempts++
    }
    Start-Sleep -Milliseconds 100
}

if (-not $rateLimited) {
    Write-Host "⚠️ Rate limiting not triggered after $attempts attempts" -ForegroundColor Yellow
}

Write-Host "`n"

# Summary
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Cyan
