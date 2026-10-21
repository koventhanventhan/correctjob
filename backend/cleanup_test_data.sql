-- =====================================================================
-- HireConnect: Test Data Cleanup Script
-- DO NOT EXECUTE AUTOMATICALLY. Review thoroughly before executing.
-- =====================================================================
-- Description:
-- Safely purges test accounts, test companies, test job postings, test
-- applications, and associated mock data created during development and QA
-- (e.g., step4test.com, step5test.com, step6test.com, test.com, example.com).
--
-- Safety instructions:
-- 1. Take a full database backup before running:
--    mysqldump -u root -p HireConnectDB > pre_cleanup_backup.sql
-- 2. Open this script in MySQL Workbench or run via mysql CLI.
-- 3. The transaction is set to ROLLBACK by default.
--    Inspect the affected counts in the output. If satisfied, change
--    ROLLBACK to COMMIT at the very bottom of the script.
-- =====================================================================

START TRANSACTION;

-- Step 0: Temporary table of test user IDs to target
CREATE TEMPORARY TABLE TempTestUserIds AS
SELECT Id, Email FROM AspNetUsers
WHERE Email LIKE '%@step4test.com'
   OR Email LIKE '%@step5test.com'
   OR Email LIKE '%@step6test.com'
   OR Email LIKE '%@step7test.com'
   OR Email LIKE '%@step8test.com'
   OR Email LIKE '%@test.com'
   OR Email LIKE '%@testcompany.com'
   OR Email LIKE '%@example.com'
   OR Email LIKE 'test_%@%'
   OR UserName LIKE 'test_%'
   OR FullName LIKE '%Test User%'
   OR FullName LIKE '%Regression Test%';

SELECT COUNT(*) AS TargetedTestUsersCount FROM TempTestUserIds;

-- Step 1: Identify test companies and test seeker profiles
CREATE TEMPORARY TABLE TempTestCompanyIds AS
SELECT c.Id FROM Companies c
WHERE c.EmployerId IN (SELECT Id FROM TempTestUserIds)
   OR c.CompanyName LIKE '%Test Company%'
   OR c.CompanyName LIKE '%Mock Corp%'
   OR c.CompanyName LIKE 'Step%';

CREATE TEMPORARY TABLE TempTestSeekerIds AS
SELECT s.Id FROM SeekerProfiles s
WHERE s.UserId IN (SELECT Id FROM TempTestUserIds);

CREATE TEMPORARY TABLE TempTestJobIds AS
SELECT j.Id FROM Jobs j
WHERE j.CompanyId IN (SELECT Id FROM TempTestCompanyIds)
   OR j.Title LIKE '%Test Job%'
   OR j.Title LIKE '%[TEST]%'
   OR j.Title LIKE 'Step%';

-- Step 2: Delete related dependent records (Foreign Key order)

-- 2.1 Refresh Tokens
DELETE FROM RefreshTokens WHERE UserId IN (SELECT Id FROM TempTestUserIds);

-- 2.2 Notifications
DELETE FROM Notifications WHERE UserId IN (SELECT Id FROM TempTestUserIds);

-- 2.3 Messages
DELETE FROM Messages 
WHERE SenderId IN (SELECT Id FROM TempTestUserIds)
   OR ApplicationId IN (
       SELECT a.Id FROM Applications a 
       WHERE a.JobId IN (SELECT Id FROM TempTestJobIds) 
          OR a.SeekerId IN (SELECT Id FROM TempTestSeekerIds)
   );

-- 2.4 Reports (submitted by test user or referencing test job/review)
DELETE FROM Reports
WHERE UserId IN (SELECT Id FROM TempTestUserIds)
   OR JobId IN (SELECT Id FROM TempTestJobIds);

-- 2.5 Company Reviews
DELETE FROM CompanyReviews
WHERE SeekerId IN (SELECT Id FROM TempTestSeekerIds)
   OR CompanyId IN (SELECT Id FROM TempTestCompanyIds);

-- 2.6 Candidate Invitations
DELETE FROM CandidateInvitations
WHERE SeekerId IN (SELECT Id FROM TempTestSeekerIds)
   OR CompanyId IN (SELECT Id FROM TempTestCompanyIds)
   OR JobId IN (SELECT Id FROM TempTestJobIds);

-- 2.7 Application Screening Answers & Applications
DELETE FROM ApplicationAnswers
WHERE ApplicationId IN (
    SELECT a.Id FROM Applications a 
    WHERE a.JobId IN (SELECT Id FROM TempTestJobIds) 
       OR a.SeekerId IN (SELECT Id FROM TempTestSeekerIds)
);

DELETE FROM Applications
WHERE JobId IN (SELECT Id FROM TempTestJobIds) 
   OR SeekerId IN (SELECT Id FROM TempTestSeekerIds);

-- 2.8 Job Screening Questions
DELETE FROM JobQuestions WHERE JobId IN (SELECT Id FROM TempTestJobIds);

-- 2.9 Saved Jobs & Job Alerts
DELETE FROM SavedJobs 
WHERE JobId IN (SELECT Id FROM TempTestJobIds)
   OR SeekerId IN (SELECT Id FROM TempTestSeekerIds);

DELETE FROM JobAlerts WHERE SeekerId IN (SELECT Id FROM TempTestUserIds);

-- 2.10 Payments records referencing test jobs
DELETE FROM Payments WHERE JobId IN (SELECT Id FROM TempTestJobIds);

-- 2.11 Jobs
DELETE FROM Jobs WHERE Id IN (SELECT Id FROM TempTestJobIds);

-- 2.12 Companies
DELETE FROM Companies WHERE Id IN (SELECT Id FROM TempTestCompanyIds);

-- 2.13 Seeker Profile Child Tables
DELETE FROM SeekerWorkHistories WHERE SeekerId IN (SELECT Id FROM TempTestSeekerIds);
DELETE FROM SeekerEducations WHERE SeekerId IN (SELECT Id FROM TempTestSeekerIds);
DELETE FROM SeekerSkills WHERE SeekerId IN (SELECT Id FROM TempTestSeekerIds);
DELETE FROM SeekerLanguages WHERE SeekerId IN (SELECT Id FROM TempTestSeekerIds);
DELETE FROM SeekerCertifications WHERE SeekerId IN (SELECT Id FROM TempTestSeekerIds);
DELETE FROM SeekerResumes WHERE SeekerId IN (SELECT Id FROM TempTestSeekerIds);

-- 2.14 Seeker Profiles
DELETE FROM SeekerProfiles WHERE Id IN (SELECT Id FROM TempTestSeekerIds);

-- 2.15 Audit Logs (optional: purge test audit entries)
DELETE FROM AuditLogs 
WHERE AdminId IN (SELECT Id FROM TempTestUserIds)
   OR (TargetType IN ('User', 'Job', 'Company') AND TargetId IN (SELECT Id FROM TempTestUserIds));

-- 2.16 Identity User Roles, Claims, Logins, Tokens
DELETE FROM AspNetUserRoles WHERE UserId IN (SELECT Id FROM TempTestUserIds);
DELETE FROM AspNetUserClaims WHERE UserId IN (SELECT Id FROM TempTestUserIds);
DELETE FROM AspNetUserLogins WHERE UserId IN (SELECT Id FROM TempTestUserIds);
DELETE FROM AspNetUserTokens WHERE UserId IN (SELECT Id FROM TempTestUserIds);

-- 2.17 AspNetUsers
DELETE FROM AspNetUsers WHERE Id IN (SELECT Id FROM TempTestUserIds);

-- Clean up temporary tables
DROP TEMPORARY TABLE TempTestJobIds;
DROP TEMPORARY TABLE TempTestSeekerIds;
DROP TEMPORARY TABLE TempTestCompanyIds;
DROP TEMPORARY TABLE TempTestUserIds;

-- =====================================================================
-- SAFETY VERIFICATION & FINAL DECISION
-- =====================================================================
-- Inspect the output above. If the deleted record counts look accurate:
-- Change ROLLBACK to COMMIT; and execute again.
-- =====================================================================
ROLLBACK;
-- COMMIT;
