'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
    LuMapPin, 
    LuBriefcase, 
    LuIndianRupee, 
    LuClock, 
    LuBuilding, 
    LuBookmark, 
    LuShare2, 
    LuX, 
    LuCheck,
    LuExternalLink,
    LuArrowRight,
    LuCircleHelp
} from 'react-icons/lu';
import { useState } from 'react';
import Link from 'next/link';

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;
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

    const { data: job, isLoading, error } = useQuery({
        queryKey: ['job', id],
        queryFn: async () => {
            const res = await api.get(`/jobs/${id}`);
            return res.data;
        }
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

    return (
        <div className="min-h-screen bg-warmwhite py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
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
                                    <span className="font-bold uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                                        {applicationCheck?.status || 'Submitted'}
                                    </span>
                                    {applicationCheck?.appliedAt && (
                                        <span className="ml-2">
                                            on {new Date(applicationCheck.appliedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <Link 
                            href="/seeker/applied-jobs" 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex-shrink-0"
                        >
                            View in My Applications <LuArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}

                {/* Header Card */}
                <div className="bg-warmwhite p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 bg-peach rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 shadow-inner">
                                {job.company?.logoUrl ? (
                                    <img src={job.company.logoUrl} alt={job.company.companyName} className="h-12 w-12 object-contain" />
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
                                        <span className="flex items-center gap-1.5 font-semibold text-charcoal">
                                            <LuIndianRupee className="h-4 w-4 text-gray-400" />
                                            {job.salaryMin.toLocaleString()} - {job.salaryMax ? job.salaryMax.toLocaleString() : 'Negotiable'}
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
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl shadow-sm text-sm font-semibold focus:outline-none transition-all ${
                                    isSaved 
                                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                                    : 'border-gray-300 text-gray-700 bg-warmwhite hover:bg-peach'
                                }`}
                            >
                                <LuBookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-amber-600' : ''}`} /> 
                                {isSaved ? 'Saved' : 'Save Job'}
                            </button>

                            <button 
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-warmwhite hover:bg-peach focus:outline-none transition-all"
                            >
                                {copied ? <LuCheck className="h-4 w-4 text-emerald-600" /> : <LuShare2 className="h-4 w-4" />}
                                {copied ? 'Link Copied!' : 'Share'}
                            </button>

                            {isSeeker ? (
                                isApplied ? (
                                    <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold shadow-sm text-sm">
                                        <LuCheck className="w-4 h-4" />
                                        Applied
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setApplyError('');
                                            setIsApplyModalOpen(true);
                                        }}
                                        className="bg-orange text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-orange/90 transition-all shadow-md active:scale-95"
                                    >
                                        Apply Now
                                    </button>
                                )
                            ) : (
                                !user && (
                                    <Link href="/login" className="bg-orange text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-orange/90 text-center flex items-center justify-center shadow-md">
                                        Sign in to Apply
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-warmwhite p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 prose max-w-none">
                            <h3 className="text-xl font-display font-bold text-charcoal border-b pb-2 mb-4">Job Description</h3>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                            
                            {job.responsibilities && (
                                <>
                                    <h3 className="text-xl font-display font-bold text-charcoal border-b pb-2 mt-8 mb-4">Key Responsibilities</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.responsibilities}</p>
                                </>
                            )}

                            {job.requirements && (
                                <>
                                    <h3 className="text-xl font-display font-bold text-charcoal border-b pb-2 mt-8 mb-4">Qualifications & Requirements</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
                                </>
                            )}

                            {job.skills && job.skills.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">Required Skills</h4>
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

                            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                        <LuCircleHelp className="w-4 h-4 text-orange" />
                                        Screening Questions ({job.screeningQuestions.length})
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        {job.screeningQuestions.map((q: any, i: number) => (
                                            <li key={q.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between gap-2">
                                                <span>{i + 1}. {q.questionText}</span>
                                                {q.isRequired && (
                                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase">Required</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-warmwhite p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-display font-bold text-charcoal mb-4">About the Company</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 bg-peach rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0">
                                    <LuBuilding className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-charcoal truncate">{job.company?.companyName}</div>
                                    {job.company?.website && (
                                        <a 
                                            href={job.company.website} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-xs text-orange hover:underline inline-flex items-center gap-1 font-medium"
                                        >
                                            Visit website <LuExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-4 leading-relaxed">
                                {job.company?.description || 'No company description provided.'}
                            </p>
                            
                            <div className="space-y-2 text-sm text-gray-600 pt-3 border-t border-gray-100">
                                {job.company?.industry && (
                                    <div className="flex justify-between">
                                        <span className="font-medium text-charcoal">Industry:</span>
                                        <span>{job.company.industry}</span>
                                    </div>
                                )}
                                {job.company?.companySize && (
                                    <div className="flex justify-between">
                                        <span className="font-medium text-charcoal">Company Size:</span>
                                        <span>{job.company.companySize}</span>
                                    </div>
                                )}
                                {job.company?.location && (
                                    <div className="flex justify-between">
                                        <span className="font-medium text-charcoal">Location:</span>
                                        <span>{job.company.location}</span>
                                    </div>
                                )}
                            </div>

                            {/* Company active jobs link */}
                            <div className="mt-5 pt-4 border-t border-gray-100">
                                <Link 
                                    href={`/jobs?keyword=${encodeURIComponent(job.company?.companyName || '')}`}
                                    className="w-full text-center block py-2.5 px-4 bg-peach hover:bg-orange hover:text-white text-charcoal rounded-xl text-xs font-semibold transition-all shadow-sm"
                                >
                                    View all active jobs at {job.company?.companyName || 'this company'} →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Similar Jobs Section */}
                {similarJobs && similarJobs.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-display font-bold text-charcoal">Similar Jobs You Might Like</h2>
                                <p className="text-sm text-gray-500">Explore related opportunities matching this role</p>
                            </div>
                            <Link 
                                href={`/jobs?category=${job.categoryId}`} 
                                className="text-sm text-orange hover:underline font-semibold inline-flex items-center gap-1"
                            >
                                Browse Category <LuArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {similarJobs.map((simJob: any) => (
                                <Link
                                    key={simJob.id}
                                    href={`/jobs/${simJob.id}`}
                                    className="p-5 bg-warmwhite rounded-2xl border border-gray-200 hover:border-orange hover:shadow-md transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-charcoal group-hover:text-orange transition-colors truncate text-base">
                                                    {simJob.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 font-medium truncate mt-0.5">
                                                    {simJob.company?.companyName}
                                                </p>
                                            </div>
                                            {simJob.company?.logoUrl && (
                                                <img 
                                                    src={simJob.company.logoUrl} 
                                                    alt={simJob.company.companyName} 
                                                    className="w-10 h-10 object-contain rounded-lg border border-gray-100 flex-shrink-0" 
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-500">
                                            {simJob.location && (
                                                <span className="flex items-center gap-1">
                                                    <LuMapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    {simJob.location}
                                                </span>
                                            )}
                                            {simJob.jobType && (
                                                <span className="flex items-center gap-1">
                                                    <LuBriefcase className="w-3.5 h-3.5 text-gray-400" />
                                                    {simJob.jobType}
                                                </span>
                                            )}
                                            {simJob.salaryMin && (
                                                <span className="flex items-center gap-1 font-semibold text-charcoal">
                                                    <LuIndianRupee className="w-3.5 h-3.5 text-gray-400" />
                                                    {simJob.salaryMin.toLocaleString()} - {simJob.salaryMax ? simJob.salaryMax.toLocaleString() : 'Negotiable'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                        <span className="text-gray-400">
                                            Posted {new Date(simJob.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-orange font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                            View Details →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Step 5: Advanced Apply Modal (Screening Questions + Multiple Resumes) */}
            {isApplyModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setIsApplyModalOpen(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <LuX className="w-5 h-5" />
                        </button>

                        <div className="mb-5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange/10 text-orange">
                                Direct Application
                            </span>
                            <h3 className="text-2xl font-bold text-charcoal mt-1">Apply for {job.title}</h3>
                            <p className="text-sm text-gray-500">{job.company?.companyName} • {job.location || 'Remote'}</p>
                        </div>

                        {applyError && (
                            <div className="mb-5 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
                                <p>{applyError}</p>
                                {applyError.toLowerCase().includes('profile') && (
                                    <Link href="/seeker/profile" className="text-orange font-semibold underline mt-1 inline-block">
                                        Go to My Profile to complete it →
                                    </Link>
                                )}
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyMutation.mutate();
                            }}
                            className="space-y-6"
                        >
                            {/* 1. Resume Selection (Multiple Resumes) */}
                            <div>
                                <label className="block text-sm font-bold text-charcoal mb-2">
                                    Select Resume <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        resumeSource === 'profile' ? 'border-orange bg-peach/40 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="resumeSource"
                                            checked={resumeSource === 'profile'}
                                            onChange={() => setResumeSource('profile')}
                                            className="text-orange focus:ring-orange"
                                        />
                                        <div className="text-xs">
                                            <p className="font-semibold text-charcoal">Use Default Profile Resume</p>
                                            <p className="text-gray-500">Your primary verified resume on your profile</p>
                                        </div>
                                    </label>

                                    {seekerResumes && seekerResumes.length > 0 && (
                                        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            resumeSource === 'saved' ? 'border-orange bg-peach/40 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="resumeSource"
                                                checked={resumeSource === 'saved'}
                                                onChange={() => {
                                                    setResumeSource('saved');
                                                    if (!selectedResumeId && seekerResumes.length > 0) {
                                                        setSelectedResumeId(seekerResumes[0].id);
                                                    }
                                                }}
                                                className="text-orange focus:ring-orange mt-1"
                                            />
                                            <div className="w-full text-xs">
                                                <p className="font-semibold text-charcoal">Choose from Saved Resumes ({seekerResumes.length})</p>
                                                {resumeSource === 'saved' && (
                                                    <select
                                                        value={selectedResumeId || ''}
                                                        onChange={(e) => setSelectedResumeId(parseInt(e.target.value, 10))}
                                                        className="mt-2 w-full p-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:border-orange"
                                                    >
                                                        {seekerResumes.map((r: any) => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.title} {r.isDefault ? '(Default)' : ''} — {new Date(r.uploadedAt).toLocaleDateString()}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </label>
                                    )}

                                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        resumeSource === 'upload' ? 'border-orange bg-peach/40 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="resumeSource"
                                            checked={resumeSource === 'upload'}
                                            onChange={() => setResumeSource('upload')}
                                            className="text-orange focus:ring-orange mt-1"
                                        />
                                        <div className="w-full text-xs">
                                            <p className="font-semibold text-charcoal">Upload Tailored Resume</p>
                                            <p className="text-gray-500 mb-2">Upload a specific CV for this role (.pdf, .doc, .docx)</p>
                                            {resumeSource === 'upload' && (
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:font-semibold file:bg-orange file:text-white hover:file:bg-orange/90 cursor-pointer"
                                                />
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* 2. Screening Questions (Employer Set) */}
                            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-bold text-charcoal mb-3 flex items-center justify-between">
                                        <span>Employer Screening Questions</span>
                                        <span className="text-xs font-normal text-gray-500">{job.screeningQuestions.length} Questions</span>
                                    </h4>
                                    <div className="space-y-4">
                                        {job.screeningQuestions.map((q: any, idx: number) => (
                                            <div key={q.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                                <label className="block text-xs font-bold text-charcoal mb-2">
                                                    {idx + 1}. {q.questionText} {q.isRequired && <span className="text-red-500">*</span>}
                                                </label>
                                                {q.questionType === 'YesNo' ? (
                                                    <div className="flex gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAnswerChange(q.id, 'Yes')}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                                answers[q.id] === 'Yes' 
                                                                    ? 'bg-orange text-white border-orange shadow-sm' 
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-peach'
                                                            }`}
                                                        >
                                                            Yes
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAnswerChange(q.id, 'No')}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                                answers[q.id] === 'No' 
                                                                    ? 'bg-orange text-white border-orange shadow-sm' 
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-peach'
                                                            }`}
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={answers[q.id] || ''}
                                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                        placeholder="Your answer..."
                                                        className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. Cover Letter */}
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-bold text-charcoal mb-1">
                                    Cover Letter <span className="text-xs font-normal text-gray-400">(Optional)</span>
                                </label>
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    rows={4}
                                    placeholder="Explain why your experience makes you a strong fit for this position..."
                                    className="w-full border border-gray-300 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-orange focus:border-orange outline-none"
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsApplyModalOpen(false)}
                                    className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applyMutation.isPending}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-orange text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-orange/90 disabled:opacity-50 transition-all shadow-md text-center active:scale-95"
                                >
                                    {applyMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
