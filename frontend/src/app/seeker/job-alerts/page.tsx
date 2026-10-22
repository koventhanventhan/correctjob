'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { LuBell, LuMapPin, LuBriefcase, LuTrash2, LuTag } from 'react-icons/lu';
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-display font-bold text-charcoal">Job Alerts</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage your saved searches and get notified of new matches.</p>
                </div>
                <Link href="/jobs" className="self-start sm:self-auto bg-orange text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-orange/90 text-center shadow-sm">
                    Create New Alert
                </Link>
            </div>

            {alerts?.length === 0 ? (
                <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                    <LuBell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h2 className="text-lg font-display font-semibold text-charcoal">No job alerts</h2>
                    <p className="text-gray-500 text-sm mt-1">You haven't set up any job alerts yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {alerts?.map((alert: any) => {
                        const searchParamsObj = new URLSearchParams();
                        if (alert.keyword) searchParamsObj.set('keyword', alert.keyword);
                        if (alert.location) searchParamsObj.set('location', alert.location);
                        if (alert.categoryId) searchParamsObj.set('category', alert.categoryId.toString());
                        if (alert.jobType) searchParamsObj.set('jobType', alert.jobType);
                        const searchHref = `/jobs?${searchParamsObj.toString()}`;

                        return (
                            <div key={alert.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-orange transition-all">
                                <div>
                                    <h2 className="font-bold text-charcoal flex items-center gap-2 text-base">
                                        <div className="w-8 h-8 rounded-md bg-orange/10 flex items-center justify-center text-orange shrink-0">
                                            <LuBell className="h-4 w-4 text-orange" />
                                        </div>
                                        <span>Alert: "{alert.keyword || 'All Jobs'}"</span>
                                    </h2>
                                    
                                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                                        {alert.location && (
                                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
                                                <LuMapPin className="h-3 w-3 text-gray-400" /> {alert.location}
                                            </span>
                                        )}
                                        {alert.jobType && (
                                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
                                                <LuBriefcase className="h-3 w-3 text-gray-400" /> {alert.jobType}
                                            </span>
                                        )}
                                        {alert.category && (
                                            <span className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
                                                <LuTag className="h-3 w-3 text-gray-400" /> {alert.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2.5">
                                        Active since {new Date(alert.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 self-end sm:self-center">
                                    <Link
                                        href={searchHref}
                                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange/10 text-orange hover:bg-orange hover:text-white rounded-md text-xs font-semibold transition-colors"
                                    >
                                        View Matching Jobs →
                                    </Link>
                                    <button 
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this alert?')) {
                                                deleteMutation.mutate(alert.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors disabled:opacity-50"
                                        title="Delete Alert"
                                    >
                                        <LuTrash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
