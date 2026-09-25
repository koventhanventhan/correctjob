'use client';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Users, Building, Briefcase, AlertTriangle, Search, ChevronLeft, ChevronRight, MessageSquare, Star } from 'lucide-react';
import { useState } from 'react';

import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('jobs');
    
    // Pagination & Search States
    const [jobsPage, setJobsPage] = useState(1);
    const [searchJob, setSearchJob] = useState('');
    const [filterJobStatus, setFilterJobStatus] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [companiesPage, setCompaniesPage] = useState(1);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [searchUser, setSearchUser] = useState('');
    const [searchCompany, setSearchCompany] = useState('');

    const { data: jobsData, refetch: refetchJobs } = useQuery({
        queryKey: ['admin-jobs', jobsPage, searchJob, filterJobStatus],
        queryFn: async () => {
            const res = await api.get(`/admin/jobs?page=${jobsPage}&pageSize=10&search=${searchJob}&status=${filterJobStatus}`);
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

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                </div>
                <nav className="space-y-1 px-3">
                    <button onClick={() => setActiveTab('jobs')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'jobs' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <Briefcase className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Jobs
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <Users className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Users
                    </button>
                    <button onClick={() => setActiveTab('companies')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'companies' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <Building className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Employers
                    </button>
                    <button onClick={() => setActiveTab('reviews')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'reviews' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <MessageSquare className="mr-3 h-5 w-5 flex-shrink-0" />
                        Manage Reviews
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
                
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
                            </div>
                            <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Job Approvals</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {jobs?.filter((j: any) => j.status === 'Draft' || j.status === 'PendingApproval').length || 0}
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {activeTab === 'jobs' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <h3 className="font-semibold text-gray-900">Manage Jobs</h3>
                            <div className="flex items-center gap-2">
                                <select 
                                    className="border rounded p-1 text-sm bg-white"
                                    value={filterJobStatus}
                                    onChange={(e) => { setFilterJobStatus(e.target.value); setJobsPage(1); }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Draft">Draft</option>
                                    <option value="PendingApproval">Pending Approval</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Published">Published</option>
                                </select>
                                <div className="flex items-center border rounded px-2 bg-white">
                                    <Search className="w-4 h-4 text-gray-400" />
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
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job / Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {jobs.map((job: any) => (
                                        <tr key={job.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{job.title}</div>
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
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
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
                        <div className="px-6 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-200">
                            <span className="text-sm text-gray-500">Total: {totalJobs}</span>
                            <div className="flex space-x-2">
                                <button disabled={jobsPage === 1} onClick={() => setJobsPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
                                <button disabled={jobsPage * 10 >= totalJobs} onClick={() => setJobsPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'users' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">All Users</h3>
                            <div className="flex items-center border rounded px-2 bg-white">
                                <Search className="w-4 h-4 text-gray-400" />
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
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((u: any) => (
                                        <tr key={u.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{u.fullName}</div>
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
                        <div className="px-6 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-200">
                            <span className="text-sm text-gray-500">Total: {totalUsers}</span>
                            <div className="flex space-x-2">
                                <button disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
                                <button disabled={usersPage * 10 >= totalUsers} onClick={() => setUsersPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'companies' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Manage Employers</h3>
                            <div className="flex items-center border rounded px-2 bg-white">
                                <Search className="w-4 h-4 text-gray-400" />
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
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employer Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {companies.map((c: any) => (
                                        <tr key={c.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{c.companyName}</div>
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
                                                    className={`${c.isApproved ? 'text-red-600 hover:text-red-900' : 'text-indigo-600 hover:text-indigo-900'}`}
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
                        <div className="px-6 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-200">
                            <span className="text-sm text-gray-500">Total: {totalCompanies}</span>
                            <div className="flex space-x-2">
                                <button disabled={companiesPage === 1} onClick={() => setCompaniesPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
                                <button disabled={companiesPage * 10 >= totalCompanies} onClick={() => setCompaniesPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Manage Company Reviews</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating & Headline</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reviews.map((r: any) => (
                                        <tr key={r.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {r.companyName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {r.seekerName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                <div className="flex items-center text-yellow-500 mb-1">
                                                    {r.rating} <Star className="w-3 h-3 ml-1 fill-yellow-500" />
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
                        <div className="px-6 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-200">
                            <span className="text-sm text-gray-500">Total: {totalReviews}</span>
                            <div className="flex space-x-2">
                                <button disabled={reviewsPage === 1} onClick={() => setReviewsPage(p => p - 1)} className="p-1 border rounded disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button>
                                <button disabled={reviewsPage * 10 >= totalReviews} onClick={() => setReviewsPage(p => p + 1)} className="p-1 border rounded disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
