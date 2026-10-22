'use client';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { 
    LuUsers, LuUser, LuBuilding, LuBriefcase, LuSearch, 
    LuChevronLeft, LuChevronRight, LuMessageSquare, LuStar, LuBadgeCheck, 
    LuUserCheck, LuShieldCheck, LuLock, LuSave, LuPen,
    LuLayoutDashboard, LuTrendingUp, LuDollarSign, LuEye, LuClock, 
    LuCircleCheck, LuCircleAlert, LuArrowRight, LuRefreshCw,
    LuUserPlus, LuUserX, LuShieldAlert, LuInfo, LuEyeOff,
    LuTriangleAlert, LuCheck, LuX, LuFlag, LuTag, LuMapPin, LuCreditCard,
    LuPlus, LuDownload
} from 'react-icons/lu';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuSettings } from 'react-icons/lu';
import { getFileUrl } from '@/utils/imageUrl';

interface TrendPoint {
    date: string;
    signups: number;
    jobs: number;
    applications: number;
}

interface DashboardStats {
    users: {
        total: number;
        seekers: number;
        employers: number;
        admins: number;
        active: number;
        blocked: number;
        newLast30Days: number;
    };
    jobs: {
        total: number;
        draft: number;
        pendingApproval: number;
        published: number;
        closed: number;
        rejected: number;
    };
    applications: {
        total: number;
        views: number;
        conversionRate: number;
    };
    revenue: {
        total: number;
        completedCount: number;
        pendingCount: number;
    };
    queues: {
        pendingJobs: number;
        pendingCompanies: number;
        pendingSeekerVerifications: number;
        pendingEmployerVerifications: number;
        pendingReports: number;
    };
    trends30Days: TrendPoint[];
}

export default function AdminDashboard() {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'users' | 'jobseekers' | 'companies' | 'reviews' | 'verifications' | 'employer-verifications' | 'reports' | 'categories' | 'locations' | 'payments' | 'settings' | 'audit-logs' | 'profile'>('overview');

    // Profile editing state
    const [profileData, setProfileData] = useState({ fullName: '', email: '' });
    const [profileMsg, setProfileMsg] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMsg, setPasswordMsg] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);

    // Trend chart interactive toggles & hover
    const [trendSeries, setTrendSeries] = useState({
        signups: true,
        jobs: true,
        applications: true
    });
    const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

    // Sync profile data when user changes
    useEffect(() => {
        if (user) {
            setProfileData({ fullName: user.fullName, email: user.email });
        }
    }, [user]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileMsg('');
        try {
            const res = await api.put('/auth/profile', profileData);
            setUser(res.data.user);
            setProfileMsg('Profile updated successfully.');
        } catch (error: any) {
            setProfileMsg(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSaving(true);
        setPasswordMsg('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMsg('New password and confirm password do not match.');
            setPasswordSaving(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMsg('New password must be at least 6 characters long.');
            setPasswordSaving(false);
            return;
        }

        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordMsg('Password changed successfully.');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setPasswordMsg(
                error.response?.data?.message ||
                error.response?.data?.[0]?.description ||
                'Failed to change password.'
            );
        } finally {
            setPasswordSaving(false);
        }
    };
    
    // Pagination & Search States
    const [jobsPage, setJobsPage] = useState(1);
    const [searchJob, setSearchJob] = useState('');
    const [filterJobStatus, setFilterJobStatus] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [usersPageSize, setUsersPageSize] = useState(10);
    const [usersRoleFilter, setUsersRoleFilter] = useState('');
    const [usersStatusFilter, setUsersStatusFilter] = useState('');
    const [usersSortBy, setUsersSortBy] = useState('createdAt');
    const [usersSortOrder, setUsersSortOrder] = useState<'desc' | 'asc'>('desc');
    const [companiesPage, setCompaniesPage] = useState(1);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [searchUser, setSearchUser] = useState('');
    const [searchCompany, setSearchCompany] = useState('');

    // User Management Modal & Alert States
    const [blockModalUser, setBlockModalUser] = useState<{ id: string; fullName: string; email: string; role?: string } | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [blockLoading, setBlockLoading] = useState(false);
    const [blockError, setBlockError] = useState('');

    const [unblockModalUser, setUnblockModalUser] = useState<{ id: string; fullName: string; email: string } | null>(null);
    const [unblockReason, setUnblockReason] = useState('');
    const [unblockLoading, setUnblockLoading] = useState(false);
    const [unblockError, setUnblockError] = useState('');

    const [demoteModalAdmin, setDemoteModalAdmin] = useState<{ id: string; fullName: string; email: string } | null>(null);
    const [demoteLoading, setDemoteLoading] = useState(false);
    const [demoteError, setDemoteError] = useState('');

    const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
    const [createAdminData, setCreateAdminData] = useState({
        fullName: '',
        email: '',
        password: '',
        forcePasswordChange: true
    });
    const [showCreateAdminPassword, setShowCreateAdminPassword] = useState(false);
    const [createAdminLoading, setCreateAdminLoading] = useState(false);
    const [createAdminError, setCreateAdminError] = useState('');
    const [createAdminSuccess, setCreateAdminSuccess] = useState('');

    const [userActionAlert, setUserActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    
    // Job Seekers Tab
    const [jobseekersPage, setJobseekersPage] = useState(1);
    const [searchJobseeker, setSearchJobseeker] = useState('');
    
    // Verifications Tab
    const [verificationsPage, setVerificationsPage] = useState(1);
    const [searchVerification, setSearchVerification] = useState('');
    
    // Employer Verifications Tab
    const [employerVerificationsPage, setEmployerVerificationsPage] = useState(1);
    const [searchEmployerVerification, setSearchEmployerVerification] = useState('');

    // Reports Tab
    const [reportsPage, setReportsPage] = useState(1);
    const [reportsStatusFilter, setReportsStatusFilter] = useState('');
    const [reportsTypeFilter, setReportsTypeFilter] = useState('');
    const [searchReport, setSearchReport] = useState('');
    const [reportActionLoading, setReportActionLoading] = useState<number | null>(null);
    const [reportStatusModal, setReportStatusModal] = useState<{id: number; currentStatus: string} | null>(null);
    const [reportNewStatus, setReportNewStatus] = useState('');
    const [reportAdminNote, setReportAdminNote] = useState('');
    const [reportDirectActionModal, setReportDirectActionModal] = useState<{id: number; type: string} | null>(null);
    const [reportDirectAction, setReportDirectAction] = useState('');
    const [reportDirectReason, setReportDirectReason] = useState('');

    // Categories Tab
    const [catEditModal, setCatEditModal] = useState<{id?: number; name: string; description: string; isActive: boolean} | null>(null);
    const [catLoading, setCatLoading] = useState(false);
    const [catError, setCatError] = useState('');
    const [catDeleteConfirm, setCatDeleteConfirm] = useState<{id: number; name: string} | null>(null);

    // Locations Tab
    const [locEditModal, setLocEditModal] = useState<{id?: number; name: string; stateOrProvince: string; country: string; isActive: boolean} | null>(null);
    const [locLoading, setLocLoading] = useState(false);
    const [locError, setLocError] = useState('');
    const [locDeleteConfirm, setLocDeleteConfirm] = useState<{id: number; name: string} | null>(null);

    // Payments Tab
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('');
    const [searchPayment, setSearchPayment] = useState('');
    const [paymentsDateFrom, setPaymentsDateFrom] = useState('');
    const [paymentsDateTo, setPaymentsDateTo] = useState('');

    // System Settings State
    const [settingsForm, setSettingsForm] = useState({
        siteName: 'HireConnect',
        jobPostingFee: 5000,
        contactEmail: 'support@hireconnect.com',
        maintenanceMode: false
    });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsMsg, setSettingsMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);

    // Audit Logs State
    const [auditPage, setAuditPage] = useState(1);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditActionFilter, setAuditActionFilter] = useState('');
    const [auditAdminFilter, setAuditAdminFilter] = useState('');
    const [auditTargetTypeFilter, setAuditTargetTypeFilter] = useState('');
    const [auditDateFrom, setAuditDateFrom] = useState('');
    const [auditDateTo, setAuditDateTo] = useState('');

    // CSV Export State
    const [exportingType, setExportingType] = useState<'users' | 'jobs' | null>(null);

    // Reviews Moderation
    const [reviewModerateModal, setReviewModerateModal] = useState<{ id: number; action: 'Hide' | 'Unhide' | 'Delete'; headline: string } | null>(null);
    const [reviewModerateReason, setReviewModerateReason] = useState('');
    const [reviewModerateLoading, setReviewModerateLoading] = useState(false);

    // Dashboard Stats Query
    const { 
        data: dashboardStats, 
        isLoading: isStatsLoading, 
        isFetching: isStatsFetching, 
        refetch: refetchStats 
    } = useQuery<DashboardStats>({
        queryKey: ['admin-dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/dashboard-stats');
            return res.data;
        },
        refetchInterval: 30000
    });
    
    // Verifications Query
    const { data: verificationsData, refetch: refetchVerifications } = useQuery({
        queryKey: ['admin-verifications', verificationsPage, searchVerification],
        queryFn: async () => {
            const res = await api.get(`/admin/identity-verifications?page=${verificationsPage}&pageSize=10&search=${searchVerification}`);
            return res.data;
        }
    });

    const { data: employerVerificationsData, refetch: refetchEmployerVerifications } = useQuery({
        queryKey: ['admin-employer-verifications', employerVerificationsPage, searchEmployerVerification],
        queryFn: async () => {
            const res = await api.get(`/admin/employer-verifications?page=${employerVerificationsPage}&pageSize=10&search=${searchEmployerVerification}`);
            return res.data;
        }
    });

    const { data: jobsData, refetch: refetchJobs } = useQuery({
        queryKey: ['admin-jobs', jobsPage, searchJob, filterJobStatus],
        queryFn: async () => {
            const res = await api.get(`/admin/jobs?page=${jobsPage}&pageSize=10&search=${searchJob}&status=${filterJobStatus}`);
            return res.data;
        }
    });

    const { data: jobseekersData, refetch: refetchJobseekers } = useQuery({
        queryKey: ['admin-jobseekers', jobseekersPage, searchJobseeker],
        queryFn: async () => {
            const res = await api.get(`/admin/jobseekers?page=${jobseekersPage}&pageSize=10&search=${searchJobseeker}`);
            return res.data;
        }
    });

    const { data: usersData, refetch: refetchUsers } = useQuery({
        queryKey: ['admin-users', usersPage, usersPageSize, searchUser, usersRoleFilter, usersStatusFilter, usersSortBy, usersSortOrder],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: usersPage.toString(),
                pageSize: usersPageSize.toString(),
                sortBy: usersSortBy,
                sortOrder: usersSortOrder,
            });
            if (searchUser.trim()) params.append('search', searchUser.trim());
            if (usersRoleFilter) params.append('role', usersRoleFilter);
            if (usersStatusFilter) params.append('status', usersStatusFilter);
            const res = await api.get(`/admin/users?${params.toString()}`);
            return res.data;
        }
    });

    const { data: companiesData, refetch: refetchCompanies } = useQuery({
        queryKey: ['admin-companies', companiesPage, searchCompany],
        queryFn: async () => {
            const res = await api.get(`/admin/companies?page=${companiesPage}&pageSize=10&search=${searchCompany}`);
            return res.data;
        }
    });

    const { data: reviewsData, refetch: refetchReviews } = useQuery({
        queryKey: ['admin-reviews', reviewsPage],
        queryFn: async () => {
            const res = await api.get(`/admin/reviews?page=${reviewsPage}&pageSize=10`);
            return res.data;
        }
    });

    // Admin Reports Query
    const { data: reportsData, refetch: refetchReports } = useQuery({
        queryKey: ['admin-reports', reportsPage, reportsStatusFilter, reportsTypeFilter, searchReport],
        queryFn: async () => {
            const params = new URLSearchParams({ page: reportsPage.toString(), pageSize: '20' });
            if (reportsStatusFilter) params.append('status', reportsStatusFilter);
            if (reportsTypeFilter) params.append('type', reportsTypeFilter);
            if (searchReport.trim()) params.append('search', searchReport.trim());
            const res = await api.get(`/admin/reports?${params.toString()}`);
            return res.data;
        }
    });

    // Admin Categories Query
    const { data: categoriesData, refetch: refetchCategories } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: async () => {
            const res = await api.get('/admin/categories');
            return res.data;
        }
    });

    // Admin Locations Query
    const { data: locationsData, refetch: refetchLocations } = useQuery({
        queryKey: ['admin-locations'],
        queryFn: async () => {
            const res = await api.get('/admin/locations');
            return res.data;
        }
    });

    // Admin Payments Query
    const { data: paymentsData, refetch: refetchPayments } = useQuery({
        queryKey: ['admin-payments', paymentsPage, paymentsStatusFilter, searchPayment, paymentsDateFrom, paymentsDateTo],
        queryFn: async () => {
            const params = new URLSearchParams({ page: paymentsPage.toString(), pageSize: '20' });
            if (paymentsStatusFilter) params.append('status', paymentsStatusFilter);
            if (searchPayment.trim()) params.append('search', searchPayment.trim());
            if (paymentsDateFrom) params.append('dateFrom', paymentsDateFrom);
            if (paymentsDateTo) params.append('dateTo', paymentsDateTo);
            const res = await api.get(`/admin/payments?${params.toString()}`);
            return res.data;
        }
    });

    // System Settings Query
    const { data: settingsData, refetch: refetchSettings, isLoading: isSettingsLoading } = useQuery({
        queryKey: ['admin-system-settings'],
        queryFn: async () => {
            const res = await api.get('/admin/settings');
            return res.data;
        }
    });

    useEffect(() => {
        if (settingsData) {
            setSettingsForm({
                siteName: settingsData.siteName || 'HireConnect',
                jobPostingFee: typeof settingsData.jobPostingFee === 'number' ? settingsData.jobPostingFee : 5000,
                contactEmail: settingsData.contactEmail || 'support@hireconnect.com',
                maintenanceMode: Boolean(settingsData.maintenanceMode)
            });
        }
    }, [settingsData]);

    const handleSaveSettings = async (overrideMaintenance?: boolean) => {
        setSettingsMsg(null);

        if (!settingsForm.siteName.trim()) {
            setSettingsMsg({ text: 'Site Name is required.', isError: true });
            return;
        }
        if (settingsForm.siteName.trim().length > 100) {
            setSettingsMsg({ text: 'Site Name cannot exceed 100 characters.', isError: true });
            return;
        }
        if (settingsForm.jobPostingFee < 0 || settingsForm.jobPostingFee > 1000000) {
            setSettingsMsg({ text: 'Job posting fee must be between 0 and 1,000,000 LKR.', isError: true });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(settingsForm.contactEmail.trim())) {
            setSettingsMsg({ text: 'Please enter a valid contact email address.', isError: true });
            return;
        }

        const targetMaintenance = overrideMaintenance !== undefined ? overrideMaintenance : settingsForm.maintenanceMode;
        if (targetMaintenance && !settingsData?.maintenanceMode && overrideMaintenance === undefined) {
            setMaintenanceConfirmOpen(true);
            return;
        }

        setSettingsSaving(true);
        try {
            const payload = {
                siteName: settingsForm.siteName.trim(),
                jobPostingFee: Number(settingsForm.jobPostingFee),
                contactEmail: settingsForm.contactEmail.trim(),
                maintenanceMode: targetMaintenance
            };
            const res = await api.put('/admin/settings', payload);
            setSettingsMsg({ text: res.data?.message || 'Settings saved successfully!', isError: false });
            refetchSettings();
            setMaintenanceConfirmOpen(false);
        } catch (e: any) {
            const errorMsg = e.response?.data?.message || 'Failed to update settings.';
            setSettingsMsg({ text: errorMsg, isError: true });
        } finally {
            setSettingsSaving(false);
        }
    };

    // Audit Logs Query
    const { data: auditLogsData, refetch: refetchAuditLogs, isLoading: isAuditLoading } = useQuery({
        queryKey: ['admin-audit-logs', auditPage, auditSearch, auditActionFilter, auditAdminFilter, auditTargetTypeFilter, auditDateFrom, auditDateTo],
        queryFn: async () => {
            const params = new URLSearchParams({ page: auditPage.toString(), pageSize: '20' });
            if (auditSearch.trim()) params.append('search', auditSearch.trim());
            if (auditActionFilter) params.append('action', auditActionFilter);
            if (auditAdminFilter.trim()) params.append('admin', auditAdminFilter.trim());
            if (auditTargetTypeFilter) params.append('targetType', auditTargetTypeFilter);
            if (auditDateFrom) params.append('dateFrom', auditDateFrom);
            if (auditDateTo) params.append('dateTo', auditDateTo);
            const res = await api.get(`/admin/audit-logs?${params.toString()}`);
            return res.data;
        }
    });

    // CSV Export Handler
    const handleDownloadCsv = async (type: 'users' | 'jobs') => {
        try {
            setExportingType(type);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/export/${type}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to export CSV');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e: any) {
            console.error(e);
            alert('Failed to export CSV: ' + (e.message || 'Unknown error'));
        } finally {
            setExportingType(null);
        }
    };

    const handleApproveJob = async (id: number) => {
        try {
            await api.patch(`/admin/jobs/${id}/approve`, "Published", { headers: { 'Content-Type': 'application/json' }});
            refetchJobs();
            refetchStats();
        } catch {
            console.error("Failed to approve job");
        }
    };

    const handleRejectJob = async (id: number) => {
        const reason = prompt("Please provide a reason for rejecting this job posting (max 500 characters, optional):");
        if (reason === null) return;
        if (reason.length > 500) {
            alert("Rejection reason cannot exceed 500 characters.");
            return;
        }
        try {
            await api.patch(`/admin/jobs/${id}/approve`, { status: "Rejected", reason });
            refetchJobs();
            refetchStats();
        } catch {
            console.error("Failed to reject job");
        }
    };

    const handleApproveCompany = async (id: number, isApproved: boolean) => {
        try {
            await api.patch(`/admin/companies/${id}/approve`, isApproved, { headers: { 'Content-Type': 'application/json' }});
            refetchCompanies();
            refetchStats();
        } catch {
            console.error("Failed to update company approval");
        }
    };

    const handleToggleUserBlock = async (id: string, currentStatus: boolean) => {
        const targetUser = users.find((u: any) => u.id === id) || jobseekers.find((s: any) => s.userId === id);
        if (currentStatus) {
            setBlockModalUser({
                id,
                fullName: targetUser?.fullName || 'User',
                email: targetUser?.email || '',
                role: targetUser?.role || 'User'
            });
            setBlockReason('');
            setBlockError('');
        } else {
            setUnblockModalUser({
                id,
                fullName: targetUser?.fullName || 'User',
                email: targetUser?.email || ''
            });
            setUnblockReason('');
            setUnblockError('');
        }
    };

    const handleConfirmBlock = async () => {
        if (!blockModalUser) return;
        if (!blockReason.trim()) {
            setBlockError('A reason is required to block an account.');
            return;
        }
        if (blockReason.length > 500) {
            setBlockError('Reason cannot exceed 500 characters.');
            return;
        }
        setBlockLoading(true);
        setBlockError('');
        try {
            await api.patch(`/admin/users/${blockModalUser.id}/block`, {
                block: true,
                reason: blockReason.trim()
            });
            setBlockModalUser(null);
            setBlockReason('');
            refetchUsers();
            refetchJobseekers();
            refetchStats();
            setUserActionAlert({ type: 'success', message: `User ${blockModalUser.fullName} has been blocked and sessions revoked.` });
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to block user.';
            setBlockError(typeof msg === 'string' ? msg : 'Failed to block user.');
        } finally {
            setBlockLoading(false);
        }
    };

    const handleConfirmUnblock = async () => {
        if (!unblockModalUser) return;
        setUnblockLoading(true);
        setUnblockError('');
        try {
            await api.patch(`/admin/users/${unblockModalUser.id}/block`, {
                block: false,
                reason: unblockReason.trim() || undefined
            });
            setUnblockModalUser(null);
            setUnblockReason('');
            refetchUsers();
            refetchJobseekers();
            refetchStats();
            setUserActionAlert({ type: 'success', message: `User ${unblockModalUser.fullName} has been unblocked.` });
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to unblock user.';
            setUnblockError(typeof msg === 'string' ? msg : 'Failed to unblock user.');
        } finally {
            setUnblockLoading(false);
        }
    };

    const handleConfirmDemote = async () => {
        if (!demoteModalAdmin) return;
        setDemoteLoading(true);
        setDemoteError('');
        try {
            await api.delete(`/admin/admins/${demoteModalAdmin.id}`);
            setDemoteModalAdmin(null);
            refetchUsers();
            refetchStats();
            setUserActionAlert({ type: 'success', message: `Administrator privileges removed for ${demoteModalAdmin.fullName}. Role demoted to JobSeeker.` });
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to demote admin.';
            setDemoteError(typeof msg === 'string' ? msg : 'Failed to demote admin.');
        } finally {
            setDemoteLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateAdminLoading(true);
        setCreateAdminError('');
        setCreateAdminSuccess('');

        if (!createAdminData.fullName.trim()) {
            setCreateAdminError('Full name is required.');
            setCreateAdminLoading(false);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(createAdminData.email)) {
            setCreateAdminError('Please provide a valid email address.');
            setCreateAdminLoading(false);
            return;
        }
        const pwd = createAdminData.password;
        if (pwd.length < 12 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[^a-zA-Z0-9]/.test(pwd)) {
            setCreateAdminError('Password does not satisfy all security requirements.');
            setCreateAdminLoading(false);
            return;
        }

        try {
            await api.post('/admin/admins', {
                fullName: createAdminData.fullName.trim(),
                email: createAdminData.email.trim(),
                password: createAdminData.password,
                forcePasswordChangeOnFirstLogin: createAdminData.forcePasswordChange
            });
            setCreateAdminSuccess(`Admin account created successfully for ${createAdminData.email}.`);
            setCreateAdminData({ fullName: '', email: '', password: '', forcePasswordChange: true });
            refetchUsers();
            refetchStats();
            setTimeout(() => {
                setIsCreateAdminOpen(false);
                setCreateAdminSuccess('');
            }, 1200);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.[0]?.description || err.response?.data || 'Failed to create admin.';
            setCreateAdminError(typeof msg === 'string' ? msg : 'Failed to create admin.');
        } finally {
            setCreateAdminLoading(false);
        }
    };

    const handleModerateReview = async () => {
        if (!reviewModerateModal) return;
        if (!reviewModerateReason.trim()) {
            alert("A reason is required for review moderation.");
            return;
        }
        setReviewModerateLoading(true);
        try {
            await api.patch(`/admin/reviews/${reviewModerateModal.id}/moderate`, {
                action: reviewModerateModal.action,
                reason: reviewModerateReason.trim()
            });
            refetchReviews();
            if (refetchReports) refetchReports();
            setReviewModerateModal(null);
            setReviewModerateReason('');
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to moderate review.");
        } finally {
            setReviewModerateLoading(false);
        }
    };

    const handleSaveReportStatus = async () => {
        if (!reportStatusModal) return;
        setReportActionLoading(reportStatusModal.id);
        try {
            await api.patch(`/admin/reports/${reportStatusModal.id}/status`, {
                status: reportNewStatus,
                adminNote: reportAdminNote.trim() || undefined
            });
            refetchReports();
            setReportStatusModal(null);
            setReportNewStatus('');
            setReportAdminNote('');
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to update report status.");
        } finally {
            setReportActionLoading(null);
        }
    };

    const handleExecuteReportAction = async () => {
        if (!reportDirectActionModal) return;
        if (!reportDirectReason.trim()) {
            alert("Please provide a reason for this action.");
            return;
        }
        setReportActionLoading(reportDirectActionModal.id);
        try {
            await api.post(`/admin/reports/${reportDirectActionModal.id}/action`, {
                action: reportDirectAction,
                reason: reportDirectReason.trim()
            });
            refetchReports();
            refetchJobs();
            refetchReviews();
            setReportDirectActionModal(null);
            setReportDirectAction('');
            setReportDirectReason('');
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to perform action.");
        } finally {
            setReportActionLoading(null);
        }
    };

    const handleSaveCategory = async () => {
        if (!catEditModal) return;
        if (!catEditModal.name.trim()) {
            setCatError("Category name is required.");
            return;
        }
        if (catEditModal.name.trim().length > 100) {
            setCatError("Category name cannot exceed 100 characters.");
            return;
        }
        setCatLoading(true);
        setCatError('');
        try {
            if (catEditModal.id) {
                await api.put(`/admin/categories/${catEditModal.id}`, {
                    name: catEditModal.name.trim(),
                    description: catEditModal.description?.trim() || null,
                    isActive: catEditModal.isActive
                });
            } else {
                await api.post('/admin/categories', {
                    name: catEditModal.name.trim(),
                    description: catEditModal.description?.trim() || null
                });
            }
            refetchCategories();
            setCatEditModal(null);
        } catch (err: any) {
            setCatError(err?.response?.data?.message || "Failed to save category.");
        } finally {
            setCatLoading(false);
        }
    };

    const handleToggleCategoryActive = async (cat: any) => {
        try {
            await api.put(`/admin/categories/${cat.id}`, {
                name: cat.name,
                description: cat.description,
                isActive: !cat.isActive
            });
            refetchCategories();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to update category.");
        }
    };

    const handleDeleteCategory = async () => {
        if (!catDeleteConfirm) return;
        setCatLoading(true);
        try {
            await api.delete(`/admin/categories/${catDeleteConfirm.id}`);
            refetchCategories();
            setCatDeleteConfirm(null);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to delete category.");
        } finally {
            setCatLoading(false);
        }
    };

    const handleSaveLocation = async () => {
        if (!locEditModal) return;
        if (!locEditModal.name.trim()) {
            setLocError("Location name is required.");
            return;
        }
        if (locEditModal.name.trim().length > 100) {
            setLocError("Location name cannot exceed 100 characters.");
            return;
        }
        setLocLoading(true);
        setLocError('');
        try {
            if (locEditModal.id) {
                await api.put(`/admin/locations/${locEditModal.id}`, {
                    name: locEditModal.name.trim(),
                    stateOrProvince: locEditModal.stateOrProvince?.trim() || null,
                    country: locEditModal.country?.trim() || "Sri Lanka",
                    isActive: locEditModal.isActive
                });
            } else {
                await api.post('/admin/locations', {
                    name: locEditModal.name.trim(),
                    stateOrProvince: locEditModal.stateOrProvince?.trim() || null,
                    country: locEditModal.country?.trim() || "Sri Lanka"
                });
            }
            refetchLocations();
            setLocEditModal(null);
        } catch (err: any) {
            setLocError(err?.response?.data?.message || "Failed to save location.");
        } finally {
            setLocLoading(false);
        }
    };

    const handleToggleLocationActive = async (loc: any) => {
        try {
            await api.put(`/admin/locations/${loc.id}`, {
                name: loc.name,
                stateOrProvince: loc.stateOrProvince,
                country: loc.country,
                isActive: !loc.isActive
            });
            refetchLocations();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to update location.");
        }
    };

    const handleDeleteLocation = async () => {
        if (!locDeleteConfirm) return;
        setLocLoading(true);
        try {
            await api.delete(`/admin/locations/${locDeleteConfirm.id}`);
            refetchLocations();
            setLocDeleteConfirm(null);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to delete location.");
        } finally {
            setLocLoading(false);
        }
    };

    const handleVerificationDecision = async (id: number, approved: boolean) => {
        const notes = approved ? '' : prompt("Please provide a reason for rejection:");
        if (!approved && notes === null) return;

        try {
            await api.patch(`/admin/identity-verifications/${id}/decision`, { approved, notes });
            refetchVerifications();
            refetchStats();
        } catch {
            console.error("Failed to submit decision");
        }
    };

    const handleEmployerVerificationDecision = async (id: number, approved: boolean) => {
        const notes = approved ? '' : prompt("Please provide a reason for rejection:");
        if (!approved && notes === null) return;

        try {
            await api.patch(`/admin/employer-verifications/${id}/decision`, { approved, notes });
            refetchEmployerVerifications();
            refetchStats();
        } catch {
            console.error("Failed to submit decision");
        }
    };

    const [viewingDoc, setViewingDoc] = useState<string | null>(null);

    const handleViewDocument = async (endpoint: string, docKey: string) => {
        const newTab = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
        try {
            setViewingDoc(docKey);
            const response = await api.get(endpoint, {
                responseType: 'blob'
            });
            const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            if (newTab && !newTab.closed) {
                newTab.location.href = url;
            } else {
                window.open(url, '_blank');
            }
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (error) {
            if (newTab && !newTab.closed) {
                newTab.close();
            }
            console.error("Failed to view document", error);
            alert("Failed to view document. Please try again.");
        } finally {
            setViewingDoc(null);
        }
    };

    // Helper functions for 30-Day SVG chart
    const trends: TrendPoint[] = dashboardStats?.trends30Days || [];
    const totalDays = trends.length || 30;

    const maxVal = Math.max(
        1,
        ...trends.map(t => {
            let maxInDay = 0;
            if (trendSeries.signups) maxInDay = Math.max(maxInDay, t.signups);
            if (trendSeries.jobs) maxInDay = Math.max(maxInDay, t.jobs);
            if (trendSeries.applications) maxInDay = Math.max(maxInDay, t.applications);
            return maxInDay;
        })
    );
    const maxY = Math.max(5, Math.ceil(maxVal * 1.15));

    const svgWidth = 800;
    const svgHeight = 240;
    const padding = { top: 20, right: 25, bottom: 35, left: 45 };
    const chartW = svgWidth - padding.left - padding.right;
    const chartH = svgHeight - padding.top - padding.bottom;

    const getX = (idx: number) => padding.left + (idx / Math.max(1, totalDays - 1)) * chartW;
    const getY = (val: number) => padding.top + chartH - (val / maxY) * chartH;

    const getLinePath = (key: 'signups' | 'jobs' | 'applications') => {
        if (trends.length === 0) return '';
        return trends.map((t, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(t[key]).toFixed(1)}`).join(' ');
    };

    const getAreaPath = (key: 'signups' | 'jobs' | 'applications') => {
        if (trends.length === 0) return '';
        const line = getLinePath(key);
        const bottomY = (padding.top + chartH).toFixed(1);
        const lastX = getX(trends.length - 1).toFixed(1);
        const firstX = getX(0).toFixed(1);
        return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    };

    const formatShortDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            return `${months[m]} ${d}`;
        }
        return dateStr;
    };

    const formatFullDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(`${dateStr}T12:00:00Z`);
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const svgX = (clientX / rect.width) * svgWidth;
        const relX = svgX - padding.left;
        if (relX < 0 || relX > chartW || trends.length === 0) {
            setHoveredTrendIdx(null);
            return;
        }
        const idx = Math.min(trends.length - 1, Math.max(0, Math.round((relX / chartW) * (trends.length - 1))));
        setHoveredTrendIdx(idx);
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warmwhite">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
            </div>
        );
    }

    if (!user || user.role !== 'Admin') {
        router.push('/login');
        return null;
    }

    const totalJobs = jobsData?.totalCount || 0;
    const jobs = jobsData?.data || [];
    const totalUsers = usersData?.totalCount || 0;
    const totalUsersPages = usersData?.totalPages || Math.ceil(totalUsers / usersPageSize) || 1;
    const totalCompanies = companiesData?.totalCount || 0;
    const totalReviews = reviewsData?.totalCount || 0;
    const users = usersData?.data || [];
    const companies = companiesData?.data || [];
    const reviews = reviewsData?.data || [];
    const verifications = verificationsData?.data || [];
    const totalVerifications = verificationsData?.totalCount || 0;
    const employerVerifications = employerVerificationsData?.data || [];
    const totalEmployerVerifications = employerVerificationsData?.totalCount || 0;
    const jobseekers = jobseekersData?.data || [];
    const totalJobseekers = jobseekersData?.totalCount || 0;

    const totalPendingQueues = (dashboardStats?.queues?.pendingJobs || 0) +
        (dashboardStats?.queues?.pendingCompanies || 0) +
        (dashboardStats?.queues?.pendingSeekerVerifications || 0) +
        (dashboardStats?.queues?.pendingEmployerVerifications || 0) +
        (dashboardStats?.queues?.pendingReports || 0);

    return (
        <div className="min-h-screen bg-warmwhite flex">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-sm hidden md:block flex-shrink-0 border-r border-gray-100">
                {/* Admin Profile Card */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        {user?.profileImage ? (
                            <img
                                src={getFileUrl(user.profileImage)}
                                alt={user.fullName}
                                className="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-md flex-shrink-0"
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-orange flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                                {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-charcoal truncate">{user?.fullName}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange/10 text-orange border border-orange/20">
                            <LuShieldCheck className="w-3 h-3" />
                            {user?.role}
                        </span>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className="inline-flex items-center gap-1 text-xs text-orange hover:text-orange/80 font-medium transition-colors"
                        >
                            <LuPen className="w-3 h-3" />
                            Edit Profile
                        </button>
                    </div>
                </div>

                <div className="p-6 pb-2">
                    <h2 className="text-xl font-display font-bold text-charcoal">Admin Panel</h2>
                </div>
                <nav className="space-y-1 px-3">
                    <button 
                        onClick={() => setActiveTab('overview')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'overview' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuLayoutDashboard className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Overview & Analytics</span>
                        {totalPendingQueues > 0 && activeTab !== 'overview' && (
                            <span className="ml-auto bg-amber-100 text-amber-800 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                                {totalPendingQueues}
                            </span>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('jobs')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'jobs' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuBriefcase className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Manage Jobs</span>
                        {(dashboardStats?.queues?.pendingJobs || 0) > 0 && (
                            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                {dashboardStats?.queues?.pendingJobs}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => setActiveTab('users')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'users' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuUsers className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Manage Users</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('jobseekers')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'jobseekers' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuUserCheck className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Manage Job Seekers</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('companies')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'companies' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuBuilding className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Manage Employers</span>
                        {(dashboardStats?.queues?.pendingCompanies || 0) > 0 && (
                            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${activeTab === 'companies' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                {dashboardStats?.queues?.pendingCompanies}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => setActiveTab('reviews')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'reviews' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuMessageSquare className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Manage Reviews</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('verifications')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'verifications' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuBadgeCheck className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>ID Verifications (Seeker)</span>
                        {totalVerifications > 0 && (
                            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${activeTab === 'verifications' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'}`}>
                                {totalVerifications}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => setActiveTab('employer-verifications')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'employer-verifications' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuBadgeCheck className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>ID Verifications (Employer)</span>
                        {totalEmployerVerifications > 0 && (
                            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${activeTab === 'employer-verifications' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'}`}>
                                {totalEmployerVerifications}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => setActiveTab('reports')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'reports' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuFlag className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Reports Moderation</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('categories')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'categories' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuTag className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Manage Categories</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('locations')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'locations' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuMapPin className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Manage Locations</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('payments')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'payments' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuCreditCard className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Platform Payments</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('settings')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'settings' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuSettings className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>System Settings</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('audit-logs')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'audit-logs' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuClock className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Audit Logs</span>
                    </button>

                    <div className="border-t border-gray-100 my-2 mx-1"></div>

                    <button 
                        onClick={() => setActiveTab('profile')} 
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'profile' ? 'bg-orange text-white shadow-sm' : 'text-gray-700 hover:bg-peach'}`}
                    >
                        <LuShieldCheck className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Profile & Security</span>
                    </button>

                    <Link 
                        href="/admin/settings" 
                        className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-peach transition-all"
                    >
                        <LuUser className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Account Settings</span>
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-full overflow-hidden">
                
                {/* Mobile Tabs */}
                <div className="md:hidden mb-6">
                    <label htmlFor="tabs" className="sr-only">Select a tab</label>
                    <select
                        id="tabs"
                        name="tabs"
                        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-orange focus:outline-none focus:ring-orange sm:text-sm"
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as any)}
                    >
                        <option value="overview">Overview & Analytics</option>
                        <option value="jobs">Manage Jobs</option>
                        <option value="users">Manage Users</option>
                        <option value="jobseekers">Manage Job Seekers</option>
                        <option value="companies">Manage Employers</option>
                        <option value="reviews">Manage Reviews</option>
                        <option value="verifications">ID Verifications (Seeker)</option>
                        <option value="employer-verifications">ID Verifications (Employer)</option>
                        <option value="reports">Reports Moderation</option>
                        <option value="categories">Manage Categories</option>
                        <option value="locations">Manage Locations</option>
                        <option value="payments">Platform Payments</option>
                        <option value="settings">System Settings</option>
                        <option value="audit-logs">Audit Logs</option>
                        <option value="profile">Profile & Security</option>
                    </select>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 max-w-7xl">
                        {/* Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Live System Active</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">Platform Overview & Analytics</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Live platform metrics, user engagement trends, and moderation action queues.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => refetchStats()}
                                    disabled={isStatsFetching}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-peach/60 hover:bg-peach text-charcoal transition-colors disabled:opacity-50 border border-orange/10 shadow-sm"
                                >
                                    <LuRefreshCw className={`w-4 h-4 text-orange ${isStatsFetching ? 'animate-spin' : ''}`} />
                                    <span>{isStatsFetching ? 'Refreshing...' : 'Refresh Live Data'}</span>
                                </button>
                                <Link
                                    href="/admin/settings"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-charcoal text-white hover:bg-charcoal/90 transition-colors shadow-sm"
                                >
                                    <LuSettings className="w-4 h-4 text-orange" />
                                    <span>System Settings</span>
                                </Link>
                            </div>
                        </div>

                        {/* Top 4 KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Card 1: Users */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-orange/10 flex items-center justify-center text-orange group-hover:scale-105 transition-transform">
                                        <LuUsers className="w-6 h-6" />
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                        +{dashboardStats?.users.newLast30Days ?? 0} in 30d
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Platform Users</p>
                                <p className="text-3xl font-display font-bold text-charcoal mt-1">
                                    {isStatsLoading ? '...' : (dashboardStats?.users.total ?? 0).toLocaleString()}
                                </p>
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <span>{dashboardStats?.users.seekers ?? 0} Seekers · {dashboardStats?.users.employers ?? 0} Employers</span>
                                    <span className="font-semibold text-charcoal">{dashboardStats?.users.active ?? 0} Active</span>
                                </div>
                            </div>

                            {/* Card 2: Jobs */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                                        <LuBriefcase className="w-6 h-6" />
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                        {dashboardStats?.jobs.total ?? 0} Total
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Published Active Jobs</p>
                                <p className="text-3xl font-display font-bold text-charcoal mt-1">
                                    {isStatsLoading ? '...' : (dashboardStats?.jobs.published ?? 0).toLocaleString()}
                                </p>
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <span className="text-amber-700 font-medium">{dashboardStats?.jobs.pendingApproval ?? 0} Pending</span>
                                    <span>{dashboardStats?.jobs.draft ?? 0} Draft · {dashboardStats?.jobs.closed ?? 0} Closed</span>
                                </div>
                            </div>

                            {/* Card 3: Applications & Conversion */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                                        <LuTrendingUp className="w-6 h-6" />
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                        {dashboardStats?.applications.conversionRate ?? 0}% Rate
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Applications Submitted</p>
                                <p className="text-3xl font-display font-bold text-charcoal mt-1">
                                    {isStatsLoading ? '...' : (dashboardStats?.applications.total ?? 0).toLocaleString()}
                                </p>
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <LuEye className="w-3.5 h-3.5 text-gray-400" />
                                        {(dashboardStats?.applications.views ?? 0).toLocaleString()} Views
                                    </span>
                                    <span className="text-emerald-600 font-medium">Conversion Funnel</span>
                                </div>
                            </div>

                            {/* Card 4: Platform Revenue */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                                        <LuDollarSign className="w-6 h-6" />
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                        {dashboardStats?.revenue.completedCount ?? 0} Orders
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Revenue</p>
                                <p className="text-2xl font-display font-bold text-charcoal mt-1 truncate">
                                    {isStatsLoading ? '...' : `LKR ${Number(dashboardStats?.revenue.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </p>
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <span>{dashboardStats?.revenue.pendingCount ?? 0} Pending Sessions</span>
                                    <span className="font-semibold text-emerald-700">PayHere Gateway</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Queues Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-lg font-display font-bold text-charcoal flex items-center gap-2">
                                        <LuClock className="w-5 h-5 text-orange" />
                                        Moderation Action Queues
                                    </h2>
                                    <p className="text-xs text-gray-500">Pending tasks requiring admin attention or verification decisions.</p>
                                </div>
                                <div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                        totalPendingQueues > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}>
                                        {totalPendingQueues > 0 ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                {totalPendingQueues} items pending action
                                            </>
                                        ) : (
                                            <>
                                                <LuCircleCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                All moderation queues clear
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Queue Item 1: Pending Jobs */}
                                <div className="p-4 rounded-lg border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500">Pending Jobs</span>
                                            <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                                                {dashboardStats?.queues.pendingJobs ?? 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">New job postings awaiting moderation before publishing.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setActiveTab('jobs');
                                            setFilterJobStatus('PendingApproval');
                                            setJobsPage(1);
                                        }}
                                        className="mt-3 inline-flex items-center text-xs font-bold text-orange hover:text-orange/80 group"
                                    >
                                        <span>Review Jobs</span>
                                        <LuArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>

                                {/* Queue Item 2: Seeker ID Verifications */}
                                <div className="p-4 rounded-lg border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500">Seeker ID Verification</span>
                                            <span className="w-7 h-7 rounded-lg bg-orange/15 text-orange flex items-center justify-center font-bold text-xs">
                                                {dashboardStats?.queues.pendingSeekerVerifications ?? 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">National ID documents submitted by candidates.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setActiveTab('verifications');
                                            setVerificationsPage(1);
                                        }}
                                        className="mt-3 inline-flex items-center text-xs font-bold text-orange hover:text-orange/80 group"
                                    >
                                        <span>Verify Seekers</span>
                                        <LuArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>

                                {/* Queue Item 3: Employer ID Verifications */}
                                <div className="p-4 rounded-lg border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500">Employer ID Verification</span>
                                            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                                                {dashboardStats?.queues.pendingEmployerVerifications ?? 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">Official business & ID cards submitted by hiring managers.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setActiveTab('employer-verifications');
                                            setEmployerVerificationsPage(1);
                                        }}
                                        className="mt-3 inline-flex items-center text-xs font-bold text-orange hover:text-orange/80 group"
                                    >
                                        <span>Verify Employers</span>
                                        <LuArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>

                                {/* Queue Item 4: Pending Companies */}
                                <div className="p-4 rounded-lg border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500">Company Approvals</span>
                                            <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                                                {dashboardStats?.queues.pendingCompanies ?? 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">New employer profiles awaiting platform verification.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setActiveTab('companies');
                                            setCompaniesPage(1);
                                        }}
                                        className="mt-3 inline-flex items-center text-xs font-bold text-orange hover:text-orange/80 group"
                                    >
                                        <span>Review Companies</span>
                                        <LuArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>

                                {/* Queue Item 5: Pending User Reports */}
                                <div className="p-4 rounded-lg border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500">Flagged Reports</span>
                                            <span className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs">
                                                {dashboardStats?.queues.pendingReports ?? 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">User reports on suspicious jobs or offensive reviews.</p>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-red-600">High Priority</span>
                                        <LuCircleAlert className="w-4 h-4 text-red-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive 30-Day SVG Trend Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-display font-bold text-charcoal">30-Day Platform Activity Trends</h2>
                                        <span className="text-xs bg-peach text-charcoal font-semibold px-2 py-0.5 rounded-md">
                                            Last 30 Days
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Interactive trends for user registrations, new job postings, and job applications.
                                    </p>
                                </div>

                                {/* Series Toggles */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTrendSeries(prev => ({ ...prev, signups: !prev.signups }))}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                                            trendSeries.signups 
                                                ? 'bg-orange/10 text-orange border-orange/30 shadow-xs' 
                                                : 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                                        }`}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full ${trendSeries.signups ? 'bg-orange' : 'bg-gray-300'}`}></span>
                                        <span>Signups</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTrendSeries(prev => ({ ...prev, jobs: !prev.jobs }))}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                                            trendSeries.jobs 
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs' 
                                                : 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                                        }`}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full ${trendSeries.jobs ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
                                        <span>Jobs Posted</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTrendSeries(prev => ({ ...prev, applications: !prev.applications }))}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                                            trendSeries.applications 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs' 
                                                : 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                                        }`}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full ${trendSeries.applications ? 'bg-emerald-600' : 'bg-gray-300'}`}></span>
                                        <span>Applications</span>
                                    </button>
                                </div>
                            </div>

                            {/* Chart Container */}
                            <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                                {/* Floating Tooltip */}
                                {hoveredTrendIdx !== null && trends[hoveredTrendIdx] && (
                                    <div 
                                        className="absolute pointer-events-none bg-white border border-gray-200 rounded-lg shadow-md p-3 text-xs z-20 transition-all duration-75"
                                        style={{
                                            left: `${Math.min(84, Math.max(16, (getX(hoveredTrendIdx) / svgWidth) * 100))}%`,
                                            top: '16px',
                                            transform: 'translateX(-50%)'
                                        }}
                                    >
                                        <div className="font-semibold text-charcoal mb-1.5 border-b border-gray-100 pb-1 flex items-center justify-between gap-4">
                                            <span>{formatFullDate(trends[hoveredTrendIdx].date)}</span>
                                            <span className="text-[10px] text-gray-400">Day {hoveredTrendIdx + 1}/30</span>
                                        </div>
                                        <div className="space-y-1">
                                            {trendSeries.signups && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="flex items-center gap-1.5 text-gray-600">
                                                        <span className="w-2 h-2 rounded-full bg-orange"></span> Signups:
                                                    </span>
                                                    <span className="font-bold text-orange">{trends[hoveredTrendIdx].signups}</span>
                                                </div>
                                            )}
                                            {trendSeries.jobs && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="flex items-center gap-1.5 text-gray-600">
                                                        <span className="w-2 h-2 rounded-full bg-blue-600"></span> Jobs Posted:
                                                    </span>
                                                    <span className="font-bold text-blue-600">{trends[hoveredTrendIdx].jobs}</span>
                                                </div>
                                            )}
                                            {trendSeries.applications && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="flex items-center gap-1.5 text-gray-600">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Applications:
                                                    </span>
                                                    <span className="font-bold text-emerald-600">{trends[hoveredTrendIdx].applications}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <svg
                                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                    className="w-full h-64 md:h-72 select-none"
                                    onMouseMove={handleSvgMouseMove}
                                    onMouseLeave={() => setHoveredTrendIdx(null)}
                                >
                                    <defs>
                                        {/* Orange gradient for signups */}
                                        <linearGradient id="grad-signups" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#F97316" stopOpacity="0.28" />
                                            <stop offset="100%" stopColor="#F97316" stopOpacity="0.00" />
                                        </linearGradient>
                                        {/* Blue gradient for jobs */}
                                        <linearGradient id="grad-jobs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.24" />
                                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.00" />
                                        </linearGradient>
                                        {/* Emerald gradient for applications */}
                                        <linearGradient id="grad-applications" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#059669" stopOpacity="0.24" />
                                            <stop offset="100%" stopColor="#059669" stopOpacity="0.00" />
                                        </linearGradient>
                                    </defs>

                                    {/* Horizontal gridlines and Y-axis scale labels */}
                                    {[0, 0.33, 0.66, 1.0].map((ratio, i) => {
                                        const yVal = Math.round(maxY * ratio);
                                        const yPos = padding.top + chartH - ratio * chartH;
                                        return (
                                            <g key={i}>
                                                <line 
                                                    x1={padding.left} 
                                                    y1={yPos} 
                                                    x2={svgWidth - padding.right} 
                                                    y2={yPos} 
                                                    stroke="#E2E8F0" 
                                                    strokeDasharray="4 4" 
                                                    strokeWidth="1" 
                                                />
                                                <text 
                                                    x={padding.left - 8} 
                                                    y={yPos + 4} 
                                                    textAnchor="end" 
                                                    fontSize="10" 
                                                    fill="#94A3B8" 
                                                    fontFamily="sans-serif"
                                                >
                                                    {yVal}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* Areas */}
                                    {trendSeries.signups && (
                                        <path d={getAreaPath('signups')} fill="url(#grad-signups)" />
                                    )}
                                    {trendSeries.jobs && (
                                        <path d={getAreaPath('jobs')} fill="url(#grad-jobs)" />
                                    )}
                                    {trendSeries.applications && (
                                        <path d={getAreaPath('applications')} fill="url(#grad-applications)" />
                                    )}

                                    {/* Lines */}
                                    {trendSeries.signups && (
                                        <path 
                                            d={getLinePath('signups')} 
                                            fill="none" 
                                            stroke="#F97316" 
                                            strokeWidth="2.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />
                                    )}
                                    {trendSeries.jobs && (
                                        <path 
                                            d={getLinePath('jobs')} 
                                            fill="none" 
                                            stroke="#2563EB" 
                                            strokeWidth="2.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />
                                    )}
                                    {trendSeries.applications && (
                                        <path 
                                            d={getLinePath('applications')} 
                                            fill="none" 
                                            stroke="#059669" 
                                            strokeWidth="2.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />
                                    )}

                                    {/* X-axis dates */}
                                    {[0, 6, 12, 18, 24, Math.max(0, totalDays - 1)].map((idx, i) => {
                                        if (!trends[idx]) return null;
                                        return (
                                            <text
                                                key={i}
                                                x={getX(idx)}
                                                y={svgHeight - 12}
                                                textAnchor="middle"
                                                fontSize="11"
                                                fill="#64748B"
                                                fontFamily="sans-serif"
                                            >
                                                {formatShortDate(trends[idx].date)}
                                            </text>
                                        );
                                    })}

                                    {/* Hover Guideline & Data Points */}
                                    {hoveredTrendIdx !== null && trends[hoveredTrendIdx] && (
                                        <g>
                                            <line
                                                x1={getX(hoveredTrendIdx)}
                                                y1={padding.top}
                                                x2={getX(hoveredTrendIdx)}
                                                y2={padding.top + chartH}
                                                stroke="#94A3B8"
                                                strokeWidth="1.5"
                                                strokeDasharray="3 3"
                                            />
                                            {trendSeries.signups && (
                                                <circle
                                                    cx={getX(hoveredTrendIdx)}
                                                    cy={getY(trends[hoveredTrendIdx].signups)}
                                                    r={5.5}
                                                    fill="#F97316"
                                                    stroke="#FFFFFF"
                                                    strokeWidth={2.5}
                                                />
                                            )}
                                            {trendSeries.jobs && (
                                                <circle
                                                    cx={getX(hoveredTrendIdx)}
                                                    cy={getY(trends[hoveredTrendIdx].jobs)}
                                                    r={5.5}
                                                    fill="#2563EB"
                                                    stroke="#FFFFFF"
                                                    strokeWidth={2.5}
                                                />
                                            )}
                                            {trendSeries.applications && (
                                                <circle
                                                    cx={getX(hoveredTrendIdx)}
                                                    cy={getY(trends[hoveredTrendIdx].applications)}
                                                    r={5.5}
                                                    fill="#059669"
                                                    stroke="#FFFFFF"
                                                    strokeWidth={2.5}
                                                />
                                            )}
                                        </g>
                                    )}
                                </svg>
                            </div>
                        </div>

                        {/* Breakdown Widgets: User Demographics & Job Pipeline Health */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Breakdown 1: User Community */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-display font-bold text-charcoal">User Community Breakdown</h3>
                                        <p className="text-xs text-gray-500">Distribution between Job Seekers, Employers, and Admins</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('users')}
                                        className="text-xs font-semibold text-orange hover:underline"
                                    >
                                        View Users →
                                    </button>
                                </div>

                                {/* Proportional Progress Bar */}
                                {(() => {
                                    const total = Math.max(1, dashboardStats?.users.total || 0);
                                    const seekersPct = Math.round(((dashboardStats?.users.seekers || 0) / total) * 100);
                                    const employersPct = Math.round(((dashboardStats?.users.employers || 0) / total) * 100);
                                    const adminsPct = Math.max(0, 100 - seekersPct - employersPct);
                                    return (
                                        <div className="space-y-4">
                                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                                <div style={{ width: `${seekersPct}%` }} className="bg-orange h-full transition-all" title={`Seekers: ${seekersPct}%`}></div>
                                                <div style={{ width: `${employersPct}%` }} className="bg-blue-600 h-full transition-all" title={`Employers: ${employersPct}%`}></div>
                                                <div style={{ width: `${adminsPct}%` }} className="bg-charcoal h-full transition-all" title={`Admins: ${adminsPct}%`}></div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 pt-2">
                                                <div className="p-3 rounded-lg bg-orange/5 border border-orange/15">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-orange mb-1">
                                                        <span className="w-2 h-2 rounded-full bg-orange"></span>
                                                        <span>Job Seekers</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-charcoal">{dashboardStats?.users.seekers ?? 0}</p>
                                                    <span className="text-[11px] text-gray-500">{seekersPct}% of user base</span>
                                                </div>

                                                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
                                                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                                        <span>Employers</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-charcoal">{dashboardStats?.users.employers ?? 0}</p>
                                                    <span className="text-[11px] text-gray-500">{employersPct}% of user base</span>
                                                </div>

                                                <div className="p-3 rounded-lg bg-charcoal/5 border border-charcoal/20">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal mb-1">
                                                        <span className="w-2 h-2 rounded-full bg-charcoal"></span>
                                                        <span>Admins</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-charcoal">{dashboardStats?.users.admins ?? 0}</p>
                                                    <span className="text-[11px] text-gray-500">{adminsPct}% of user base</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                    Active: <strong className="text-charcoal">{dashboardStats?.users.active ?? 0}</strong>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                    Suspended/Blocked: <strong className="text-charcoal">{dashboardStats?.users.blocked ?? 0}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Breakdown 2: Job Postings Health */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-display font-bold text-charcoal">Job Postings Pipeline</h3>
                                        <p className="text-xs text-gray-500">Status breakdown of all postings across the platform</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('jobs')}
                                        className="text-xs font-semibold text-orange hover:underline"
                                    >
                                        Manage Jobs →
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-xs font-semibold text-gray-700">Published / Approved</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-charcoal">{dashboardStats?.jobs.published ?? 0}</span>
                                            <span className="text-[11px] text-gray-400">
                                                ({Math.round(((dashboardStats?.jobs.published || 0) / Math.max(1, dashboardStats?.jobs.total || 0)) * 100)}%)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-100/60">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                            <span className="text-xs font-semibold text-amber-900">Pending Admin Approval</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-amber-900">{dashboardStats?.jobs.pendingApproval ?? 0}</span>
                                            <span className="text-[11px] text-amber-700">Requires review</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                                            <span className="text-xs font-semibold text-gray-700">Drafts (Unpublished)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-charcoal">{dashboardStats?.jobs.draft ?? 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                                            <span className="text-xs font-semibold text-gray-700">Rejected Postings</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-charcoal">{dashboardStats?.jobs.rejected ?? 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                                            <span className="text-xs font-semibold text-gray-700">Closed / Expired</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-charcoal">{dashboardStats?.jobs.closed ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'jobs' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <h3 className="text-lg font-display font-bold text-charcoal">Manage Jobs</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => handleDownloadCsv('jobs')}
                                    disabled={exportingType === 'jobs'}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-charcoal border border-gray-200 font-semibold rounded-lg shadow-sm transition-all text-xs flex-shrink-0 disabled:opacity-50"
                                >
                                    <LuDownload className="w-3.5 h-3.5 text-orange" />
                                    <span>{exportingType === 'jobs' ? 'Exporting...' : 'Export Jobs CSV'}</span>
                                </button>
                                <select 
                                    className="border rounded p-1 text-sm bg-warmwhite"
                                    value={filterJobStatus}
                                    onChange={(e) => { setFilterJobStatus(e.target.value); setJobsPage(1); }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Draft">Draft</option>
                                    <option value="PendingApproval">Pending Approval</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Published">Published</option>
                                </select>
                                <div className="flex items-center border rounded px-2 bg-warmwhite">
                                    <LuSearch className="w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search jobs..." 
                                        className="p-1 outline-none text-sm"
                                        value={searchJob}
                                        onChange={(e) => { setSearchJob(e.target.value); setJobsPage(1); }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job / Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {jobs.map((job: any) => (
                                        <tr key={job.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-charcoal">{job.title}</div>
                                                <div className="text-sm text-gray-500">{job.company?.companyName || 'Unknown Company'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    job.status === 'Published' || job.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {job.status !== 'Approved' && job.status !== 'Published' && job.status !== 'Rejected' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApproveJob(job.id)}
                                                            className="text-charcoal hover:text-charcoal bg-peach hover:bg-peach/80 px-3 py-1 rounded text-xs font-semibold"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectJob(job.id)}
                                                            className="text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded text-xs font-semibold"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-3 bg-white flex items-center justify-between border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total: {totalJobs}</span>
                            <div className="flex space-x-2">
                                <button disabled={jobsPage === 1} onClick={() => setJobsPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronLeft className="w-4 h-4"/></button>
                                <button disabled={jobsPage * 10 >= totalJobs} onClick={() => setJobsPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {/* Action feedback alert */}
                        {userActionAlert && (
                            <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${
                                userActionAlert.type === 'success' 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    {userActionAlert.type === 'success' ? (
                                        <LuCircleCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    ) : (
                                        <LuCircleAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                                    )}
                                    <span>{userActionAlert.message}</span>
                                </div>
                                <button 
                                    onClick={() => setUserActionAlert(null)} 
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <LuX className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Header & Create Admin Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-display font-bold text-charcoal">User Management</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange/10 text-orange border border-orange/20">
                                        {totalUsers} {totalUsers === 1 ? 'Account' : 'Accounts'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Manage platform users, enforce security policies, block abusive accounts, and provision administrators.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => handleDownloadCsv('users')}
                                    disabled={exportingType === 'users'}
                                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-gray-50 text-charcoal border border-gray-200 font-semibold rounded-md shadow-sm transition-colors text-sm flex-shrink-0 disabled:opacity-50"
                                >
                                    <LuDownload className="w-4 h-4 text-orange" />
                                    <span>{exportingType === 'users' ? 'Exporting...' : 'Export Users CSV'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreateAdminOpen(true);
                                        setCreateAdminError('');
                                        setCreateAdminSuccess('');
                                    }}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange hover:bg-orange/90 text-white font-semibold rounded-md shadow-sm transition-colors text-sm flex-shrink-0"
                                >
                                    <LuUserPlus className="w-4 h-4" />
                                    <span>Create Admin</span>
                                </button>
                            </div>
                        </div>

                        {/* Search and Filters Strip */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                {/* Search */}
                                <div className="lg:col-span-2 relative">
                                    <LuSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or email..." 
                                        className="w-full pl-9 pr-8 py-2 text-sm bg-warmwhite/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all"
                                        value={searchUser}
                                        onChange={(e) => { setSearchUser(e.target.value); setUsersPage(1); }}
                                    />
                                    {searchUser && (
                                        <button 
                                            onClick={() => { setSearchUser(''); setUsersPage(1); }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <LuX className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Role Filter */}
                                <div>
                                    <select
                                        value={usersRoleFilter}
                                        onChange={(e) => { setUsersRoleFilter(e.target.value); setUsersPage(1); }}
                                        className="w-full py-2 px-3 text-sm bg-warmwhite/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all text-charcoal"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="JobSeeker">Job Seekers</option>
                                        <option value="Employer">Employers</option>
                                        <option value="Admin">Administrators</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <select
                                        value={usersStatusFilter}
                                        onChange={(e) => { setUsersStatusFilter(e.target.value); setUsersPage(1); }}
                                        className="w-full py-2 px-3 text-sm bg-warmwhite/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all text-charcoal"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="active">Active Only</option>
                                        <option value="blocked">Blocked Only</option>
                                    </select>
                                </div>

                                {/* Sort Selector */}
                                <div>
                                    <select
                                        value={`${usersSortBy}_${usersSortOrder}`}
                                        onChange={(e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('_');
                                            setUsersSortBy(sortBy);
                                            setUsersSortOrder(sortOrder as 'desc' | 'asc');
                                            setUsersPage(1);
                                        }}
                                        className="w-full py-2 px-3 text-sm bg-warmwhite/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all text-charcoal"
                                    >
                                        <option value="createdAt_desc">Newest Joined</option>
                                        <option value="createdAt_asc">Oldest Joined</option>
                                        <option value="fullName_asc">Name (A-Z)</option>
                                        <option value="fullName_desc">Name (Z-A)</option>
                                        <option value="email_asc">Email (A-Z)</option>
                                        <option value="lastLogin_desc">Recent Login</option>
                                    </select>
                                </div>
                            </div>

                            {/* Active Filters Summary & Page Size */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-charcoal">Filters:</span>
                                    {!searchUser && !usersRoleFilter && !usersStatusFilter ? (
                                        <span className="italic text-gray-400">None applied</span>
                                    ) : (
                                        <>
                                            {searchUser && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-charcoal">
                                                    Search: &quot;{searchUser}&quot;
                                                    <button onClick={() => { setSearchUser(''); setUsersPage(1); }}>
                                                        <LuX className="w-3 h-3 hover:text-red-500" />
                                                    </button>
                                                </span>
                                            )}
                                            {usersRoleFilter && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-charcoal">
                                                    Role: {usersRoleFilter}
                                                    <button onClick={() => { setUsersRoleFilter(''); setUsersPage(1); }}>
                                                        <LuX className="w-3 h-3 hover:text-red-500" />
                                                    </button>
                                                </span>
                                            )}
                                            {usersStatusFilter && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-charcoal">
                                                    Status: {usersStatusFilter}
                                                    <button onClick={() => { setUsersStatusFilter(''); setUsersPage(1); }}>
                                                        <LuX className="w-3 h-3 hover:text-red-500" />
                                                    </button>
                                                </span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSearchUser('');
                                                    setUsersRoleFilter('');
                                                    setUsersStatusFilter('');
                                                    setUsersSortBy('createdAt');
                                                    setUsersSortOrder('desc');
                                                    setUsersPage(1);
                                                }}
                                                className="text-orange hover:underline font-semibold ml-1"
                                            >
                                                Reset filters
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Rows:</span>
                                    <select
                                        value={usersPageSize}
                                        onChange={(e) => { setUsersPageSize(Number(e.target.value)); setUsersPage(1); }}
                                        className="bg-transparent border border-gray-200 rounded px-1.5 py-0.5 text-xs text-charcoal focus:outline-none"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hidden md:block">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/70">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status & Security</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                                                    No users found matching current filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((u: any) => {
                                                const isSelf = u.id === user?.id;
                                                const initials = u.fullName ? u.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
                                                return (
                                                    <tr key={u.id} className="hover:bg-warmwhite/40 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                                                                    u.role === 'Admin'
                                                                        ? 'bg-charcoal text-white border border-charcoal'
                                                                        : u.role === 'Employer'
                                                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                                }`}>
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-charcoal text-sm">{u.fullName}</span>
                                                                        {isSelf && (
                                                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                                                You
                                                                            </span>
                                                                        )}
                                                                        {u.mustChangePassword && (
                                                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                                                                                Pwd Reset Req.
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {u.role === 'Admin' ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-charcoal text-white">
                                                                    <LuShieldCheck className="w-3.5 h-3.5 text-orange" /> Admin
                                                                </span>
                                                            ) : u.role === 'Employer' ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                                    <LuBuilding className="w-3.5 h-3.5" /> Employer
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <LuUserCheck className="w-3.5 h-3.5" /> Job Seeker
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {u.isActive ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <div>
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                        Blocked
                                                                    </span>
                                                                    {u.blockedReason && (
                                                                        <p className="text-[11px] text-rose-600 mt-1 max-w-xs truncate" title={u.blockedReason}>
                                                                            Reason: {u.blockedReason}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-gray-400">Joined:</span>
                                                                <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <span className="text-gray-400">Login:</span>
                                                                <span>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                            {isSelf ? (
                                                                <span className="text-gray-400 italic font-normal">
                                                                    Protected (Self)
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {u.isActive ? (
                                                                        <button 
                                                                            onClick={() => {
                                                                                setBlockModalUser(u);
                                                                                setBlockReason('');
                                                                                setBlockError('');
                                                                            }}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100 font-semibold transition-colors"
                                                                        >
                                                                            <LuUserX className="w-3.5 h-3.5" />
                                                                            Block
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => {
                                                                                setUnblockModalUser(u);
                                                                                setUnblockReason('');
                                                                                setUnblockError('');
                                                                            }}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 font-semibold transition-colors"
                                                                        >
                                                                            <LuUserCheck className="w-3.5 h-3.5" />
                                                                            Unblock
                                                                        </button>
                                                                    )}

                                                                    {u.role === 'Admin' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setDemoteModalAdmin(u);
                                                                                setDemoteError('');
                                                                            }}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-800 bg-amber-50/60 hover:bg-amber-100 font-semibold transition-colors"
                                                                            title="Demote administrator to JobSeeker"
                                                                        >
                                                                            <LuShieldAlert className="w-3.5 h-3.5" />
                                                                            Demote
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Desktop Pagination */}
                            <div className="px-6 py-3.5 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                                <span className="text-xs text-gray-500">
                                    Showing {totalUsers > 0 ? ((usersPage - 1) * usersPageSize) + 1 : 0} to {Math.min(usersPage * usersPageSize, totalUsers)} of {totalUsers} users
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 mr-2">
                                        Page {usersPage} of {totalUsersPages}
                                    </span>
                                    <button 
                                        disabled={usersPage <= 1} 
                                        onClick={() => setUsersPage(p => Math.max(1, p - 1))} 
                                        className="p-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                    >
                                        <LuChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button 
                                        disabled={usersPage >= totalUsersPages} 
                                        onClick={() => setUsersPage(p => p + 1)} 
                                        className="p-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                    >
                                        <LuChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="md:hidden space-y-3">
                            {users.length === 0 ? (
                                <div className="bg-white p-8 rounded-xl text-center text-sm text-gray-400 border border-gray-100">
                                    No users found matching current filters.
                                </div>
                            ) : (
                                users.map((u: any) => {
                                    const isSelf = u.id === user?.id;
                                    const initials = u.fullName ? u.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
                                    return (
                                        <div key={u.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                                                        u.role === 'Admin'
                                                            ? 'bg-charcoal text-white border border-charcoal'
                                                            : u.role === 'Employer'
                                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    }`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-charcoal text-sm">{u.fullName}</span>
                                                            {isSelf && (
                                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{u.email}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {u.role === 'Admin' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-charcoal text-white">
                                                            <LuShieldCheck className="w-3 h-3 text-orange" /> Admin
                                                        </span>
                                                    ) : u.role === 'Employer' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                            Employer
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Job Seeker
                                                        </span>
                                                    )}
                                                    {u.isActive ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                            Blocked
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Blocked Reason Banner */}
                                            {!u.isActive && u.blockedReason && (
                                                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-700">
                                                    <span className="font-semibold">Reason:</span> {u.blockedReason}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                                <div>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                                                <div>Login: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</div>
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                                                {isSelf ? (
                                                    <span className="text-xs text-gray-400 italic">Protected (Self)</span>
                                                ) : (
                                                    <>
                                                        {u.isActive ? (
                                                            <button 
                                                                onClick={() => {
                                                                    setBlockModalUser(u);
                                                                    setBlockReason('');
                                                                    setBlockError('');
                                                                }}
                                                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50/60 font-semibold text-xs"
                                                            >
                                                                <LuUserX className="w-3.5 h-3.5" /> Block
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => {
                                                                    setUnblockModalUser(u);
                                                                    setUnblockReason('');
                                                                    setUnblockError('');
                                                                }}
                                                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50/60 font-semibold text-xs"
                                                            >
                                                                <LuUserCheck className="w-3.5 h-3.5" /> Unblock
                                                            </button>
                                                        )}
                                                        {u.role === 'Admin' && (
                                                            <button
                                                                onClick={() => {
                                                                    setDemoteModalAdmin(u);
                                                                    setDemoteError('');
                                                                }}
                                                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 bg-amber-50/60 font-semibold text-xs"
                                                            >
                                                                <LuShieldAlert className="w-3.5 h-3.5" /> Demote
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Mobile Pagination */}
                            <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span>Page {usersPage} of {totalUsersPages}</span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        disabled={usersPage <= 1} 
                                        onClick={() => setUsersPage(p => Math.max(1, p - 1))} 
                                        className="p-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-40"
                                    >
                                        <LuChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button 
                                        disabled={usersPage >= totalUsersPages} 
                                        onClick={() => setUsersPage(p => p + 1)} 
                                        className="p-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-40"
                                    >
                                        <LuChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'jobseekers' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                            <h3 className="text-lg font-display font-bold text-charcoal">Manage Job Seekers</h3>
                            <div className="flex items-center border rounded px-2 bg-warmwhite">
                                <LuSearch className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search job seekers..." 
                                    className="p-1 outline-none text-sm"
                                    value={searchJobseeker}
                                    onChange={(e) => { setSearchJobseeker(e.target.value); setJobseekersPage(1); }}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seeker</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {jobseekers.map((s: any) => (
                                        <tr key={s.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-charcoal">{s.fullName}</div>
                                                <div className="text-sm text-gray-500">{s.email}</div>
                                                {s.careerTitle && <div className="text-xs text-gray-400">{s.careerTitle}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    s.verificationStatus === 'Verified' ? 'bg-green-100 text-green-800' :
                                                    s.verificationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    s.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {s.verificationStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>Apps: {s.applicationsCount} | Saved: {s.savedJobsCount}</div>
                                                <div>Resume: {s.hasResume ? 'Yes' : 'No'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {s.isActive ? 'Active' : 'Blocked'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex flex-col items-end gap-1">
                                                    {s.verificationStatus === 'Pending' && (
                                                        <button 
                                                            onClick={() => { setActiveTab('verifications'); setSearchVerification(s.email); }}
                                                            className="text-orange hover:text-orange/80"
                                                        >
                                                            Review ID
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleToggleUserBlock(s.userId, s.isActive)}
                                                        className={`${s.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                    >
                                                        {s.isActive ? 'Block' : 'Unblock'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-3 bg-white flex items-center justify-between border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total: {totalJobseekers}</span>
                            <div className="flex space-x-2">
                                <button disabled={jobseekersPage === 1} onClick={() => setJobseekersPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronLeft className="w-4 h-4"/></button>
                                <button disabled={jobseekersPage * 10 >= totalJobseekers} onClick={() => setJobseekersPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'companies' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                            <h3 className="text-lg font-display font-bold text-charcoal">Manage Employers</h3>
                            <div className="flex items-center border rounded px-2 bg-warmwhite">
                                <LuSearch className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search companies..." 
                                    className="p-1 outline-none text-sm"
                                    value={searchCompany}
                                    onChange={(e) => { setSearchCompany(e.target.value); setCompaniesPage(1); }}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employer Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {companies.map((c: any) => (
                                        <tr key={c.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-charcoal">{c.companyName}</div>
                                                <div className="text-sm text-gray-500">{c.location}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {c.employer?.fullName}<br/>
                                                <span className="text-xs">{c.employer?.email}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    c.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {c.isApproved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => handleApproveCompany(c.id, !c.isApproved)}
                                                    className={`${c.isApproved ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                >
                                                    {c.isApproved ? 'Revoke Approval' : 'Approve'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-3 bg-white flex items-center justify-between border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total: {totalCompanies}</span>
                            <div className="flex space-x-2">
                                <button disabled={companiesPage === 1} onClick={() => setCompaniesPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronLeft className="w-4 h-4"/></button>
                                <button disabled={companiesPage * 10 >= totalCompanies} onClick={() => setCompaniesPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                            <h3 className="text-lg font-display font-bold text-charcoal">Manage Company Reviews</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating & Headline</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {reviews.map((r: any) => (
                                        <tr key={r.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal">
                                                {r.companyName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {r.seekerName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-charcoal max-w-xs truncate">
                                                <div className="flex items-center text-yellow-500 mb-1">
                                                    {r.rating} <LuStar className="w-3 h-3 ml-1 fill-yellow-500" />
                                                </div>
                                                <span title={r.description}>{r.headline}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    !r.isHidden ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {!r.isHidden ? 'Visible' : 'Hidden'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!r.isHidden ? (
                                                        <button 
                                                            onClick={() => {
                                                                setReviewModerateModal({ id: r.id, action: 'Hide', headline: r.headline });
                                                                setReviewModerateReason('');
                                                            }}
                                                            className="text-amber-600 hover:text-amber-900 bg-amber-50 px-2.5 py-1 rounded text-xs font-medium border border-amber-200"
                                                        >
                                                            Hide
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => {
                                                                setReviewModerateModal({ id: r.id, action: 'Unhide', headline: r.headline });
                                                                setReviewModerateReason('');
                                                            }}
                                                            className="text-green-600 hover:text-green-900 bg-green-50 px-2.5 py-1 rounded text-xs font-medium border border-green-200"
                                                        >
                                                            Unhide
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => {
                                                            setReviewModerateModal({ id: r.id, action: 'Delete', headline: r.headline });
                                                            setReviewModerateReason('');
                                                        }}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 px-2.5 py-1 rounded text-xs font-medium border border-red-200"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-3 bg-white flex items-center justify-between border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total: {totalReviews}</span>
                            <div className="flex space-x-2">
                                <button disabled={reviewsPage === 1} onClick={() => setReviewsPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronLeft className="w-4 h-4"/></button>
                                <button disabled={reviewsPage * 10 >= totalReviews} onClick={() => setReviewsPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'verifications' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                            <h3 className="text-lg font-display font-bold text-charcoal">Pending Identity Verifications</h3>
                            <div className="flex items-center border rounded px-2 bg-warmwhite">
                                <LuSearch className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    className="p-1 outline-none text-sm"
                                    value={searchVerification}
                                    onChange={(e) => { setSearchVerification(e.target.value); setVerificationsPage(1); }}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seeker</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Documents</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {verifications.map((v: any) => (
                                        <tr key={v.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-charcoal">{v.fullName}</div>
                                                <div className="text-sm text-gray-500">{v.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                                                {v.idCardFrontUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDocument(`/seekerprofiles/id-card/front?profileId=${v.id}`, `seeker-${v.id}-front`)}
                                                        disabled={viewingDoc === `seeker-${v.id}-front`}
                                                        className="text-orange hover:underline font-medium cursor-pointer disabled:opacity-50"
                                                    >
                                                        {viewingDoc === `seeker-${v.id}-front` ? 'Opening...' : 'Front'}
                                                    </button>
                                                )}
                                                {v.idCardBackUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDocument(`/seekerprofiles/id-card/back?profileId=${v.id}`, `seeker-${v.id}-back`)}
                                                        disabled={viewingDoc === `seeker-${v.id}-back`}
                                                        className="text-orange hover:underline font-medium cursor-pointer disabled:opacity-50"
                                                    >
                                                        {viewingDoc === `seeker-${v.id}-back` ? 'Opening...' : 'Back'}
                                                    </button>
                                                )}
                                                {!v.idCardFrontUrl && !v.idCardBackUrl && (
                                                    <span className="text-gray-400 italic">None</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => handleVerificationDecision(v.id, true)} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded border border-green-200">Approve</button>
                                                <button onClick={() => handleVerificationDecision(v.id, false)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded border border-red-200">Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {verifications.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No pending verifications found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 bg-white flex items-center justify-between border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total: {totalVerifications}</span>
                            <div className="flex space-x-2">
                                <button disabled={verificationsPage === 1} onClick={() => setVerificationsPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronLeft className="w-4 h-4"/></button>
                                <button disabled={verificationsPage * 10 >= totalVerifications} onClick={() => setVerificationsPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'employer-verifications' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                            <h3 className="text-lg font-display font-bold text-charcoal">Pending Employer ID Verifications</h3>
                            <div className="flex items-center border rounded px-2 bg-warmwhite">
                                <LuSearch className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email, or company..." 
                                    className="p-1 outline-none text-sm w-64"
                                    value={searchEmployerVerification}
                                    onChange={(e) => { setSearchEmployerVerification(e.target.value); setEmployerVerificationsPage(1); }}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employer & Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Documents</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {employerVerifications.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No pending verifications.</td></tr>
                                    ) : employerVerifications.map((v: any) => (
                                        <tr key={v.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-charcoal">{v.fullName}</div>
                                                <div className="text-sm text-gray-500">{v.email}</div>
                                                <div className="text-xs text-orange mt-1">Company: {v.companyName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                                                {v.idCardFrontUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDocument(`/companies/id-card/front?companyId=${v.id}`, `employer-${v.id}-front`)}
                                                        disabled={viewingDoc === `employer-${v.id}-front`}
                                                        className="text-orange hover:underline font-medium cursor-pointer disabled:opacity-50"
                                                    >
                                                        {viewingDoc === `employer-${v.id}-front` ? 'Opening...' : 'Front'}
                                                    </button>
                                                )}
                                                {v.idCardBackUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDocument(`/companies/id-card/back?companyId=${v.id}`, `employer-${v.id}-back`)}
                                                        disabled={viewingDoc === `employer-${v.id}-back`}
                                                        className="text-orange hover:underline font-medium cursor-pointer disabled:opacity-50"
                                                    >
                                                        {viewingDoc === `employer-${v.id}-back` ? 'Opening...' : 'Back'}
                                                    </button>
                                                )}
                                                {!v.idCardFrontUrl && !v.idCardBackUrl && (
                                                    <span className="text-gray-400 italic">None</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => handleEmployerVerificationDecision(v.id, true)} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded border border-green-200">Approve</button>
                                                <button onClick={() => handleEmployerVerificationDecision(v.id, false)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded border border-red-200">Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-3 bg-white flex items-center justify-between border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total Pending: {totalEmployerVerifications}</span>
                            <div className="flex space-x-2">
                                <button disabled={employerVerificationsPage === 1} onClick={() => setEmployerVerificationsPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronLeft className="w-4 h-4"/></button>
                                <button disabled={employerVerificationsPage * 10 >= totalEmployerVerifications} onClick={() => setEmployerVerificationsPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* REPORTS MODERATION TAB */}
                {activeTab === 'reports' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-display font-bold text-charcoal">Reports Moderation</h3>
                                <p className="text-xs text-gray-500 mt-1">Review flagged jobs and company reviews submitted by community members.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={reportsStatusFilter}
                                    onChange={(e) => { setReportsStatusFilter(e.target.value); setReportsPage(1); }}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-orange"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Dismissed">Dismissed</option>
                                </select>
                                <select
                                    value={reportsTypeFilter}
                                    onChange={(e) => { setReportsTypeFilter(e.target.value); setReportsPage(1); }}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-orange"
                                >
                                    <option value="">All Types</option>
                                    <option value="Job">Job Postings</option>
                                    <option value="Review">Company Reviews</option>
                                </select>
                                <div className="flex items-center border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50">
                                    <LuSearch className="w-4 h-4 text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Search reports..."
                                        className="bg-transparent outline-none text-xs w-40 sm:w-48 text-charcoal"
                                        value={searchReport}
                                        onChange={(e) => { setSearchReport(e.target.value); setReportsPage(1); }}
                                    />
                                </div>
                                <button
                                    onClick={() => refetchReports()}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                                    title="Refresh"
                                >
                                    <LuRefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Card View (375px responsive) */}
                        <div className="block lg:hidden divide-y divide-gray-100">
                            {(!reportsData?.data || reportsData.data.length === 0) ? (
                                <div className="p-8 text-center text-gray-400 text-sm">No reports match your filters.</div>
                            ) : (
                                reportsData.data.map((r: any) => (
                                    <div key={r.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                                r.reportType === 'Job' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {r.reportType} Report #{r.id}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                r.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                r.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                                                r.status === 'Dismissed' ? 'bg-gray-100 text-gray-700' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {r.status}
                                            </span>
                                        </div>

                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Target Summary</div>
                                            <div className="text-sm font-semibold text-charcoal">{r.targetSummary}</div>
                                            <div className="text-xs text-gray-400">Target ID: #{r.targetId ?? 'N/A'}</div>
                                        </div>

                                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs">
                                            <div className="font-semibold text-charcoal mb-0.5">Reason: {r.reason}</div>
                                            {r.description && <p className="text-gray-600 italic">"{r.description}"</p>}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>Reporter: <strong className="text-gray-600">{r.reporterName}</strong></span>
                                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        {r.adminNote && (
                                            <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-800">
                                                <strong>Admin Note:</strong> {r.adminNote}
                                            </div>
                                        )}

                                        <div className="pt-2 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    setReportStatusModal({ id: r.id, currentStatus: r.status });
                                                    setReportNewStatus(r.status);
                                                    setReportAdminNote(r.adminNote || '');
                                                }}
                                                className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                                            >
                                                Update Status
                                            </button>
                                            {r.reportType === 'Job' && (
                                                <button
                                                    onClick={() => {
                                                        setReportDirectActionModal({ id: r.id, type: 'Job' });
                                                        setReportDirectAction('CloseJob');
                                                        setReportDirectReason(`Closed due to community report #${r.id}: ${r.reason}`);
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
                                                >
                                                    Close Job
                                                </button>
                                            )}
                                            {r.reportType === 'Review' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setReportDirectActionModal({ id: r.id, type: 'Review' });
                                                            setReportDirectAction('HideReview');
                                                            setReportDirectReason(`Hidden due to community report #${r.id}: ${r.reason}`);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition-colors"
                                                    >
                                                        Hide Review
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setReportDirectActionModal({ id: r.id, type: 'Review' });
                                                            setReportDirectAction('DeleteReview');
                                                            setReportDirectReason(`Deleted due to community report #${r.id}: ${r.reason}`);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
                                                    >
                                                        Delete Review
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/60">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type / ID</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reporter</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason & Details</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Note</th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {(!reportsData?.data || reportsData.data.length === 0) ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                                                No reports found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportsData.data.map((r: any) => (
                                            <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                                        r.reportType === 'Job' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {r.reportType} #{r.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <div className="text-sm font-semibold text-charcoal truncate" title={r.targetSummary}>{r.targetSummary}</div>
                                                    <div className="text-xs text-gray-400">ID: #{r.targetId ?? 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {r.reporterName}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs text-xs">
                                                    <div className="font-semibold text-charcoal">{r.reason}</div>
                                                    {r.description && <div className="text-gray-500 truncate" title={r.description}>{r.description}</div>}
                                                    <div className="text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        r.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                        r.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                                                        r.status === 'Dismissed' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs text-xs text-gray-600">
                                                    {r.adminNote ? (
                                                        <span className="truncate block" title={r.adminNote}>{r.adminNote}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">None</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                setReportStatusModal({ id: r.id, currentStatus: r.status });
                                                                setReportNewStatus(r.status);
                                                                setReportAdminNote(r.adminNote || '');
                                                            }}
                                                            className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded transition-colors"
                                                        >
                                                            Status
                                                        </button>
                                                        {r.reportType === 'Job' && (
                                                            <button
                                                                onClick={() => {
                                                                    setReportDirectActionModal({ id: r.id, type: 'Job' });
                                                                    setReportDirectAction('CloseJob');
                                                                    setReportDirectReason(`Closed due to community report #${r.id}: ${r.reason}`);
                                                                }}
                                                                className="text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded transition-colors"
                                                            >
                                                                Close Job
                                                            </button>
                                                        )}
                                                        {r.reportType === 'Review' && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setReportDirectActionModal({ id: r.id, type: 'Review' });
                                                                        setReportDirectAction('HideReview');
                                                                        setReportDirectReason(`Hidden due to community report #${r.id}: ${r.reason}`);
                                                                    }}
                                                                    className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded transition-colors"
                                                                >
                                                                    Hide
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setReportDirectActionModal({ id: r.id, type: 'Review' });
                                                                        setReportDirectAction('DeleteReview');
                                                                        setReportDirectReason(`Deleted due to community report #${r.id}: ${r.reason}`);
                                                                    }}
                                                                    className="text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-3.5 bg-white flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
                            <span>Total Reports: <strong>{reportsData?.totalCount ?? 0}</strong></span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={reportsPage <= 1}
                                    onClick={() => setReportsPage(p => p - 1)}
                                    className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                                >
                                    <LuChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-semibold">Page {reportsPage}</span>
                                <button
                                    disabled={reportsPage * 20 >= (reportsData?.totalCount ?? 0)}
                                    onClick={() => setReportsPage(p => p + 1)}
                                    className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                                >
                                    <LuChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CATEGORIES MANAGEMENT TAB */}
                {activeTab === 'categories' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-display font-bold text-charcoal">Manage Job Categories</h3>
                                <p className="text-xs text-gray-500 mt-1">Configure industry job categories. Categories linked to active jobs cannot be deleted, but may be disabled.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setCatEditModal({ name: '', description: '', isActive: true });
                                    setCatError('');
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange/90 shadow-sm transition-colors"
                            >
                                <LuPlus className="w-4 h-4" />
                                <span>Add Category</span>
                            </button>
                        </div>

                        {/* Mobile Cards */}
                        <div className="block md:hidden divide-y divide-gray-100">
                            {(!categoriesData?.data || categoriesData.data.length === 0) ? (
                                <div className="p-8 text-center text-gray-400 text-sm">No categories available.</div>
                            ) : (
                                categoriesData.data.map((cat: any) => (
                                    <div key={cat.id} className="p-4 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-charcoal">{cat.name}</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {cat.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>
                                        {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
                                        <div className="text-xs text-gray-400">
                                            Jobs Assigned: <strong className="text-gray-700">{cat.jobCount}</strong>
                                        </div>
                                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-50">
                                            <button
                                                onClick={() => {
                                                    setCatEditModal({ id: cat.id, name: cat.name, description: cat.description || '', isActive: cat.isActive });
                                                    setCatError('');
                                                }}
                                                className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleToggleCategoryActive(cat)}
                                                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                                    cat.isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'
                                                }`}
                                            >
                                                {cat.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => setCatDeleteConfirm({ id: cat.id, name: cat.name })}
                                                className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/60">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Name</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Associated Jobs</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {(!categoriesData?.data || categoriesData.data.length === 0) ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                                                No categories found. Click "Add Category" to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        categoriesData.data.map((cat: any) => (
                                            <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                                                    {cat.name}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 max-w-sm">
                                                    {cat.description || <span className="text-gray-400 italic">No description</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                                        {cat.jobCount} Jobs
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {cat.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setCatEditModal({ id: cat.id, name: cat.name, description: cat.description || '', isActive: cat.isActive });
                                                                setCatError('');
                                                            }}
                                                            className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded transition-colors"
                                                            title="Edit Category"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleCategoryActive(cat)}
                                                            className={`px-2.5 py-1 rounded transition-colors ${
                                                                cat.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200' : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                                                            }`}
                                                        >
                                                            {cat.isActive ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button
                                                            onClick={() => setCatDeleteConfirm({ id: cat.id, name: cat.name })}
                                                            className="text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded transition-colors"
                                                            title="Delete Category"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* LOCATIONS MANAGEMENT TAB */}
                {activeTab === 'locations' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-display font-bold text-charcoal">Manage Locations</h3>
                                <p className="text-xs text-gray-500 mt-1">Configure predefined cities and districts across Sri Lanka used in job postings and search filters.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setLocEditModal({ name: '', stateOrProvince: '', country: 'Sri Lanka', isActive: true });
                                    setLocError('');
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange/90 shadow-sm transition-colors"
                            >
                                <LuPlus className="w-4 h-4" />
                                <span>Add Location</span>
                            </button>
                        </div>

                        {/* Mobile Cards */}
                        <div className="block md:hidden divide-y divide-gray-100">
                            {(!locationsData?.data || locationsData.data.length === 0) ? (
                                <div className="p-8 text-center text-gray-400 text-sm">No locations available.</div>
                            ) : (
                                locationsData.data.map((loc: any) => (
                                    <div key={loc.id} className="p-4 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-charcoal">{loc.name}</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                loc.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {loc.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {loc.stateOrProvince ? `${loc.stateOrProvince}, ` : ''}{loc.country}
                                        </div>
                                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-50">
                                            <button
                                                onClick={() => {
                                                    setLocEditModal({ id: loc.id, name: loc.name, stateOrProvince: loc.stateOrProvince || '', country: loc.country || 'Sri Lanka', isActive: loc.isActive });
                                                    setLocError('');
                                                }}
                                                className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleToggleLocationActive(loc)}
                                                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                                    loc.isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'
                                                }`}
                                            >
                                                {loc.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => setLocDeleteConfirm({ id: loc.id, name: loc.name })}
                                                className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/60">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">City / Location</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">State / Province</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {(!locationsData?.data || locationsData.data.length === 0) ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                                                No locations found. Click "Add Location" to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        locationsData.data.map((loc: any) => (
                                            <tr key={loc.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                                                    {loc.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                                    {loc.stateOrProvince || '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                                    {loc.country}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        loc.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {loc.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setLocEditModal({ id: loc.id, name: loc.name, stateOrProvince: loc.stateOrProvince || '', country: loc.country || 'Sri Lanka', isActive: loc.isActive });
                                                                setLocError('');
                                                            }}
                                                            className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded transition-colors"
                                                            title="Edit Location"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleLocationActive(loc)}
                                                            className={`px-2.5 py-1 rounded transition-colors ${
                                                                loc.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200' : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                                                            }`}
                                                        >
                                                            {loc.isActive ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button
                                                            onClick={() => setLocDeleteConfirm({ id: loc.id, name: loc.name })}
                                                            className="text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded transition-colors"
                                                            title="Delete Location"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* PLATFORM PAYMENTS TAB (READ-ONLY) */}
                {activeTab === 'payments' && (
                    <div className="space-y-6">
                        {/* Revenue Metrics Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                        Completed Revenue
                                    </span>
                                    <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <LuCreditCard className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Revenue (Completed)</p>
                                <p className="text-2xl font-display font-bold text-charcoal mt-1 truncate">
                                    LKR {Number(paymentsData?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                                        Transactions
                                    </span>
                                    <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                                        <LuDollarSign className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Orders Processed</p>
                                <p className="text-2xl font-display font-bold text-charcoal mt-1">
                                    {(paymentsData?.totalCount || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Payments Table Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-display font-bold text-charcoal">Payment History (Read-Only)</h3>
                                    <p className="text-xs text-gray-500 mt-1">Secure record of all job posting payments processed through the PayHere gateway.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={paymentsStatusFilter}
                                        onChange={(e) => { setPaymentsStatusFilter(e.target.value); setPaymentsPage(1); }}
                                        className="border border-gray-200 rounded-md px-3 py-2 text-xs bg-white focus:outline-none focus:border-orange"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Failed">Failed</option>
                                    </select>
                                    <div className="flex items-center border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50">
                                        <LuSearch className="w-4 h-4 text-gray-400 mr-2" />
                                        <input
                                            type="text"
                                            placeholder="Order, company, job..."
                                            className="bg-transparent outline-none text-xs w-36 sm:w-44 text-charcoal"
                                            value={searchPayment}
                                            onChange={(e) => { setSearchPayment(e.target.value); setPaymentsPage(1); }}
                                        />
                                    </div>
                                    <input
                                        type="date"
                                        value={paymentsDateFrom}
                                        onChange={(e) => { setPaymentsDateFrom(e.target.value); setPaymentsPage(1); }}
                                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-orange"
                                        title="Date From"
                                    />
                                    <input
                                        type="date"
                                        value={paymentsDateTo}
                                        onChange={(e) => { setPaymentsDateTo(e.target.value); setPaymentsPage(1); }}
                                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-orange"
                                        title="Date To"
                                    />
                                    <button
                                        onClick={() => refetchPayments()}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                                        title="Refresh Payments"
                                    >
                                        <LuRefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Card View (375px responsive) */}
                            <div className="block lg:hidden divide-y divide-gray-100">
                                {(!paymentsData?.data || paymentsData.data.length === 0) ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">No payment records match your filters.</div>
                                ) : (
                                    paymentsData.data.map((p: any) => (
                                        <div key={p.id} className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold text-charcoal">#{p.orderId}</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    p.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                    p.status === 'Failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-charcoal">
                                                {p.currency} {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                <div><strong>Company:</strong> {p.company}</div>
                                                <div><strong>Job:</strong> {p.jobTitle}</div>
                                            </div>
                                            <div className="text-xs text-gray-400 pt-1 border-t border-gray-50 flex items-center justify-between">
                                                <span>Initiated: {new Date(p.createdAt).toLocaleDateString()}</span>
                                                {p.completedAt && <span>Completed: {new Date(p.completedAt).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/60">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {(!paymentsData?.data || paymentsData.data.length === 0) ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                                                    No payment records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            paymentsData.data.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-charcoal">
                                                        #{p.orderId}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {p.company}
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs text-xs text-charcoal truncate" title={p.jobTitle}>
                                                        {p.jobTitle}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-charcoal">
                                                        {p.currency} {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            p.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                            p.status === 'Failed' ? 'bg-red-100 text-red-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                        {new Date(p.createdAt).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-3.5 bg-white flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
                                <span>Total Payments: <strong>{paymentsData?.totalCount ?? 0}</strong></span>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={paymentsPage <= 1}
                                        onClick={() => setPaymentsPage(p => p - 1)}
                                        className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        <LuChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-semibold">Page {paymentsPage}</span>
                                    <button
                                        disabled={paymentsPage * 20 >= (paymentsData?.totalCount ?? 0)}
                                        onClick={() => setPaymentsPage(p => p + 1)}
                                        className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        <LuChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SYSTEM SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="space-y-6 max-w-4xl">
                        {/* Header */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-display font-bold text-charcoal flex items-center gap-2">
                                    <LuSettings className="w-5 h-5 text-orange" />
                                    System & Platform Settings
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Configure global platform configurations, job posting rates, contact details, and maintenance mode.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => refetchSettings()}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
                                    title="Reload settings"
                                >
                                    <LuRefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Settings Form Card */}
                        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
                            {settingsMsg && (
                                <div className={`p-4 rounded-md text-xs font-semibold flex items-center gap-2.5 ${settingsMsg.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                    {settingsMsg.isError ? <LuTriangleAlert className="w-4 h-4 shrink-0" /> : <LuCircleCheck className="w-4 h-4 shrink-0" />}
                                    <span>{settingsMsg.text}</span>
                                </div>
                            )}

                            {isSettingsLoading ? (
                                <div className="py-12 text-center text-xs text-gray-400">Loading system settings...</div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }} className="space-y-6">
                                    {/* Site Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Platform Display Name (Site Name) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={100}
                                            required
                                            value={settingsForm.siteName}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                                            placeholder="e.g. CorrectJob or HireConnect"
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange transition-all"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">Displayed in website header, footer, page titles, and notification emails (Max 100 characters).</p>
                                    </div>

                                    {/* Job Posting Fee */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Job Posting Fee (LKR) <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">LKR</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={1000000}
                                                step="100"
                                                required
                                                value={settingsForm.jobPostingFee}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, jobPostingFee: Number(e.target.value) })}
                                                className="w-full pl-14 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange transition-all font-semibold text-charcoal"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1">Standard listing fee charged to employers per paid job post. Valid range: 0.00 to 1,000,000.00 LKR.</p>
                                    </div>

                                    {/* Contact Email */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Support Contact Email <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={settingsForm.contactEmail}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                                            placeholder="support@correctjob.com"
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange transition-all"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">Direct support email shown on public contact page and system communications.</p>
                                    </div>

                                    {/* Maintenance Mode */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-charcoal">Platform Maintenance Mode</span>
                                                    {settingsForm.maintenanceMode && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">ACTIVE</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    When enabled, non-admin visitors receive a 503 Maintenance page. Admins retain full access.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settingsForm.maintenanceMode}
                                                    onChange={(e) => {
                                                        const newVal = e.target.checked;
                                                        if (newVal) {
                                                            setMaintenanceConfirmOpen(true);
                                                        } else {
                                                            setSettingsForm({ ...settingsForm, maintenanceMode: false });
                                                        }
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="pt-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={settingsSaving}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-orange hover:bg-orange/90 rounded-xl shadow-sm transition-all disabled:opacity-50"
                                        >
                                            <LuSave className="w-4 h-4" />
                                            {settingsSaving ? 'Saving Changes...' : 'Save Settings'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Quick Platform Data Export Card */}
                        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                                    <LuDownload className="w-4 h-4 text-orange" />
                                    Platform Data Exports (CSV)
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Download sanitized CSV exports with formula injection defense and privacy redaction (passwords, payment cards, identity IDs omitted).
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownloadCsv('users')}
                                    disabled={exportingType === 'users'}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-charcoal bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-all shadow-sm disabled:opacity-50"
                                >
                                    <LuDownload className="w-3.5 h-3.5 text-orange" />
                                    {exportingType === 'users' ? 'Generating Users CSV...' : 'Download Users CSV'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDownloadCsv('jobs')}
                                    disabled={exportingType === 'jobs'}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-charcoal bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-all shadow-sm disabled:opacity-50"
                                >
                                    <LuDownload className="w-3.5 h-3.5 text-orange" />
                                    {exportingType === 'jobs' ? 'Generating Jobs CSV...' : 'Download Jobs CSV'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AUDIT LOGS TAB (STRICTLY READ-ONLY) */}
                {activeTab === 'audit-logs' && (
                    <div className="space-y-6 max-w-7xl">
                        {/* Header Banner */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-display font-bold text-charcoal flex items-center gap-2">
                                    <LuClock className="w-5 h-5 text-orange" />
                                    Admin Audit Logs
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Read-Only & Immutable</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tamper-proof record of all admin administrative operations, category edits, moderation decisions, and system setting changes.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => refetchAuditLogs()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-all"
                                >
                                    <LuRefreshCw className="w-3.5 h-3.5" />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                {/* Search */}
                                <div className="relative sm:col-span-2">
                                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search details or action..."
                                        value={auditSearch}
                                        onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                                        className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange focus:bg-white"
                                    />
                                </div>

                                {/* Action Filter */}
                                <div>
                                    <select
                                        value={auditActionFilter}
                                        onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange focus:bg-white"
                                    >
                                        <option value="">All Actions</option>
                                        <option value="UPDATE_REPORT_STATUS">Report Status</option>
                                        <option value="CLOSE_JOB_FROM_REPORT">Close Job (Report)</option>
                                        <option value="MODERATE_REVIEW">Moderate Review</option>
                                        <option value="CREATE_CATEGORY">Create Category</option>
                                        <option value="UPDATE_CATEGORY">Update Category</option>
                                        <option value="DELETE_CATEGORY">Delete Category</option>
                                        <option value="CREATE_LOCATION">Create Location</option>
                                        <option value="UPDATE_LOCATION">Update Location</option>
                                        <option value="DELETE_LOCATION">Delete Location</option>
                                        <option value="UPDATE_SETTING_SITENAME">Update SiteName</option>
                                        <option value="SETTING_JOB_POSTING_FEE_UPDATED">Update Fee</option>
                                        <option value="UPDATE_SETTING_CONTACT_EMAIL">Update ContactEmail</option>
                                        <option value="SETTING_MAINTENANCE_MODE_UPDATED">Update Maintenance</option>
                                        <option value="EXPORT_USERS_CSV">Export Users CSV</option>
                                        <option value="EXPORT_JOBS_CSV">Export Jobs CSV</option>
                                    </select>
                                </div>

                                {/* Target Type Filter */}
                                <div>
                                    <select
                                        value={auditTargetTypeFilter}
                                        onChange={(e) => { setAuditTargetTypeFilter(e.target.value); setAuditPage(1); }}
                                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange focus:bg-white"
                                    >
                                        <option value="">All Target Types</option>
                                        <option value="Report">Report</option>
                                        <option value="Job">Job</option>
                                        <option value="Review">Review</option>
                                        <option value="Category">Category</option>
                                        <option value="Location">Location</option>
                                        <option value="SystemSetting">SystemSetting</option>
                                        <option value="User">User</option>
                                    </select>
                                </div>

                                {/* Admin Filter */}
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Filter by admin..."
                                        value={auditAdminFilter}
                                        onChange={(e) => { setAuditAdminFilter(e.target.value); setAuditPage(1); }}
                                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange focus:bg-white"
                                    />
                                </div>
                            </div>

                            {/* Date Range & Reset */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-100 text-xs">
                                <span className="text-gray-400 font-medium">Date Range:</span>
                                <input
                                    type="date"
                                    value={auditDateFrom}
                                    onChange={(e) => { setAuditDateFrom(e.target.value); setAuditPage(1); }}
                                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                                    title="Date From"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="date"
                                    value={auditDateTo}
                                    onChange={(e) => { setAuditDateTo(e.target.value); setAuditPage(1); }}
                                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                                    title="Date To"
                                />
                                {(auditSearch || auditActionFilter || auditAdminFilter || auditTargetTypeFilter || auditDateFrom || auditDateTo) && (
                                    <button
                                        onClick={() => {
                                            setAuditSearch('');
                                            setAuditActionFilter('');
                                            setAuditAdminFilter('');
                                            setAuditTargetTypeFilter('');
                                            setAuditDateFrom('');
                                            setAuditDateTo('');
                                            setAuditPage(1);
                                        }}
                                        className="text-orange hover:underline font-semibold ml-auto"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Audit Logs Content (Desktop Table + Mobile Cards) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Mobile Card View (375px responsive) */}
                            <div className="md:hidden divide-y divide-gray-100 p-4 space-y-3">
                                {isAuditLoading ? (
                                    <div className="py-8 text-center text-xs text-gray-400">Loading audit logs...</div>
                                ) : auditLogsData?.data?.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-gray-400">No audit log records found matching your filters.</div>
                                ) : (
                                    auditLogsData?.data?.map((log: any) => (
                                        <div key={log.id} className="p-3 bg-warmwhite/60 rounded-lg space-y-2 border border-gray-200 text-xs">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-bold text-charcoal">{log.adminName}</span>
                                                <span className="text-[10px] text-gray-400 shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange/10 text-orange">
                                                    {log.action}
                                                </span>
                                                {log.targetType && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                                                        {log.targetType}{log.targetId ? ` #${log.targetId}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                            {log.details && (
                                                <p className="text-gray-600 text-[11px] leading-relaxed break-words bg-white p-2 rounded-lg border border-gray-100">
                                                    {log.details}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left">Timestamp</th>
                                            <th className="px-6 py-3.5 text-left">Admin</th>
                                            <th className="px-6 py-3.5 text-left">Action</th>
                                            <th className="px-6 py-3.5 text-left">Target</th>
                                            <th className="px-6 py-3.5 text-left">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                        {isAuditLoading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading audit records...</td>
                                            </tr>
                                        ) : auditLogsData?.data?.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No audit log records found.</td>
                                            </tr>
                                        ) : (
                                            auditLogsData?.data?.map((log: any) => (
                                                <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-6 py-3.5 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-3.5 whitespace-nowrap">
                                                        <div className="font-bold text-charcoal">{log.adminName}</div>
                                                        {log.adminEmail && <div className="text-[11px] text-gray-400">{log.adminEmail}</div>}
                                                    </td>
                                                    <td className="px-6 py-3.5 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange/10 text-orange">
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                                                        {log.targetType ? `${log.targetType}${log.targetId ? ` #${log.targetId}` : ''}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-gray-600 max-w-md truncate" title={log.details || ''}>
                                                        {log.details || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-3.5 bg-white flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
                                <span>Total Records: <strong>{auditLogsData?.totalCount ?? 0}</strong></span>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={auditPage <= 1}
                                        onClick={() => setAuditPage(p => p - 1)}
                                        className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        <LuChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-semibold">Page {auditPage} of {auditLogsData?.totalPages || 1}</span>
                                    <button
                                        disabled={auditPage >= (auditLogsData?.totalPages || 1)}
                                        onClick={() => setAuditPage(p => p + 1)}
                                        className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        <LuChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="max-w-2xl">
                        <h2 className="text-2xl font-display font-bold text-charcoal mb-6">Profile & Security</h2>

                        {/* Edit Profile Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <div className="flex items-center gap-4 mb-6">
                                {user?.profileImage ? (
                                    <img
                                        src={getFileUrl(user.profileImage)}
                                        alt={user.fullName}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-orange/20 shadow-sm flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-orange flex items-center justify-center text-white font-bold text-2xl shadow-sm flex-shrink-0">
                                        {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold text-charcoal">{user?.fullName}</h3>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-orange/10 text-orange border border-orange/20">
                                        <LuShieldCheck className="w-3 h-3" />
                                        {user?.role}
                                    </span>
                                </div>
                            </div>

                            <h4 className="text-base font-semibold text-charcoal mb-4 border-b border-gray-100 pb-2">Edit Profile</h4>
                            <form onSubmit={handleProfileSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={profileData.fullName}
                                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none text-sm"
                                    />
                                </div>

                                {profileMsg && (
                                    <p className={`text-sm font-medium ${profileMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                        {profileMsg}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={profileSaving}
                                    className="flex items-center justify-center bg-orange text-white px-5 py-2.5 rounded-md font-medium hover:bg-orange/90 disabled:opacity-50 transition-all shadow-sm text-sm"
                                >
                                    <LuSave className="w-4 h-4 mr-2" />
                                    {profileSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Change Password Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h4 className="text-base font-semibold text-charcoal mb-4 border-b border-gray-100 pb-2 flex items-center">
                                <LuLock className="w-4 h-4 mr-2 text-gray-500" />
                                Change Password
                            </h4>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Re-enter new password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none text-sm"
                                    />
                                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                        <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                                    )}
                                </div>

                                {passwordMsg && (
                                    <p className={`text-sm font-medium ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordMsg}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={passwordSaving}
                                    className="flex items-center justify-center bg-charcoal text-white px-5 py-2.5 rounded-md font-medium hover:bg-charcoal/90 disabled:opacity-50 transition-all shadow-sm text-sm"
                                >
                                    <LuLock className="w-4 h-4 mr-2" />
                                    {passwordSaving ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Block User Modal */}
                {blockModalUser && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                                    <LuShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-charcoal">Block User Account</h3>
                                    <p className="text-xs text-gray-500">Suspend access and invalidate active sessions.</p>
                                </div>
                            </div>

                            <div className="p-3 bg-warmwhite/60 rounded-md mb-4 text-xs space-y-1 border border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Target User:</span>
                                    <span className="font-semibold text-charcoal">{blockModalUser.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Email:</span>
                                    <span className="text-charcoal">{blockModalUser.email}</span>
                                </div>
                                {blockModalUser.role && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Role:</span>
                                        <span className="font-medium text-charcoal">{blockModalUser.role}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md mb-4 text-xs text-rose-700 flex items-start gap-2">
                                <LuInfo className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>Blocking this user will immediately revoke all active refresh tokens and log them out across all devices.</span>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <div className="flex justify-between items-center text-xs">
                                    <label className="font-semibold text-charcoal">
                                        Reason for Blocking <span className="text-rose-500">*</span>
                                    </label>
                                    <span className={`text-[11px] ${blockReason.length > 500 ? 'text-rose-600 font-bold' : 'text-gray-400'}`}>
                                        {blockReason.length} / 500
                                    </span>
                                </div>
                                <textarea
                                    rows={3}
                                    required
                                    maxLength={500}
                                    placeholder="Specify the violation or reason for suspension (e.g. Terms violation, spam posting)..."
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    className="w-full text-xs p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-200 focus:border-rose-500 outline-none resize-none transition-all"
                                />
                                {blockError && (
                                    <p className="text-xs text-rose-600 font-medium">{blockError}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    disabled={blockLoading}
                                    onClick={() => { setBlockModalUser(null); setBlockReason(''); setBlockError(''); }}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={blockLoading || !blockReason.trim() || blockReason.length > 500}
                                    onClick={handleConfirmBlock}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                                >
                                    {blockLoading ? (
                                        <>
                                            <LuRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Blocking...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LuUserX className="w-3.5 h-3.5" />
                                            <span>Confirm Block</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Unblock User Modal */}
                {unblockModalUser && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                    <LuCircleCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-charcoal">Unblock User Account</h3>
                                    <p className="text-xs text-gray-500">Restore access and permit new logins.</p>
                                </div>
                            </div>

                            <div className="p-3 bg-warmwhite/60 rounded-md mb-4 text-xs space-y-1 border border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Target User:</span>
                                    <span className="font-semibold text-charcoal">{unblockModalUser.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Email:</span>
                                    <span className="text-charcoal">{unblockModalUser.email}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <label className="text-xs font-semibold text-charcoal">
                                    Optional Note / Unblock Reason
                                </label>
                                <textarea
                                    rows={2}
                                    maxLength={500}
                                    placeholder="Optional audit note (e.g. Appeal approved, verification completed)..."
                                    value={unblockReason}
                                    onChange={(e) => setUnblockReason(e.target.value)}
                                    className="w-full text-xs p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none resize-none transition-all"
                                />
                                {unblockError && (
                                    <p className="text-xs text-rose-600 font-medium">{unblockError}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    disabled={unblockLoading}
                                    onClick={() => { setUnblockModalUser(null); setUnblockReason(''); setUnblockError(''); }}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={unblockLoading}
                                    onClick={handleConfirmUnblock}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                                >
                                    {unblockLoading ? (
                                        <>
                                            <LuRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Unblocking...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LuUserCheck className="w-3.5 h-3.5" />
                                            <span>Confirm Unblock</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Admin Modal */}
                {isCreateAdminOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
                                    <LuUserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-charcoal">Create Administrator</h3>
                                    <p className="text-xs text-gray-500">Provision a new administrator account with system-level access.</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateAdmin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. John Doe"
                                        value={createAdminData.fullName}
                                        onChange={(e) => setCreateAdminData({ ...createAdminData, fullName: e.target.value })}
                                        className="w-full text-xs p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="admin@hireconnect.com"
                                        value={createAdminData.email}
                                        onChange={(e) => setCreateAdminData({ ...createAdminData, email: e.target.value })}
                                        className="w-full text-xs p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-charcoal mb-1">
                                        Initial Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCreateAdminPassword ? 'text' : 'password'}
                                            required
                                            placeholder="Strong admin password"
                                            value={createAdminData.password}
                                            onChange={(e) => setCreateAdminData({ ...createAdminData, password: e.target.value })}
                                            className="w-full text-xs p-2.5 pr-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateAdminPassword(!showCreateAdminPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCreateAdminPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Password Checklist */}
                                    <div className="mt-2.5 p-3 bg-warmwhite/60 rounded-md space-y-1.5 text-[11px] border border-gray-200">
                                        <span className="font-semibold text-charcoal block mb-1">Password Requirements:</span>
                                        {(() => {
                                            const pwd = createAdminData.password;
                                            const hasMinLen = pwd.length >= 12;
                                            const hasUpper = /[A-Z]/.test(pwd);
                                            const hasLower = /[a-z]/.test(pwd);
                                            const hasDigit = /[0-9]/.test(pwd);
                                            const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                    <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                                        {hasMinLen ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                                        <span>At least 12 characters</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                                        {hasUpper ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                                        <span>Uppercase letter (A-Z)</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                                        {hasLower ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                                        <span>Lowercase letter (a-z)</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                                        {hasDigit ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                                        <span>Numeric digit (0-9)</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                                        {hasSpecial ? <LuCheck className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1" />}
                                                        <span>Special symbol (!@#$...)</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="forcePwdChange"
                                        checked={createAdminData.forcePasswordChange}
                                        onChange={(e) => setCreateAdminData({ ...createAdminData, forcePasswordChange: e.target.checked })}
                                        className="w-4 h-4 text-orange focus:ring-orange border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="forcePwdChange" className="text-xs text-charcoal font-medium cursor-pointer">
                                        Require password change on first login (Recommended)
                                    </label>
                                </div>

                                {createAdminError && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
                                        {createAdminError}
                                    </div>
                                )}

                                {createAdminSuccess && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700">
                                        {createAdminSuccess}
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        disabled={createAdminLoading}
                                        onClick={() => {
                                            setIsCreateAdminOpen(false);
                                            setCreateAdminError('');
                                            setCreateAdminSuccess('');
                                        }}
                                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            createAdminLoading ||
                                             !createAdminData.fullName.trim() ||
                                            !createAdminData.email.trim() ||
                                            createAdminData.password.length < 12 ||
                                            !/[A-Z]/.test(createAdminData.password) ||
                                            !/[a-z]/.test(createAdminData.password) ||
                                            !/[0-9]/.test(createAdminData.password) ||
                                            !/[^a-zA-Z0-9]/.test(createAdminData.password)
                                        }
                                        className="px-4 py-2 text-xs font-semibold text-white bg-orange hover:bg-orange/90 disabled:opacity-50 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                                    >
                                        {createAdminLoading ? (
                                            <>
                                                <LuRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                <span>Creating Admin...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LuUserPlus className="w-3.5 h-3.5" />
                                                <span>Create Admin</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Demote Admin Modal */}
                {demoteModalAdmin && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                                    <LuTriangleAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-charcoal">Demote Administrator</h3>
                                    <p className="text-xs text-gray-500">Revoke administrative privileges.</p>
                                </div>
                            </div>

                            <div className="p-3 bg-warmwhite/60 rounded-md mb-4 text-xs space-y-1 border border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Target User:</span>
                                    <span className="font-semibold text-charcoal">{demoteModalAdmin.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Email:</span>
                                    <span className="text-charcoal">{demoteModalAdmin.email}</span>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4 text-xs text-amber-800 flex items-start gap-2">
                                <LuInfo className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>This action will strip all administrator privileges, change the user&apos;s role to JobSeeker, and terminate their active administrative sessions.</span>
                            </div>

                            {demoteError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md mb-4 text-xs text-rose-700">
                                    {demoteError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    disabled={demoteLoading}
                                    onClick={() => { setDemoteModalAdmin(null); setDemoteError(''); }}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={demoteLoading}
                                    onClick={handleConfirmDemote}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                                >
                                    {demoteLoading ? (
                                        <>
                                            <LuRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Demoting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LuShieldAlert className="w-3.5 h-3.5" />
                                            <span>Confirm Demote</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Status Modal */}
                {reportStatusModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="font-bold text-charcoal">Update Report Status (#{reportStatusModal.id})</h3>
                                <button onClick={() => setReportStatusModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <LuX className="w-5 h-5" />
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
                                <select
                                    value={reportNewStatus}
                                    onChange={(e) => setReportNewStatus(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange/50"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Dismissed">Dismissed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Admin Note <span className="text-gray-400 normal-case">(Max 500 chars)</span>
                                </label>
                                <textarea
                                    value={reportAdminNote}
                                    onChange={(e) => setReportAdminNote(e.target.value.slice(0, 500))}
                                    placeholder="Enter administrative notes for resolution or internal tracking..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                                <div className="text-right text-[11px] text-gray-400">{reportAdminNote.length} / 500</div>
                            </div>
                            {reportNewStatus === 'Resolved' && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 flex items-start gap-2">
                                    <LuInfo className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Setting status to <strong>Resolved</strong> will automatically dispatch a notification to the reporter.</span>
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => setReportStatusModal(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveReportStatus}
                                    disabled={reportActionLoading === reportStatusModal.id}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-orange hover:bg-orange/90 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {reportActionLoading === reportStatusModal.id ? 'Saving...' : 'Save Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Direct Action Modal */}
                {reportDirectActionModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="font-bold text-charcoal">
                                    Direct Action on Report #{reportDirectActionModal.id}
                                </h3>
                                <button onClick={() => setReportDirectActionModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <LuX className="w-5 h-5" />
                                </button>
                            </div>

                            {reportDirectActionModal.type === 'Job' && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800">
                                    <strong>Action: Close Job Posting</strong>
                                    <p className="mt-1">This will immediately set the job status to Closed (ClosedByAdmin=true) and notify the employer.</p>
                                </div>
                            )}

                            {reportDirectActionModal.type === 'Review' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Action</label>
                                    <select
                                        value={reportDirectAction}
                                        onChange={(e) => setReportDirectAction(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange/50"
                                    >
                                        <option value="HideReview">Hide Review</option>
                                        <option value="DeleteReview">Delete Review Permanently</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Reason <span className="text-red-500">*</span> <span className="text-gray-400 normal-case">(Will be sent in notification)</span>
                                </label>
                                <textarea
                                    value={reportDirectReason}
                                    onChange={(e) => setReportDirectReason(e.target.value.slice(0, 500))}
                                    placeholder="Enter the reason for this action..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                                <div className="text-right text-[11px] text-gray-400">{reportDirectReason.length} / 500</div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => setReportDirectActionModal(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExecuteReportAction}
                                    disabled={reportActionLoading === reportDirectActionModal.id || !reportDirectReason.trim()}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {reportActionLoading === reportDirectActionModal.id ? 'Processing...' : 'Execute Action'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Moderate Modal */}
                {reviewModerateModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="font-bold text-charcoal">
                                    {reviewModerateModal.action} Review (#{reviewModerateModal.id})
                                </h3>
                                <button onClick={() => setReviewModerateModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <LuX className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-600">
                                Headline: <strong>&quot;{reviewModerateModal.headline}&quot;</strong>
                            </p>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Reason <span className="text-red-500">*</span> <span className="text-gray-400 normal-case">(Required for audit log & seeker notification)</span>
                                </label>
                                <textarea
                                    value={reviewModerateReason}
                                    onChange={(e) => setReviewModerateReason(e.target.value)}
                                    placeholder="Enter detailed reason for moderating this review..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => setReviewModerateModal(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleModerateReview}
                                    disabled={reviewModerateLoading || !reviewModerateReason.trim()}
                                    className={`px-4 py-2 text-xs font-semibold text-white rounded-md shadow-sm disabled:opacity-50 ${
                                        reviewModerateModal.action === 'Delete' ? 'bg-rose-600 hover:bg-rose-700' :
                                        reviewModerateModal.action === 'Hide' ? 'bg-amber-600 hover:bg-amber-700' :
                                        'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {reviewModerateLoading ? 'Processing...' : `Confirm ${reviewModerateModal.action}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Edit/Create Modal */}
                {catEditModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="font-bold text-charcoal">
                                    {catEditModal.id ? `Edit Category: ${catEditModal.name}` : 'Create New Category'}
                                </h3>
                                <button onClick={() => setCatEditModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <LuX className="w-5 h-5" />
                                </button>
                            </div>

                            {catError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
                                    {catError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Name <span className="text-red-500">*</span> <span className="text-gray-400 normal-case">(Max 100 chars, unique)</span>
                                </label>
                                <input
                                    type="text"
                                    value={catEditModal.name}
                                    onChange={(e) => setCatEditModal({ ...catEditModal, name: e.target.value.slice(0, 100) })}
                                    placeholder="e.g. Information Technology"
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                                <div className="text-right text-[11px] text-gray-400">{catEditModal.name.length} / 100</div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Description <span className="text-gray-400 normal-case">(Optional, max 500 chars)</span>
                                </label>
                                <textarea
                                    value={catEditModal.description}
                                    onChange={(e) => setCatEditModal({ ...catEditModal, description: e.target.value.slice(0, 500) })}
                                    placeholder="Brief summary of jobs included under this category..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                            </div>

                            {catEditModal.id && (
                                <label className="flex items-center gap-2 cursor-pointer pt-1">
                                    <input
                                        type="checkbox"
                                        checked={catEditModal.isActive}
                                        onChange={(e) => setCatEditModal({ ...catEditModal, isActive: e.target.checked })}
                                        className="w-4 h-4 text-orange focus:ring-orange rounded"
                                    />
                                    <span className="text-xs font-semibold text-gray-700">Is Active (Visible for new postings)</span>
                                </label>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => setCatEditModal(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCategory}
                                    disabled={catLoading || !catEditModal.name.trim()}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-orange hover:bg-orange/90 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {catLoading ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Delete Confirm Modal */}
                {catDeleteConfirm && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg border border-gray-200 space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <LuTriangleAlert className="w-6 h-6 shrink-0" />
                                <h3 className="font-bold text-charcoal">Delete Category</h3>
                            </div>
                            <p className="text-xs text-gray-600">
                                Are you sure you want to delete <strong>&quot;{catDeleteConfirm.name}&quot;</strong>? If jobs are currently assigned to this category, the deletion will be blocked and you must disable it instead.
                            </p>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => setCatDeleteConfirm(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCategory}
                                    disabled={catLoading}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {catLoading ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Location Edit/Create Modal */}
                {locEditModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="font-bold text-charcoal">
                                    {locEditModal.id ? `Edit Location: ${locEditModal.name}` : 'Create New Location'}
                                </h3>
                                <button onClick={() => setLocEditModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <LuX className="w-5 h-5" />
                                </button>
                            </div>

                            {locError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
                                    {locError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    City / Location Name <span className="text-red-500">*</span> <span className="text-gray-400 normal-case">(Max 100 chars, unique)</span>
                                </label>
                                <input
                                    type="text"
                                    value={locEditModal.name}
                                    onChange={(e) => setLocEditModal({ ...locEditModal, name: e.target.value.slice(0, 100) })}
                                    placeholder="e.g. Colombo"
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    State / Province / District <span className="text-gray-400 normal-case">(Max 100 chars)</span>
                                </label>
                                <input
                                    type="text"
                                    value={locEditModal.stateOrProvince}
                                    onChange={(e) => setLocEditModal({ ...locEditModal, stateOrProvince: e.target.value.slice(0, 100) })}
                                    placeholder="e.g. Western Province"
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    Country <span className="text-gray-400 normal-case">(Max 100 chars)</span>
                                </label>
                                <input
                                    type="text"
                                    value={locEditModal.country}
                                    onChange={(e) => setLocEditModal({ ...locEditModal, country: e.target.value.slice(0, 100) })}
                                    placeholder="e.g. Sri Lanka"
                                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                                />
                            </div>

                            {locEditModal.id && (
                                <label className="flex items-center gap-2 cursor-pointer pt-1">
                                    <input
                                        type="checkbox"
                                        checked={locEditModal.isActive}
                                        onChange={(e) => setLocEditModal({ ...locEditModal, isActive: e.target.checked })}
                                        className="w-4 h-4 text-orange focus:ring-orange rounded"
                                    />
                                    <span className="text-xs font-semibold text-gray-700">Is Active</span>
                                </label>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => setLocEditModal(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveLocation}
                                    disabled={locLoading || !locEditModal.name.trim()}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-orange hover:bg-orange/90 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {locLoading ? 'Saving...' : 'Save Location'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Location Delete Confirm Modal */}
                {locDeleteConfirm && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg border border-gray-200 space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <LuTriangleAlert className="w-6 h-6 shrink-0" />
                                <h3 className="font-bold text-charcoal">Delete Location</h3>
                            </div>
                            <p className="text-xs text-gray-600">
                                Are you sure you want to delete <strong>&quot;{locDeleteConfirm.name}&quot;</strong>?
                            </p>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => setLocDeleteConfirm(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteLocation}
                                    disabled={locLoading}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {locLoading ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Maintenance Mode Confirmation Modal */}
                {maintenanceConfirmOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg border border-gray-200 space-y-4">
                            <div className="flex items-center gap-3 text-amber-600">
                                <LuTriangleAlert className="w-6 h-6 shrink-0" />
                                <h3 className="font-bold text-charcoal">Enable Maintenance Mode?</h3>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Are you sure you want to turn ON <strong>Maintenance Mode</strong>? All non-admin users and visitors will be temporarily blocked from browsing jobs, applying, or submitting content with a <strong>503 Service Unavailable</strong> message until disabled.
                            </p>
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => setMaintenanceConfirmOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setSettingsForm(prev => ({ ...prev, maintenanceMode: true }));
                                        handleSaveSettings(true);
                                    }}
                                    disabled={settingsSaving}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {settingsSaving ? 'Enabling...' : 'Confirm Enable'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
