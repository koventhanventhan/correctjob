$baseUrl = "http://localhost:5189/api"

# Login as admin to get tokens
$adminBody = @{ Email = "admin@hireconnect.com"; Password = "Admin@123" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Headers @{"Content-Type" = "application/json"} -Body $adminBody
$adminToken = $adminRes.token
$adminHeaders = @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" }

function Login-User($email, $password) {
    try {
        $body = @{ Email = $email; Password = $password } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Headers @{"Content-Type" = "application/json"} -Body $body
        return $res.token
    } catch {
        # Create user if doesn't exist
        $role = if ($email -like "*employer*") { "Employer" } else { "JobSeeker" }
        $body = @{ FullName = "Test $role"; Email = $email; Password = $password; Role = $role } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Headers @{"Content-Type" = "application/json"} -Body $body
        $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Headers @{"Content-Type" = "application/json"} -Body $body
        return $res.token
    }
}

$empEmail = "employer_review_test@example.com"
$empToken = Login-User $empEmail "Password123!"
$empHeaders = @{ Authorization = "Bearer $empToken"; "Content-Type" = "application/json" }

$seekerEmail = "seeker_review_test@example.com"
$seekerToken = Login-User $seekerEmail "Password123!"
$seekerHeaders = @{ Authorization = "Bearer $seekerToken"; "Content-Type" = "application/json" }

# Create Seeker Profile
try {
    Invoke-RestMethod -Uri "$baseUrl/seekerprofiles/me" -Method Put -Headers $seekerHeaders -Body (@{ CareerTitle = "Dev"; Bio = "Test"; Experience = "1 yr"; Education = "BS"; Location = "NY" } | ConvertTo-Json)
} catch {
    # Ignore if already exists
}

# Create Category first
$cat = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Get | Select-Object -First 1
if (-not $cat) {
    $cat = Invoke-RestMethod -Uri "$baseUrl/admin/categories" -Method Post -Headers $adminHeaders -Body (@{ Name = "Tech"; Description = "Tech" } | ConvertTo-Json)
}

# Create Company
$compBody = @{ CompanyName = "Review Test Corp"; Location = "NY"; Industry = "Tech" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/companies/me" -Method Put -Headers $empHeaders -Body $compBody

# Approve Company
$companies = Invoke-RestMethod -Uri "$baseUrl/admin/companies?search=Review Test Corp" -Method Get -Headers $adminHeaders
$companyId = $companies.data[0].id
Invoke-RestMethod -Uri "$baseUrl/admin/companies/$companyId/approve" -Method Patch -Headers $adminHeaders -Body ('true')

# Create Job
$jobBody = @{ Title = "Review Job"; Description = "Review me"; Requirements = "None"; Location = "NY"; JobType = "Full-time"; CategoryId = $cat.id; SalaryMin = 10; SalaryMax = 20; ExperienceMin = 0; ExperienceMax = 1 } | ConvertTo-Json
$job = Invoke-RestMethod -Uri "$baseUrl/jobs" -Method Post -Headers $empHeaders -Body $jobBody

# Approve Job
$jobs = Invoke-RestMethod -Uri "$baseUrl/admin/jobs?search=Review Job" -Method Get -Headers $adminHeaders
$jobId = $jobs.data[0].id
Invoke-RestMethod -Uri "$baseUrl/admin/jobs/$jobId/approve" -Method Patch -Headers $adminHeaders -Body ('"Published"')

# ----------------- REVIEW TESTING -----------------

Write-Host "Test 1: Seeker tries to review without applying"
try {
    $reviewBody = @{ Rating = 5; Headline = "Great!"; Description = "Loved it" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/reviews" -Method Post -Headers $seekerHeaders -Body $reviewBody
    Write-Host "FAIL: Allowed review without application" -ForegroundColor Red
} catch {
    Write-Host "PASS: Blocked review without application" -ForegroundColor Green
}

Write-Host "Test 2: Seeker applies, then reviews"
try {
    $applyBody = @{ JobId = $jobId; CoverLetter = "Hello" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Headers $seekerHeaders -Body $applyBody
    Write-Host "Applied to job."

    $reviewBody = @{ Rating = 4; Headline = "Good company"; Description = "Nice people" } | ConvertTo-Json
    $review = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/reviews" -Method Post -Headers $seekerHeaders -Body $reviewBody
    Write-Host "PASS: Allowed review after applying" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
}

Write-Host "Test 3: Seeker tries to review again (duplicate)"
try {
    $reviewBody2 = @{ Rating = 1; Headline = "Bad"; Description = "Changed my mind" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/reviews" -Method Post -Headers $seekerHeaders -Body $reviewBody2
    Write-Host "FAIL: Allowed duplicate review" -ForegroundColor Red
} catch {
    Write-Host "PASS: Blocked duplicate review" -ForegroundColor Green
}

Write-Host "Test 4: Admin checks reviews and hides the review"
try {
    $adminReviews = Invoke-RestMethod -Uri "$baseUrl/admin/reviews" -Method Get -Headers $adminHeaders
    $reviewToHide = $adminReviews.data | Where-Object { $_.companyId -eq $companyId } | Select-Object -First 1
    
    Invoke-RestMethod -Uri "$baseUrl/admin/reviews/$($reviewToHide.id)/toggle-visibility" -Method Patch -Headers $adminHeaders
    Write-Host "PASS: Admin toggled visibility" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
}

Write-Host "Test 5: Check if hidden review is visible to public"
try {
    $publicReviews = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/reviews" -Method Get
    if ($publicReviews.data.length -eq 0) {
        Write-Host "PASS: Hidden review is NOT visible" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Hidden review is still visible" -ForegroundColor Red
    }
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
}
