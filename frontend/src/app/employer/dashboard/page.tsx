'use client';

import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnalyticsTrendChart from '@/components/AnalyticsTrendChart';
import {
    LuBriefcase,
    LuFileText,
    LuSettings,
    LuEye,
    LuTrendingUp,
    LuPercent,
    LuCirclePlus,
    LuCalendar,
    LuArrowUpRight
} from 'react-icons/lu';

interface JobAnalyticsItem {
    jobId: number;
    title: string;
    status: string;
    viewsCount: number;
    applicationsCount: number;
    conversionRate: number;
    deadline?: string | null;
    createdAt: string;
}

interface EmployerAnalytics {
    totalJobs: number;
    totalViews: number;
    totalApplications: number;
    overallConversionRate: number;
    dailyTrends: Array<{
        date: string;
        views: number;
        applications: number;
    }>;
    jobStats: JobAnalyticsItem[];
}

export default function EmployerDashboard() {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();

    const { data: jobs, isLoading: isJobsLoading } = useQuery({
        queryKey: ['my-jobs'],
        queryFn: async () => {
            const res = await api.get('/jobs/my-jobs?pageSize=50');
            return res.data.data;
        }
    });

    const { data: analytics, isLoading: isAnalyticsLoading } = useQuery<EmployerAnalytics>({
        queryKey: ['employer-analytics'],
        queryFn: async () => {
            const res = await api.get('/jobs/employer-analytics');
            return res.data;
        }
    });

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warmwhite">
                <div className="w-8 h-8 border-3 border-orange border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'Employer') {
        router.push('/login');
        return null;
    }

    const totalJobs = analytics?.totalJobs ?? jobs?.length ?? 0;
    const activeJobs = jobs?.filter((j: any) => j.status === 'Published').length ?? 0;
    const totalViews = analytics?.totalViews ?? 0;
    const totalApplications = analytics?.totalApplications ?? 0;
    const overallConversion = analytics?.overallConversionRate ?? 0;

    return (
        <div className="min-h-screen bg-warmwhite py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-charcoal">Employer Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Monitor job performance, views, applications, and conversion statistics in real-time.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                            href="/employer/settings"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-md shadow-sm transition"
                        >
                            <LuSettings className="w-4 h-4 text-gray-500" />
                            Settings
                        </Link>
                        <Link
                            href="/employer/post-job"
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-orange hover:bg-orange/90 rounded-md shadow-sm transition"
                        >
                            <LuCirclePlus className="w-4 h-4" />
                            Post New Job
                        </Link>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Card 1: Total Jobs */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 transition-all hover:border-orange">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Jobs</p>
                                <p className="text-2xl font-display font-bold text-charcoal mt-1.5">{totalJobs}</p>
                                <p className="text-xs text-emerald-600 font-medium mt-1">
                                    {activeJobs} published & active
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-orange/10 text-orange rounded-md flex items-center justify-center shrink-0">
                                <LuBriefcase className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Total Views */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 transition-all hover:border-orange">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Views</p>
                                <p className="text-2xl font-display font-bold text-charcoal mt-1.5">
                                    {totalViews.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 font-medium mt-1">
                                    Across all posted jobs
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center shrink-0">
                                <LuEye className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Total Applications */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 transition-all hover:border-orange">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Applications</p>
                                <p className="text-2xl font-display font-bold text-charcoal mt-1.5">
                                    {totalApplications.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 font-medium mt-1">
                                    Candidates applied
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center shrink-0">
                                <LuFileText className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Conversion Rate */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 transition-all hover:border-orange">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversion Rate</p>
                                <p className="text-2xl font-display font-bold text-charcoal mt-1.5">
                                    {overallConversion}%
                                </p>
                                <p className="text-xs text-gray-500 font-medium mt-1">
                                    Applications per view
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-md flex items-center justify-center shrink-0">
                                <LuPercent className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 30-Day Trend Line Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <LuTrendingUp className="w-5 h-5 text-orange" />
                                <h2 className="text-lg font-display font-bold text-charcoal">30-Day Activity Trend</h2>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Daily views and job application trends over the last 30 days
                            </p>
                        </div>
                    </div>

                    {isAnalyticsLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-xs">Loading analytics data...</p>
                        </div>
                    ) : (
                        <AnalyticsTrendChart data={analytics?.dailyTrends || []} />
                    )}
                </div>

                {/* Job Performance & Conversion Breakdown Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-display font-bold text-charcoal">Job Performance & Conversion</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Detailed breakdown of views, applications, and conversion rates per job posting.
                            </p>
                        </div>
                        <Link
                            href="/employer/manage-jobs"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:underline transition"
                        >
                            <span>Manage all jobs</span>
                            <LuArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/75">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Job Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Views
                                    </th>
                                    <th className="px-6 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Applies
                                    </th>
                                    <th className="px-6 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Conversion
                                    </th>
                                    <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Deadline
                                    </th>
                                    <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 text-xs">
                                {isAnalyticsLoading || isJobsLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                                            <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            Loading job stats...
                                        </td>
                                    </tr>
                                ) : !analytics?.jobStats || analytics.jobStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No job postings found. Post your first job to see performance stats.
                                        </td>
                                    </tr>
                                ) : (
                                    analytics.jobStats.map((item) => {
                                        const convRate = item.conversionRate;
                                        return (
                                            <tr key={item.jobId} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-charcoal">{item.title}</div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                                        Posted {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                            item.status === 'Published'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : item.status === 'PendingApproval'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : item.status === 'Rejected'
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-charcoal">
                                                    {item.viewsCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-charcoal">
                                                    {item.applicationsCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                                            convRate >= 15
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : convRate > 0
                                                                ? 'bg-blue-50 text-blue-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}
                                                    >
                                                        {convRate}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                    {item.deadline ? (
                                                        <span className="flex items-center gap-1">
                                                            <LuCalendar className="w-3.5 h-3.5 text-gray-400" />
                                                            {new Date(item.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">None</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                                    <Link
                                                        href={`/employer/applications/${item.jobId}`}
                                                        className="text-orange hover:text-orange/80 font-semibold mr-3"
                                                    >
                                                        Applicants
                                                    </Link>
                                                    <Link
                                                        href={`/employer/manage-jobs/${item.jobId}`}
                                                        className="text-gray-500 hover:text-charcoal"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
