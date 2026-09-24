'use client';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Users, Building, Briefcase, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('jobs');

    const { data: jobs, refetch: refetchJobs } = useQuery({
        queryKey: ['admin-jobs'],
        queryFn: async () => {
            const res = await api.get('/admin/jobs');
            return res.data;
        }
    });

    const { data: usersData } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await api.get('/admin/users');
            return res.data;
        }
    });

    const handleApproveJob = async (id: number) => {
        try {
            await api.patch(`/admin/jobs/${id}/approve`, "Approved", { headers: { 'Content-Type': 'application/json' }});
            refetchJobs();
        } catch (error) {
            console.error("Failed to approve job");
        }
    };

    if (!user) return null;

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
                                <p className="text-2xl font-bold text-gray-900 mt-1">{usersData?.length || 0}</p>
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
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Job Approvals</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job / Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {jobs?.map((job: any) => (
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
                )}
                
                {activeTab === 'users' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">All Users</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {usersData?.map((u: any) => (
                                    <tr key={u.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{u.fullName}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {u.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {u.isActive ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
}
