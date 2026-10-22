'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { 
    LuCircleCheck, 
    LuBriefcase, 
    LuBuilding, 
    LuClock, 
    LuFileText, 
    LuSearch 
} from 'react-icons/lu';

function AppliedSuccessContent() {
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');
    const jobTitle = searchParams.get('jobTitle') || 'Job Position';
    const companyName = searchParams.get('companyName') || 'Company';

    return (
        <div className="min-h-screen bg-warmwhite py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-xl w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
                {/* Big Green Celebration Icon */}
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center mb-6">
                    <LuCircleCheck className="w-10 h-10" />
                </div>

                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2 border border-emerald-200">
                    Application Sent
                </span>

                <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal mb-2">
                    You've successfully applied!
                </h1>
                
                <p className="text-gray-600 text-sm mb-8">
                    Your resume and answers have been securely submitted to the employer.
                </p>

                {/* Job Summary Card */}
                <div className="bg-orange/5 rounded-lg p-5 mb-8 border border-orange/15 text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-orange/10 flex items-center justify-center text-orange shrink-0">
                            <LuBriefcase className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-bold text-charcoal text-base truncate">{jobTitle}</h2>
                            <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                <LuBuilding className="w-3.5 h-3.5 text-gray-400" /> {companyName}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <LuClock className="w-3.5 h-3.5 text-gray-400" /> Submitted today
                        </span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Status: Applied
                        </span>
                    </div>
                </div>

                {/* What Happens Next Steps */}
                <div className="text-left mb-8 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">What happens next</h3>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-orange text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            1
                        </div>
                        <div className="text-xs text-gray-600">
                            <p className="font-semibold text-charcoal">Application Delivered</p>
                            <p className="mt-0.5">The hiring team has received your application and answers.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-orange/20 text-charcoal flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            2
                        </div>
                        <div className="text-xs text-gray-600">
                            <p className="font-semibold text-charcoal">Employer Review</p>
                            <p className="mt-0.5">You'll receive an in-app and email alert whenever your application status updates.</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/seeker/applied-jobs"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange text-white rounded-md text-sm font-semibold hover:bg-orange/90 transition shadow-sm"
                    >
                        <LuFileText className="w-4 h-4" /> My Applications
                    </Link>
                    <Link
                        href="/jobs"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-charcoal rounded-md text-sm font-semibold hover:bg-gray-50 transition"
                    >
                        <LuSearch className="w-4 h-4" /> Find More Jobs
                    </Link>
                </div>

                {jobId && (
                    <div className="mt-6">
                        <Link 
                            href={`/jobs/${jobId}`}
                            className="text-xs text-gray-500 hover:text-orange underline"
                        >
                            Back to job listing
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AppliedSuccessPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-gray-500 font-medium">Loading confirmation...</div>}>
            <AppliedSuccessContent />
        </Suspense>
    );
}
