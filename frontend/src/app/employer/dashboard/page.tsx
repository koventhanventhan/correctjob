'use client';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { Briefcase, Users, FileText, Activity } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function EmployerDashboard() {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();

    const { data: jobs, isLoading } = useQuery({
        queryKey: ['my-jobs'],
        queryFn: async () => {
            const res = await api.get('/jobs/my-jobs?pageSize=50');
            return res.data.data;
        }
    });

    const { data: stats } = useQuery({
        queryKey: ['employer-stats'],
        queryFn: async () => {
            const res = await api.get('/applications/employer-stats');
            return res.data;
        }
    });

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warmwhite">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
            </div>
        );
    }

    if (!user || user.role !== 'Employer') {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-warmwhite">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-charcoal">Employer Dashboard</h1>
                        <p className="text-gray-600 mt-1">Manage your job postings and applicants.</p>
                    </div>
                    <Link href="/employer/post-job" className="bg-orange text-white px-4 py-2 rounded-md font-medium hover:bg-orange/90 transition-colors shadow-sm">
                        Post New Job
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Jobs Posted</p>
                                <p className="text-2xl font-bold text-charcoal mt-1">{jobs?.length || 0}</p>
                            </div>
                            <div className="h-10 w-10 bg-peach text-charcoal rounded-full flex items-center justify-center">
                                <Briefcase className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                                <p className="text-2xl font-bold text-charcoal mt-1">
                                    {jobs?.filter((j: any) => j.status === 'Published').length || 0}
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <Activity className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                                <p className="text-2xl font-bold text-charcoal mt-1">{stats?.totalApplications || 0}</p>
                            </div>
                            <div className="h-10 w-10 bg-peach text-charcoal rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Shortlisted</p>
                                <p className="text-2xl font-bold text-charcoal mt-1">{stats?.interviewing || 0}</p>
                            </div>
                            <div className="h-10 w-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jobs Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                        <h3 className="text-lg font-display font-bold text-charcoal">Your Job Postings</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading jobs...</td></tr>
                                ) : jobs?.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">You haven't posted any jobs yet.</td></tr>
                                ) : (
                                    jobs?.map((job: any) => (
                                        <tr key={job.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-charcoal">{job.title}</div>
                                                <div className="text-sm text-gray-500">{job.location} • {job.jobType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    job.status === 'Published' ? 'bg-green-100 text-green-800' :
                                                    job.status === 'PendingApproval' ? 'bg-yellow-100 text-yellow-800' :
                                                    job.status === 'Draft' ? 'bg-peach text-charcoal' :
                                                    'bg-peach text-charcoal'
                                                }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(job.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link href={`/employer/manage-jobs/${job.id}`} className="text-orange hover:text-orange mr-4">Edit</Link>
                                                <Link href={`/employer/applications/${job.id}`} className="text-orange hover:text-orange">View Applicants</Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
