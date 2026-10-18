'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { useParams } from 'next/navigation';
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
    LuArrowRight
} from 'react-icons/lu';
import { useState } from 'react';
import Link from 'next/link';

export default function JobDetailsPage() {
    const params = useParams();
    const id = params.id;
    const { user } = useAuthStore();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
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

    const applyMutation = useMutation({
        mutationFn: async () => {
            setApplyError('');
            const formData = new FormData();
            formData.append('JobId', id as string);
            if (coverLetter.trim()) {
                formData.append('CoverLetter', coverLetter.trim());
            }
            if (resumeFile) {
                formData.append('ResumeFile', resumeFile);
            }
            const res = await api.post('/applications', formData);
            return res.data;
        },
        onSuccess: () => {
            setApplySuccess(true);
            setIsApplyModalOpen(false);
            refetchApplicationCheck();
        },
        onError: (err: any) => {
            const errorData = err.response?.data;
            const message = typeof errorData === 'string' 
                ? errorData 
                : errorData?.message || 'Failed to apply for this job.';
            setApplyError(message);
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
                    // Fall back to clipboard if user dismissed or cancelled share dialog
                }
            }
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // Clipboard copy fallback
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

                            {/* Seek.com feature: Company active jobs link */}
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

            {/* Apply Modal */}
            {isApplyModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                        <button
                            type="button"
                            onClick={() => setIsApplyModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <LuX className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-charcoal mb-1">Apply for {job.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{job.company?.companyName}</p>

                        {applyError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
                                <p className="font-medium">{applyError}</p>
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
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cover Letter <span className="text-xs text-gray-400">(Optional)</span>
                                </label>
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    rows={4}
                                    placeholder="Explain why you're a strong fit for this position..."
                                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange focus:border-orange outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Attach Custom Resume <span className="text-xs text-gray-400">(Optional)</span>
                                </label>
                                <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center bg-warmwhite/50">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                        className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange file:text-white hover:file:bg-orange/90 cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {resumeFile ? `Selected: ${resumeFile.name}` : 'If not provided, your default profile resume will be used.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsApplyModalOpen(false)}
                                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applyMutation.isPending}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-orange text-white rounded-xl text-sm font-semibold hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-md text-center"
                                >
                                    {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
