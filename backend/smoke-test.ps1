# Smoke test using token from token.txt if present
$baseUrl = "http://localhost:5000"
$tokenPath = "token.txt"

if (Test-Path $tokenPath) {
  $TOKEN = Get-Content $tokenPath -Raw
  Write-Host "Using token from token.txt" -ForegroundColor Cyan
} else {
  Write-Host "No token.txt found; registering a new user" -ForegroundColor Yellow
  $resp = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -Body (@{email="test-$(Get-Random)@example.com";password="SecurePass123!";name="Test User";accountType="brand"} | ConvertTo-Json) -ContentType "application/json"
  $data = $resp.Content | ConvertFrom-Json
  $TOKEN = $data.token
  Set-Content -Path $tokenPath -Value $TOKEN
  Write-Host "Saved token to token.txt" -ForegroundColor Cyan
}

# Health
Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing | Out-Host

# Token statuses
if ($TOKEN) {
  $headers = @{ Authorization = "Bearer $TOKEN" }
  Write-Host "Twitter status:" -ForegroundColor Yellow
  try { Invoke-WebRequest -Uri "$baseUrl/api/social-auth/twitter/token-status" -Headers $headers -UseBasicParsing | Out-Host } catch { $_ | Out-Host }
  Write-Host "LinkedIn status:" -ForegroundColor Yellow
  try { Invoke-WebRequest -Uri "$baseUrl/api/social-auth/linkedin/token-status" -Headers $headers -UseBasicParsing | Out-Host } catch { $_ | Out-Host }
  Write-Host "Facebook status:" -ForegroundColor Yellow
  try { Invoke-WebRequest -Uri "$baseUrl/api/social-auth/facebook/token-status" -Headers $headers -UseBasicParsing | Out-Host } catch { $_ | Out-Host }
  Write-Host "Instagram status:" -ForegroundColor Yellow
  try { Invoke-WebRequest -Uri "$baseUrl/api/social-auth/instagram/token-status" -Headers $headers -UseBasicParsing | Out-Host } catch { $_ | Out-Host }
}

Write-Host "Smoke test complete." -ForegroundColor Green
