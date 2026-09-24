'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Bell, MapPin, Briefcase, Trash2, Tag } from 'lucide-react';
import Link from 'next/link';

export default function JobAlertsPage() {
    const queryClient = useQueryClient();
    const { data: alerts, isLoading } = useQuery({
        queryKey: ['jobAlerts'],
        queryFn: async () => {
            const res = await api.get('/jobalerts/my-alerts');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/jobalerts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobAlerts'] });
        }
    });

    if (isLoading) {
        return <div className="text-center py-12 text-gray-500">Loading alerts...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Alerts</h1>
                    <p className="text-gray-500 mt-1">Manage your saved searches and get notified of new matches.</p>
                </div>
                <Link href="/jobs" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                    Create New Alert
                </Link>
            </div>

            {alerts?.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                    <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No job alerts</h3>
                    <p className="text-gray-500 mt-1">You haven't set up any job alerts yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {alerts?.map((alert: any) => (
                        <div key={alert.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-indigo-500" />
                                    Alert for: "{alert.keyword || 'All Jobs'}"
                                </h3>
                                
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                    {alert.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {alert.location}
                                        </span>
                                    )}
                                    {alert.jobType && (
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" /> {alert.jobType}
                                        </span>
                                    )}
                                    {alert.category && (
                                        <span className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" /> {alert.category.name}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-2">
                                    Created on {new Date(alert.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this alert?')) {
                                        deleteMutation.mutate(alert.id);
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                                className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
                                title="Delete Alert"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
