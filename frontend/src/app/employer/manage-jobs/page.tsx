'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface StatusCounts {
    all: number;
    published: number;
    draft: number;
    pendingApproval: number;
    closed: number;
    expired: number;
}

export default function ManageJobsPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [closingId, setClosingId] = useState<number | null>(null);
    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
    const [reopeningId, setReopeningId] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Filters & Search
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusCounts, setStatusCounts] = useState<StatusCounts>({
        all: 0,
        published: 0,
        draft: 0,
        pendingApproval: 0,
        closed: 0,
        expired: 0
    });

    // Reopen Modal State
    const [reopenModalJob, setReopenModalJob] = useState<any | null>(null);
    const [newDeadlineDate, setNewDeadlineDate] = useState<string>('');

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('pageSize', '50');
            if (statusFilter && statusFilter !== 'All') {
                params.append('status', statusFilter);
            }
            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            const res = await api.get(`/Jobs/my-jobs?${params.toString()}`);
            setJobs(res.data.data || []);
            if (res.data.statusCounts) {
                setStatusCounts(res.data.statusCounts);
            }
        } catch (error: any) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchTerm]);

    useEffect(() => {
        if (!user || user.role !== 'Employer') {
            router.push('/');
            return;
        }
        fetchJobs();
    }, [user, router, fetchJobs]);

    const handleCloseJob = async (jobId: number, title: string) => {
        if (!window.confirm(`Are you sure you want to close "${title}"? Candidates will no longer be able to apply.`)) {
            return;
        }

        setClosingId(jobId);
        try {
            await api.post(`/Jobs/${jobId}/close`);
            setMessage(`"${title}" has been closed.`);
            setTimeout(() => setMessage(null), 4000);
            await fetchJobs();
        } catch (error: any) {
            console.error("Failed to close job", error);
            alert(error.response?.data?.message || "Failed to close the job.");
        } finally {
            setClosingId(null);
        }
    };

    const handleDuplicateJob = async (jobId: number, title: string) => {
        if (!window.confirm(`Duplicate "${title}" as a new draft job post?`)) {
            return;
        }

        setDuplicatingId(jobId);
        try {
            const res = await api.post(`/Jobs/${jobId}/duplicate`);
            setMessage(res.data?.message || "Job duplicated successfully as draft.");
            setTimeout(() => setMessage(null), 5000);
            await fetchJobs();
        } catch (error: any) {
            console.error("Failed to duplicate job", error);
            alert(error.response?.data?.message || "Failed to duplicate job.");
        } finally {
            setDuplicatingId(null);
        }
    };

    const handleReopenClick = (job: any) => {
        const isExpired = job.status === 'Expired' || job.isExpired || (job.deadline && new Date(job.deadline) <= new Date());
        if (isExpired) {
            // Prompt for a new future deadline in modal
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 14);
            setNewDeadlineDate(futureDate.toISOString().split('T')[0]);
            setReopenModalJob(job);
        } else {
            // Directly confirm reopen for closed job with valid deadline
            if (window.confirm(`Reopen "${job.title}" for applications?`)) {
                executeReopen(job.id, null);
            }
        }
    };

    const executeReopen = async (jobId: number, deadline: string | null) => {
        setReopeningId(jobId);
        try {
            let payload: { deadline?: string } = {};
            if (deadline) {
                // Format deadline with end of day UTC so selecting today or future is strictly ahead
                const dateObj = new Date(deadline.includes('T') ? deadline : `${deadline}T23:59:59Z`);
                payload = { deadline: dateObj.toISOString() };
            }
            const res = await api.post(`/Jobs/${jobId}/reopen`, payload);
            setMessage(res.data?.message || "Job reopened successfully.");
            setTimeout(() => setMessage(null), 4000);
            setReopenModalJob(null);
            await fetchJobs();
        } catch (error: any) {
            console.error("Failed to reopen job", error);
            alert(error.response?.data?.message || "Failed to reopen job.");
        } finally {
            setReopeningId(null);
        }
    };

    const tabs = [
        { key: 'All', label: 'All Jobs', count: statusCounts.all },
        { key: 'Published', label: 'Active', count: statusCounts.published },
        { key: 'Draft', label: 'Draft', count: statusCounts.draft },
        { key: 'PendingApproval', label: 'Pending Approval', count: statusCounts.pendingApproval },
        { key: 'Closed', label: 'Closed', count: statusCounts.closed },
        { key: 'Expired', label: 'Expired', count: statusCounts.expired }
    ];

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">Manage Jobs</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Track views, manage applicants, filter by status, close or reopen job opportunities.
                    </p>
                </div>
                <Link href="/employer/post-job" className="bg-orange text-white px-4 py-2 rounded-md font-semibold hover:bg-orange/90 transition-colors shadow-sm text-sm">
                    Post New Job
                </Link>
            </div>

            {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl flex items-center justify-between shadow-sm">
                    <span>{message}</span>
                    <button onClick={() => setMessage(null)} className="text-green-600 hover:text-green-900 font-bold ml-4">
                        ✕
                    </button>
                </div>
            )}

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                                statusFilter === tab.key
                                    ? 'bg-charcoal text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search by job title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange/50"
                    />
                </div>
            </div>
            
            {loading ? (
                <div className="p-12 text-center text-gray-500 bg-warmwhite rounded-xl border border-gray-200">
                    Loading your posted jobs...
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-warmwhite p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-500 mb-4">No jobs found matching your current filter.</p>
                    <Link href="/employer/post-job" className="inline-block bg-orange text-white px-4 py-2 rounded-lg font-medium hover:bg-orange/90 transition-colors text-sm">
                        Post a Job Now
                    </Link>
                </div>
            ) : (
                <div className="bg-warmwhite rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[760px]">
                            <thead>
                                <tr className="bg-peach border-b border-gray-200">
                                    <th className="p-4 font-semibold text-charcoal text-xs uppercase tracking-wider">Job Title & Details</th>
                                    <th className="p-4 font-semibold text-charcoal text-xs uppercase tracking-wider">Status</th>
                                    <th className="p-4 font-semibold text-charcoal text-xs uppercase tracking-wider text-center">Views</th>
                                    <th className="p-4 font-semibold text-charcoal text-xs uppercase tracking-wider text-center">Applicants</th>
                                    <th className="p-4 font-semibold text-charcoal text-xs uppercase tracking-wider">Deadline</th>
                                    <th className="p-4 font-semibold text-charcoal text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {jobs.map((job) => {
                                    const isJobExpired = job.status === 'Expired' || job.isExpired || (job.deadline && new Date(job.deadline) <= new Date());
                                    return (
                                        <tr key={job.id} className="hover:bg-peach/40 transition-colors">
                                            {/* Title & Badges */}
                                            <td className="p-4">
                                                <div className="font-semibold text-charcoal text-sm flex items-center flex-wrap gap-1.5">
                                                    <span>{job.title}</span>
                                                    {job.isRemote && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                                                             Remote
                                                        </span>
                                                    )}
                                                    {job.jobType && (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                                                            {job.jobType}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                    {job.location && <span>📍 {job.location}</span>}
                                                    <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${
                                                    job.status === 'Expired' || isJobExpired ? 'bg-red-50 text-red-700 border border-red-200' :
                                                    job.status === 'Published' ? 'bg-green-100 text-green-800' : 
                                                    job.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                                                    job.status === 'Draft' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {job.status === 'Expired' || isJobExpired ? 'Expired' : job.status}
                                                </span>
                                            </td>

                                            {/* Views Count */}
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                    👁️ {job.viewsCount ?? 0}
                                                </span>
                                            </td>

                                            {/* Applicants Count */}
                                            <td className="p-4 text-center">
                                                <Link 
                                                    href={`/employer/applications/${job.id}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                >
                                                    👥 {job.applicantsCount ?? 0}
                                                </Link>
                                            </td>

                                            {/* Deadline */}
                                            <td className="p-4 text-xs text-gray-500">
                                                {job.deadline ? (
                                                    <span className={isJobExpired ? 'text-red-600 font-medium' : ''}>
                                                        {new Date(job.deadline).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">No deadline</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-right space-x-2 text-xs">
                                                <Link href={`/employer/manage-jobs/${job.id}`} className="text-orange hover:text-orange/80 font-semibold px-2 py-1 rounded hover:bg-orange/10 transition-colors">
                                                    Edit
                                                </Link>
                                                <Link href={`/employer/applications/${job.id}`} className="text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                                    Applicants
                                                </Link>
                                                
                                                {job.status === 'Closed' || job.status === 'Expired' || isJobExpired ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReopenClick(job)}
                                                        disabled={reopeningId === job.id}
                                                        className="text-green-700 hover:text-green-900 font-semibold px-2 py-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {reopeningId === job.id ? 'Reopening...' : 'Reopen'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCloseJob(job.id, job.title)}
                                                        disabled={closingId === job.id}
                                                        className="text-amber-600 hover:text-amber-800 font-semibold px-2 py-1 rounded hover:bg-amber-50 transition-colors disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {closingId === job.id ? 'Closing...' : 'Close'}
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => handleDuplicateJob(job.id, job.title)}
                                                    disabled={duplicatingId === job.id}
                                                    className="text-orange hover:text-orange/80 font-semibold px-2 py-1 rounded hover:bg-orange/10 transition-colors disabled:opacity-50"
                                                    title="Copy this job post"
                                                >
                                                    {duplicatingId === job.id ? 'Copying...' : 'Copy'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reopen Modal for Expired Deadlines */}
            {reopenModalJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-charcoal">Reopen Job Post</h3>
                            <button
                                type="button"
                                onClick={() => setReopenModalJob(null)}
                                className="text-gray-400 hover:text-charcoal text-sm"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            The deadline for <strong>"{reopenModalJob.title}"</strong> has expired. Please choose a new future deadline to reopen this job for candidates:
                        </p>
                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-charcoal mb-1">New Application Deadline *</label>
                            <input
                                type="date"
                                min={todayStr}
                                value={newDeadlineDate}
                                onChange={(e) => setNewDeadlineDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setReopenModalJob(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!newDeadlineDate || reopeningId === reopenModalJob.id}
                                onClick={() => executeReopen(reopenModalJob.id, newDeadlineDate)}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {reopeningId === reopenModalJob.id ? 'Reopening...' : 'Reopen Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
