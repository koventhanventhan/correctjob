'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MapPin, Briefcase, IndianRupee, Clock, Building, Bookmark, Share2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function JobDetailsPage() {
    const params = useParams();
    const id = params.id;
    const { user } = useAuthStore();
    const [isApplying, setIsApplying] = useState(false);
    const [applySuccess, setApplySuccess] = useState(false);

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
            const formData = new FormData();
            formData.append('JobId', id as string);
            // In a real scenario, you'd have a modal to attach cover letter/resume
            const res = await api.post('/applications', formData);
            return res.data;
        },
        onSuccess: () => {
            setApplySuccess(true);
            setIsApplying(false);
        },
        onError: (err) => {
            alert('Failed to apply. ' + (err as any).response?.data || '');
            setIsApplying(false);
        }
    });

    if (isLoading) return <div className="text-center py-20 text-gray-500">Loading job details...</div>;
    if (error || !job) return <div className="text-center py-20 text-red-500">Job not found.</div>;

    const isSeeker = user?.role === 'JobSeeker';

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                                {job.company?.logoUrl ? (
                                    <img src={job.company.logoUrl} alt={job.company.companyName} className="h-12 w-12 object-contain" />
                                ) : (
                                    <Building className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                                <div className="text-lg text-indigo-600 font-medium mt-1 hover:underline cursor-pointer">
                                    {job.company?.companyName}
                                </div>
                                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400" /> {job.location}</span>
                                    <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-gray-400" /> {job.jobType}</span>
                                    {job.salaryMin && (
                                        <span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4 text-gray-400" /> {job.salaryMin} - {job.salaryMax}</span>
                                    )}
                                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-gray-400" /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
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
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                                <Share2 className="h-4 w-4" /> Share
                            </button>
                            {isSeeker ? (
                                applySuccess ? (
                                    <button disabled className="bg-green-600 text-white px-6 py-2 rounded-md font-medium">
                                        Applied Successfully
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => { setIsApplying(true); applyMutation.mutate(); }}
                                        disabled={isApplying}
                                        className="bg-indigo-600 text-white px-8 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isApplying ? 'Applying...' : 'Apply Now'}
                                    </button>
                                )
                            ) : (
                                !user && (
                                    <Link href="/login" className="bg-indigo-600 text-white px-8 py-2 rounded-md font-medium hover:bg-indigo-700 text-center flex items-center justify-center">
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
                        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 prose max-w-none">
                            <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Job Description</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                            
                            {job.responsibilities && (
                                <>
                                    <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mt-8 mb-4">Responsibilities</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{job.responsibilities}</p>
                                </>
                            )}

                            {job.requirements && (
                                <>
                                    <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mt-8 mb-4">Requirements</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">About the Company</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                    <Building className="h-6 w-6 text-gray-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{job.company?.companyName}</div>
                                    <Link href={job.company?.website || '#'} className="text-sm text-indigo-600 hover:underline">View website</Link>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-4">
                                {job.company?.description || 'No description available for this company.'}
                            </p>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                                {job.company?.industry && <div className="flex justify-between"><span className="font-medium text-gray-900">Industry:</span> <span>{job.company.industry}</span></div>}
                                {job.company?.companySize && <div className="flex justify-between"><span className="font-medium text-gray-900">Size:</span> <span>{job.company.companySize}</span></div>}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
