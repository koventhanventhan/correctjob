'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { MapPin, Briefcase, Search, Filter, Bell } from 'lucide-react';
import { useState, useCallback, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function JobsContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('keyword') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') || '');
    const [maxSalary, setMaxSalary] = useState(searchParams.get('maxSalary') || '');
    const [experience, setExperience] = useState(searchParams.get('experience') || '');
    const [jobType, setJobType] = useState(searchParams.get('jobType') || '');

    const { user } = useAuthStore();
    const [alertMsg, setAlertMsg] = useState('');

    const createQueryString = useCallback(
        (params: Record<string, string>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            Object.entries(params).forEach(([k, v]) => {
                if (v) newSearchParams.set(k, v);
                else newSearchParams.delete(k);
            });
            return newSearchParams.toString();
        },
        [searchParams]
    );

    const applyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.push(pathname + '?' + createQueryString({
            keyword: searchTerm,
            location,
            category,
            minSalary,
            maxSalary,
            experience,
            jobType
        }));
    };

    // Apply filters when checkboxes change
    useEffect(() => {
        if (jobType !== (searchParams.get('jobType') || '')) {
            applyFilters();
        }
    }, [jobType]);

    const currentKeyword = searchParams.get('keyword') || '';
    const currentLocation = searchParams.get('location') || '';
    const currentCategory = searchParams.get('category') || '';
    const currentJobType = searchParams.get('jobType') || '';
    const currentMinSalary = searchParams.get('minSalary') || '';
    const currentMaxSalary = searchParams.get('maxSalary') || '';
    const currentExperience = searchParams.get('experience') || '';

    const { data, isLoading } = useQuery({
        queryKey: ['jobs', currentKeyword, currentLocation, currentCategory, currentJobType, currentMinSalary, currentMaxSalary, currentExperience],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (currentKeyword) params.append('keyword', currentKeyword);
            if (currentLocation) params.append('location', currentLocation);
            if (currentCategory) params.append('category', currentCategory);
            if (currentJobType) params.append('jobType', currentJobType);
            if (currentMinSalary) params.append('minSalary', currentMinSalary);
            if (currentMaxSalary) params.append('maxSalary', currentMaxSalary);
            if (currentExperience) params.append('experience', currentExperience);
            
            const res = await api.get(`/jobs?${params.toString()}`);
            return res.data;
        }
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data;
        }
    });

    const createAlertMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/jobalerts', { 
                keyword: currentKeyword,
                location: currentLocation || undefined,
                categoryId: currentCategory ? parseInt(currentCategory) : undefined,
                jobType: currentJobType || undefined
            });
            return res.data;
        },
        onSuccess: () => {
            setAlertMsg('Alert created!');
            setTimeout(() => setAlertMsg(''), 3000);
        },
        onError: () => {
            setAlertMsg('Failed to create alert.');
            setTimeout(() => setAlertMsg(''), 3000);
        }
    });

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const hasAnyFilter = currentKeyword || currentLocation || currentCategory || currentJobType || currentMinSalary || currentMaxSalary || currentExperience;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
                    
                    <form onSubmit={applyFilters} className="flex w-full md:w-auto gap-2">
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
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 whitespace-nowrap">
                            Search
                        </button>
                    </form>
                </div>

                {user?.role === 'JobSeeker' && hasAnyFilter && (
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 p-4 rounded-md border border-indigo-100 gap-4">
                        <div className="flex items-center text-indigo-800">
                            <Bell className="w-5 h-5 mr-2 text-indigo-600" />
                            <span>
                                Get notified when new jobs match 
                                {currentKeyword && <strong> "{currentKeyword}"</strong>}
                                {currentLocation && <span> in <strong>{currentLocation}</strong></span>}
                                {currentJobType && <span> for <strong>{currentJobType}</strong></span>}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {alertMsg && <span className="text-sm font-medium text-indigo-600">{alertMsg}</span>}
                            <button
                                onClick={() => createAlertMutation.mutate()}
                                disabled={createAlertMutation.isPending || !currentKeyword}
                                title={!currentKeyword ? "Keyword is required for job alerts" : ""}
                                className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-md hover:bg-indigo-50 font-medium text-sm disabled:opacity-50 whitespace-nowrap"
                            >
                                {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div 
                                className="flex items-center justify-between mb-4 lg:mb-4 cursor-pointer lg:cursor-default" 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                            >
                                <div className="flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-gray-500" />
                                    <h2 className="font-semibold text-gray-900">Filters</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="lg:hidden text-sm text-gray-500">{isFilterOpen ? 'Hide' : 'Show'}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); applyFilters(e as any); }} className="hidden lg:block text-sm text-indigo-600 font-medium hover:underline">Apply</button>
                                </div>
                            </div>
                            
                            <form onSubmit={applyFilters} className={`space-y-6 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                                    <input 
                                        type="text" 
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="City, state, or remote"
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Category</h3>
                                    <select 
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    >
                                        <option value="">All Categories</option>
                                        {categories?.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Job Type</h3>
                                    <div className="space-y-2">
                                        {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'].map((type) => (
                                            <label key={type} className="flex items-center">
                                                <input 
                                                    type="radio" 
                                                    name="jobType"
                                                    checked={jobType === type}
                                                    onChange={() => setJobType(type)}
                                                    className="border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" 
                                                />
                                                <span className="ml-2 text-sm text-gray-600">{type}</span>
                                            </label>
                                        ))}
                                        {jobType && (
                                            <button 
                                                type="button" 
                                                onClick={() => setJobType('')} 
                                                className="text-xs text-red-500 hover:underline mt-1 block"
                                            >
                                                Clear Job Type
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Experience (Years)</h3>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={experience}
                                        onChange={(e) => setExperience(e.target.value)}
                                        placeholder="e.g. 2"
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Salary Range</h3>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            value={minSalary}
                                            onChange={(e) => setMinSalary(e.target.value)}
                                            placeholder="Min"
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input 
                                            type="number" 
                                            value={maxSalary}
                                            onChange={(e) => setMaxSalary(e.target.value)}
                                            placeholder="Max"
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                            </form>
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
                                <button 
                                    onClick={() => router.push(pathname)} 
                                    className="mt-4 text-indigo-600 hover:underline font-medium"
                                >
                                    Clear all filters
                                </button>
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

export default function JobsPage() {
    return (
        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
            <JobsContent />
        </Suspense>
    );
}
