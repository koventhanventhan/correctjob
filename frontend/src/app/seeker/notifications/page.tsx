'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { LuBell, LuCheck, LuCircleCheck } from 'react-icons/lu';

export default function Notifications() {
    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['my-notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications/my-notifications');
            return res.data;
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => refetch()
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await api.patch('/notifications/read-all');
        },
        onSuccess: () => refetch()
    });

    if (isLoading) return <div className="p-12 text-center text-gray-500">Loading notifications...</div>;

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-charcoal">Notifications</h1>
                {unreadCount > 0 && (
                    <button 
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="text-sm font-medium text-charcoal hover:text-charcoal bg-peach px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center"
                    >
                        <LuCheck className="w-4 h-4 mr-1" /> Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-warmwhite rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <LuBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>You're all caught up!</p>
                        <p className="text-sm mt-1">No new notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {notifications.map((notification: any) => (
                            <div 
                                key={notification.id} 
                                className={`p-4 flex gap-4 transition-colors ${!notification.isRead ? 'bg-peach/50' : 'hover:bg-peach'}`}
                            >
                                <div className="mt-1">
                                    <div className={`w-2 h-2 rounded-full ${!notification.isRead ? 'bg-orange' : 'bg-transparent'}`}></div>
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-charcoal' : 'text-gray-700'}`}>
                                        {notification.title}
                                    </h4>
                                    <p className={`text-sm mt-1 ${!notification.isRead ? 'text-charcoal' : 'text-gray-600'}`}>
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-gray-500 mt-2 block">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {!notification.isRead && (
                                    <button 
                                        onClick={() => markAsReadMutation.mutate(notification.id)}
                                        title="Mark as read"
                                        className="text-gray-400 hover:text-orange self-start p-1"
                                    >
                                        <LuCircleCheck className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
