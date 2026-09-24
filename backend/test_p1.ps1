$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5189"

Write-Host "`n=== 1. Registering Employer ==="
$empEmail = "employer_p1_$([guid]::NewGuid().ToString().Substring(0,5))@example.com"
$regBody = @{ FullName="Employer P1"; Email=$empEmail; Password="Password123!"; Role="Employer" } | ConvertTo-Json
$null = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"

Write-Host "Logging in as Employer..."
$loginBody = @{ Email=$empEmail; Password="Password123!" } | ConvertTo-Json
$loginResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$empToken = ($loginResp.Content | ConvertFrom-Json).token

Write-Host "`n=== 2. Creating Company Profile ==="
$companyBody = @{ CompanyName="P1 Tech"; Description="A test company"; Industry="IT"; Location="NY"; CompanySize="1-10"; Website="http://example.com" } | ConvertTo-Json
$compResp = Invoke-WebRequest -Uri "$baseUrl/api/companies" -Method Post -Body $companyBody -ContentType "application/json" -Headers @{ Authorization="Bearer $empToken" }
$companyId = ($compResp.Content | ConvertFrom-Json).id
Write-Host "Created Company ID: $companyId (IsApproved: $(($compResp.Content | ConvertFrom-Json).isApproved))"

Write-Host "`n=== 3. Admin Approving Company ==="
$adminLogin = @{ Email="admin@hireconnect.com"; Password="Admin@123" } | ConvertTo-Json
$adminResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
$adminToken = ($adminResp.Content | ConvertFrom-Json).token
$approveBody = "true"
$null = Invoke-WebRequest -Uri "$baseUrl/api/admin/companies/$companyId/approve" -Method Patch -Body $approveBody -ContentType "application/json" -Headers @{ Authorization="Bearer $adminToken" }
Write-Host "Company Approved!"

Write-Host "`n=== 4. Employer Posting Job ==="
$jobBody = @{ title="Software Eng P1"; description="Test"; categoryId=1; jobType="Full-Time" } | ConvertTo-Json
$jobResp = Invoke-WebRequest -Uri "$baseUrl/api/jobs" -Method Post -Body $jobBody -ContentType "application/json" -Headers @{ Authorization="Bearer $empToken" }
$jobId = ($jobResp.Content | ConvertFrom-Json).id
Write-Host "Posted Job ID: $jobId (Status: $(($jobResp.Content | ConvertFrom-Json).status))"

Write-Host "`n=== 5. Admin Approving Job ==="
$approveJobBody = '"Published"'
$null = Invoke-WebRequest -Uri "$baseUrl/api/admin/jobs/$jobId/approve" -Method Patch -Body $approveJobBody -ContentType "application/json" -Headers @{ Authorization="Bearer $adminToken" }
Write-Host "Job Published!"

Write-Host "`n=== 6. Public Job View ==="
$pubJobsResp = Invoke-WebRequest -Uri "$baseUrl/api/jobs" -Method Get
$pubJobs = ($pubJobsResp.Content | ConvertFrom-Json).data
$found = $pubJobs | Where-Object { $_.id -eq $jobId }
if ($found) { Write-Host "SUCCESS: Job is visible to public." } else { Write-Host "ERROR: Job not found." }

Write-Host "`n=== 7. Seeker Applying to Job ==="
$seekEmail = "seeker_p1_$([guid]::NewGuid().ToString().Substring(0,5))@example.com"
$seekReg = @{ FullName="Seeker P1"; Email=$seekEmail; Password="Password123!"; Role="JobSeeker" } | ConvertTo-Json
$null = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method Post -Body $seekReg -ContentType "application/json"

$seekLogin = @{ Email=$seekEmail; Password="Password123!" } | ConvertTo-Json
$seekResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method Post -Body $seekLogin -ContentType "application/json"
$seekToken = ($seekResp.Content | ConvertFrom-Json).token

$profBody = @{ CareerTitle="Developer"; Bio="Hello"; Experience="3 Years" } | ConvertTo-Json
$null = Invoke-WebRequest -Uri "$baseUrl/api/seekerprofiles" -Method Post -Body $profBody -ContentType "application/json" -Headers @{ Authorization="Bearer $seekToken" }

# Application is FormUrlEncoded
$appBody = @{ JobId=$jobId; CoverLetter="Hire me!" }
$appResp = Invoke-WebRequest -Uri "$baseUrl/api/applications" -Method Post -Body $appBody -Headers @{ Authorization="Bearer $seekToken" }
Write-Host "Applied successfully!"

Write-Host "`n=== 8. Employer Checking Applications & Stats ==="
$empAppsResp = Invoke-WebRequest -Uri "$baseUrl/api/applications/job/$jobId" -Method Get -Headers @{ Authorization="Bearer $empToken" }
$appCount = ($empAppsResp.Content | ConvertFrom-Json).Length
Write-Host "Total Applicants seen by Employer for this job: $appCount"

$empStatsResp = Invoke-WebRequest -Uri "$baseUrl/api/applications/employer-stats" -Method Get -Headers @{ Authorization="Bearer $empToken" }
$stats = ($empStatsResp.Content | ConvertFrom-Json)
Write-Host "Employer Dashboard Stats -> Total Applications: $($stats.totalApplications)"
