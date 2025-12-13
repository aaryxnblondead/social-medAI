# Simple endpoint tests
$baseUrl = "http://localhost:5000"

Write-Host "Testing Backend Endpoints" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Test 1: Health check
Write-Host "`nTest 1: Health endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET
    Write-Host "SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json
} catch {
    Write-Host "FAILED: $_" -ForegroundColor Red
}

# Test 2: Register
Write-Host "`nTest 2: User Registration" -ForegroundColor Yellow
$email = "test-$(Get-Random)@example.com"
$registerBody = @{
    email = $email
    password = "SecurePass123!"
    name = "Test User"
    accountType = "brand"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "User: $($data.user.email)"
    Write-Host "Subscription: $($data.user.subscription.plan)"
    $global:token = $data.token
    Write-Host "Token saved" -ForegroundColor Cyan
} catch {
    Write-Host "FAILED: $_" -ForegroundColor Red
}

# Test 3: Account info
Write-Host "`nTest 3: Account Info" -ForegroundColor Yellow
if ($global:token) {
    try {
        $headers = @{ Authorization = "Bearer $global:token" }
        $response = Invoke-WebRequest -Uri "$baseUrl/api/account/me" -Method GET -Headers $headers
        $data = $response.Content | ConvertFrom-Json
        Write-Host "SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Posts this month: $($data.usage.postsThisMonth) / $($data.usage.maxPosts)"
        Write-Host "Brands: $($data.usage.brandsCount) / $($data.usage.maxBrands)"
    } catch {
        Write-Host "FAILED: $_" -ForegroundColor Red
    }
} else {
    Write-Host "SKIPPED: No token" -ForegroundColor Gray
}

# Test 4: Social auth status
Write-Host "`nTest 4: Social Auth Status" -ForegroundColor Yellow
if ($global:token) {
    try {
        $headers = @{ Authorization = "Bearer $global:token" }
        $response = Invoke-WebRequest -Uri "$baseUrl/api/social-auth/status" -Method GET -Headers $headers
        $data = $response.Content | ConvertFrom-Json
        Write-Host "SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Twitter: $($data.twitter.connected)"
        Write-Host "LinkedIn: $($data.linkedin.connected)"
        Write-Host "Facebook: $($data.facebook.connected)"
        Write-Host "Instagram: $($data.instagram.connected)"
    } catch {
        Write-Host "FAILED: $_" -ForegroundColor Red
    }
} else {
    Write-Host "SKIPPED: No token" -ForegroundColor Gray
}

# Test 5: Trends
Write-Host "`nTest 5: Get Trends" -ForegroundColor Yellow
if ($global:token) {
    try {
        $headers = @{ Authorization = "Bearer $global:token" }
        $response = Invoke-WebRequest -Uri "$baseUrl/api/trends" -Method GET -Headers $headers
        $trends = $response.Content | ConvertFrom-Json
        Write-Host "SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Found $($trends.Count) trends"
        if ($trends.Count -gt 0) {
            Write-Host "Latest: $($trends[0].name) (score: $($trends[0].virality_score))"
        }
    } catch {
        Write-Host "FAILED: $_" -ForegroundColor Red
    }
} else {
    Write-Host "SKIPPED: No token" -ForegroundColor Gray
}

Write-Host "`n=========================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Green
