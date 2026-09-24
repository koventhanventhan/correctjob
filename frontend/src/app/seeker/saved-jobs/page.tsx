'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { Building, MapPin, IndianRupee, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SavedJobs() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['my-saved-jobs', page],
        queryFn: async () => {
            const res = await api.get(`/savedjobs/my-saved?page=${page}&pageSize=${pageSize}`);
            return res.data;
        }
    });

    const unsaveMutation = useMutation({
        mutationFn: async (jobId: string | number) => {
            await api.delete(`/savedjobs/${jobId}`);
        },
        onSuccess: () => {
            refetch();
        }
    });

    const savedJobs = data?.data || [];
    const totalCount = data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
                    <p className="text-gray-600">Jobs you've bookmarked for later.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Loading saved jobs...</div>
                ) : savedJobs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        You don't have any saved jobs yet.
                        <div className="mt-4">
                            <Link href="/jobs" className="text-indigo-600 font-medium hover:underline">Browse Jobs</Link>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {savedJobs.map((saved: any) => {
                            const job = saved.job;
                            if (!job) return null;
                            
                            return (
                                <div key={saved.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200 shrink-0">
                                                {job.company?.logoUrl ? (
                                                    <img src={job.company.logoUrl} alt="" className="h-10 w-10 object-contain" />
                                                ) : (
                                                    <Building className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                                                    <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                                                </h3>
                                                <div className="mt-1 flex items-center flex-wrap gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center">
                                                        <Building className="w-4 h-4 mr-1 text-gray-400" /> {job.company?.companyName}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <MapPin className="w-4 h-4 mr-1 text-gray-400" /> {job.location}
                                                    </span>
                                                    {job.salaryMin && (
                                                        <span className="flex items-center">
                                                            <IndianRupee className="w-4 h-4 mr-1 text-gray-400" /> {job.salaryMin} - {job.salaryMax}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-1 text-gray-400" /> Saved {new Date(saved.savedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link 
                                                href={`/jobs/${job.id}`}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-md hover:bg-indigo-100 transition-colors text-sm"
                                            >
                                                View & Apply
                                            </Link>
                                            <button 
                                                onClick={() => unsaveMutation.mutate(job.id)}
                                                disabled={unsaveMutation.isPending}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                title="Unsave Job"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> saved jobs
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
