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
import { formatSalary } from '@/utils/currency';

interface JobsClientProps {
    initialJobs?: any;
    initialCategories?: any;
    initialLocations?: any;
}

function JobsContent({ initialJobs, initialCategories, initialLocations }: JobsClientProps) {
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

    const isDefaultQuery = 
        currentPage === 1 && 
        !currentKeyword && 
        !currentLocation && 
        !currentCategory && 
        !currentJobType && 
        !currentMinSalary && 
        !currentMaxSalary && 
        !currentExperience && 
        !currentRemote && 
        !currentDatePosted && 
        currentSortBy === 'newest';

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
        },
        initialData: isDefaultQuery && initialJobs ? initialJobs : undefined,
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data;
        },
        initialData: initialCategories || undefined,
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const res = await api.get('/locations');
            return res.data;
        },
        initialData: initialLocations || undefined,
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
                categoryId: alertCategoryId ? parseInt(alertCategoryId) : undefined,
                jobType: alertJobType.trim() || undefined,
            });
            return res.data;
        },
        onSuccess: () => {
            setAlertMsg('Job alert created successfully! We will email you when matching jobs are posted.');
            setIsAlertModalOpen(false);
            setTimeout(() => setAlertMsg(''), 6000);
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Failed to create alert. Please check your inputs.';
            alert(msg);
        }
    });

    const handleCreateAlert = (e: React.FormEvent) => {
        e.preventDefault();
        createAlertMutation.mutate();
    };

    const totalPages = data?.pagination?.totalPages || 1;
    const totalJobs = data?.pagination?.totalCount || 0;

    const hasAnyFilter = Boolean(
        currentKeyword || currentLocation || currentCategory || 
        currentJobType || currentMinSalary || currentMaxSalary || 
        currentExperience || currentRemote || currentDatePosted || (currentSortBy && currentSortBy !== 'newest')
    );

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
                                    {location && !locations?.some((l: any) => l.name?.toLowerCase() === location.toLowerCase()) && (
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
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/60 text-xs">
                            
                            {/* Work Type Filter */}
                            <select 
                                value={jobType} 
                                onChange={(e) => { setJobType(e.target.value); }} 
                                className="bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-charcoal focus:ring-1 focus:ring-orange outline-none"
                            >
                                <option value="">Work Type (All)</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Casual">Casual / Temporary</option>
                                <option value="Internship">Internship</option>
                            </select>

                            {/* Experience Level Filter */}
                            <select 
                                value={experience} 
                                onChange={(e) => { setExperience(e.target.value); }} 
                                className="bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-charcoal focus:ring-1 focus:ring-orange outline-none"
                            >
                                <option value="">Experience (All)</option>
                                <option value="Entry Level">Entry Level</option>
                                <option value="Mid Level">Mid Level</option>
                                <option value="Senior Level">Senior Level</option>
                                <option value="Director / Executive">Director / Executive</option>
                            </select>

                            {/* Date Listed Filter */}
                            <select 
                                value={datePosted} 
                                onChange={(e) => { setDatePosted(e.target.value); }} 
                                className="bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-charcoal focus:ring-1 focus:ring-orange outline-none"
                            >
                                <option value="">Listed Anytime</option>
                                <option value="today">Today</option>
                                <option value="3days">Last 3 days</option>
                                <option value="week">Last 7 days</option>
                                <option value="month">Last 30 days</option>
                            </select>

                            {/* Remote Only Toggle */}
                            <label className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 select-none">
                                <input 
                                    type="checkbox" 
                                    checked={remote} 
                                    onChange={(e) => setRemote(e.target.checked)} 
                                    className="rounded border-gray-300 text-orange focus:ring-orange w-3.5 h-3.5"
                                />
                                <span className="text-charcoal font-medium">Remote Only</span>
                            </label>

                            {/* Sort Filter */}
                            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2.5 py-1.5">
                                <LuArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                                <select 
                                    value={sortBy} 
                                    onChange={(e) => { setSortBy(e.target.value); }} 
                                    className="bg-transparent outline-none text-charcoal"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="salaryHigh">Highest Salary</option>
                                    <option value="closingSoon">Closing Soon</option>
                                </select>
                            </div>

                            {/* Salary Input Controls */}
                            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2.5 py-1.5">
                                <span className="text-gray-400">LKR</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="5000"
                                    value={minSalary} 
                                    onChange={(e) => setMinSalary(e.target.value)} 
                                    placeholder="Min" 
                                    className="w-16 bg-transparent outline-none text-charcoal" 
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="5000"
                                    value={maxSalary} 
                                    onChange={(e) => setMaxSalary(e.target.value)} 
                                    placeholder="Max" 
                                    className="w-16 bg-transparent outline-none text-charcoal" 
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

                {/* Job Alert Banner */}
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-peach/70 border border-peach p-4 rounded-xl gap-4 shadow-sm">
                    <div className="flex items-center text-charcoal">
                        <div className="h-10 w-10 bg-orange/10 text-orange rounded-xl flex items-center justify-center mr-3 shrink-0">
                            <LuBell className="w-5 h-5 text-orange" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-charcoal text-sm">Save this search as an Email Alert</h2>
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
                                    className="p-5 sm:p-6 bg-white border border-gray-200 rounded-lg hover:border-orange hover:shadow-sm transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-peach/60 text-charcoal">
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
                                                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    {formatSalary(job.salaryMin, job.salaryMax)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">Competitive salary</span>
                                            )}

                                            <Link 
                                                href={`/jobs/${job.id}`}
                                                className="text-orange font-semibold text-sm hover:underline flex items-center gap-1"
                                            >
                                                <span>View Job</span>
                                                <LuChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                            <div className="text-sm text-gray-500">
                                Page <span className="font-semibold text-charcoal">{currentPage}</span> of{' '}
                                <span className="font-semibold text-charcoal">{totalPages}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => applyFilters(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <LuChevronLeft className="w-4 h-4" /> Previous
                                </button>
                                <button
                                    onClick={() => applyFilters(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next <LuChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Job Alert Modal */}
                {isAlertModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                                <div className="flex items-center gap-2 text-charcoal font-bold text-base">
                                    <LuBell className="w-5 h-5 text-orange" />
                                    <span>Create Job Alert</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAlertModalOpen(false)}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                >
                                    <LuX className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                We will send email notifications to <strong>{user?.email}</strong> whenever new jobs match these criteria:
                            </p>

                            <form onSubmit={handleCreateAlert} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Keywords</label>
                                    <input
                                        type="text"
                                        value={alertKeyword}
                                        onChange={(e) => setAlertKeyword(e.target.value)}
                                        placeholder="e.g. Software Engineer, React, Manager"
                                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={alertLocation}
                                        onChange={(e) => setAlertLocation(e.target.value)}
                                        placeholder="e.g. Colombo, Kandy, Remote"
                                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-charcoal focus:ring-2 focus:ring-orange/30 focus:border-orange outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
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

export default function JobsClient(props: JobsClientProps) {
    return (
        <Suspense fallback={<div className="text-center py-12">Loading jobs...</div>}>
            <JobsContent {...props} />
        </Suspense>
    );
}
