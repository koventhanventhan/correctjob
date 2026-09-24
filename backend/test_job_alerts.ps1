$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5189/api"

# Helper to login
function Login-User($email, $password) {
    $body = @{ Email = $email; Password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    return $res.token
}

# 1. Login Admin
$adminToken = Login-User "admin@hireconnect.com" "Admin@123"
$adminHeaders = @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" }

# 2. Register & Login Seeker
$seekerEmail = "seeker_alert@test.com"
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ FullName = "Alert Seeker"; Email = $seekerEmail; Password = "Password123!"; Role = "JobSeeker" } | ConvertTo-Json) -ContentType "application/json"
} catch {}
$seekerToken = Login-User $seekerEmail "Password123!"
$seekerHeaders = @{ Authorization = "Bearer $seekerToken"; "Content-Type" = "application/json" }

# Create Category first
$cat = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Get | Select-Object -First 1
if (-not $cat) {
    $cat = Invoke-RestMethod -Uri "$baseUrl/admin/categories" -Method Post -Headers $adminHeaders -Body (@{ Name = "Tech"; Description = "Tech" } | ConvertTo-Json)
}

# Create Seeker Profile
try {
    Invoke-RestMethod -Uri "$baseUrl/seekerprofiles/me" -Method Put -Headers $seekerHeaders -Body (@{ CareerTitle = "Dev"; Bio = "Test"; Experience = "1 yr"; Education = "BS"; Location = "NY" } | ConvertTo-Json)
} catch {
    Write-Host "Failed to create Seeker Profile: $_"
}

# Create Job Alert for Seeker
try {
    $alertBody = @{ Keyword = "AlertBot"; Location = "NY"; JobType = "Full-time"; CategoryId = $cat.id } | ConvertTo-Json
    $alert = Invoke-RestMethod -Uri "$baseUrl/jobalerts" -Method Post -Headers $seekerHeaders -Body $alertBody
    Write-Host "Created Job Alert with multiple criteria"
} catch {
    Write-Host "Failed to create Job Alert: $_"
}

# 3. Register & Login Employer
$empEmail = "emp_alert@test.com"
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body (@{ FullName = "Alert Emp"; Email = $empEmail; Password = "Password123!"; Role = "Employer" } | ConvertTo-Json) -ContentType "application/json"
} catch {}
$empToken = Login-User $empEmail "Password123!"
$empHeaders = @{ Authorization = "Bearer $empToken"; "Content-Type" = "application/json" }

# Create Company
$compBody = @{ CompanyName = "Alert Corp"; Description = "Test"; Location = "NY" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/companies" -Method Post -Headers $empHeaders -Body $compBody
} catch {}

# Admin approve company
$companies = Invoke-RestMethod -Uri "$baseUrl/admin/companies?search=Alert Corp" -Method Get -Headers $adminHeaders
$companyId = $companies.data[0].id
Invoke-RestMethod -Uri "$baseUrl/admin/companies/$companyId/approve" -Method Patch -Headers $adminHeaders -Body ('"Approved"')

# Create Job
$jobBody = @{ Title = "AlertBot Engineer"; Description = "You will work on AlertBot"; Requirements = "None"; Location = "NY"; JobType = "Full-time"; CategoryId = $cat.id; SalaryMin = 10; SalaryMax = 20; ExperienceMin = 0; ExperienceMax = 1 } | ConvertTo-Json
$job = Invoke-RestMethod -Uri "$baseUrl/jobs" -Method Post -Headers $empHeaders -Body $jobBody
$jobId = $job.id
Write-Host "Created Job ID: $jobId"

# Admin publish job
Invoke-RestMethod -Uri "$baseUrl/admin/jobs/$jobId/approve" -Method Patch -Headers $adminHeaders -Body ('"Published"')
Write-Host "Job Published. Waiting 70 seconds for background service..."

Start-Sleep -Seconds 70

# Check Seeker Notifications
$notifs = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $seekerHeaders
Write-Host "Seeker Notifications: "
$notifs | ConvertTo-Json

if ($notifs.Length -gt 0) {
    Write-Host "TEST PASSED: Job Alert created a notification!"
} else {
    Write-Host "TEST FAILED: No notification found."
}
