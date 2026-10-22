'use client';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { 
    LuBriefcase, 
    LuFileText, 
    LuCircleCheck, 
    LuClock, 
    LuBell, 
    LuCalendar as CalendarIcon, 
    LuDownload,
    LuSparkles,
    LuMapPin,
    LuArrowRight,
    LuBuilding
} from 'react-icons/lu';
import { calculateProfileCompletion } from '@/utils/profile';
import { formatSalary } from '@/utils/currency';

export default function SeekerDashboard() {
    const { user } = useAuthStore();

    const handleDownloadCalendar = async (appId: number, jobTitle: string) => {
        try {
            const res = await api.get(`/applications/${appId}/calendar.ics`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Interview_${jobTitle.replace(/\s+/g, '_')}.ics`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download calendar invite:", error);
            alert("Failed to download calendar invite.");
        }
    };

    const { data: applications, isLoading } = useQuery({
        queryKey: ['my-applications'],
        queryFn: async () => {
            const res = await api.get('/applications/my-applications');
            return res.data.data;
        }
    });

    const { data: profile } = useQuery({
        queryKey: ['my-profile'],
        queryFn: async () => {
            const res = await api.get('/seekerprofiles/me');
            return res.data;
        }
    });

    const { data: recommendedJobs, isLoading: isLoadingRecommended } = useQuery({
        queryKey: ['recommended-jobs'],
        queryFn: async () => {
            const res = await api.get('/jobs/recommended?limit=4');
            return res.data;
        }
    });

    if (!user) return null;

    return (
        <div className="min-h-screen bg-warmwhite">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-charcoal">Welcome back, {user.fullName}</h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Here's what's happening with your job search today.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile Completion</p>
                                <p className="text-2xl font-bold font-display text-charcoal mt-1">{calculateProfileCompletion(profile)}%</p>
                            </div>
                            <div className="h-10 w-10 bg-orange/10 text-orange rounded-md flex items-center justify-center">
                                <LuFileText className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-orange h-2 rounded-full transition-all duration-500" style={{ width: `${calculateProfileCompletion(profile)}%` }}></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Applications</p>
                                <p className="text-2xl font-bold font-display text-charcoal mt-1">{applications?.length || 0}</p>
                            </div>
                            <div className="h-10 w-10 bg-orange/10 text-orange rounded-md flex items-center justify-center">
                                <LuBriefcase className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shortlisted</p>
                                <p className="text-2xl font-bold font-display text-charcoal mt-1">
                                    {applications?.filter((a: any) => a.status === 'Shortlisted').length || 0}
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center">
                                <LuCircleCheck className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:border-orange transition-colors cursor-pointer group">
                        <Link href="/seeker/job-alerts" className="block">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-orange">Job Alerts</p>
                                    <p className="text-sm font-medium text-charcoal mt-1">Manage saved searches</p>
                                </div>
                                <div className="h-10 w-10 bg-orange/10 text-orange rounded-md flex items-center justify-center group-hover:bg-orange group-hover:text-white transition-colors">
                                    <LuBell className="h-5 w-5" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recommended Jobs */}
                <div className="mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
                                <LuSparkles className="w-4 h-4 text-orange" />
                            </div>
                            <div>
                                <h2 className="text-lg font-display font-bold text-charcoal">Recommended Jobs</h2>
                                <p className="text-xs text-gray-500">Personalized matches based on your career title, location & skills</p>
                            </div>
                        </div>
                        <Link 
                            href="/jobs" 
                            className="text-sm text-orange hover:underline font-semibold inline-flex items-center gap-1 self-start sm:self-auto"
                        >
                            Explore all jobs <LuArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {isLoadingRecommended ? (
                        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500 font-medium">
                            Finding the best matches for you...
                        </div>
                    ) : !recommendedJobs || recommendedJobs.length === 0 ? (
                        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center shadow-sm">
                            <p className="text-sm text-gray-600">No recommended jobs yet. Add your career title, target location, and skills in your profile to get matches!</p>
                            <Link href="/seeker/profile" className="mt-2 inline-block text-xs font-semibold text-orange underline">
                                Complete your profile →
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendedJobs.map((recJob: any) => (
                                <Link
                                    key={recJob.id}
                                    href={`/jobs/${recJob.id}`}
                                    className="bg-white p-5 rounded-lg border border-gray-200 hover:border-orange shadow-sm transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-charcoal group-hover:text-orange transition-colors truncate text-base">
                                                    {recJob.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 font-medium truncate mt-0.5">
                                                    {recJob.company?.companyName}
                                                </p>
                                            </div>
                                            {recJob.company?.logoUrl ? (
                                                <img 
                                                    src={recJob.company.logoUrl} 
                                                    alt="" 
                                                    className="w-10 h-10 object-contain rounded-md border border-gray-200 flex-shrink-0" 
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                                                    <LuBuilding className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                                            {recJob.location && (
                                                <span className="flex items-center gap-1">
                                                    <LuMapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    {recJob.location}
                                                </span>
                                            )}
                                            {recJob.jobType && (
                                                <span className="flex items-center gap-1">
                                                    <LuBriefcase className="w-3.5 h-3.5 text-gray-400" />
                                                    {recJob.jobType}
                                                </span>
                                            )}
                                            {(recJob.salaryMin || recJob.salaryMax) && (
                                                <span className="font-semibold text-charcoal">
                                                    {formatSalary(recJob.salaryMin, recJob.salaryMax)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                        <span className="text-gray-400">
                                            Posted {new Date(recJob.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-orange font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                            View & Apply →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Applications Timeline */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-white">
                        <h2 className="text-lg font-display font-bold text-charcoal">Recent Applications</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {isLoading ? (
                            <div className="p-6 text-center text-gray-500">Loading applications...</div>
                        ) : applications?.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                You haven't applied to any jobs yet.
                                <div className="mt-4">
                                    <Link href="/jobs" className="text-orange font-medium hover:underline">Find Jobs</Link>
                                </div>
                            </div>
                        ) : (
                            applications?.map((app: any) => (
                                <div key={app.id} className="p-6 hover:bg-warmwhite transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-gray-50 rounded-md flex items-center justify-center border border-gray-200 flex-shrink-0">
                                            {app.job?.company?.logoUrl ? (
                                                <img src={app.job.company.logoUrl} alt="" className="h-8 w-8 object-contain" />
                                            ) : (
                                                <LuBriefcase className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-charcoal hover:text-orange truncate">
                                                <Link href={`/jobs/${app.jobId}`}>{app.job?.title}</Link>
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate">{app.job?.company?.companyName}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-start md:items-end gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            app.status === 'Applied' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                            app.status === 'Viewed' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                                            app.status === 'Shortlisted' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                            (app.status === 'Interview' || app.status === 'Interview Scheduled') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                            (app.status === 'Hired' || app.status === 'Selected') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                            app.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                            app.status === 'Withdrawn' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                            'bg-gray-100 text-charcoal border border-gray-200'
                                        }`}>
                                            {app.status}
                                        </span>

                                        {(app.status === 'Interview' || app.status === 'Interview Scheduled') && app.interviewDate && (
                                            <div className="flex flex-col items-start md:items-end gap-1 mt-2">
                                                <span className="flex items-center gap-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md">
                                                    <CalendarIcon className="h-4 w-4" /> 
                                                    {new Date(app.interviewDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {app.meetingLink && (
                                                        <a 
                                                            href={app.meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-md font-medium transition-colors"
                                                        >
                                                            Join Interview
                                                        </a>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDownloadCalendar(app.id, app.job?.title || 'Job')}
                                                        className="flex items-center gap-1 text-xs text-orange hover:underline font-medium bg-transparent border-none cursor-pointer"
                                                    >
                                                        <LuDownload className="h-3 w-3" /> Add to Calendar
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <span className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                            <LuClock className="h-3 w-3" /> Applied on {new Date(app.appliedAt).toLocaleDateString()}
                                        </span>
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
