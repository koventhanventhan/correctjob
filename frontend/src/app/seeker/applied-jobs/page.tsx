'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { Briefcase, ChevronLeft, ChevronRight, Clock, Building } from 'lucide-react';

const statuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];

const StatusTimeline = ({ currentStatus }: { currentStatus: string }) => {
    // If Rejected, we handle it separately
    const isRejected = currentStatus === 'Rejected';
    const flowStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected'];
    
    let currentIndex = flowStatuses.indexOf(currentStatus);
    if (isRejected) {
        // Find where it was rejected, default to after applied
        currentIndex = -1; // We'll handle visual separately
    }

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2 px-1">
                {flowStatuses.map((s, i) => (
                    <span key={s} className={`hidden md:block ${
                        isRejected && i === flowStatuses.length - 1 ? 'text-red-500' : 
                        !isRejected && i <= currentIndex ? 'text-indigo-600' : ''
                    }`}>
                        {isRejected && i === flowStatuses.length - 1 ? 'Rejected' : s}
                    </span>
                ))}
            </div>
            <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full" />
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full transition-all duration-500 ${isRejected ? 'bg-red-500' : 'bg-indigo-600'}`} 
                    style={{ width: isRejected ? '100%' : `${(currentIndex / (flowStatuses.length - 1)) * 100}%` }} />
                
                {flowStatuses.map((s, i) => {
                    const isCompleted = !isRejected && i <= currentIndex;
                    const isCurrent = !isRejected && i === currentIndex;
                    const isRejectedNode = isRejected && i === flowStatuses.length - 1;
                    return (
                        <div key={s} className="relative z-10">
                            <div className={`w-4 h-4 rounded-full border-2 bg-white ${
                                isRejectedNode ? 'border-red-500 bg-red-500' :
                                isCompleted ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                            }`}>
                                {isCompleted && <CheckIcon />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CheckIcon = () => (
    <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

export default function AppliedJobs() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['my-applications', page],
        queryFn: async () => {
            const res = await api.get(`/applications/my-applications?page=${page}&pageSize=${pageSize}`);
            return res.data; // { data, totalCount }
        }
    });

    const applications = data?.data || [];
    const totalCount = data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Applied Jobs</h1>
                    <p className="text-gray-600">Track the status of your applications.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Loading applications...</div>
                ) : applications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        You haven't applied to any jobs yet.
                        <div className="mt-4">
                            <Link href="/jobs" className="text-indigo-600 font-medium hover:underline">Find Jobs</Link>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {applications.map((app: any) => (
                            <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200 shrink-0">
                                            {app.job?.company?.logoUrl ? (
                                                <img src={app.job.company.logoUrl} alt="" className="h-10 w-10 object-contain" />
                                            ) : (
                                                <Building className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                                                <Link href={`/jobs/${app.jobId}`}>{app.job?.title}</Link>
                                            </h3>
                                            <div className="mt-1 flex items-center flex-wrap gap-3 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <Building className="w-4 h-4 mr-1" /> {app.job?.company?.companyName}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" /> Applied {new Date(app.appliedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                            app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                                            app.status === 'Under Review' ? 'bg-purple-100 text-purple-800' :
                                            app.status === 'Shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                                            app.status === 'Interview Scheduled' ? 'bg-orange-100 text-orange-800' :
                                            app.status === 'Selected' ? 'bg-green-100 text-green-800' :
                                            app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                </div>
                                <StatusTimeline currentStatus={app.status} />
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> applications
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
