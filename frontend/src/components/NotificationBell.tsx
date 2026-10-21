'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { 
    LuBell, 
    LuCheck, 
    LuMessageCircle, 
    LuBriefcase, 
    LuCircleCheck, 
    LuCircleAlert,
    LuInfo, 
    LuChevronRight,
    LuSparkles,
    LuClock
} from 'react-icons/lu';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user } = useAuthStore();

    // Fetch unread count & recent notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['navbar-notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications/my-notifications');
            return res.data || [];
        },
        refetchInterval: 30000 // Poll every 30s
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    const markAsReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['navbar-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await api.patch('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['navbar-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
        }
    });

    // Close on click outside or escape key
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const getNotificationIcon = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes('expiring')) {
            return <LuClock className="w-4 h-4 text-amber-500" />;
        }
        if (lower.includes('rejected') || lower.includes('revoked')) {
            return <LuCircleAlert className="w-4 h-4 text-rose-500" />;
        }
        if (lower.includes('message') || lower.includes('chat')) {
            return <LuMessageCircle className="w-4 h-4 text-blue-500" />;
        }
        if (lower.includes('job alert') || lower.includes('match')) {
            return <LuSparkles className="w-4 h-4 text-amber-500" />;
        }
        if (lower.includes('status') || lower.includes('application')) {
            return <LuBriefcase className="w-4 h-4 text-orange" />;
        }
        if (lower.includes('verified') || lower.includes('approved')) {
            return <LuCircleCheck className="w-4 h-4 text-emerald-500" />;
        }
        return <LuInfo className="w-4 h-4 text-gray-400" />;
    };

    const getNotificationLink = (notification: any, role?: string): string => {
        const title = (notification.title || '').toLowerCase();

        if (role === 'Employer') {
            if (title.includes('job approved') || title.includes('job rejected') || title.includes('expiring')) {
                return '/employer/manage-jobs';
            }
            if (title.includes('verification') || title.includes('company')) {
                return '/employer/verification';
            }
            if (title.includes('candidate accepted') || title.includes('invitation')) {
                return '/employer/candidates';
            }
            if (title.includes('application') || title.includes('applied')) {
                return '/employer/applications';
            }
            if (title.includes('message') || title.includes('chat')) {
                return '/chat';
            }
            return '/employer/dashboard';
        }

        if (role === 'Admin') {
            if (title.includes('verification')) {
                return '/admin/dashboard';
            }
            if (title.includes('job')) {
                return '/admin/dashboard';
            }
            return '/admin/dashboard';
        }

        // Default: JobSeeker
        if (title.includes('invitation')) {
            return '/seeker/notifications';
        }
        if (title.includes('verification') || title.includes('identity')) {
            return '/seeker/verification';
        }
        if (title.includes('application') || title.includes('status')) {
            return '/seeker/applied-jobs';
        }
        if (title.includes('job alert') || title.includes('match')) {
            return '/jobs';
        }
        if (title.includes('message') || title.includes('chat')) {
            return '/chat';
        }
        return '/seeker/notifications';
    };

    const handleItemClick = (item: any) => {
        if (!item.isRead) {
            markAsReadMutation.mutate(item.id);
        }
        const targetLink = getNotificationLink(item, user?.role);
        setIsOpen(false);
        router.push(targetLink);
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    const recentList = notifications.slice(0, 5);
    const allNotificationsLink = user?.role === 'Employer'
        ? '/employer/notifications'
        : user?.role === 'Admin'
        ? '/admin/dashboard'
        : '/seeker/notifications';

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Bell Icon Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative p-2 text-gray-500 hover:text-charcoal hover:bg-gray-100 rounded-full transition-colors focus:outline-hidden cursor-pointer"
                aria-expanded={isOpen}
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
            >
                <LuBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Popover Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 ring-1 ring-black/5 divide-y divide-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* Header */}
                    <div className="p-3.5 flex items-center justify-between bg-gray-50/60 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-charcoal">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-orange/15 text-orange text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                                className="text-xs font-semibold text-orange hover:text-orange/80 transition flex items-center gap-1"
                            >
                                <LuCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {recentList.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <LuBell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-xs">No notifications yet.</p>
                            </div>
                        ) : (
                            recentList.map((item: any) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 transition cursor-pointer ${
                                        !item.isRead ? 'bg-orange/5' : ''
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                                        {getNotificationIcon(item.title)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className={`text-xs truncate ${!item.isRead ? 'font-bold text-charcoal' : 'font-medium text-gray-700'}`}>
                                                {item.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 shrink-0">
                                                {formatTime(item.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                                            {item.message}
                                        </p>
                                    </div>
                                    {!item.isRead && (
                                        <span className="w-2 h-2 rounded-full bg-orange shrink-0 mt-1.5" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 bg-gray-50/60 rounded-b-2xl text-center">
                        <Link
                            href={allNotificationsLink}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-orange transition"
                        >
                            <span>View all notifications</span>
                            <LuChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
