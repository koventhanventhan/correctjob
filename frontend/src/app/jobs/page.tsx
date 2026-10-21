'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { 
    LuMapPin, 
    LuBriefcase, 
    LuSearch, 
    LuFilter, 
    LuBell, 
    LuChevronLeft, 
    LuChevronRight,
    LuGlobe,
    LuClock,
    LuArrowUpDown,
    LuX
} from 'react-icons/lu';
import { useState, useCallback, Suspense } from 'react';
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
    const [remote, setRemote] = useState(searchParams.get('remote') === 'true');
    const [datePosted, setDatePosted] = useState(searchParams.get('datePosted') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

    const { user } = useAuthStore();
    const [alertMsg, setAlertMsg] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertKeyword, setAlertKeyword] = useState('');
    const [alertLocation, setAlertLocation] = useState('');
    const [alertCategoryId, setAlertCategoryId] = useState('');
    const [alertJobType, setAlertJobType] = useState('');

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

    const applyFilters = (newPage?: number) => {
        const targetPage = newPage !== undefined ? newPage : 1;
        router.push(pathname + '?' + createQueryString({
            keyword: searchTerm,
            location,
            category,
            minSalary,
            maxSalary,
            experience,
            jobType,
            remote: remote ? 'true' : '',
            datePosted,
            sortBy,
            page: targetPage > 1 ? targetPage.toString() : ''
        }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(1);
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setLocation('');
        setCategory('');
        setMinSalary('');
        setMaxSalary('');
        setExperience('');
        setJobType('');
        setRemote(false);
        setDatePosted('');
        setSortBy('newest');
        router.push(pathname);
    };

    // Current active query values from URL
    const currentKeyword = searchParams.get('keyword') || '';
    const currentLocation = searchParams.get('location') || '';
    const currentCategory = searchParams.get('category') || '';
    const currentJobType = searchParams.get('jobType') || '';
    const currentMinSalary = searchParams.get('minSalary') || '';
    const currentMaxSalary = searchParams.get('maxSalary') || '';
    const currentExperience = searchParams.get('experience') || '';
    const currentRemote = searchParams.get('remote') === 'true';
    const currentDatePosted = searchParams.get('datePosted') || '';
    const currentSortBy = searchParams.get('sortBy') || 'newest';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const { data, isLoading } = useQuery({
        queryKey: [
            'jobs', 
            currentKeyword, 
            currentLocation, 
            currentCategory, 
            currentJobType, 
            currentMinSalary, 
            currentMaxSalary, 
            currentExperience,
            currentRemote,
            currentDatePosted,
            currentSortBy,
            currentPage
        ],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (currentKeyword) params.append('keyword', currentKeyword);
            if (currentLocation) params.append('location', currentLocation);
            if (currentCategory) params.append('category', currentCategory);
            if (currentJobType) params.append('jobType', currentJobType);
            if (currentMinSalary) params.append('minSalary', currentMinSalary);
            if (currentMaxSalary) params.append('maxSalary', currentMaxSalary);
            if (currentExperience) params.append('experience', currentExperience);
            if (currentRemote) params.append('remote', 'true');
            if (currentDatePosted) params.append('datePosted', currentDatePosted);
            if (currentSortBy) params.append('sortBy', currentSortBy);
            params.append('page', currentPage.toString());
            params.append('pageSize', '12');
            
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

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const res = await api.get('/locations');
            return res.data;
        }
    });

    const openSaveAlertModal = () => {
        if (!user) {
            router.push('/login?redirect=/jobs');
            return;
        }
        if (user.role !== 'JobSeeker') {
            alert('Please sign in as a Job Seeker to create job alerts.');
            return;
        }
        setAlertKeyword(currentKeyword);
        setAlertLocation(currentLocation);
        setAlertCategoryId(currentCategory);
        setAlertJobType(currentJobType);
        setIsAlertModalOpen(true);
    };

    const createAlertMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/jobalerts', { 
                keyword: alertKeyword.trim() || undefined,
                location: alertLocation.trim() || undefined,
                categoryId: alertCategoryId ? parseInt(alertCategoryId, 10) : undefined,
                jobType: alertJobType || undefined
            });
            return res.data;
        },
        onSuccess: () => {
            setIsAlertModalOpen(false);
            setAlertMsg('Job alert saved! You will receive email notifications when new matching jobs are published.');
            setTimeout(() => setAlertMsg(''), 6000);
        },
        onError: () => {
            setAlertMsg('Failed to create alert.');
            setTimeout(() => setAlertMsg(''), 4000);
        }
    });

    const hasAnyFilter = Boolean(
        currentKeyword || 
        currentLocation || 
        currentCategory || 
        currentJobType || 
        currentMinSalary || 
        currentMaxSalary || 
        currentExperience ||
        currentRemote ||
        currentDatePosted ||
        (currentSortBy && currentSortBy !== 'newest')
    );

    const totalJobs = data?.pagination?.totalCount || 0;
    const totalPages = data?.pagination?.totalPages || 1;

    return (
        <div className="min-h-screen bg-warmwhite py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-display font-bold text-charcoal">Find Jobs</h1>
                        <p className="text-gray-600 mt-1">Explore verified opportunities tailored for your career path</p>
                    </div>
                    {totalJobs > 0 && (
                        <div className="text-sm font-medium text-gray-500">
                            Showing <span className="font-bold text-charcoal">{totalJobs}</span> available {totalJobs === 1 ? 'job' : 'jobs'}
                        </div>
                    )}
                </div>

                {/* Sticky Search & Filter Command Center */}
                <div className="sticky top-16 z-30 bg-warmwhite py-4 mb-8 border-b border-gray-200">
                    <div className="flex justify-between lg:hidden mb-4">
                        <button 
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="w-full bg-peach text-charcoal font-bold py-3 rounded-md flex items-center justify-center gap-2 border border-gray-300 hover:border-orange transition-colors"
                        >
                            <LuFilter className="h-5 w-5" />
                            {isFilterOpen ? 'Hide Filters' : 'Show Filters & Search'}
                        </button>
                    </div>

                    <form 
                        onSubmit={handleFormSubmit} 
                        className={`flex-col gap-4 ${isFilterOpen ? 'flex' : 'hidden lg:flex'}`}
                    >
                        {/* Primary Search Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 w-full">
                            <div className="relative sm:col-span-2 lg:col-span-4">
                                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Keywords, title, or skills..."
                                    className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none text-charcoal text-sm"
                                />
                            </div>
                            <div className="relative sm:col-span-1 lg:col-span-3">
                                <LuMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                                <select 
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none text-charcoal text-sm"
                                >
                                    <option value="">All Locations</option>
                                    {location && !locations?.some((l: any) => l.name.toLowerCase() === location.toLowerCase()) && (
                                        <option value={location}>{location} (Current Filter)</option>
                                    )}
                                    {locations?.map((loc: any) => (
                                        <option key={loc.id} value={loc.name}>
                                            {loc.name}{loc.stateOrProvince ? `, ${loc.stateOrProvince}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-1 lg:col-span-3">
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-charcoal text-sm focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                >
                                    <option value="">All Categories</option>
                                    {categories?.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-2 flex gap-2">
                                <button 
                                    type="submit" 
                                    className="w-full bg-orange text-white font-semibold py-2.5 px-4 rounded-md hover:bg-orange/90 whitespace-nowrap transition-colors shadow-sm text-sm"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                        
                        {/* Secondary Filter Controls */}
                        <div className="flex flex-wrap gap-3 items-center w-full pt-3 border-t border-gray-200/60 text-xs sm:text-sm">
                            {/* Sort By */}
                            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 py-1.5">
                                <LuArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
                                <label className="text-gray-500 font-medium whitespace-nowrap">Sort:</label>
                                <select 
                                    value={sortBy} 
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        // Auto apply on sort change
                                        router.push(pathname + '?' + createQueryString({ sortBy: e.target.value, page: '1' }));
                                    }}
                                    className="bg-transparent border-none text-charcoal font-medium outline-none cursor-pointer pr-1"
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="relevance">Relevance</option>
                                    <option value="salaryHigh">Highest Salary</option>
                                    <option value="salaryLow">Lowest Salary</option>
                                </select>
                            </div>

                            {/* Date Posted */}
                            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 py-1.5">
                                <LuClock className="w-4 h-4 text-gray-400 shrink-0" />
                                <label className="text-gray-500 font-medium whitespace-nowrap">Listed:</label>
                                <select 
                                    value={datePosted} 
                                    onChange={(e) => {
                                        setDatePosted(e.target.value);
                                        router.push(pathname + '?' + createQueryString({ datePosted: e.target.value, page: '1' }));
                                    }}
                                    className="bg-transparent border-none text-charcoal font-medium outline-none cursor-pointer pr-1"
                                >
                                    <option value="">Any time</option>
                                    <option value="24h">Past 24 hours</option>
                                    <option value="7d">Past 7 days</option>
                                    <option value="30d">Past 30 days</option>
                                </select>
                            </div>

                            {/* Job Type (Full-time, Part-time, Contract, Casual, Internship) */}
                            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 py-1.5">
                                <LuBriefcase className="w-4 h-4 text-gray-400 shrink-0" />
                                <label className="text-gray-500 font-medium whitespace-nowrap">Work Type:</label>
                                <select 
                                    value={jobType} 
                                    onChange={(e) => {
                                        setJobType(e.target.value);
                                        router.push(pathname + '?' + createQueryString({ jobType: e.target.value, page: '1' }));
                                    }}
                                    className="bg-transparent border-none text-charcoal font-medium outline-none cursor-pointer pr-1"
                                >
                                    <option value="">All Work Types</option>
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Casual">Casual / Temporary</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </div>

                            {/* Remote Only Toggle */}
                            <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                                remote 
                                    ? 'bg-orange text-white border-orange shadow-sm' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}>
                                <input 
                                    type="checkbox" 
                                    checked={remote} 
                                    onChange={(e) => {
                                        setRemote(e.target.checked);
                                        router.push(pathname + '?' + createQueryString({ remote: e.target.checked ? 'true' : '', page: '1' }));
                                    }}
                                    className="sr-only" 
                                />
                                <LuGlobe className="w-4 h-4" />
                                <span>Remote only</span>
                            </label>

                            {/* Min Salary Input */}
                            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1.5">
                                <span className="text-gray-500 font-medium">Min ₹:</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="5000"
                                    value={minSalary} 
                                    onChange={(e) => setMinSalary(e.target.value)} 
                                    placeholder="e.g. 50000" 
                                    className="w-20 bg-transparent outline-none text-charcoal" 
                                />
                            </div>

                            {/* Max Salary Input */}
                            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1.5">
                                <span className="text-gray-500 font-medium">Max ₹:</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="5000"
                                    value={maxSalary} 
                                    onChange={(e) => setMaxSalary(e.target.value)} 
                                    placeholder="e.g. 150000" 
                                    className="w-20 bg-transparent outline-none text-charcoal" 
                                />
                            </div>

                            {/* Clear All Filters */}
                            {hasAnyFilter && (
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600 font-medium px-2 py-1.5 transition-colors cursor-pointer"
                                >
                                    <LuX className="w-4 h-4" />
                                    <span>Clear filters</span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Job Alert Banner (Seek.com Feature) */}
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-peach/70 border border-peach p-4 rounded-xl gap-4 shadow-sm">
                    <div className="flex items-center text-charcoal">
                        <div className="h-10 w-10 bg-orange/10 text-orange rounded-xl flex items-center justify-center mr-3 shrink-0">
                            <LuBell className="w-5 h-5 text-orange" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-charcoal text-sm">Save this search as an Email Alert</h4>
                            <p className="text-xs text-gray-600 mt-0.5">
                                {hasAnyFilter ? (
                                    <>Get instant email notifications as soon as new jobs matching your filters are published.</>
                                ) : (
                                    <>Get updates for new opportunities delivered directly to your inbox.</>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {alertMsg && (
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                                {alertMsg}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={openSaveAlertModal}
                            className="bg-orange text-white px-4 py-2.5 rounded-xl hover:bg-orange/90 font-semibold text-xs whitespace-nowrap transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                        >
                            <LuBell className="w-3.5 h-3.5" /> Save Search & Alert
                        </button>
                    </div>
                </div>

                {/* Job List */}
                <div className="max-w-5xl">
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="py-20 text-center text-gray-500">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange mb-3"></div>
                                <p>Finding matching jobs...</p>
                            </div>
                        ) : data?.data?.length === 0 ? (
                            <div className="py-16 text-center bg-white rounded-lg border border-gray-200 p-8">
                                <LuBriefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-xl font-display font-semibold text-charcoal">No matching jobs found</h3>
                                <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm">
                                    We couldn't find any jobs matching your current filters. Try broadening your keywords, clearing some filters, or checking back soon.
                                </p>
                                <button 
                                    onClick={clearAllFilters} 
                                    className="mt-5 inline-flex items-center justify-center bg-orange text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-orange/90 transition-colors shadow-sm"
                                >
                                    Reset all filters
                                </button>
                            </div>
                        ) : (
                            data?.data?.map((job: any) => (
                                <div 
                                    key={job.id} 
                                    className="p-5 sm:p-6 bg-white border border-gray-200/80 rounded-xl hover:border-orange/60 hover:shadow-md transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-peach text-charcoal">
                                                    {job.category?.name || 'General'}
                                                </span>
                                                {job.jobType && (
                                                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                                        {job.jobType}
                                                    </span>
                                                )}
                                                {(job.location?.toLowerCase().includes('remote') || job.jobType?.toLowerCase().includes('remote')) && (
                                                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                                        <LuGlobe className="w-3 h-3" /> Remote
                                                    </span>
                                                )}
                                            </div>

                                            <h2 className="text-xl font-display font-bold text-charcoal group-hover:text-orange transition-colors">
                                                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                                            </h2>
                                            
                                            <p className="text-sm text-gray-600 mt-1 font-medium">
                                                {job.company?.companyName}
                                            </p>
                                            
                                            <div className="flex flex-wrap gap-4 mt-3 text-xs sm:text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <LuMapPin className="h-4 w-4 text-gray-400" /> {job.location || 'Location not specified'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <LuClock className="h-4 w-4 text-gray-400" /> Listed {new Date(job.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {job.description && (
                                                <p className="text-xs sm:text-sm text-gray-600 mt-3 line-clamp-2">
                                                    {job.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                            {job.salaryMin ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs sm:text-sm font-bold bg-green-50 text-green-700 border border-green-200">
                                                    ₹{job.salaryMin.toLocaleString()} {job.salaryMax ? `- ₹${job.salaryMax.toLocaleString()}` : '+'}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Competitive</span>
                                            )}
                                            <Link 
                                                href={`/jobs/${job.id}`} 
                                                className="inline-flex items-center justify-center bg-orange text-white px-5 py-2 rounded-md font-semibold text-xs sm:text-sm hover:bg-orange/90 transition-colors shadow-sm"
                                            >
                                                View & Apply
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-8 bg-white px-6 py-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Page <span className="font-semibold text-charcoal">{currentPage}</span> of <span className="font-semibold text-charcoal">{totalPages}</span> ({totalJobs} total results)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => applyFilters(Math.max(1, currentPage - 1))}
                                    disabled={currentPage <= 1}
                                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-charcoal bg-white hover:bg-peach disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <LuChevronLeft className="w-4 h-4" /> Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFilters(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-charcoal bg-white hover:bg-peach disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next <LuChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Search & Alert Modal (Seek.com Feature) */}
                {isAlertModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                            <button
                                type="button"
                                onClick={() => setIsAlertModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <LuX className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 mb-1">
                                <LuBell className="w-5 h-5 text-orange" />
                                <h3 className="text-xl font-bold text-charcoal">Save Search & Email Alert</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">
                                Receive email notifications as soon as new jobs matching these criteria are posted.
                            </p>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    createAlertMutation.mutate();
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Keyword / Title</label>
                                    <input
                                        type="text"
                                        value={alertKeyword}
                                        onChange={(e) => setAlertKeyword(e.target.value)}
                                        placeholder="e.g. React Developer, UI Designer"
                                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={alertLocation}
                                        onChange={(e) => setAlertLocation(e.target.value)}
                                        placeholder="e.g. Colombo, Remote, Jaffna"
                                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                                        <select
                                            value={alertCategoryId}
                                            onChange={(e) => setAlertCategoryId(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-2 py-2 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                        >
                                            <option value="">Any Category</option>
                                            {categories?.map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Work Type</label>
                                        <select
                                            value={alertJobType}
                                            onChange={(e) => setAlertJobType(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-2 py-2 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                        >
                                            <option value="">Any Work Type</option>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Casual">Casual / Temporary</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <Link
                                        href="/seeker/job-alerts"
                                        className="text-xs text-orange hover:underline font-semibold"
                                        onClick={() => setIsAlertModalOpen(false)}
                                    >
                                        Manage alerts →
                                    </Link>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAlertModalOpen(false)}
                                            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createAlertMutation.isPending}
                                            className="px-4 py-2 bg-orange text-white rounded-xl text-xs font-semibold hover:bg-orange/90 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            {createAlertMutation.isPending ? 'Saving...' : 'Save Alert'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function JobsPage() {
    return (
        <Suspense fallback={<div className="text-center py-12">Loading jobs...</div>}>
            <JobsContent />
        </Suspense>
    );
}
