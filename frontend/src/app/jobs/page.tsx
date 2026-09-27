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
        <div className="min-h-screen bg-warmwhite py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-end justify-between">
                    <h1 className="text-4xl font-display font-bold text-charcoal">Find Jobs</h1>
                </div>

                {/* Sticky Command Center */}
                <div className="sticky top-16 z-40 bg-warmwhite py-4 mb-8 border-b border-gray-200">
                    <div className="flex justify-between lg:hidden mb-4">
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="w-full bg-peach text-charcoal font-bold py-3 rounded-md flex items-center justify-center gap-2 border border-transparent hover:border-orange transition-colors"
                        >
                            <Filter className="h-5 w-5" />
                            {isFilterOpen ? 'Hide Filters' : 'Show Filters & Search'}
                        </button>
                    </div>

                    <form 
                        onSubmit={applyFilters} 
                        className={`flex-col gap-4 ${isFilterOpen ? 'flex' : 'hidden lg:flex'}`}
                    >
                        {/* Primary Row */}
                        <div className="flex flex-col lg:flex-row gap-4 lg:items-center w-full">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Keywords or Job Title..."
                                    className="pl-10 pr-4 py-3 w-full bg-white border border-gray-200 rounded-md focus:ring-orange focus:border-orange outline-none text-charcoal"
                                />
                            </div>
                            <div className="relative flex-1">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input 
                                    type="text" 
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Location..."
                                    className="pl-10 pr-4 py-3 w-full bg-white border border-gray-200 rounded-md focus:ring-orange focus:border-orange outline-none text-charcoal"
                                />
                            </div>
                            <div className="flex-1">
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-charcoal focus:ring-orange focus:border-orange outline-none appearance-none"
                                >
                                    <option value="">All Categories</option>
                                    {categories?.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="bg-orange text-white font-bold px-8 py-3 rounded-md hover:bg-orange/90 whitespace-nowrap transition-colors shadow-sm">
                                Update Search
                            </button>
                        </div>
                        
                        {/* Secondary Row (Advanced Filters) */}
                        <div className="flex flex-col lg:flex-row gap-4 lg:items-center w-full text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-charcoal">Job Type:</span>
                                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="bg-white border border-gray-200 rounded p-1.5 focus:ring-orange focus:border-orange outline-none text-charcoal">
                                    <option value="">Any</option>
                                    {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'].map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-charcoal">Experience (Yrs):</span>
                                <input type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} className="w-16 bg-white border border-gray-200 rounded p-1.5 focus:ring-orange focus:border-orange outline-none text-charcoal" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-charcoal">Min Salary (₹):</span>
                                <input type="number" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} className="w-24 bg-white border border-gray-200 rounded p-1.5 focus:ring-orange focus:border-orange outline-none text-charcoal" />
                            </div>
                        </div>
                    </form>
                </div>

                {user?.role === 'JobSeeker' && hasAnyFilter && (
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-peach p-4 rounded-md gap-4">
                        <div className="flex items-center text-charcoal">
                            <Bell className="w-5 h-5 mr-2 text-orange" />
                            <span>
                                Get notified when new jobs match 
                                {currentKeyword && <strong> "{currentKeyword}"</strong>}
                                {currentLocation && <span> in <strong>{currentLocation}</strong></span>}
                                {currentJobType && <span> for <strong>{currentJobType}</strong></span>}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {alertMsg && <span className="text-sm font-medium text-orange">{alertMsg}</span>}
                            <button
                                onClick={() => createAlertMutation.mutate()}
                                disabled={createAlertMutation.isPending || !currentKeyword}
                                title={!currentKeyword ? "Keyword is required for job alerts" : ""}
                                className="bg-warmwhite text-charcoal border border-transparent px-4 py-2 rounded-md hover:border-orange font-medium text-sm disabled:opacity-50 whitespace-nowrap transition-colors"
                            >
                                {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-5xl">
                    {/* Job List (Unboxed Rows) */}
                    <div className="space-y-0">
                        {isLoading ? (
                            <div className="py-12 text-gray-500">Loading jobs...</div>
                        ) : data?.data?.length === 0 ? (
                            <div className="py-12 border-b border-gray-200">
                                <h3 className="text-lg font-display font-medium text-charcoal">No jobs found</h3>
                                <p className="text-gray-500 mt-1">Try adjusting your search filters.</p>
                                <button 
                                    onClick={() => router.push(pathname)} 
                                    className="mt-4 text-orange hover:underline font-bold"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            data?.data?.map((job: any) => (
                                <div key={job.id} className="py-8 border-b border-gray-200 hover:bg-peach/40 transition-colors group px-4 -mx-4 rounded-lg">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                        <div>
                                            <h2 className="text-2xl font-display font-bold text-charcoal group-hover:text-orange transition-colors">
                                                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                                            </h2>
                                            <p className="text-gray-600 mt-1 font-semibold">{job.company?.companyName}</p>
                                            
                                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" /> {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="h-4 w-4" /> {job.jobType}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            {job.salaryMin && job.salaryMax && (
                                                <span className="inline-flex items-center px-3 py-1 rounded text-sm font-bold bg-green-100 text-green-800">
                                                    ₹{job.salaryMin} - ₹{job.salaryMax}
                                                </span>
                                            )}
                                            <Link href={`/jobs/${job.id}`} className="mt-2 text-orange font-bold hover:underline">
                                                Apply Now
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
