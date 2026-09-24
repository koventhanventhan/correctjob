'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { MapPin, Briefcase, Search, Filter } from 'lucide-react';
import { useState } from 'react';

export default function JobsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [query, setQuery] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['jobs', query],
        queryFn: async () => {
            const res = await api.get(`/jobs?keyword=${query}`);
            return res.data;
        }
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQuery(searchTerm);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
                    
                    <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by job title or keyword..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                            Search
                        </button>
                    </form>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="h-5 w-5 text-gray-500" />
                                <h2 className="font-semibold text-gray-900">Filters</h2>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Job Type</h3>
                                    <div className="space-y-2">
                                        {['Full-Time', 'Part-Time', 'Contract', 'Remote'].map((type) => (
                                            <label key={type} className="flex items-center">
                                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                                                <span className="ml-2 text-sm text-gray-600">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Job List */}
                    <div className="flex-1 space-y-4">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-500">Loading jobs...</div>
                        ) : data?.data?.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                                <p className="text-gray-500 mt-1">Try adjusting your search filters.</p>
                            </div>
                        ) : (
                            data?.data?.map((job: any) => (
                                <div key={job.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 hover:text-indigo-600">
                                                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                                            </h2>
                                            <p className="text-gray-600 mt-1">{job.company?.companyName}</p>
                                            
                                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" /> {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="h-4 w-4" /> {job.jobType}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {job.salaryMin && job.salaryMax && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    ₹{job.salaryMin} - ₹{job.salaryMax}
                                                </span>
                                            )}
                                            <Link href={`/jobs/${job.id}`} className="mt-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded text-sm font-medium transition-colors">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
