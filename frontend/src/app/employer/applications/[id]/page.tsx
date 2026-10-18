'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { 
    LuMessageCircle, 
    LuFileText, 
    LuStar, 
    LuChevronDown, 
    LuChevronUp, 
    LuSearch, 
    LuX, 
    LuArrowLeft, 
    LuSparkles 
} from 'react-icons/lu';
import Link from 'next/link';

interface ApplicationAnswer {
    id: number;
    questionId: number;
    answerText: string;
    question?: {
        id: number;
        questionText: string;
        questionType: string;
        idealAnswer?: string;
    };
}

interface ApplicationItem {
    id: number;
    jobId: number;
    seekerId: number;
    status: string;
    rating?: number | null;
    employerNotes?: string | null;
    coverLetter?: string | null;
    resumeUrl?: string | null;
    matchScore?: number | null;
    matchExplanation?: string | null;
    appliedAt: string;
    updatedAt: string;
    interviewDate?: string | null;
    meetingLink?: string | null;
    seeker?: {
        user?: {
            fullName?: string;
            email?: string;
            phoneNumber?: string;
        };
        verificationStatus?: string;
    };
    answers?: ApplicationAnswer[];
}

const STATUS_TABS = [
    { key: 'All', label: 'All' },
    { key: 'Applied', label: 'Applied' },
    { key: 'Viewed', label: 'Viewed' },
    { key: 'Shortlisted', label: 'Shortlisted' },
    { key: 'Interview', label: 'Interview' },
    { key: 'Hired', label: 'Hired' },
    { key: 'Rejected', label: 'Rejected' },
    { key: 'Withdrawn', label: 'Withdrawn' }
];

export default function JobApplicationsPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [jobTitle, setJobTitle] = useState('Job Applications');
    const [applications, setApplications] = useState<ApplicationItem[]>([]);

    // Filters, Search, Sort
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all'); // all, 24h, 7d, 30d
    const [sortBy, setSortBy] = useState('dateDesc'); // dateDesc, dateAsc, scoreDesc, nameAsc, ratingDesc
    const [filterRefTime] = useState(() => Date.now());

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkUpdating, setBulkUpdating] = useState(false);

    // Expand details per application
    const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

    // Local state for inline notes & updating
    const [notesState, setNotesState] = useState<Record<number, string>>({});
    const [savingNotesId, setSavingNotesId] = useState<number | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

    // Interview schedule modal / form state per application
    const [interviewForms, setInterviewForms] = useState<Record<number, { date: string; link: string }>>({});

    // Download resume loading state
    const [downloadingResumeId, setDownloadingResumeId] = useState<number | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'Employer') {
            router.push('/');
            return;
        }
        if (jobId) {
            fetchJobAndApplications();
        }
    }, [user, router, jobId]);

    const fetchJobAndApplications = async () => {
        try {
            setLoading(true);
            const [jobRes, appsRes] = await Promise.all([
                api.get(`/Jobs/${jobId}`).catch(() => null),
                api.get(`/Applications/job/${jobId}`)
            ]);

            if (jobRes?.data?.title) {
                setJobTitle(jobRes.data.title);
            }
            setApplications(appsRes.data || []);

            // Initialize notes state
            const initialNotes: Record<number, string> = {};
            const initialForms: Record<number, { date: string; link: string }> = {};
            (appsRes.data || []).forEach((a: ApplicationItem) => {
                initialNotes[a.id] = a.employerNotes || '';
                initialForms[a.id] = {
                    date: a.interviewDate ? a.interviewDate.slice(0, 16) : '',
                    link: a.meetingLink || ''
                };
            });
            setNotesState(initialNotes);
            setInterviewForms(initialForms);
        } catch (error) {
            console.error('Failed to fetch applications', error);
            alert('Failed to load applications for this job.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-mark viewed when opening details
    const handleToggleExpand = async (appId: number) => {
        const isNowExpanding = !expandedIds[appId];
        setExpandedIds(prev => ({ ...prev, [appId]: isNowExpanding }));

        const targetApp = applications.find(a => a.id === appId);
        if (isNowExpanding && targetApp && targetApp.status === 'Applied') {
            try {
                await api.post(`/Applications/${appId}/mark-viewed`);
                setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'Viewed' } : a));
            } catch (err) {
                console.error('Failed to mark application as viewed', err);
            }
        }
    };

    // Rating star click
    const handleSetRating = async (appId: number, starValue: number) => {
        const targetApp = applications.find(a => a.id === appId);
        const newRating = targetApp?.rating === starValue ? null : starValue; // Toggle off if clicked again

        // Optimistic UI update
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, rating: newRating } : a));

        try {
            await api.patch(`/Applications/${appId}/rating`, { rating: newRating });
        } catch (error) {
            console.error('Failed to save rating', error);
            alert('Failed to save rating.');
            // Revert on error
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, rating: targetApp?.rating } : a));
        }
    };

    // Save employer notes
    const handleSaveNotes = async (appId: number) => {
        try {
            setSavingNotesId(appId);
            const notes = notesState[appId] ?? '';
            await api.patch(`/Applications/${appId}/notes`, { employerNotes: notes });
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, employerNotes: notes } : a));
        } catch (error) {
            console.error('Failed to save notes', error);
            alert('Failed to save notes.');
        } finally {
            setSavingNotesId(null);
        }
    };

    // Single Status Change
    const handleStatusChange = async (app: ApplicationItem, newStatus: string, confirmed = false) => {
        if (app.status === 'Withdrawn') {
            alert('Cannot change status of a withdrawn application.');
            return;
        }

        // Confirmation guard if moving away from Hired or Rejected
        if ((app.status === 'Hired' || app.status === 'Rejected') && app.status !== newStatus && !confirmed) {
            const confirmChange = window.confirm(
                `This candidate is currently marked as "${app.status}". Are you sure you want to change their status to "${newStatus}"?`
            );
            if (!confirmChange) return;
        }

        const formData = interviewForms[app.id] || { date: '', link: '' };
        if (newStatus === 'Interview' && !formData.date && !app.interviewDate) {
            alert('Please select an interview date and time.');
            return;
        }

        try {
            setUpdatingStatusId(app.id);
            const res = await api.patch(`/Applications/${app.id}/status`, {
                status: newStatus,
                confirmTransition: true,
                interviewDate: newStatus === 'Interview' && formData.date ? new Date(formData.date).toISOString() : undefined,
                meetingLink: newStatus === 'Interview' ? formData.link : undefined
            });

            setApplications(prev => prev.map(a => a.id === app.id ? { ...a, ...res.data } : a));
        } catch (error: any) {
            console.error('Status update failed', error);
            alert(error.response?.data?.message || 'Failed to update application status.');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    // Bulk Status Updates (Shortlist / Reject)
    const handleBulkStatus = async (targetStatus: 'Shortlisted' | 'Rejected') => {
        if (selectedIds.length === 0) return;

        const confirmMsg = `Are you sure you want to bulk mark ${selectedIds.length} candidate(s) as "${targetStatus}"?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setBulkUpdating(true);
            const res = await api.post('/Applications/bulk-status', {
                applicationIds: selectedIds,
                status: targetStatus
            });

            // Refresh applications list
            const updated = res.data;
            let alertMsg = updated.message || `Successfully updated ${updated.updatedCount ?? selectedIds.length} applications.`;
            if (updated.skipped && updated.skipped.length > 0) {
                alertMsg += `\n\nSkipped (${updated.skipped.length}):`;
                updated.skipped.slice(0, 5).forEach((s: any) => {
                    alertMsg += `\n- ID #${s.applicationId}: ${s.reason}`;
                });
                if (updated.skipped.length > 5) {
                    alertMsg += `\n...and ${updated.skipped.length - 5} more.`;
                }
            }
            alert(alertMsg);
            setSelectedIds([]);
            await fetchJobAndApplications();
        } catch (error: any) {
            console.error('Bulk update error', error);
            alert(error.response?.data?.message || 'Failed to update applications in bulk.');
        } finally {
            setBulkUpdating(false);
        }
    };

    // Resume Download
    const handleDownloadResume = async (app: ApplicationItem) => {
        try {
            setDownloadingResumeId(app.id);
            const response = await api.get(`/Applications/download-resume/${app.id}`, {
                responseType: 'blob'
            });
            const contentType = (response.headers['content-type'] as string) || 'application/pdf';
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const applicantName = (app.seeker?.user?.fullName || 'Applicant').replace(/[^a-zA-Z0-9_-]/g, '_');
            link.setAttribute('download', `${applicantName}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Failed to download resume', error);
            alert('Failed to download resume.');
        } finally {
            setDownloadingResumeId(null);
        }
    };

    // Filter, Search, and Sort calculation
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            // Status filter
            if (statusFilter !== 'All') {
                const normStatus = (app.status || '').toLowerCase();
                const normFilter = statusFilter.toLowerCase();
                if (normFilter === 'viewed') {
                    if (normStatus !== 'viewed' && normStatus !== 'under review') return false;
                } else if (normFilter === 'interview') {
                    if (normStatus !== 'interview' && normStatus !== 'interview scheduled') return false;
                } else if (normFilter === 'hired') {
                    if (normStatus !== 'hired' && normStatus !== 'selected') return false;
                } else {
                    if (normStatus !== normFilter) return false;
                }
            }

            // Search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const name = (app.seeker?.user?.fullName || '').toLowerCase();
                const email = (app.seeker?.user?.email || '').toLowerCase();
                const phone = (app.seeker?.user?.phoneNumber || '').toLowerCase();
                const notes = (app.employerNotes || '').toLowerCase();
                const matchesAnswers = app.answers?.some(a => a.answerText.toLowerCase().includes(term));
                if (!name.includes(term) && !email.includes(term) && !phone.includes(term) && !notes.includes(term) && !matchesAnswers) {
                    return false;
                }
            }

            // Date filter
            if (dateFilter !== 'all') {
                const appliedTime = new Date(app.appliedAt).getTime();
                const diffHours = (filterRefTime - appliedTime) / (1000 * 60 * 60);

                if (dateFilter === '24h' && diffHours > 24) return false;
                if (dateFilter === '7d' && diffHours > 24 * 7) return false;
                if (dateFilter === '30d' && diffHours > 24 * 30) return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'dateDesc') {
                return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
            }
            if (sortBy === 'dateAsc') {
                return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
            }
            if (sortBy === 'scoreDesc') {
                return (b.matchScore ?? -1) - (a.matchScore ?? -1);
            }
            if (sortBy === 'ratingDesc') {
                return (b.rating ?? 0) - (a.rating ?? 0);
            }
            if (sortBy === 'nameAsc') {
                const nameA = a.seeker?.user?.fullName || '';
                const nameB = b.seeker?.user?.fullName || '';
                return nameA.localeCompare(nameB);
            }
            return 0;
        });
    }, [applications, statusFilter, searchTerm, dateFilter, sortBy, filterRefTime]);

    // Counts for tabs
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { All: applications.length };
        STATUS_TABS.forEach(tab => {
            if (tab.key === 'All') return;
            const normKey = tab.key.toLowerCase();
            counts[tab.key] = applications.filter(a => {
                const s = (a.status || '').toLowerCase();
                if (normKey === 'viewed') return s === 'viewed' || s === 'under review';
                if (normKey === 'interview') return s === 'interview' || s === 'interview scheduled';
                if (normKey === 'hired') return s === 'hired' || s === 'selected';
                return s === normKey;
            }).length;
        });
        return counts;
    }, [applications]);

    // Selectable applications (excluding Withdrawn)
    const selectableFilteredIds = useMemo(() => {
        return filteredApplications.filter(a => a.status !== 'Withdrawn').map(a => a.id);
    }, [filteredApplications]);

    const isAllSelected = selectableFilteredIds.length > 0 && selectableFilteredIds.every(id => selectedIds.includes(id));

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !selectableFilteredIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...selectableFilteredIds])));
        }
    };

    const handleToggleSelectOne = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange border-t-transparent mb-4"></div>
                <p className="text-gray-500 font-medium">Loading candidate applications...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb & Navigation */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Link 
                        href="/employer/manage-jobs"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange transition-colors font-medium mb-2"
                    >
                        <LuArrowLeft className="w-3.5 h-3.5" />
                        Back to Manage Jobs
                    </Link>
                    <h1 className="text-2xl font-bold text-charcoal flex items-center flex-wrap gap-2.5">
                        <span>{jobTitle}</span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-peach text-charcoal border border-peach/80">
                            {applications.length} total applicant{applications.length !== 1 ? 's' : ''}
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/employer/manage-jobs/${jobId}`}
                        className="text-xs font-medium px-3.5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                        Edit Job Details
                    </Link>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="bg-warmwhite rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {STATUS_TABS.map(tab => {
                        const count = statusCounts[tab.key] || 0;
                        const isActive = statusFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setStatusFilter(tab.key)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                    isActive 
                                        ? 'bg-charcoal text-white shadow-sm' 
                                        : 'text-gray-600 hover:bg-peach/60'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter, Search & Sort Control Bar */}
            <div className="bg-warmwhite rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search candidate by name, email, phone, or answer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-orange/50"
                    />
                    {searchTerm && (
                        <button 
                            type="button" 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                            <LuX className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Date Filter & Sort */}
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange/50"
                    >
                        <option value="all">Date: All Time</option>
                        <option value="24h">Past 24 Hours</option>
                        <option value="7d">Past 7 Days</option>
                        <option value="30d">Past 30 Days</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange/50"
                    >
                        <option value="dateDesc">Sort: Newest First</option>
                        <option value="dateAsc">Sort: Oldest First</option>
                        <option value="scoreDesc">Sort: AI Match (Highest)</option>
                        <option value="ratingDesc">Sort: Rating (Highest)</option>
                        <option value="nameAsc">Sort: Candidate Name (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Floating Toolbar */}
            {selectedIds.length > 0 && (
                <div className="sticky top-4 z-30 mb-6 bg-charcoal text-white rounded-xl shadow-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-orange text-white">
                            {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="text-xs text-gray-300 hover:text-white underline"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleBulkStatus('Shortlisted')}
                            disabled={bulkUpdating}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            {bulkUpdating ? 'Updating...' : 'Bulk Shortlist'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkStatus('Rejected')}
                            disabled={bulkUpdating}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            {bulkUpdating ? 'Updating...' : 'Bulk Reject'}
                        </button>
                    </div>
                </div>
            )}

            {/* Select All Checkbox bar */}
            {selectableFilteredIds.length > 0 && (
                <div className="mb-3 px-2 flex items-center justify-between text-xs text-gray-500">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-charcoal select-none">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded text-orange focus:ring-orange border-gray-300 cursor-pointer"
                        />
                        <span>Select all visible candidates ({selectableFilteredIds.length})</span>
                    </label>
                    <span>Showing {filteredApplications.length} of {applications.length} candidates</span>
                </div>
            )}

            {/* Candidate List (Cards) */}
            {filteredApplications.length === 0 ? (
                <div className="bg-warmwhite rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                    <p className="text-gray-500 text-sm mb-2">No applications match your filter or search query.</p>
                    <button
                        type="button"
                        onClick={() => { setStatusFilter('All'); setSearchTerm(''); setDateFilter('all'); }}
                        className="text-xs text-orange hover:underline font-semibold"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map(app => {
                        const isExpanded = !!expandedIds[app.id];
                        const isSelected = selectedIds.includes(app.id);
                        const isWithdrawn = app.status === 'Withdrawn';
                        const currentRating = app.rating || 0;
                        const form = interviewForms[app.id] || { date: '', link: '' };

                        return (
                            <div 
                                key={app.id}
                                className={`bg-warmwhite rounded-xl border transition-all duration-200 shadow-sm ${
                                    isSelected 
                                        ? 'border-orange ring-1 ring-orange/30' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="p-4 sm:p-6">
                                    {/* Card Top: Checkbox, Name, Status, Rating, Chat */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isWithdrawn}
                                                onChange={() => handleToggleSelectOne(app.id)}
                                                className="mt-1 w-4 h-4 rounded text-orange focus:ring-orange border-gray-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={isWithdrawn ? 'Cannot bulk-select withdrawn candidates' : 'Select candidate'}
                                            />

                                            {/* Candidate Info */}
                                            <div className="min-w-0">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <h3 className="text-base font-bold text-charcoal truncate">
                                                        {app.seeker?.user?.fullName || 'Anonymous Candidate'}
                                                    </h3>
                                                    {app.seeker?.verificationStatus === 'Verified' && (
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                                                            ✓ Verified ID
                                                        </span>
                                                    )}
                                                    {isWithdrawn && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                            Withdrawn by candidate
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                                                    <span>✉️ {app.seeker?.user?.email || 'No email'}</span>
                                                    {app.seeker?.user?.phoneNumber && (
                                                        <span>📞 {app.seeker.user.phoneNumber}</span>
                                                    )}
                                                    <span>📅 Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                                                </div>

                                                {/* Interactive Rating Stars (1-5) */}
                                                <div className="flex items-center gap-1 mt-2.5">
                                                    <span className="text-xs text-gray-400 font-medium mr-1">Rating:</span>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => handleSetRating(app.id, star)}
                                                            className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                                                            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                                        >
                                                            <LuStar 
                                                                className={`w-4 h-4 ${
                                                                    star <= currentRating 
                                                                        ? 'text-amber-400 fill-amber-400' 
                                                                        : 'text-gray-300 hover:text-amber-200'
                                                                }`} 
                                                            />
                                                        </button>
                                                    ))}
                                                    {currentRating > 0 && (
                                                        <span className="text-[11px] text-amber-700 font-semibold ml-1">
                                                            {currentRating}/5
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge & Chat Button */}
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                app.status === 'Applied' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                app.status === 'Viewed' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                app.status === 'Shortlisted' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                app.status === 'Interview' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                                app.status === 'Hired' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}>
                                                {app.status}
                                            </span>

                                            <Link
                                                href={`/chat/${app.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-peach hover:bg-peach/80 text-charcoal transition-colors border border-peach/80"
                                            >
                                                <LuMessageCircle className="w-3.5 h-3.5" />
                                                <span>Chat</span>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* AI Match Score Badge (if present) */}
                                    {app.matchScore !== undefined && app.matchScore !== null && (
                                        <div className="mt-3 flex items-center flex-wrap gap-2">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                                                app.matchScore >= 75 ? 'bg-emerald-100 text-emerald-800' :
                                                app.matchScore >= 50 ? 'bg-amber-100 text-amber-800' :
                                                app.matchScore > 0 ? 'bg-rose-100 text-rose-800' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                <LuSparkles className="w-3.5 h-3.5" />
                                                <span>AI Match: {app.matchScore > 0 ? `${app.matchScore}%` : 'Pending'}</span>
                                            </span>
                                            {app.matchExplanation && (
                                                <span className="text-xs text-gray-500 italic truncate max-w-md">
                                                    {app.matchExplanation}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Quick Actions Strip: Resume & Expand */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            {app.resumeUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadResume(app)}
                                                    disabled={downloadingResumeId === app.id}
                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-orange hover:text-orange/80 bg-orange/10 hover:bg-orange/20 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <LuFileText className="w-3.5 h-3.5" />
                                                    <span>{downloadingResumeId === app.id ? 'Downloading...' : 'Download Resume'}</span>
                                                </button>
                                            )}

                                            {app.answers && app.answers.length > 0 && (
                                                <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                                                    {app.answers.length} screening answer{app.answers.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleExpand(app.id)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-charcoal px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
                                            {isExpanded ? <LuChevronUp className="w-3.5 h-3.5" /> : <LuChevronDown className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>

                                    {/* Expanded Section: Screening Questions, Cover Letter, Notes, Status Change */}
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-fadeIn">
                                            {/* Screening Questions Display */}
                                            {app.answers && app.answers.length > 0 ? (
                                                <div className="bg-peach/30 rounded-lg p-3.5 border border-peach/70">
                                                    <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                                        <span>Screening Questions & Answers</span>
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {app.answers.map((ans, idx) => (
                                                            <div key={ans.id || idx} className="text-xs bg-white rounded-lg p-2.5 border border-gray-200">
                                                                <p className="font-semibold text-charcoal mb-1">
                                                                    Q{idx + 1}: {ans.question?.questionText || 'Question'}
                                                                    <span className="text-[10px] text-gray-400 font-normal ml-1.5">
                                                                        ({ans.question?.questionType || 'Text'})
                                                                    </span>
                                                                </p>
                                                                <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap font-medium">
                                                                    Ans: {ans.answerText || '<No Answer>'}
                                                                </p>
                                                                {ans.question?.idealAnswer && (
                                                                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                                                                        <span className="font-semibold">Ideal Answer:</span> {ans.question.idealAnswer}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">No screening questions were attached to this application.</p>
                                            )}

                                            {/* Cover Letter */}
                                            {app.coverLetter && (
                                                <div className="bg-white rounded-lg p-3.5 border border-gray-200 text-xs">
                                                    <h4 className="font-bold text-charcoal uppercase tracking-wider mb-1.5">Cover Letter</h4>
                                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{app.coverLetter}</p>
                                                </div>
                                            )}

                                            {/* Employer Private Notes Edit */}
                                            <div className="bg-white rounded-lg p-3.5 border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-bold text-charcoal uppercase tracking-wider">
                                                        Private Employer Notes
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveNotes(app.id)}
                                                        disabled={savingNotesId === app.id}
                                                        className="text-xs font-semibold px-3 py-1 bg-charcoal text-white rounded hover:bg-black transition-colors disabled:opacity-50"
                                                    >
                                                        {savingNotesId === app.id ? 'Saving...' : 'Save Notes'}
                                                    </button>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    placeholder="Add internal feedback, interview remarks, or evaluation notes (visible only to your company team)..."
                                                    value={notesState[app.id] ?? ''}
                                                    onChange={(e) => setNotesState({ ...notesState, [app.id]: e.target.value })}
                                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50"
                                                />
                                            </div>

                                            {/* Status Change & Interview Scheduling Form */}
                                            {!isWithdrawn ? (
                                                <div className="bg-peach/20 rounded-lg p-3.5 border border-peach/60 space-y-3">
                                                    <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                                                        Change Application Status
                                                    </h4>

                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                        <select
                                                            value={app.status}
                                                            onChange={(e) => handleStatusChange(app, e.target.value)}
                                                            disabled={updatingStatusId === app.id}
                                                            className="flex-1 bg-white border border-gray-300 rounded-lg text-xs font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange/50"
                                                        >
                                                            <option value="Applied">Applied</option>
                                                            <option value="Viewed">Viewed</option>
                                                            <option value="Shortlisted">Shortlisted</option>
                                                            <option value="Interview">Interview</option>
                                                            <option value="Hired">Hired</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                    </div>

                                                    {/* Interview Scheduling Extra Fields */}
                                                    {app.status === 'Interview' && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                                                    Interview Date & Time
                                                                </label>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={form.date}
                                                                    onChange={(e) => setInterviewForms({
                                                                        ...interviewForms,
                                                                        [app.id]: { ...form, date: e.target.value }
                                                                    })}
                                                                    className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange/50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                                                    Meeting Link (Google Meet, Zoom, etc.)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="https://meet.google.com/..."
                                                                    value={form.link}
                                                                    onChange={(e) => setInterviewForms({
                                                                        ...interviewForms,
                                                                        [app.id]: { ...form, link: e.target.value }
                                                                    })}
                                                                    className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange/50"
                                                                />
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStatusChange(app, 'Interview', true)}
                                                                    disabled={updatingStatusId === app.id || !form.date}
                                                                    className="px-4 py-2 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange/90 transition-colors disabled:opacity-50"
                                                                >
                                                                    {updatingStatusId === app.id ? 'Updating...' : 'Save Interview Details'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-gray-100 rounded-lg text-xs text-gray-500">
                                                    Status updates are locked because the candidate has withdrawn their application.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
