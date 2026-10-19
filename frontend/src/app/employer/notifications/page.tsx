'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
    LuBell,
    LuCheck,
    LuCircleCheck,
    LuCircleAlert,
    LuBriefcase,
    LuClock,
    LuExternalLink,
    LuShieldCheck,
    LuUsers
} from 'react-icons/lu';

interface NotificationItem {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function EmployerNotificationsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user, isInitializing } = useAuthStore();

    const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
        queryKey: ['my-notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications/my-notifications');
            return res.data || [];
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['navbar-notifications'] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await api.patch('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
            queryClient.invalidateQueries({ queryKey: ['navbar-notifications'] });
        }
    });

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warmwhite">
                <div className="w-8 h-8 border-3 border-orange border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'Employer') {
        router.push('/login');
        return null;
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const getActionLink = (notification: NotificationItem) => {
        const title = notification.title.toLowerCase();
        if (title.includes('job approved') || title.includes('job rejected') || title.includes('expiring')) {
            return { url: '/employer/manage-jobs', label: 'View Jobs' };
        }
        if (title.includes('company') || title.includes('verification')) {
            return { url: '/employer/verification', label: 'Check Verification' };
        }
        if (title.includes('candidate accepted') || title.includes('invitation')) {
            return { url: '/employer/candidates', label: 'View Candidates' };
        }
        if (title.includes('application') || title.includes('applied')) {
            return { url: '/employer/applications', label: 'View Applications' };
        }
        return { url: '/employer/dashboard', label: 'Go to Dashboard' };
    };

    const getIcon = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes('expiring')) {
            return (
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <LuClock className="w-5 h-5" />
                </div>
            );
        }
        if (lower.includes('rejected') || lower.includes('revoked')) {
            return (
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <LuCircleAlert className="w-5 h-5" />
                </div>
            );
        }
        if (lower.includes('candidate accepted') || lower.includes('invitation')) {
            return (
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <LuUsers className="w-5 h-5" />
                </div>
            );
        }
        if (lower.includes('verification') || lower.includes('approved')) {
            return (
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <LuShieldCheck className="w-5 h-5" />
                </div>
            );
        }
        return (
            <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center shrink-0">
                <LuBriefcase className="w-5 h-5" />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-warmwhite py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal">
                            Employer Notifications
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Updates on your job approvals, expirations, applicant responses, and company verification.
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-charcoal rounded-xl shadow-xs transition disabled:opacity-50 self-start sm:self-auto"
                        >
                            <LuCheck className="w-4 h-4 text-emerald-600" />
                            <span>Mark all as read</span>
                        </button>
                    )}
                </div>

                {/* Notification List Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
                    {isLoading ? (
                        <div className="p-16 text-center text-gray-400">
                            <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-16 text-center text-gray-500">
                            <LuBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-bold text-charcoal text-base">You are all caught up!</p>
                            <p className="text-xs text-gray-500 mt-1">No notifications at the moment.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((item) => {
                                const action = getActionLink(item);
                                return (
                                    <div
                                        key={item.id}
                                        className={`p-5 flex items-start gap-4 transition-colors ${
                                            !item.isRead ? 'bg-orange/5' : 'hover:bg-gray-50/70'
                                        }`}
                                    >
                                        {getIcon(item.title)}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <h3
                                                        className={`text-sm font-bold ${
                                                            !item.isRead ? 'text-charcoal' : 'text-gray-800'
                                                        }`}
                                                    >
                                                        {item.title}
                                                    </h3>
                                                    {!item.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-orange shrink-0" />
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-gray-400 shrink-0">
                                                    {new Date(item.createdAt).toLocaleDateString([], {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                                {item.message}
                                            </p>

                                            <div className="mt-3 flex items-center gap-4">
                                                <Link
                                                    href={action.url}
                                                    onClick={() => {
                                                        if (!item.isRead) markAsReadMutation.mutate(item.id);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:text-orange/80 transition"
                                                >
                                                    <span>{action.label}</span>
                                                    <LuExternalLink className="w-3.5 h-3.5" />
                                                </Link>

                                                {!item.isRead && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markAsReadMutation.mutate(item.id)}
                                                        disabled={markAsReadMutation.isPending}
                                                        className="text-xs text-gray-400 hover:text-charcoal transition flex items-center gap-1"
                                                    >
                                                        <LuCircleCheck className="w-3.5 h-3.5" />
                                                        <span>Mark as read</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
