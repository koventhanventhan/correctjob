'use client';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { 
    LuUsers, LuBuilding, LuBriefcase, LuSearch, 
    LuChevronLeft, LuChevronRight, LuMessageSquare, LuStar, LuBadgeCheck, 
    LuUserCheck, LuShieldCheck, LuLock, LuSave, LuPen,
    LuLayoutDashboard, LuTrendingUp, LuDollarSign, LuEye, LuClock, 
    LuCircleCheck, LuCircleAlert, LuArrowRight, LuRefreshCw
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
        pendingReviews: number;
        pendingReports: number;
    };
    trends30Days: TrendPoint[];
}

export default function AdminDashboard() {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'users' | 'jobseekers' | 'companies' | 'reviews' | 'verifications' | 'employer-verifications' | 'profile'>('overview');

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
    const [companiesPage, setCompaniesPage] = useState(1);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [searchUser, setSearchUser] = useState('');
    const [searchCompany, setSearchCompany] = useState('');
    
    // Job Seekers Tab
    const [jobseekersPage, setJobseekersPage] = useState(1);
    const [searchJobseeker, setSearchJobseeker] = useState('');
    
    // Verifications Tab
    const [verificationsPage, setVerificationsPage] = useState(1);
    const [searchVerification, setSearchVerification] = useState('');
    
    // Employer Verifications Tab
    const [employerVerificationsPage, setEmployerVerificationsPage] = useState(1);
    const [searchEmployerVerification, setSearchEmployerVerification] = useState('');

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
        queryKey: ['admin-users', usersPage, searchUser],
        queryFn: async () => {
            const res = await api.get(`/admin/users?page=${usersPage}&pageSize=10&search=${searchUser}`);
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
        try {
            await api.patch(`/admin/users/${id}/block`, !currentStatus, { headers: { 'Content-Type': 'application/json' }});
            refetchUsers();
            refetchJobseekers();
            refetchStats();
        } catch {
            console.error("Failed to block/unblock user");
        }
    };

    const handleToggleReviewVisibility = async (id: number) => {
        try {
            await api.patch(`/admin/reviews/${id}/toggle-visibility`);
            refetchReviews();
            refetchStats();
        } catch {
            console.error("Failed to toggle review visibility");
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
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                                {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-charcoal truncate">{user?.fullName}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange/10 to-amber-100 text-orange border border-orange/20">
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
                        <LuSettings className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>Settings</span>
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
                        onChange={(e) => {
                            if (e.target.value === 'settings') {
                                router.push('/admin/settings');
                            } else {
                                setActiveTab(e.target.value as any);
                            }
                        }}
                    >
                        <option value="overview">Overview & Analytics</option>
                        <option value="jobs">Manage Jobs</option>
                        <option value="users">Manage Users</option>
                        <option value="jobseekers">Manage Job Seekers</option>
                        <option value="companies">Manage Employers</option>
                        <option value="reviews">Manage Reviews</option>
                        <option value="verifications">ID Verifications (Seeker)</option>
                        <option value="employer-verifications">ID Verifications (Employer)</option>
                        <option value="profile">Profile & Security</option>
                        <option value="settings">Settings (Redirect)</option>
                    </select>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 max-w-7xl">
                        {/* Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Live System Active</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">Platform Overview & Analytics</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Live platform metrics, user engagement trends, and moderation action queues.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => refetchStats()}
                                    disabled={isStatsFetching}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-peach/60 hover:bg-peach text-charcoal transition-all disabled:opacity-50 border border-orange/10 shadow-sm"
                                >
                                    <LuRefreshCw className={`w-4 h-4 text-orange ${isStatsFetching ? 'animate-spin' : ''}`} />
                                    <span>{isStatsFetching ? 'Refreshing...' : 'Refresh Live Data'}</span>
                                </button>
                                <Link
                                    href="/admin/settings"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-charcoal text-white hover:bg-charcoal/90 transition-all shadow-sm"
                                >
                                    <LuSettings className="w-4 h-4 text-orange" />
                                    <span>System Settings</span>
                                </Link>
                            </div>
                        </div>

                        {/* Top 4 Seek.com Style KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Card 1: Users */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange/10 flex items-center justify-center text-orange group-hover:scale-110 transition-transform">
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
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
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
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
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
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/10 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                                        <LuDollarSign className="w-6 h-6" />
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                                        {dashboardStats?.revenue.completedCount ?? 0} Orders
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Revenue</p>
                                <p className="text-2xl font-display font-bold text-charcoal mt-1 truncate">
                                    {isStatsLoading ? '...' : `LKR ${Number(dashboardStats?.revenue.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </p>
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <span>{dashboardStats?.revenue.pendingCount ?? 0} Pending Sessions</span>
                                    <span className="font-semibold text-violet-700">PayHere Gateway</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Queues Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                                <div className="p-4 rounded-xl border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
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
                                <div className="p-4 rounded-xl border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
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
                                <div className="p-4 rounded-xl border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
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
                                <div className="p-4 rounded-xl border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500">Company Approvals</span>
                                            <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
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
                                <div className="p-4 rounded-xl border border-gray-100 bg-warmwhite/40 hover:bg-peach/30 transition-colors flex flex-col justify-between">
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
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
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
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
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
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
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
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
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
                            <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                                {/* Floating Tooltip */}
                                {hoveredTrendIdx !== null && trends[hoveredTrendIdx] && (
                                    <div 
                                        className="absolute pointer-events-none bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-xl p-3 text-xs z-20 transition-all duration-75"
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                                                <div style={{ width: `${adminsPct}%` }} className="bg-purple-600 h-full transition-all" title={`Admins: ${adminsPct}%`}></div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 pt-2">
                                                <div className="p-3 rounded-xl bg-orange/5 border border-orange/15">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-orange mb-1">
                                                        <span className="w-2 h-2 rounded-full bg-orange"></span>
                                                        <span>Job Seekers</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-charcoal">{dashboardStats?.users.seekers ?? 0}</p>
                                                    <span className="text-[11px] text-gray-500">{seekersPct}% of user base</span>
                                                </div>

                                                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
                                                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                                        <span>Employers</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-charcoal">{dashboardStats?.users.employers ?? 0}</p>
                                                    <span className="text-[11px] text-gray-500">{employersPct}% of user base</span>
                                                </div>

                                                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 mb-1">
                                                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                            <div className="flex items-center gap-2">
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
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                            <h3 className="text-lg font-display font-bold text-charcoal">All Users</h3>
                            <div className="flex items-center border rounded px-2 bg-warmwhite">
                                <LuSearch className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    className="p-1 outline-none text-sm"
                                    value={searchUser}
                                    onChange={(e) => { setSearchUser(e.target.value); setUsersPage(1); }}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {users.map((u: any) => (
                                        <tr key={u.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-charcoal">{u.fullName}</div>
                                                <div className="text-sm text-gray-500">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {u.role}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {u.isActive ? 'Active' : 'Blocked'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => handleToggleUserBlock(u.id, u.isActive)}
                                                    className={`${u.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                >
                                                    {u.isActive ? 'Block' : 'Unblock'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-3 bg-white flex items-center justify-between border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total: {totalUsers}</span>
                            <div className="flex space-x-2">
                                <button disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronLeft className="w-4 h-4"/></button>
                                <button disabled={usersPage * 10 >= totalUsers} onClick={() => setUsersPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><LuChevronRight className="w-4 h-4"/></button>
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
                                                <button 
                                                    onClick={() => handleToggleReviewVisibility(r.id)}
                                                    className={`${!r.isHidden ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                >
                                                    {!r.isHidden ? 'Hide' : 'Show'}
                                                </button>
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

                {activeTab === 'profile' && (
                    <div className="max-w-2xl">
                        <h2 className="text-2xl font-display font-bold text-charcoal mb-6">Profile & Security</h2>

                        {/* Edit Profile Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex items-center gap-4 mb-6">
                                {user?.profileImage ? (
                                    <img
                                        src={getFileUrl(user.profileImage)}
                                        alt={user.fullName}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-orange/20 shadow-lg flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange to-amber-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                                        {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold text-charcoal">{user?.fullName}</h3>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange/10 to-amber-100 text-orange border border-orange/20">
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
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none"
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
                                    className="flex items-center justify-center bg-orange text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange/90 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    <LuSave className="w-4 h-4 mr-2" />
                                    {profileSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Change Password Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none"
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
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange/30 focus:border-orange transition-all outline-none"
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
                                    className="flex items-center justify-center bg-charcoal text-white px-5 py-2.5 rounded-lg font-medium hover:bg-charcoal/90 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    <LuLock className="w-4 h-4 mr-2" />
                                    {passwordSaving ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
