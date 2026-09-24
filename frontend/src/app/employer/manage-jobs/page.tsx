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

    useEffect(() => {
        if (!user || user.role !== 'Employer') {
            router.push('/');
            return;
        }
        fetchJobs();
    }, [user, router]);

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

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 my-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Jobs</h1>
                <Link href="/employer/post-job" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Post New Job
                </Link>
            </div>
            
            {jobs.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-4 font-semibold">Title</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Posted On</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium">{job.title}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            job.status === 'Published' ? 'bg-green-100 text-green-800' : 
                                            job.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 space-x-2">
                                        <Link href={`/employer/manage-jobs/${job.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                                            Edit
                                        </Link>
                                        <Link href={`/employer/applications/${job.id}`} className="text-indigo-600 hover:underline text-sm font-medium">
                                            View Applicants
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
