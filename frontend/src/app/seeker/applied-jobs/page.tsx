'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { 
    LuChevronLeft, 
    LuChevronRight, 
    LuClock, 
    LuBuilding, 
    LuMessageCircle, 
    LuCheck, 
    LuX, 
    LuCircleX, 
    LuChevronDown, 
    LuChevronUp, 
    LuMapPin, 
    LuBriefcase,
    LuVideo
} from 'react-icons/lu';

// Seek-style ATS timeline stages
const TIMELINE_STAGES = [
    { key: 'applied', label: 'Applied', aliases: ['Applied'] },
    { key: 'viewed', label: 'Viewed', aliases: ['Viewed', 'Under Review'] },
    { key: 'shortlisted', label: 'Shortlisted', aliases: ['Shortlisted'] },
    { key: 'interview', label: 'Interview', aliases: ['Interview Scheduled', 'Interview'] },
    { key: 'hired', label: 'Hired', aliases: ['Selected', 'Hired', 'Offer Extended'] }
];

function getStageIndex(status: string): number {
    for (let i = 0; i < TIMELINE_STAGES.length; i++) {
        if (TIMELINE_STAGES[i].aliases.some(a => a.toLowerCase() === status.toLowerCase())) {
            return i;
        }
    }
    return 0; // Default to applied
}

const StatusTimeline = ({ currentStatus }: { currentStatus: string }) => {
    const isRejected = currentStatus.toLowerCase() === 'rejected';
    const isWithdrawn = currentStatus.toLowerCase() === 'withdrawn';
    const currentIndex = getStageIndex(currentStatus);

    if (isWithdrawn) {
        return (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span>Status: Application withdrawn by candidate</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">Withdrawn</span>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-red-600 flex items-center gap-1.5">
                        <LuCircleX className="w-4 h-4 text-red-500" />
                        Application not progressed by employer
                    </span>
                    <span className="bg-red-50 text-red-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                        Not Selected
                    </span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-400 h-full w-1/3 rounded-full" />
                </div>
            </div>
        );
    }

    const progressPercent = (currentIndex / (TIMELINE_STAGES.length - 1)) * 100;

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Step Labels */}
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2 px-1">
                {TIMELINE_STAGES.map((stage, idx) => {
                    const isDone = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;
                    return (
                        <span 
                            key={stage.key} 
                            className={`transition-colors ${
                                isCurrent 
                                    ? 'text-orange font-bold scale-105' 
                                    : isDone 
                                    ? 'text-charcoal font-semibold' 
                                    : 'text-gray-400'
                            }`}
                        >
                            {stage.label}
                        </span>
                    );
                })}
            </div>

            {/* Connecting Bar and Nodes */}
            <div className="relative flex items-center justify-between w-full px-1">
                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full" />
                <div 
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-orange to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `calc(${progressPercent}% - 8px)` }}
                />

                {TIMELINE_STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isCurrent = idx === currentIndex;
                    const isUpcoming = idx > currentIndex;

                    return (
                        <div key={stage.key} className="relative z-10 flex flex-col items-center">
                            <div 
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                    isCompleted
                                        ? 'bg-orange text-white shadow-sm'
                                        : isCurrent
                                        ? 'bg-orange text-white ring-4 ring-orange/20 shadow-md scale-110'
                                        : 'bg-white border-2 border-gray-300 text-transparent'
                                }`}
                            >
                                {isCompleted && <LuCheck className="w-3 h-3 stroke-[3]" />}
                                {isCurrent && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                {isUpcoming && null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function AppliedJobs() {
    const [page, setPage] = useState(1);
    const [withdrawingApp, setWithdrawingApp] = useState<any | null>(null);
    const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});
    const pageSize = 10;
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['my-applications', page],
        queryFn: async () => {
            const res = await api.get(`/applications/my-applications?page=${page}&pageSize=${pageSize}`);
            return res.data;
        }
    });

    const withdrawMutation = useMutation({
        mutationFn: async (appId: number) => {
            return await api.post(`/applications/${appId}/withdraw`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
            setWithdrawingApp(null);
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Failed to withdraw application. Please try again.');
        }
    });

    const toggleAnswers = (appId: number) => {
        setExpandedAnswers(prev => ({ ...prev, [appId]: !prev[appId] }));
    };

    const applications = data?.data || [];
    const totalCount = data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'applied':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'under review':
            case 'viewed':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'shortlisted':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'interview scheduled':
            case 'interview':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'selected':
            case 'hired':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'withdrawn':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-charcoal">My Applications</h1>
                    <p className="text-sm text-gray-600 mt-1">Track your progress, interview invitations, and status timelines.</p>
                </div>
                <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange/90 transition shadow-sm w-fit"
                >
                    <LuBriefcase className="w-4 h-4" />
                    Browse More Jobs
                </Link>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-gray-200">
                        <div className="w-8 h-8 border-3 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Loading your applications...
                    </div>
                ) : applications.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-gray-200">
                        <div className="w-14 h-14 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4 text-orange">
                            <LuBriefcase className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-semibold text-charcoal mb-1">No applications yet</h3>
                        <p className="text-sm text-gray-500 mb-5">Explore thousands of job opportunities and submit your first application.</p>
                        <Link 
                            href="/jobs" 
                            className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange/90 transition shadow-sm"
                        >
                            Explore Jobs
                        </Link>
                    </div>
                ) : (
                    applications.map((app: any) => {
                        const canWithdraw = !['selected', 'hired', 'rejected', 'withdrawn'].includes(app.status?.toLowerCase());
                        const hasAnswers = app.answers && app.answers.length > 0;
                        const isAnswersOpen = !!expandedAnswers[app.id];

                        return (
                            <div 
                                key={app.id} 
                                className="bg-white rounded-xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all p-5 sm:p-6"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-orange/5 border border-orange/10 flex items-center justify-center shrink-0 overflow-hidden">
                                            {app.job?.company?.logoUrl ? (
                                                <img src={app.job.company.logoUrl} alt="" className="h-10 w-10 object-contain" />
                                            ) : (
                                                <LuBuilding className="h-6 w-6 text-orange" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-charcoal hover:text-orange transition-colors">
                                                <Link href={`/jobs/${app.jobId}`}>{app.job?.title || 'Job Title'}</Link>
                                            </h3>
                                            <div className="mt-1 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                                <span className="flex items-center font-medium">
                                                    <LuBuilding className="w-3.5 h-3.5 mr-1 text-gray-400" /> 
                                                    {app.job?.company?.companyName || 'Company'}
                                                </span>
                                                {app.job?.location && (
                                                    <span className="flex items-center">
                                                        <LuMapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                                        {app.job.location}
                                                    </span>
                                                )}
                                                <span className="flex items-center text-gray-400">
                                                    <LuClock className="w-3.5 h-3.5 mr-1" /> 
                                                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(app.status)}`}>
                                            {app.status}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <Link 
                                                href={`/chat/${app.id}`} 
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-charcoal bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                                title="Message employer"
                                            >
                                                <LuMessageCircle className="w-3.5 h-3.5 text-orange" />
                                                Chat
                                            </Link>

                                            {canWithdraw && (
                                                <button
                                                    onClick={() => setWithdrawingApp(app)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Withdraw application"
                                                >
                                                    <LuX className="w-3.5 h-3.5" />
                                                    Withdraw
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Interview Scheduled Banner if any */}
                                {(app.status === 'Interview Scheduled' || app.status === 'Interview') && app.interviewDate && (
                                    <div className="mt-4 p-3 bg-purple-50/80 border border-purple-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2 text-purple-900 font-medium">
                                            <LuClock className="w-4 h-4 text-purple-600" />
                                            <span>
                                                Interview Scheduled: <strong>{new Date(app.interviewDate).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</strong>
                                            </span>
                                        </div>
                                        {app.meetingLink && (
                                            <a 
                                                href={app.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-sm transition"
                                            >
                                                <LuVideo className="w-3.5 h-3.5" />
                                                Join Meeting
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Seek-style Status Timeline */}
                                <StatusTimeline currentStatus={app.status} />

                                {/* Screening Answers preview toggle */}
                                {hasAnswers && (
                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => toggleAnswers(app.id)}
                                            className="text-xs font-semibold text-gray-600 hover:text-orange inline-flex items-center gap-1 transition"
                                        >
                                            {isAnswersOpen ? <LuChevronUp className="w-3.5 h-3.5" /> : <LuChevronDown className="w-3.5 h-3.5" />}
                                            {isAnswersOpen ? 'Hide' : 'View'} screening answers ({app.answers.length})
                                        </button>
                                        
                                        {isAnswersOpen && (
                                            <div className="mt-2.5 space-y-2 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                                                {app.answers.map((ans: any, idx: number) => (
                                                    <div key={idx} className="text-xs">
                                                        <p className="font-semibold text-charcoal">{ans.question?.questionText || `Question ${idx + 1}`}</p>
                                                        <p className="text-gray-600 mt-0.5 bg-white p-2 rounded border border-gray-200/60">{ans.answerText}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-6 py-4 rounded-xl border border-gray-200 flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                            Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span> to <span className="font-semibold">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-semibold">{totalCount}</span> applications
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
                            >
                                <LuChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
                            >
                                <LuChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Withdraw Confirmation Modal */}
            {withdrawingApp && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-4">
                            <LuCircleX className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-charcoal">Withdraw Application?</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            Are you sure you want to withdraw your application for{' '}
                            <strong>{withdrawingApp.job?.title}</strong> at{' '}
                            <strong>{withdrawingApp.job?.company?.companyName}</strong>?
                        </p>
                        <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-lg">
                            This cannot be undone. The employer will be notified that your application has been withdrawn.
                        </p>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setWithdrawingApp(null)}
                                disabled={withdrawMutation.isPending}
                                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                            >
                                Keep Application
                            </button>
                            <button
                                type="button"
                                onClick={() => withdrawMutation.mutate(withdrawingApp.id)}
                                disabled={withdrawMutation.isPending}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg transition shadow-sm disabled:opacity-50"
                            >
                                {withdrawMutation.isPending ? 'Withdrawing...' : 'Yes, Withdraw'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
