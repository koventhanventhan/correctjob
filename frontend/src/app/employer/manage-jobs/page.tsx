'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function ManageJobsPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchJobs = async () => {
        try {
            const res = await api.get('/Jobs/my-jobs?pageSize=50');
            setJobs(res.data.data || []);
        } catch (error: any) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'Employer') {
            router.push('/');
            return;
        }
        fetchJobs();
    }, [user, router]);

    const handleDeleteJob = async (jobId: number, title: string) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(jobId);
        try {
            await api.delete(`/Jobs/${jobId}`);
            setJobs(prev => prev.filter(j => j.id !== jobId));
        } catch (error: any) {
            console.error("Failed to delete job", error);
            alert(error.response?.data?.message || "Failed to delete the job.");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading jobs...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 my-6 sm:my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Manage Jobs</h1>
                    <p className="text-sm text-gray-500 mt-1">View, edit, or delete your posted job opportunities.</p>
                </div>
                <Link href="/employer/post-job" className="bg-orange text-white px-4 py-2 rounded-lg font-medium hover:bg-orange/90 transition-colors shadow-sm text-sm">
                    Post New Job
                </Link>
            </div>
            
            {jobs.length === 0 ? (
                <div className="bg-warmwhite p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
                    <Link href="/employer/post-job" className="inline-block bg-orange text-white px-4 py-2 rounded-lg font-medium hover:bg-orange/90 transition-colors text-sm">
                        Create Your First Job
                    </Link>
                </div>
            ) : (
                <div className="bg-warmwhite rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[640px]">
                            <thead>
                                <tr className="bg-peach border-b border-gray-200">
                                    <th className="p-4 font-semibold text-charcoal text-sm">Title</th>
                                    <th className="p-4 font-semibold text-charcoal text-sm">Status</th>
                                    <th className="p-4 font-semibold text-charcoal text-sm">Posted On</th>
                                    <th className="p-4 font-semibold text-charcoal text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-peach/50 transition-colors">
                                        <td className="p-4 font-medium text-charcoal">{job.title}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${
                                                job.status === 'Published' ? 'bg-green-100 text-green-800' : 
                                                job.status === 'Draft' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right space-x-3 text-sm">
                                            <Link href={`/employer/manage-jobs/${job.id}`} className="text-orange hover:text-orange/80 font-medium">
                                                Edit
                                            </Link>
                                            <Link href={`/employer/applications/${job.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                                Applicants
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteJob(job.id, job.title)}
                                                disabled={deletingId === job.id}
                                                className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                                            >
                                                {deletingId === job.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
