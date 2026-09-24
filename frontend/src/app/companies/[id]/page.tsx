'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building, MapPin, Globe, Briefcase, IndianRupee, Clock } from 'lucide-react';
import { useState } from 'react';

export default function CompanyDetailsPage() {
    const params = useParams();
    const id = params.id;
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const { data: company, isLoading: loadingCompany } = useQuery({
        queryKey: ['company', id],
        queryFn: async () => {
            const res = await api.get(`/companies/${id}`);
            return res.data;
        }
    });

    const { data: jobsData, isLoading: loadingJobs } = useQuery({
        queryKey: ['company-jobs', id, page],
        queryFn: async () => {
            const res = await api.get(`/jobs?companyId=${id}&page=${page}&pageSize=${pageSize}`);
            return res.data; // { data, totalCount, totalPages }
        },
        enabled: !!id
    });

    if (loadingCompany) return <div className="text-center py-20 text-gray-500">Loading company details...</div>;
    if (!company) return <div className="text-center py-20 text-red-500">Company not found.</div>;

    const jobs = jobsData?.data || [];
    const totalPages = jobsData?.totalPages || 1;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 mb-6 relative overflow-hidden">
                    <div className="h-32 bg-indigo-600 absolute top-0 left-0 right-0"></div>
                    <div className="relative mt-16 flex flex-col md:flex-row md:items-end gap-6">
                        <div className="h-32 w-32 bg-white rounded-lg p-2 shadow border border-gray-200 flex items-center justify-center shrink-0">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.companyName} className="h-full w-full object-contain" />
                            ) : (
                                <Building className="h-16 w-16 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 pb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{company.companyName}</h1>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" /> {company.location || 'Location not specified'}</span>
                                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-gray-400" /> {company.industry || 'Industry not specified'}</span>
                                {company.website && (
                                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline">
                                        <Globe className="h-4 w-4" /> Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">About {company.companyName}</h2>
                            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                                {company.description || 'No description provided by the company.'}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">Open Positions</h2>
                                {jobsData?.totalCount && <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{jobsData.totalCount} Jobs</span>}
                            </div>
                            
                            {loadingJobs ? (
                                <div className="p-8 text-center text-gray-500">Loading jobs...</div>
                            ) : jobs.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No open positions currently.</div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {jobs.map((job: any) => (
                                        <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                                                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                                            </h3>
                                            <div className="mt-2 flex items-center flex-wrap gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                                                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.jobType}</span>
                                                {job.salaryMin && (
                                                    <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4" /> {job.salaryMin} - {job.salaryMax}</span>
                                                )}
                                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="mt-4">
                                                <Link href={`/jobs/${job.id}`} className="text-indigo-600 font-medium hover:underline text-sm">
                                                    View Details →
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-md ${page === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">Company Details</h3>
                            <dl className="space-y-4 text-sm">
                                <div>
                                    <dt className="text-gray-500 font-medium">Industry</dt>
                                    <dd className="text-gray-900 mt-1">{company.industry || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 font-medium">Company Size</dt>
                                    <dd className="text-gray-900 mt-1">{company.companySize || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 font-medium">Headquarters</dt>
                                    <dd className="text-gray-900 mt-1">{company.location || 'N/A'}</dd>
                                </div>
                                {company.website && (
                                    <div>
                                        <dt className="text-gray-500 font-medium">Website</dt>
                                        <dd className="mt-1">
                                            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
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
