'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import {
    LuSearch,
    LuMapPin,
    LuBriefcase,
    LuLanguages,
    LuShieldCheck,
    LuSend,
    LuX,
    LuChevronLeft,
    LuChevronRight,
    LuCheck,
    LuMail,
    LuPhone,
    LuClock,
    LuCircleAlert
} from 'react-icons/lu';

interface WorkHistory {
    id: number;
    jobTitle: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
}

interface Education {
    id: number;
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    isCurrent: boolean;
}

interface Language {
    id: number;
    language: string;
    proficiency: string;
}

interface Certification {
    id: number;
    name: string;
    issuingOrganization: string;
    issueDate?: string;
}

interface Candidate {
    id: number;
    fullName: string;
    careerTitle?: string;
    location?: string;
    bio?: string;
    yearsOfExperience: number;
    skills: string[];
    workHistories: WorkHistory[];
    educations: Education[];
    languages: Language[];
    certifications: Certification[];
    contactRevealed?: boolean;
    contactInfo?: {
        fullName?: string;
        email?: string;
        phone?: string;
    } | null;
}

interface PublishedJob {
    id: number;
    title: string;
    location?: string;
    jobType?: string;
    isRemote: boolean;
    companyName: string;
}

export default function CandidatesSearchPage() {
    // Filters state
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [minExp, setMinExp] = useState<string>('');
    const [maxExp, setMaxExp] = useState<string>('');
    const [language, setLanguage] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Modals state
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteCandidateTarget, setInviteCandidateTarget] = useState<Candidate | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    // Fetch Candidates query
    const {
        data: candidatesData,
        isLoading,
        isError,
        error: searchError,
        refetch
    } = useQuery({
        queryKey: ['candidates-search', keyword, location, selectedSkills, minExp, maxExp, language, sortBy, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (location) params.append('location', location);
            if (selectedSkills.length > 0) params.append('skills', selectedSkills.join(','));
            if (minExp) params.append('minExperience', minExp);
            if (maxExp) params.append('maxExperience', maxExp);
            if (language) params.append('language', language);
            if (sortBy) params.append('sortBy', sortBy);
            params.append('page', page.toString());
            params.append('pageSize', pageSize.toString());

            const res = await api.get(`/candidates?${params.toString()}`);
            return res.data;
        },
        retry: false
    });

    // Fetch Employer's published jobs for invitation dropdown
    const { data: publishedJobs = [] } = useQuery<PublishedJob[]>({
        queryKey: ['my-published-jobs'],
        queryFn: async () => {
            const res = await api.get('/candidates/my-published-jobs');
            return res.data || [];
        }
    });

    // Send invitation mutation
    const inviteMutation = useMutation({
        mutationFn: async ({ seekerId, jobId, message }: { seekerId: number; jobId: number; message?: string }) => {
            const res = await api.post('/candidates/invite', { seekerId, jobId, message });
            return res.data;
        },
        onSuccess: (data) => {
            setInviteSuccess(data.message || 'Invitation sent successfully!');
            setInviteError(null);
            setTimeout(() => {
                setIsInviteOpen(false);
                setInviteSuccess(null);
                setSelectedJobId('');
                setInviteMessage('');
            }, 1800);
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Failed to send invitation. Please try again.';
            setInviteError(msg);
            setInviteSuccess(null);
        }
    });

    // Detail query when a candidate is clicked
    const openDetailModal = async (candidate: Candidate) => {
        try {
            const res = await api.get(`/candidates/${candidate.id}`);
            setSelectedCandidate(res.data);
        } catch {
            setSelectedCandidate(candidate);
        }
        setIsDetailOpen(true);
    };

    const handleAddSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !selectedSkills.includes(trimmed)) {
            setSelectedSkills([...selectedSkills, trimmed]);
            setSkillInput('');
            setPage(1);
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSelectedSkills(selectedSkills.filter((s) => s !== skillToRemove));
        setPage(1);
    };

    const handleOpenInvite = (candidate: Candidate) => {
        setInviteCandidateTarget(candidate);
        setInviteError(null);
        setInviteSuccess(null);
        if (publishedJobs.length > 0 && selectedJobId === '') {
            setSelectedJobId(publishedJobs[0].id);
        }
        setIsInviteOpen(true);
    };

    const handleSendInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCandidateTarget || !selectedJobId) {
            setInviteError('Please select a published job to invite candidate to.');
            return;
        }
        inviteMutation.mutate({
            seekerId: inviteCandidateTarget.id,
            jobId: Number(selectedJobId),
            message: inviteMessage
        });
    };

    // Check if error is 403 unverified company
    const errStatus = (searchError as any)?.response?.status;
    const isUnverifiedCompany = errStatus === 403;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange/10 text-orange">
                                Employer Talent Search
                            </span>
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium">
                                <LuShieldCheck className="w-3.5 h-3.5" /> Strict Privacy Protected
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal mt-2 tracking-tight">
                            Find Top Candidates
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
                            Search active job seekers open to new opportunities. Send application invitations to reveal direct candidate contact details upon acceptance.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/employer/manage-jobs"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-charcoal transition-colors"
                        >
                            <LuBriefcase className="w-4 h-4 text-gray-400" />
                            Manage Jobs
                        </Link>
                    </div>
                </div>

                {/* Unverified Company Alert */}
                {isUnverifiedCompany && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 sm:p-8 text-center space-y-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                            <LuCircleAlert className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-charcoal">Company Verification Required</h3>
                        <p className="text-sm text-gray-600 max-w-md mx-auto">
                            Only employers with a verified and approved company profile can access Candidate Talent Search to protect job seeker privacy.
                        </p>
                        <div>
                            <Link
                                href="/employer/verification"
                                className="inline-flex items-center gap-2 bg-orange text-white px-5 py-2.5 rounded-md text-sm font-semibold shadow-sm hover:bg-orange/90 transition-colors"
                            >
                                <LuShieldCheck className="w-4 h-4" /> Go to Company Verification
                            </Link>
                        </div>
                    </div>
                )}

                {!isUnverifiedCompany && (
                    <>
                        {/* Search & Filter Bar */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Keyword */}
                                <div className="relative">
                                    <LuSearch className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => {
                                            setKeyword(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Search title, skills, bio..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                    />
                                </div>

                                {/* Location */}
                                <div className="relative">
                                    <LuMapPin className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => {
                                            setLocation(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="City, State, or Remote..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                    />
                                </div>

                                {/* Language */}
                                <div className="relative">
                                    <LuLanguages className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={language}
                                        onChange={(e) => {
                                            setLanguage(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Language (e.g. English, Tamil)..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                    />
                                </div>
                            </div>

                            {/* Second Row: Skills filter & Experience range & Sort */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                                {/* Skills Tag Input */}
                                <div className="sm:col-span-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSkill();
                                                }
                                            }}
                                            placeholder="Type a skill & press Add..."
                                            className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSkill}
                                            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-charcoal rounded-md text-xs font-semibold transition"
                                        >
                                            Add Skill
                                        </button>
                                    </div>
                                    {selectedSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {selectedSkills.map((sk) => (
                                                <span
                                                    key={sk}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange/10 text-orange"
                                                >
                                                    {sk}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSkill(sk)}
                                                        className="hover:text-red-600 transition"
                                                    >
                                                        <LuX className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Experience Range */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={minExp}
                                        onChange={(e) => {
                                            setMinExp(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Min Yrs"
                                        className="w-1/2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                    />
                                    <span className="text-gray-400 text-xs">-</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={maxExp}
                                        onChange={(e) => {
                                            setMaxExp(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Max Yrs"
                                        className="w-1/2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                    />
                                </div>

                                {/* Sort By */}
                                <div>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            setSortBy(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                    >
                                        <option value="recent">Recently Active</option>
                                        <option value="experience_desc">Experience: High to Low</option>
                                        <option value="experience_asc">Experience: Low to High</option>
                                        <option value="title">Career Title</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Results Count & Rate Limit Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 px-1 gap-2">
                            <span>
                                Showing {candidatesData?.candidates?.length || 0} of {candidatesData?.totalCount || 0} active candidate profiles
                            </span>
                            <span className="inline-flex items-center gap-1 text-gray-400">
                                <LuClock className="w-3.5 h-3.5" /> Max 20 application invites per day • 30 searches/min
                            </span>
                        </div>

                        {/* Candidates Grid / List */}
                        {isLoading ? (
                            <div className="bg-white rounded-lg p-12 text-center text-gray-400 shadow-sm border border-gray-200">
                                <div className="w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm font-medium">Loading candidate talent...</p>
                            </div>
                        ) : isError ? (
                            <div className="bg-white rounded-lg p-12 text-center text-red-500 shadow-sm border border-gray-200 space-y-3">
                                <LuCircleAlert className="w-10 h-10 mx-auto opacity-70" />
                                <p className="text-sm font-semibold">Unable to fetch candidates.</p>
                                <button
                                    onClick={() => refetch()}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-charcoal rounded-md text-xs font-semibold transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : !candidatesData?.candidates || candidatesData.candidates.length === 0 ? (
                            <div className="bg-white rounded-lg p-12 text-center text-gray-400 shadow-sm border border-gray-200 space-y-3">
                                <LuBriefcase className="w-12 h-12 mx-auto text-gray-300" />
                                <h3 className="text-base font-bold text-charcoal">No candidates matched your search</h3>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                    Try expanding your filters, searching with different skills, or clearing keywords.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {candidatesData.candidates.map((candidate: Candidate) => (
                                    <div
                                        key={candidate.id}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-orange/60 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            {/* Candidate Header */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-full bg-orange flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                                                        {candidate.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-charcoal text-base">
                                                            {candidate.fullName}
                                                        </h3>
                                                        <p className="text-xs font-medium text-orange">
                                                            {candidate.careerTitle || 'Open to Opportunities'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                    {candidate.yearsOfExperience} {candidate.yearsOfExperience === 1 ? 'yr exp' : 'yrs exp'}
                                                </span>
                                            </div>

                                            {/* Location & Experience Info */}
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                {candidate.location && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <LuMapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        {candidate.location}
                                                    </span>
                                                )}
                                                {candidate.workHistories && candidate.workHistories.length > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <LuBriefcase className="w-3.5 h-3.5 text-gray-400" />
                                                        {candidate.workHistories[0].jobTitle} at {candidate.workHistories[0].company}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Bio snippet */}
                                            {candidate.bio && (
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                    {candidate.bio}
                                                </p>
                                            )}

                                            {/* Skills chips */}
                                            {candidate.skills && candidate.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {candidate.skills.slice(0, 5).map((sk) => (
                                                        <span
                                                            key={sk}
                                                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700"
                                                        >
                                                            {sk}
                                                        </span>
                                                    ))}
                                                    {candidate.skills.length > 5 && (
                                                        <span className="px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-50 text-gray-400">
                                                            +{candidate.skills.length - 5}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openDetailModal(candidate)}
                                                className="px-3.5 py-2 rounded-md text-xs font-semibold text-gray-700 hover:text-charcoal hover:bg-gray-100 transition-colors"
                                            >
                                                View Profile
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleOpenInvite(candidate)}
                                                className="inline-flex items-center gap-1.5 bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
                                            >
                                                <LuSend className="w-3.5 h-3.5" />
                                                Invite to Apply
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {candidatesData && candidatesData.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <LuChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-semibold text-gray-600 px-3 py-2 bg-white rounded-md border border-gray-200">
                                    Page {page} of {candidatesData.totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(candidatesData.totalPages, p + 1))}
                                    disabled={page >= candidatesData.totalPages}
                                    className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <LuChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Candidate Detail Modal */}
            {isDetailOpen && selectedCandidate && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 flex items-start justify-between bg-warmwhite">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-orange flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                                    {selectedCandidate.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-charcoal">
                                        {selectedCandidate.fullName}
                                    </h2>
                                    <p className="text-xs font-medium text-orange">
                                        {selectedCandidate.careerTitle || 'Open to Opportunities'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        {selectedCandidate.location && (
                                            <span className="flex items-center gap-1">
                                                <LuMapPin className="w-3 h-3" />
                                                {selectedCandidate.location}
                                            </span>
                                        )}
                                        <span>•</span>
                                        <span>{selectedCandidate.yearsOfExperience} yrs experience</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDetailOpen(false)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-charcoal hover:bg-gray-100 transition-colors"
                            >
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Contact Reveal Shield / Revealed Info */}
                            {selectedCandidate.contactRevealed && selectedCandidate.contactInfo ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                                        <LuCheck className="w-4 h-4 text-emerald-600" />
                                        Candidate Accepted Your Invitation - Contact Details Revealed
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900 pt-1">
                                        {selectedCandidate.contactInfo.email && (
                                            <div className="flex items-center gap-2">
                                                <LuMail className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>{selectedCandidate.contactInfo.email}</span>
                                            </div>
                                        )}
                                        {selectedCandidate.contactInfo.phone && (
                                            <div className="flex items-center gap-2">
                                                <LuPhone className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>{selectedCandidate.contactInfo.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-3.5 flex items-start gap-3">
                                    <LuShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-900 leading-relaxed">
                                        <span className="font-semibold">Privacy Protected:</span> Candidate contact details (email, phone, resume) remain protected. Click <strong>Invite to Apply</strong> to invite this candidate. Contact details are revealed once the candidate accepts!
                                    </div>
                                </div>
                            )}

                            {/* Bio */}
                            {selectedCandidate.bio && (
                                <div className="space-y-1.5">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Summary
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                        {selectedCandidate.bio}
                                    </p>
                                </div>
                            )}

                            {/* Skills */}
                            {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Skills & Expertise
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedCandidate.skills.map((sk) => (
                                            <span
                                                key={sk}
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-charcoal"
                                            >
                                                {sk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Work History */}
                            {selectedCandidate.workHistories && selectedCandidate.workHistories.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Work Experience
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedCandidate.workHistories.map((wh) => (
                                            <div key={wh.id} className="border-l-2 border-orange/40 pl-3 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs sm:text-sm font-bold text-charcoal">
                                                        {wh.jobTitle}
                                                    </h4>
                                                    <span className="text-[11px] text-gray-400">
                                                        {wh.isCurrent ? 'Present' : wh.endDate ? new Date(wh.endDate).toLocaleDateString([], { month: 'short', year: 'numeric' }) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-gray-600">{wh.company} {wh.location ? `• ${wh.location}` : ''}</p>
                                                {wh.description && (
                                                    <p className="text-xs text-gray-500 leading-relaxed pt-0.5 whitespace-pre-line">
                                                        {wh.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {selectedCandidate.educations && selectedCandidate.educations.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Education
                                    </h3>
                                    <div className="space-y-2.5">
                                        {selectedCandidate.educations.map((edu) => (
                                            <div key={edu.id} className="border-l-2 border-blue-300 pl-3 space-y-0.5">
                                                <h4 className="text-xs sm:text-sm font-bold text-charcoal">
                                                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                                                </h4>
                                                <p className="text-xs text-gray-600">{edu.institution}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Languages & Certifications */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                {selectedCandidate.languages && selectedCandidate.languages.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Languages
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedCandidate.languages.map((l) => (
                                                <span
                                                    key={l.id}
                                                    className="px-2 py-0.5 rounded-md text-xs bg-gray-50 border border-gray-200 text-gray-700"
                                                >
                                                    {l.language} ({l.proficiency})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Certifications
                                        </h3>
                                        <div className="space-y-1">
                                            {selectedCandidate.certifications.map((c) => (
                                                <div key={c.id} className="text-xs text-gray-700">
                                                    • <span className="font-semibold">{c.name}</span> ({c.issuingOrganization})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-warmwhite border-t border-gray-200 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setIsDetailOpen(false)}
                                className="px-4 py-2 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDetailOpen(false);
                                    handleOpenInvite(selectedCandidate);
                                }}
                                className="inline-flex items-center gap-1.5 bg-orange hover:bg-orange/90 text-white px-5 py-2.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
                            >
                                <LuSend className="w-3.5 h-3.5" />
                                Invite to Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite to Apply Modal */}
            {isInviteOpen && inviteCandidateTarget && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full overflow-hidden">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-warmwhite">
                            <div>
                                <h3 className="text-base font-bold text-charcoal">Invite Candidate</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Inviting <strong>{inviteCandidateTarget.fullName}</strong> to apply
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsInviteOpen(false)}
                                className="p-1 rounded-md text-gray-400 hover:text-charcoal hover:bg-gray-100 transition-colors"
                            >
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSendInvite} className="p-5 space-y-4">
                            {inviteError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                                    <LuCircleAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <span>{inviteError}</span>
                                </div>
                            )}

                            {inviteSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                                    <LuCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{inviteSuccess}</span>
                                </div>
                            )}

                            {/* Job Selection Dropdown */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-charcoal">
                                    Select Published Job <span className="text-red-500">*</span>
                                </label>
                                {publishedJobs.length === 0 ? (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                                        No published jobs found. Please post and publish a job first before inviting candidates.
                                    </div>
                                ) : (
                                    <select
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(Number(e.target.value))}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-xs sm:text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                    >
                                        <option value="">-- Choose a job --</option>
                                        {publishedJobs.map((job) => (
                                            <option key={job.id} value={job.id}>
                                                {job.title} {job.location ? `(${job.location})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Personal Note */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-charcoal">
                                    Personal Note (Optional, max 500 characters)
                                </label>
                                <textarea
                                    rows={3}
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    maxLength={500}
                                    placeholder="Hi! We noticed your profile and think your skills would be a great match for our role..."
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-xs sm:text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange transition"
                                />
                                <p className="text-[11px] text-gray-400 text-right">
                                    {inviteMessage.length}/500
                                </p>
                            </div>

                            <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 leading-relaxed">
                                • Candidate receives a notification to review and accept.<br />
                                • Upon candidate acceptance, contact details will be shared.<br />
                                • Rate limit: maximum 20 invitations per day.
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteOpen(false)}
                                    className="px-4 py-2 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteMutation.isPending || publishedJobs.length === 0}
                                    className="inline-flex items-center gap-1.5 bg-orange hover:bg-orange/90 disabled:opacity-50 text-white px-5 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
                                >
                                    {inviteMutation.isPending ? (
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <LuSend className="w-3.5 h-3.5" />
                                    )}
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
