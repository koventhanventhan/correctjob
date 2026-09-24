'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

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

    const handleStatusChange = async (appId: number, newStatus: string) => {
        try {
            await api.patch(`/Applications/${appId}/status`, { status: newStatus });
            setApplications(applications.map(app => 
                app.id === appId ? { ...app, status: newStatus } : app
            ));
        } catch (error: any) {
            console.error(error);
            alert("Failed to update status.");
        }
    };

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
                        <div key={app.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">{app.seeker?.user?.fullName || 'Unknown Applicant'}</h2>
                                    <p className="text-gray-600 text-sm">{app.seeker?.user?.email}</p>
                                </div>
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
                            </div>

                            <p className="text-sm text-gray-500 mb-2">
                                <strong>Applied on:</strong> {new Date(app.appliedAt).toLocaleDateString()}
                            </p>
                            
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

                            <div className="mt-4 pt-4 border-t">
                                <label className="block text-sm font-medium mb-1">Change Status:</label>
                                <select 
                                    value={app.status} 
                                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                    className="w-full border p-2 rounded text-sm"
                                >
                                    <option value="Applied">Applied</option>
                                    <option value="Under Review">Under Review</option>
                                    <option value="Shortlisted">Shortlisted</option>
                                    <option value="Interview Scheduled">Interview Scheduled</option>
                                    <option value="Selected">Selected</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
