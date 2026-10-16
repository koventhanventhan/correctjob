'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LuMapPin, LuBriefcase, LuIndianRupee, LuClock, LuBuilding, LuBookmark, LuShare2, LuX, LuCheck } from 'react-icons/lu';
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

    const isSaved = saveStatus?.isSaved || false;

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
        },
        onError: (err: any) => {
            const errorData = err.response?.data;
            const message = typeof errorData === 'string' 
                ? errorData 
                : errorData?.message || 'Failed to apply for this job.';
            setApplyError(message);
        }
    });

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) return <div className="text-center py-20 text-gray-500">Loading job details...</div>;
    if (error || !job) return <div className="text-center py-20 text-red-500">Job not found.</div>;

    const isSeeker = user?.role === 'JobSeeker';

    return (
        <div className="min-h-screen bg-warmwhite py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="bg-warmwhite p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 bg-peach rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                                {job.company?.logoUrl ? (
                                    <img src={job.company.logoUrl} alt={job.company.companyName} className="h-12 w-12 object-contain" />
                                ) : (
                                    <LuBuilding className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal break-words">{job.title}</h1>
                                <div className="text-lg text-orange font-medium mt-1 hover:underline cursor-pointer">
                                    {job.company?.companyName}
                                </div>
                                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5"><LuMapPin className="h-4 w-4 text-gray-400" /> {job.location}</span>
                                    <span className="flex items-center gap-1.5"><LuBriefcase className="h-4 w-4 text-gray-400" /> {job.jobType}</span>
                                    {job.salaryMin && (
                                        <span className="flex items-center gap-1.5"><LuIndianRupee className="h-4 w-4 text-gray-400" /> {job.salaryMin} - {job.salaryMax}</span>
                                    )}
                                    <span className="flex items-center gap-1.5"><LuClock className="h-4 w-4 text-gray-400" /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={() => {
                                    if (!isSeeker) return alert("Please sign in as a Job Seeker to save jobs.");
                                    toggleSaveMutation.mutate();
                                }}
                                disabled={toggleSaveMutation.isPending}
                                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none transition-colors ${
                                    isSaved 
                                    ? 'bg-peach border-peach text-charcoal hover:bg-peach' 
                                    : 'border-gray-300 text-gray-700 bg-warmwhite hover:bg-peach'
                                }`}
                            >
                                <LuBookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-orange' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button 
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-warmwhite hover:bg-peach focus:outline-none transition-colors"
                            >
                                {copied ? <LuCheck className="h-4 w-4 text-green-600" /> : <LuShare2 className="h-4 w-4" />}
                                {copied ? 'Link Copied!' : 'Share'}
                            </button>
                            {isSeeker ? (
                                applySuccess ? (
                                    <button disabled className="bg-green-600 text-white px-6 py-2 rounded-md font-medium cursor-default">
                                        Applied Successfully
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setApplyError('');
                                            setIsApplyModalOpen(true);
                                        }}
                                        className="bg-orange text-white px-8 py-2 rounded-md font-medium hover:bg-orange/90 transition-colors shadow-sm"
                                    >
                                        Apply Now
                                    </button>
                                )
                            ) : (
                                !user && (
                                    <Link href="/login" className="bg-orange text-white px-8 py-2 rounded-md font-medium hover:bg-orange/90 text-center flex items-center justify-center">
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
                        <div className="bg-warmwhite p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 prose max-w-none">
                            <h3 className="text-xl font-display font-bold text-charcoal border-b pb-2 mb-4">Job Description</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                            
                            {job.responsibilities && (
                                <>
                                    <h3 className="text-xl font-display font-bold text-charcoal border-b pb-2 mt-8 mb-4">Responsibilities</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{job.responsibilities}</p>
                                </>
                            )}

                            {job.requirements && (
                                <>
                                    <h3 className="text-xl font-display font-bold text-charcoal border-b pb-2 mt-8 mb-4">Requirements</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-warmwhite p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-display font-bold text-charcoal mb-4">About the Company</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 bg-peach rounded border border-gray-200 flex items-center justify-center">
                                    <LuBuilding className="h-6 w-6 text-gray-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-charcoal">{job.company?.companyName}</div>
                                    <Link href={job.company?.website || '#'} className="text-sm text-orange hover:underline">View website</Link>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-4">
                                {job.company?.description || 'No description available for this company.'}
                            </p>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                                {job.company?.industry && <div className="flex justify-between"><span className="font-medium text-charcoal">Industry:</span> <span>{job.company.industry}</span></div>}
                                {job.company?.companySize && <div className="flex justify-between"><span className="font-medium text-charcoal">Size:</span> <span>{job.company.companySize}</span></div>}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Apply Modal */}
            {isApplyModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
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
                            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
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
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange focus:border-orange"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Attach Custom Resume <span className="text-xs text-gray-400">(Optional)</span>
                                </label>
                                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center bg-warmwhite/50">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                        className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-orange file:text-white hover:file:bg-orange/90 cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {resumeFile ? `Selected: ${resumeFile.name}` : 'If not provided, your profile resume will be used.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsApplyModalOpen(false)}
                                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applyMutation.isPending}
                                    className="w-full sm:w-auto px-5 py-2 bg-orange text-white rounded-lg text-sm font-medium hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-sm text-center"
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
