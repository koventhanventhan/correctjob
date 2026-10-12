'use client';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { LuUsers, LuBuilding, LuBriefcase, LuTriangleAlert, LuSearch, LuChevronLeft, LuChevronRight, LuMessageSquare, LuStar, LuBadgeCheck, LuUserCheck, LuShieldCheck, LuLock, LuSave, LuPen } from 'react-icons/lu';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuSettings } from 'react-icons/lu';
import { getFileUrl } from '@/utils/imageUrl';

export default function AdminDashboard() {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('jobs');

    // Profile editing state
    const [profileData, setProfileData] = useState({ fullName: '', email: '' });
    const [profileMsg, setProfileMsg] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [passwordMsg, setPasswordMsg] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);

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
        try {
            await api.post('/auth/change-password', passwordData);
            setPasswordMsg('Password changed successfully.');
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (error: any) {
            setPasswordMsg(error.response?.data?.message || 'Failed to change password.');
        } finally {
            setPasswordSaving(false);
        }
    };
    
    // Pagination & LuSearch States
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
        } catch (error) {
            console.error("Failed to approve job");
        }
    };

    const handleApproveCompany = async (id: number, isApproved: boolean) => {
        try {
            await api.patch(`/admin/companies/${id}/approve`, isApproved, { headers: { 'Content-Type': 'application/json' }});
            refetchCompanies();
        } catch (error) {
            console.error("Failed to update company approval");
        }
    };

    const handleToggleUserBlock = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/users/${id}/block`, !currentStatus, { headers: { 'Content-Type': 'application/json' }});
            refetchUsers();
            refetchJobseekers();
        } catch (error) {
            console.error("Failed to block/unblock user");
        }
    };

    const handleToggleReviewVisibility = async (id: number) => {
        try {
            await api.patch(`/admin/reviews/${id}/toggle-visibility`);
            refetchReviews();
        } catch (error) {
            console.error("Failed to toggle review visibility");
        }
    };

    const handleVerificationDecision = async (id: number, approved: boolean) => {
        const notes = approved ? '' : prompt("Please provide a reason for rejection:");
        if (!approved && notes === null) return; // User cancelled prompt

        try {
            await api.patch(`/admin/identity-verifications/${id}/decision`, { approved, notes });
            refetchVerifications();
        } catch (error) {
            console.error("Failed to submit decision");
        }
    };

    const handleEmployerVerificationDecision = async (id: number, approved: boolean) => {
        const notes = approved ? '' : prompt("Please provide a reason for rejection:");
        if (!approved && notes === null) return; // User cancelled prompt

        try {
            await api.patch(`/admin/employer-verifications/${id}/decision`, { approved, notes });
            refetchEmployerVerifications();
        } catch (error) {
            console.error("Failed to submit decision");
        }
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

    return (
        <div className="min-h-screen bg-warmwhite flex">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-sm hidden md:block flex-shrink-0">
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
                    <button onClick={() => setActiveTab('jobs')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'jobs' ? 'bg-orange text-white' : 'text-gray-700 hover:bg-peach'}`}>
                        <LuBriefcase className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Jobs
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'users' ? 'bg-orange text-white' : 'text-gray-700 hover:bg-peach'}`}>
                        <LuUsers className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Users
                    </button>
                    <button onClick={() => setActiveTab('jobseekers')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'jobseekers' ? 'bg-orange text-white' : 'text-gray-700 hover:bg-peach'}`}>
                        <LuUserCheck className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Job Seekers
                    </button>
                    <button onClick={() => setActiveTab('companies')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'companies' ? 'bg-orange text-white' : 'text-gray-700 hover:bg-peach'}`}>
                        <LuBuilding className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Employers
                    </button>
                    <button onClick={() => setActiveTab('reviews')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'reviews' ? 'bg-orange text-white' : 'text-gray-700 hover:bg-peach'}`}>
                        <LuMessageSquare className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Reviews
                    </button>
                    <button onClick={() => setActiveTab('verifications')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'verifications' ? 'bg-orange text-white' : 'text-gray-700 hover:bg-peach'}`}>
                        <LuBadgeCheck className="mr-3 h-5 w-5 flex-shrink-0" />
                        ID Verifications (Seeker)
                        {totalVerifications > 0 && (
                            <span className="ml-auto bg-red-100 text-red-800 py-0.5 px-2 rounded-full text-xs">{totalVerifications}</span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('employer-verifications')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'employer-verifications' ? 'bg-orange text-white' : 'text-gray-700 hover:bg-peach'}`}>
                        <LuBadgeCheck className="mr-3 h-5 w-5 flex-shrink-0" />
                        ID Verifications (Employer)
                        {totalEmployerVerifications > 0 && (
                            <span className="ml-auto bg-red-100 text-red-800 py-0.5 px-2 rounded-full text-xs">{totalEmployerVerifications}</span>
                        )}
                    </button>
                    <div className="border-t border-gray-100 my-2 mx-1"></div>
                    <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'profile' ? 'bg-orange text-white' : 'text-gray-700 hover:bg-peach'}`}>
                        <LuShieldCheck className="mr-3 h-5 w-5 flex-shrink-0" />
                        Profile & Security
                    </button>
                    <Link href="/admin/settings" className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-peach">
                        <LuSettings className="mr-3 h-5 w-5 flex-shrink-0" />
                        Settings
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
                                setActiveTab(e.target.value);
                            }
                        }}
                    >
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

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Users</p>
                                <p className="text-2xl font-bold text-charcoal mt-1">{totalUsers}</p>
                            </div>
                            <div className="h-10 w-10 bg-peach text-charcoal rounded-full flex items-center justify-center">
                                <LuUsers className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Job Approvals</p>
                                <p className="text-2xl font-bold text-charcoal mt-1">
                                    {jobs?.filter((j: any) => j.status === 'Draft' || j.status === 'PendingApproval').length || 0}
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                                <LuTriangleAlert className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>

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
                                        placeholder="LuSearch jobs..." 
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
                                                {job.status !== 'Approved' && job.status !== 'Published' && (
                                                    <button 
                                                        onClick={() => handleApproveJob(job.id)}
                                                        className="text-charcoal hover:text-charcoal bg-peach px-3 py-1 rounded"
                                                    >
                                                        Approve
                                                    </button>
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
                                                    <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/seekerprofiles/id-card/front?profileId=${v.id}`} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline font-medium">Front</a>
                                                )}
                                                {v.idCardBackUrl && (
                                                    <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/seekerprofiles/id-card/back?profileId=${v.id}`} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline font-medium">Back</a>
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
                                                    <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/companies/id-card/front?companyId=${v.id}`} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline font-medium">Front</a>
                                                )}
                                                {v.idCardBackUrl && (
                                                    <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/companies/id-card/back?companyId=${v.id}`} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline font-medium">Back</a>
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
