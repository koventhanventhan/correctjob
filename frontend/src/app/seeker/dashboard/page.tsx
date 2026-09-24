'use client';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { Briefcase, FileText, CheckCircle, Clock, Bell } from 'lucide-react';
import { calculateProfileCompletion } from '@/utils/profile';

export default function SeekerDashboard() {
    const { user } = useAuthStore();

    const { data: applications, isLoading } = useQuery({
        queryKey: ['my-applications'],
        queryFn: async () => {
            const res = await api.get('/applications/my-applications');
            return res.data.data;
        }
    });

    const { data: profile } = useQuery({
        queryKey: ['my-profile'],
        queryFn: async () => {
            const res = await api.get('/seekerprofiles/me');
            return res.data;
        }
    });

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.fullName}</h1>
                    <p className="text-gray-600">Here's what's happening with your job search today.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Profile Completion</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{calculateProfileCompletion(profile)}%</p>
                            </div>
                            <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${calculateProfileCompletion(profile)}%` }}></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{applications?.length || 0}</p>
                            </div>
                            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <Briefcase className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Shortlisted</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {applications?.filter((a: any) => a.status === 'Shortlisted').length || 0}
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer group">
                        <Link href="/seeker/job-alerts" className="block">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 group-hover:text-indigo-600">Job Alerts</p>
                                    <p className="text-sm text-gray-900 mt-1">Manage saved searches</p>
                                </div>
                                <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                    <Bell className="h-5 w-5" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Applications Timeline */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Recent Applications</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {isLoading ? (
                            <div className="p-6 text-center text-gray-500">Loading applications...</div>
                        ) : applications?.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                You haven't applied to any jobs yet.
                                <div className="mt-4">
                                    <Link href="/jobs" className="text-indigo-600 font-medium hover:underline">Find Jobs</Link>
                                </div>
                            </div>
                        ) : (
                            applications?.map((app: any) => (
                                <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                                            {app.job?.company?.logoUrl ? (
                                                <img src={app.job.company.logoUrl} alt="" className="h-8 w-8 object-contain" />
                                            ) : (
                                                <Briefcase className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 hover:text-indigo-600">
                                                <Link href={`/jobs/${app.jobId}`}>{app.job?.title}</Link>
                                            </h4>
                                            <p className="text-sm text-gray-500">{app.job?.company?.companyName}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col md:items-end gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                                            app.status === 'Shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                                            app.status === 'Selected' ? 'bg-green-100 text-green-800' :
                                            app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {app.status}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" /> Applied on {new Date(app.appliedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
