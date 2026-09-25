'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Calendar, MessageCircle } from 'lucide-react';
import Link from 'next/link';

function ApplicationCard({ app, onUpdate }: { app: any, onUpdate: () => void }) {
    const [status, setStatus] = useState(app.status);
    const [interviewDate, setInterviewDate] = useState(app.interviewDate ? app.interviewDate.slice(0, 16) : '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        if (status === 'Interview Scheduled' && !interviewDate) {
            alert('Please select an interview date and time.');
            return;
        }
        setIsUpdating(true);
        try {
            await api.patch(`/Applications/${app.id}/status`, { 
                status: status, 
                interviewDate: status === 'Interview Scheduled' ? new Date(interviewDate).toISOString() : null 
            });
            onUpdate();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to update status.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold">{app.seeker?.user?.fullName || 'Unknown Applicant'}</h2>
                    <p className="text-gray-600 text-sm">{app.seeker?.user?.email}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'Shortlisted' ? 'bg-indigo-100 text-indigo-800' :
                        app.status === 'Interview Scheduled' ? 'bg-purple-100 text-purple-800' :
                        app.status === 'Selected' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {app.status}
                    </span>
                    <Link 
                        href={`/chat/${app.id}`} 
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat
                    </Link>
                </div>
            </div>

            <p className="text-sm text-gray-500 mb-2">
                <strong>Applied on:</strong> {new Date(app.appliedAt).toLocaleDateString()}
            </p>
            
            {app.matchScore !== undefined && app.matchScore !== null && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${app.matchScore > 75 ? 'bg-green-100 text-green-800' : app.matchScore > 50 ? 'bg-yellow-100 text-yellow-800' : app.matchScore > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {app.matchScore > 0 ? `AI Match: ${app.matchScore}%` : 'Match Score Unavailable'}
                        </span>
                    </div>
                    {app.matchExplanation && app.matchScore > 0 && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{app.matchExplanation}</p>
                    )}
                </div>
            )}
            
            {app.coverLetter && (
                <div className="mb-4 bg-gray-50 p-3 rounded text-sm text-gray-700">
                    <strong>Cover Letter:</strong>
                    <p className="mt-1 whitespace-pre-wrap">{app.coverLetter}</p>
                </div>
            )}

            {app.resumeUrl && (
                <div className="mb-4">
                    <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${app.resumeUrl}`} 
                       target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline text-sm font-medium">
                        View Resume
                    </a>
                </div>
            )}

            {app.status === 'Interview Scheduled' && app.interviewDate && (
                <div className="mb-4 flex items-center text-sm text-purple-700 bg-purple-50 p-2 rounded">
                    <Calendar className="w-4 h-4 mr-2" />
                    <strong>Interview:</strong> &nbsp;{new Date(app.interviewDate).toLocaleString()}
                </div>
            )}

            <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium mb-1">Change Status:</label>
                <div className="flex flex-col space-y-2">
                    <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border p-2 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="Applied">Applied</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                    {status === 'Interview Scheduled' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Interview Date & Time <span className="text-red-500">*</span></label>
                            <input 
                                type="datetime-local" 
                                value={interviewDate}
                                onChange={(e) => setInterviewDate(e.target.value)}
                                className="w-full border p-2 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                        </div>
                    )}
                    
                    <button 
                        onClick={handleUpdate}
                        disabled={isUpdating || (status === app.status && (!app.interviewDate || interviewDate === app.interviewDate.slice(0, 16)))}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isUpdating ? 'Updating...' : 'Update Application'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function JobApplicationsPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;
    
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<any[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'Employer') {
            router.push('/');
            return;
        }
        if (jobId) {
            fetchApplications();
        }
    }, [user, router, jobId]);

    const fetchApplications = async () => {
        try {
            const res = await api.get(`/Applications/job/${jobId}`);
            setApplications(res.data);
        } catch (error: any) {
            console.error(error);
            alert("Failed to fetch applications.");
        } finally {
            setLoading(false);
        }
    };

    // The update logic is now handled in ApplicationCard

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 my-8">
            <h1 className="text-2xl font-bold mb-6">Job Applications</h1>
            
            {applications.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-gray-500">No applications received yet for this job.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {applications.map((app) => (
                        <ApplicationCard key={app.id} app={app} onUpdate={fetchApplications} />
                    ))}
                </div>
            )}
        </div>
    );
}
