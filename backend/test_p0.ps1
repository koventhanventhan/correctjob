$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:5189"

Write-Host "Registering test employer..."
$regBody = @{ FullName="Test Employer"; Email="testemp2@example.com"; Password="Password123!"; Role="Employer" } | ConvertTo-Json
try {
    $regResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"
} catch {}

Write-Host "Logging in..."
$loginBody = @{ Email="testemp2@example.com"; Password="Password123!" } | ConvertTo-Json
$loginResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -SessionVariable session

$loginData = $loginResp.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "`n--- TEST 1: /api/auth/me ---"
$meResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" -Method Get -Headers @{ Authorization="Bearer $token" }
Write-Host $meResp.Content

Write-Host "`n--- TEST 2: /api/auth/refresh-token ---"
$refreshResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/refresh-token" -Method Post -WebSession $session
$refreshData = $refreshResp.Content | ConvertFrom-Json
$newToken = $refreshData.token
Write-Host "New token obtained: $newToken"

Write-Host "`n--- TEST 3: /api/jobs/my-jobs ---"
$myJobsResp = Invoke-WebRequest -Uri "$baseUrl/api/jobs/my-jobs" -Method Get -Headers @{ Authorization="Bearer $newToken" }
Write-Host $myJobsResp.Content
