'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
    LuMapPin, 
    LuBriefcase, 
    LuClock, 
    LuBuilding, 
    LuBookmark, 
    LuShare2, 
    LuX, 
    LuCheck,
    LuExternalLink,
    LuArrowRight,
    LuCircleHelp,
    LuTriangleAlert
} from 'react-icons/lu';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFileUrl } from '@/utils/fileUrl';
import { formatSalary } from '@/utils/currency';

interface JobDetailClientProps {
    initialJob?: any;
}

export default function JobDetailClient({ initialJob }: JobDetailClientProps) {
    const params = useParams();
    const router = useRouter();
    const id = params?.id || initialJob?.id;
    const { user } = useAuthStore();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeSource, setResumeSource] = useState<'profile' | 'saved' | 'upload'>('profile');
    const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState(false);
    const [copied, setCopied] = useState(false);

    // Track job view strictly in browser on mount
    useEffect(() => {
        if (id) {
            api.post(`/jobs/${id}/view`).catch(() => {
                // Silently handle tracking errors
            });
        }
    }, [id]);

    const { data: job, isLoading, error } = useQuery({
        queryKey: ['job', id],
        queryFn: async () => {
            const res = await api.get(`/jobs/${id}`);
            return res.data;
        },
        initialData: initialJob || undefined,
    });

    const { data: saveStatus, refetch: refetchSaveStatus } = useQuery({
        queryKey: ['job-saved-status', id],
        queryFn: async () => {
            if (user?.role !== 'JobSeeker') return { isSaved: false };
            const res = await api.get(`/savedjobs/check/${id}`);
            return res.data;
        },
        enabled: !!user && user.role === 'JobSeeker'
    });

    const { data: applicationCheck, refetch: refetchApplicationCheck } = useQuery({
        queryKey: ['job-application-check', id],
        queryFn: async () => {
            if (user?.role !== 'JobSeeker') return { isApplied: false };
            const res = await api.get(`/applications/check/${id}`);
            return res.data;
        },
        enabled: !!user && user.role === 'JobSeeker'
    });

    const { data: seekerResumes } = useQuery({
        queryKey: ['seeker-resumes'],
        queryFn: async () => {
            if (user?.role !== 'JobSeeker') return [];
            const res = await api.get('/seekerprofiles/resumes');
            return res.data;
        },
        enabled: !!user && user.role === 'JobSeeker'
    });

    const { data: similarJobs } = useQuery({
        queryKey: ['similar-jobs', id],
        queryFn: async () => {
            const res = await api.get(`/jobs/${id}/similar`);
            return res.data;
        },
        enabled: !!id
    });

    const isSaved = saveStatus?.isSaved || false;
    const isApplied = applySuccess || applicationCheck?.isApplied;

    const toggleSaveMutation = useMutation({
        mutationFn: async () => {
            if (isSaved) {
                await api.delete(`/savedjobs/${id}`);
            } else {
                await api.post(`/savedjobs/${id}`);
            }
        },
        onSuccess: () => {
            refetchSaveStatus();
        }
    });

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const applyMutation = useMutation({
        mutationFn: async () => {
            setApplyError('');

            // Validate mandatory screening questions
            if (job.screeningQuestions && job.screeningQuestions.length > 0) {
                for (const q of job.screeningQuestions) {
                    if (q.isRequired && (!answers[q.id] || !answers[q.id].trim())) {
                        throw new Error(`Please answer the required question: "${q.questionText}"`);
                    }
                }
            }

            const formData = new FormData();
            formData.append('JobId', id as string);
            if (coverLetter.trim()) {
                formData.append('CoverLetter', coverLetter.trim());
            }

            if (resumeSource === 'saved' && selectedResumeId) {
                formData.append('SelectedResumeId', selectedResumeId.toString());
            } else if (resumeSource === 'upload' && resumeFile) {
                formData.append('ResumeFile', resumeFile);
            }

            // Answers JSON
            const answersList = Object.entries(answers).map(([qId, val]) => ({
                questionId: parseInt(qId, 10),
                answerText: val
            }));
            if (answersList.length > 0) {
                formData.append('AnswersJson', JSON.stringify(answersList));
            }

            const res = await api.post('/applications', formData);
            return res.data;
        },
        onSuccess: () => {
            setApplySuccess(true);
            setIsApplyModalOpen(false);
            refetchApplicationCheck();
            router.push(`/seeker/applied-success?jobId=${id}&jobTitle=${encodeURIComponent(job.title)}&companyName=${encodeURIComponent(job.company?.companyName || '')}`);
        },
        onError: (err: any) => {
            const errorMsg = err.message || err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : 'Failed to apply for this job.');
            setApplyError(errorMsg);
        }
    });

    const handleShare = async () => {
        if (typeof window !== 'undefined') {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${job?.title || 'Job'} at ${job?.company?.companyName || 'HireConnect'}`,
                        text: `Check out this job opportunity for ${job?.title} on HireConnect!`,
                        url: window.location.href,
                    });
                    return;
                } catch {
                    // Fall back to clipboard if user dismissed dialog
                }
            }
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // Clipboard fallback
            }
        }
    };

    if (isLoading) return <div className="text-center py-20 text-gray-500 font-medium">Loading job details...</div>;
    if (error || !job) return <div className="text-center py-20 text-red-500 font-medium">Job not found.</div>;

    const isSeeker = user?.role === 'JobSeeker';

    const isClosedOrExpired = 
        job.status === 'Closed' || 
        job.status === 'Expired' || 
        job.status === 'Rejected' || 
        job.isExpired === true ||
        (job.deadline && new Date(job.deadline) < new Date());

    return (
        <div className="min-h-screen bg-warmwhite py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Closed / Expired Alert Banner */}
                {isClosedOrExpired && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-4 shadow-sm text-amber-900">
                        <div className="flex items-center gap-3">
                            <LuTriangleAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
                            <div>
                                <h2 className="text-sm font-bold text-amber-950">This job is no longer available</h2>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    The application deadline has passed or this position has been closed by the employer.
                                </p>
                            </div>
                        </div>
                        <Link 
                            href="/jobs"
                            className="text-xs font-semibold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition shrink-0"
                        >
                            Browse Open Jobs
                        </Link>
                    </div>
                )}

                {/* Applied Status Alert Banner */}
                {isApplied && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                <LuCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-900">
                                    You have already applied for this position!
                                </p>
                                <p className="text-xs text-emerald-700">
                                    Current application status:{' '}
                                    <span className="font-bold underline uppercase">
                                        {applicationCheck?.status || 'Submitted'}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/seeker/applications"
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 self-end sm:self-auto"
                        >
                            <span>View My Applications</span>
                            <LuArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}

                {/* Header Card */}
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 bg-peach/40 rounded-md flex items-center justify-center flex-shrink-0 border border-gray-200">
                                {job.company?.logoUrl ? (
                                    <img 
                                        src={getFileUrl(job.company.logoUrl)} 
                                        alt={`${job.company?.companyName || 'Company'} logo`} 
                                        className="h-12 w-12 object-contain" 
                                        width={48}
                                        height={48}
                                    />
                                ) : (
                                    <LuBuilding className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal break-words">{job.title}</h1>
                                <div className="mt-1">
                                    <Link 
                                        href={`/jobs?keyword=${encodeURIComponent(job.company?.companyName || '')}`}
                                        className="text-lg text-orange font-semibold hover:underline inline-flex items-center gap-1"
                                        title={`View all jobs from ${job.company?.companyName}`}
                                    >
                                        {job.company?.companyName}
                                    </Link>
                                </div>
                                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5"><LuMapPin className="h-4 w-4 text-gray-400" /> {job.location || 'Remote'}</span>
                                    <span className="flex items-center gap-1.5"><LuBriefcase className="h-4 w-4 text-gray-400" /> {job.jobType}</span>
                                    {job.salaryMin && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-semibold text-charcoal bg-gray-100 text-xs sm:text-sm">
                                            {formatSalary(job.salaryMin, job.salaryMax)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5"><LuClock className="h-4 w-4 text-gray-400" /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                            <button 
                                onClick={() => {
                                    if (!isSeeker) return alert("Please sign in as a Job Seeker to save jobs.");
                                    toggleSaveMutation.mutate();
                                }}
                                disabled={toggleSaveMutation.isPending}
                                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-md shadow-xs text-sm font-semibold focus:outline-none transition-colors cursor-pointer min-h-[40px] ${
                                    isSaved 
                                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <LuBookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-amber-600' : ''}`} /> 
                                <span>{isSaved ? 'Saved' : 'Save'}</span>
                            </button>
                            
                            <button 
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-xs text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer min-h-[40px]"
                            >
                                <LuShare2 className="h-4 w-4 text-gray-500" /> 
                                <span>{copied ? 'Link Copied!' : 'Share'}</span>
                            </button>

                            {isSeeker ? (
                                isClosedOrExpired ? (
                                    <button 
                                        disabled
                                        className="bg-gray-300 text-gray-500 cursor-not-allowed px-7 py-2 rounded-md font-semibold text-center flex items-center justify-center shadow-xs min-h-[40px]"
                                    >
                                        {job.status === 'Closed' ? 'Closed' : 'Expired'}
                                    </button>
                                ) : isApplied ? (
                                    <button 
                                        disabled
                                        className="bg-emerald-600 text-white cursor-default px-7 py-2 rounded-md font-semibold text-center flex items-center justify-center gap-2 shadow-xs min-h-[40px]"
                                    >
                                        <LuCheck className="w-4 h-4" /> Applied
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsApplyModalOpen(true)}
                                        className="bg-orange text-white px-7 py-2 rounded-md font-semibold hover:bg-orange/90 text-center flex items-center justify-center shadow-xs transition-colors cursor-pointer min-h-[40px]"
                                    >
                                        Apply Now
                                    </button>
                                )
                            ) : (
                                !user && (
                                    isClosedOrExpired ? (
                                        <button 
                                            disabled
                                            className="bg-gray-300 text-gray-500 cursor-not-allowed px-7 py-2 rounded-md font-semibold text-center flex items-center justify-center shadow-xs min-h-[40px]"
                                        >
                                            {job.status === 'Closed' ? 'Closed' : 'Expired'}
                                        </button>
                                    ) : (
                                        <Link href="/login" className="bg-orange text-white px-7 py-2 rounded-md font-semibold hover:bg-orange/90 text-center flex items-center justify-center shadow-xs min-h-[40px]">
                                            Sign in to Apply
                                        </Link>
                                    )
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-warmwhite p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 prose max-w-none">
                            <h2 className="text-xl font-display font-bold text-charcoal border-b pb-2 mb-4">Job Description</h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                            
                            {job.responsibilities && (
                                <>
                                    <h2 className="text-xl font-display font-bold text-charcoal border-b pb-2 mt-8 mb-4">Key Responsibilities</h2>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.responsibilities}</p>
                                </>
                            )}

                            {job.requirements && (
                                <>
                                    <h2 className="text-xl font-display font-bold text-charcoal border-b pb-2 mt-8 mb-4">Qualifications & Requirements</h2>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
                                </>
                            )}

                            {job.skills && job.skills.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">Required Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.skills.map((skill: string, index: number) => (
                                            <span 
                                                key={index} 
                                                className="px-3 py-1 bg-peach text-charcoal text-xs font-semibold rounded-lg border border-gray-200"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-warmwhite p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-charcoal mb-4">About the Company</h2>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</span>
                                    <p className="text-charcoal font-medium mt-0.5">{job.company?.companyName || 'Not specified'}</p>
                                </div>
                                {job.company?.industry && (
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</span>
                                        <p className="text-charcoal font-medium mt-0.5">{job.company.industry}</p>
                                    </div>
                                )}
                                {(job.company?.website || job.company?.websiteUrl) && (
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</span>
                                        <p className="mt-0.5">
                                            <a 
                                                href={job.company.website || job.company.websiteUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-orange hover:underline text-sm inline-flex items-center gap-1 font-medium"
                                            >
                                                Visit website <LuExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </p>
                                    </div>
                                )}
                                {job.company?.id && (
                                    <div className="pt-2">
                                        <Link 
                                            href={`/companies/${job.company.id}`}
                                            className="text-orange font-semibold text-xs hover:underline flex items-center gap-1"
                                        >
                                            View Full Company Profile →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Similar Jobs */}
                        {similarJobs && similarJobs.length > 0 && (
                            <div className="bg-warmwhite p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h2 className="text-lg font-bold text-charcoal mb-4">Similar Opportunities</h2>
                                <div className="space-y-4">
                                    {similarJobs.slice(0, 3).map((simJob: any) => (
                                        <div key={simJob.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                                            <Link href={`/jobs/${simJob.id}`} className="block group">
                                                <h3 className="font-semibold text-sm text-charcoal group-hover:text-orange transition-colors">
                                                    {simJob.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{simJob.company?.companyName}</p>
                                                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                                                    <span>{simJob.location}</span>
                                                    <span>•</span>
                                                    <span>{simJob.jobType}</span>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Apply Modal */}
                {isApplyModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-xl border border-gray-100">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-charcoal">Apply for {job.title}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{job.company?.companyName}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsApplyModalOpen(false)}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                >
                                    <LuX className="w-5 h-5" />
                                </button>
                            </div>

                            {applyError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                                    {applyError}
                                </div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); applyMutation.mutate(); }} className="space-y-5">
                                {/* Resume Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Resume / CV</label>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setResumeSource('profile')}
                                            className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition ${
                                                resumeSource === 'profile'
                                                    ? 'border-orange bg-orange/10 text-orange'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Profile CV
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setResumeSource('saved')}
                                            className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition ${
                                                resumeSource === 'saved'
                                                    ? 'border-orange bg-orange/10 text-orange'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Saved CV
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setResumeSource('upload')}
                                            className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition ${
                                                resumeSource === 'upload'
                                                    ? 'border-orange bg-orange/10 text-orange'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Upload New
                                        </button>
                                    </div>

                                    {resumeSource === 'saved' && (
                                        <select
                                            value={selectedResumeId || ''}
                                            onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                            required
                                        >
                                            <option value="">Select a saved resume...</option>
                                            {seekerResumes?.map((res: any) => (
                                                <option key={res.id} value={res.id}>
                                                    {res.fileName} (Uploaded {new Date(res.createdAt).toLocaleDateString()})
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {resumeSource === 'upload' && (
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                            className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange/10 file:text-orange hover:file:bg-orange/20 cursor-pointer"
                                            required
                                        />
                                    )}
                                </div>

                                {/* Cover Letter */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Cover Letter (Optional)
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        placeholder="Explain why you are the ideal candidate for this role..."
                                        className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none resize-none"
                                    />
                                </div>

                                {/* Screening Questions */}
                                {job.screeningQuestions && job.screeningQuestions.length > 0 && (
                                    <div className="space-y-4 pt-3 border-t border-gray-100">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                                            <LuCircleHelp className="w-4 h-4 text-orange" />
                                            <span>Employer Screening Questions</span>
                                        </h4>
                                        {job.screeningQuestions.map((q: any) => (
                                            <div key={q.id}>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                    {q.questionText} {q.isRequired && <span className="text-red-500">*</span>}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={answers[q.id] || ''}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    required={q.isRequired}
                                                    placeholder="Your answer"
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsApplyModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={applyMutation.isPending}
                                        className="px-5 py-2 bg-orange text-white rounded-xl text-xs font-semibold hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                        {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
