'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LuBuilding, LuMapPin, LuGlobe, LuBriefcase, LuClock, LuStar, LuMessageSquare, LuSparkles } from 'react-icons/lu';
import { FaLinkedin, FaTwitter, FaFacebook } from 'react-icons/fa';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getFileUrl } from '@/utils/fileUrl';
import { formatSalary } from '@/utils/currency';

interface CompanyDetailClientProps {
    initialCompany?: any;
}

export default function CompanyDetailClient({ initialCompany }: CompanyDetailClientProps) {
    const params = useParams();
    const id = params?.id || initialCompany?.id;
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 5, headline: '', description: '' });
    const [reviewError, setReviewError] = useState('');

    const { data: company, isLoading: loadingCompany } = useQuery({
        queryKey: ['company', id],
        queryFn: async () => {
            const res = await api.get(`/companies/${id}`);
            return res.data;
        },
        initialData: initialCompany || undefined,
    });

    const { data: jobsData, isLoading: loadingJobs } = useQuery({
        queryKey: ['company-jobs', id, page],
        queryFn: async () => {
            const res = await api.get(`/jobs?companyId=${id}&page=${page}&pageSize=${pageSize}`);
            return res.data; 
        },
        enabled: !!id
    });

    const { data: reviewsData, isLoading: loadingReviews } = useQuery({
        queryKey: ['company-reviews', id],
        queryFn: async () => {
            const res = await api.get(`/companies/${id}/reviews`);
            return res.data;
        },
        enabled: !!id
    });

    const submitReviewMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/companies/${id}/reviews`, reviewData);
            return res.data;
        },
        onSuccess: () => {
            setShowReviewForm(false);
            setReviewError('');
            setReviewData({ rating: 5, headline: '', description: '' });
            queryClient.invalidateQueries({ queryKey: ['company-reviews', id] });
        },
        onError: (err: any) => {
            setReviewError(err.response?.data?.message || 'Failed to submit review. Ensure you have applied to this company first.');
        }
    });

    if (loadingCompany) return <div className="text-center py-20 text-gray-500">Loading company details...</div>;
    if (!company) return <div className="text-center py-20 text-red-500">Company not found.</div>;

    const jobs = jobsData?.data || [];
    const totalPages = jobsData?.totalPages || 1;
    const reviews = reviewsData?.data || [];

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <LuStar key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ));
    };

    return (
        <div className="min-h-screen bg-warmwhite py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 mb-6 relative overflow-hidden">
                    <div className="h-36 sm:h-44 absolute top-0 left-0 right-0 overflow-hidden bg-orange">
                        {company.bannerUrl && (
                            <img 
                                src={getFileUrl(company.bannerUrl)} 
                                alt="" 
                                role="presentation"
                                className="w-full h-full object-cover" 
                                width={1200}
                                height={300}
                            />
                        )}
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    <div className="relative mt-20 sm:mt-24 flex flex-col md:flex-row md:items-end gap-6">
                        <div className="h-28 w-28 sm:h-32 sm:w-32 bg-warmwhite rounded-xl p-2 shadow border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {company.logoUrl ? (
                                <img 
                                    src={getFileUrl(company.logoUrl)} 
                                    alt={`${company.companyName} logo`} 
                                    className="h-full w-full object-contain" 
                                    width={128}
                                    height={128}
                                />
                            ) : (
                                <LuBuilding className="h-16 w-16 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 pb-2 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal flex flex-wrap items-center gap-2 sm:gap-3 break-words">
                                    <span>{company.companyName}</span>
                                    {reviewsData?.averageRating > 0 && (
                                        <span className="flex items-center text-sm sm:text-lg bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200 text-yellow-700">
                                            <LuStar className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
                                            {reviewsData.averageRating.toFixed(1)}
                                        </span>
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                    <span className="flex items-center gap-1"><LuMapPin className="h-4 w-4 text-gray-400" /> {company.location || 'Location not specified'}</span>
                                    <span className="flex items-center gap-1"><LuBriefcase className="h-4 w-4 text-gray-400" /> {company.industry || 'Industry not specified'}</span>
                                    {company.website && (
                                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange hover:underline font-medium">
                                            <LuGlobe className="h-4 w-4" /> Website
                                        </a>
                                    )}
                                </div>
                                {(company.linkedinUrl || company.twitterUrl || company.facebookUrl) && (
                                    <div className="flex items-center gap-2 mt-2.5">
                                        {company.linkedinUrl && (
                                            <a 
                                                href={company.linkedinUrl.startsWith('http') ? company.linkedinUrl : `https://${company.linkedinUrl}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[#0A66C2] hover:opacity-80 p-1.5 rounded-full bg-blue-50 transition-opacity" 
                                                title="LinkedIn"
                                            >
                                                <FaLinkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                        {company.twitterUrl && (
                                            <a 
                                                href={company.twitterUrl.startsWith('http') ? company.twitterUrl : `https://${company.twitterUrl}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[#1DA1F2] hover:opacity-80 p-1.5 rounded-full bg-sky-50 transition-opacity" 
                                                title="Twitter / X"
                                            >
                                                <FaTwitter className="w-4 h-4" />
                                            </a>
                                        )}
                                        {company.facebookUrl && (
                                            <a 
                                                href={company.facebookUrl.startsWith('http') ? company.facebookUrl : `https://${company.facebookUrl}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[#1877F2] hover:opacity-80 p-1.5 rounded-full bg-blue-50 transition-opacity" 
                                                title="Facebook"
                                            >
                                                <FaFacebook className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {user?.role === 'JobSeeker' && !showReviewForm && (
                                <button 
                                    onClick={() => setShowReviewForm(true)}
                                    className="flex items-center gap-2 bg-warmwhite border border-peach text-charcoal hover:bg-peach px-4 py-2 rounded-md shadow-sm font-medium transition-colors"
                                >
                                    <LuMessageSquare className="w-4 h-4" />
                                    Write a Review
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Write Review Form */}
                        {showReviewForm && (
                            <div className="bg-warmwhite p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-display font-bold text-charcoal">Write a Company Review</h2>
                                    <button 
                                        onClick={() => setShowReviewForm(false)} 
                                        className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {reviewError && (
                                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
                                        {reviewError}
                                    </div>
                                )}

                                <form onSubmit={(e) => { e.preventDefault(); submitReviewMutation.mutate(); }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    type="button"
                                                    key={star}
                                                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                                                    className="focus:outline-none"
                                                >
                                                    <LuStar 
                                                        className={`h-6 w-6 ${star <= reviewData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                                    />
                                                </button>
                                            ))}
                                            <span className="text-sm font-medium text-gray-600 ml-2">{reviewData.rating} out of 5</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Summarize your experience (e.g., Great culture and growth)"
                                            value={reviewData.headline}
                                            onChange={(e) => setReviewData({ ...reviewData, headline: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-orange focus:border-orange bg-warmwhite text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                                        <textarea
                                            required
                                            rows={4}
                                            placeholder="What was your experience interviewing or working here?"
                                            value={reviewData.description}
                                            onChange={(e) => setReviewData({ ...reviewData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-orange focus:border-orange bg-warmwhite text-sm"
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={submitReviewMutation.isPending}
                                            className="bg-orange text-white px-5 py-2 rounded-md hover:bg-orange/90 font-medium text-sm transition-colors disabled:opacity-50"
                                        >
                                            {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-warmwhite p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-display font-bold text-charcoal border-b pb-2 mb-4">About {company.companyName}</h2>
                            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                                {company.description || 'No description provided by the company.'}
                            </div>
                        </div>

                        {company.benefits && (
                            <div className="bg-warmwhite p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-2 border-b pb-2 mb-4">
                                    <LuSparkles className="w-5 h-5 text-orange" />
                                    <h2 className="text-xl font-display font-bold text-charcoal">Benefits & Culture</h2>
                                </div>
                                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                                    {company.benefits}
                                </div>
                            </div>
                        )}

                        {/* Reviews Section */}
                        <div className="bg-warmwhite rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-warmwhite flex justify-between items-center">
                                <h2 className="text-lg font-display font-bold text-charcoal">Company Reviews</h2>
                                {reviewsData?.totalCount !== undefined && (
                                    <span className="text-gray-500 text-sm">{reviewsData.totalCount} {reviewsData.totalCount === 1 ? 'review' : 'reviews'}</span>
                                )}
                            </div>
                            
                            {loadingReviews ? (
                                <div className="p-8 text-center text-gray-500">Loading reviews...</div>
                            ) : reviews.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 bg-warmwhite">
                                    No reviews yet. {user?.role === 'JobSeeker' ? 'Be the first to share your experience!' : ''}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {reviews.map((review: any) => (
                                        <div key={review.id} className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {renderStars(review.rating)}
                                                    </div>
                                                    <h3 className="font-bold text-charcoal">{review.headline}</h3>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <p className="text-gray-700 mt-2 whitespace-pre-wrap">{review.description}</p>
                                            <p className="text-sm text-gray-500 mt-4">- {review.seekerName}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Jobs Section */}
                        <div className="bg-warmwhite rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-warmwhite flex justify-between items-center">
                                <h2 className="text-lg font-display font-bold text-charcoal">Open Positions</h2>
                                <span className="text-gray-500 text-sm">{jobsData?.totalCount || 0} active</span>
                            </div>
                            
                            {loadingJobs ? (
                                <div className="p-8 text-center text-gray-500">Loading open positions...</div>
                            ) : jobs.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No open positions currently.</div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {jobs.map((job: any) => (
                                        <div key={job.id} className="p-6 hover:bg-peach transition-colors">
                                            <h3 className="text-lg font-semibold text-charcoal hover:text-orange">
                                                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                                            </h3>
                                            <div className="mt-2 flex items-center flex-wrap gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><LuMapPin className="h-4 w-4" /> {job.location}</span>
                                                <span className="flex items-center gap-1"><LuBriefcase className="h-4 w-4" /> {job.jobType}</span>
                                                {job.salaryMin && (
                                                    <span className="font-medium text-charcoal">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                                                )}
                                                <span className="flex items-center gap-1"><LuClock className="h-4 w-4" /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="mt-4">
                                                <Link href={`/jobs/${job.id}`} className="text-orange font-medium hover:underline text-sm">
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-md ${page === i + 1 ? 'bg-orange text-charcoal' : 'bg-peach text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-warmwhite p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="font-display font-bold text-charcoal mb-4">Company Details</h2>
                            <dl className="space-y-4 text-sm">
                                <div>
                                    <dt className="text-gray-500 font-medium">Industry</dt>
                                    <dd className="text-charcoal mt-1">{company.industry || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 font-medium">Headquarters</dt>
                                    <dd className="text-charcoal mt-1">{company.location || 'N/A'}</dd>
                                </div>
                                {company.website && (
                                    <div>
                                        <dt className="text-gray-500 font-medium">Website</dt>
                                        <dd className="mt-1">
                                            <a 
                                                href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-orange hover:underline break-all"
                                            >
                                                {company.website}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
