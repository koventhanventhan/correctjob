'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import {
    LuBell,
    LuCheck,
    LuCircleCheck,
    LuBriefcase,
    LuMapPin,
    LuClock,
    LuExternalLink,
    LuMailOpen
} from 'react-icons/lu';
import { getFileUrl } from '@/utils/imageUrl';

interface Invitation {
    id: number;
    jobId: number;
    jobTitle: string;
    jobLocation?: string;
    jobType?: string;
    companyName: string;
    companyLogo?: string;
    message?: string;
    status: 'Pending' | 'Accepted' | 'Declined';
    createdAt: string;
    respondedAt?: string;
}

export default function NotificationsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'notifications' | 'invitations'>('notifications');

    // Fetch notifications
    const { data: notifications = [], isLoading: isNotifsLoading } = useQuery({
        queryKey: ['my-notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications/my-notifications');
            return res.data || [];
        }
    });

    // Fetch seeker invitations
    const { data: invitations = [], isLoading: isInvitesLoading } = useQuery<Invitation[]>({
        queryKey: ['my-invitations'],
        queryFn: async () => {
            const res = await api.get('/candidates/invitations/my-invitations');
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

    // Respond to invitation mutation
    const respondMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: 'Accepted' | 'Declined' }) => {
            const res = await api.patch(`/candidates/invitations/${id}/respond`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
            queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
        }
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;
    const pendingInvitesCount = invitations.filter((i) => i.status === 'Pending').length;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-charcoal">Notifications & Invitations</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Stay updated with application status, employer invitations, and job alerts
                    </p>
                </div>

                {activeTab === 'notifications' && unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="text-xs sm:text-sm font-semibold text-charcoal hover:bg-peach/80 bg-peach px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center self-start sm:self-auto"
                    >
                        <LuCheck className="w-4 h-4 mr-1.5" /> Mark all as read
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-3 border-b border-gray-200 mb-6">
                <button
                    type="button"
                    onClick={() => setActiveTab('notifications')}
                    className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'notifications'
                            ? 'border-orange text-orange'
                            : 'border-transparent text-gray-500 hover:text-charcoal'
                    }`}
                >
                    <LuBell className="w-4 h-4" />
                    <span>All Notifications</span>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('invitations')}
                    className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'invitations'
                            ? 'border-orange text-orange'
                            : 'border-transparent text-gray-500 hover:text-charcoal'
                    }`}
                >
                    <LuMailOpen className="w-4 h-4" />
                    <span>Job Invitations</span>
                    {pendingInvitesCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                            {pendingInvitesCount} new
                        </span>
                    )}
                </button>
            </div>

            {/* Content Tab 1: Regular Notifications */}
            {activeTab === 'notifications' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
                    {isNotifsLoading ? (
                        <div className="p-12 text-center text-gray-400">
                            <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <LuBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-semibold text-charcoal">You're all caught up!</p>
                            <p className="text-xs text-gray-500 mt-1">No new notifications at the moment.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification: any) => {
                                const isInvite = notification.title?.toLowerCase().includes('invitation');
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 flex gap-4 transition-colors ${
                                            !notification.isRead ? 'bg-orange/5' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="mt-1">
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    !notification.isRead ? 'bg-orange' : 'bg-transparent'
                                                }`}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4
                                                    className={`text-sm font-semibold truncate ${
                                                        !notification.isRead ? 'text-charcoal' : 'text-gray-700'
                                                    }`}
                                                >
                                                    {notification.title}
                                                </h4>
                                                <span className="text-[11px] text-gray-400 shrink-0">
                                                    {new Date(notification.createdAt).toLocaleDateString([], {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <p
                                                className={`text-xs mt-1 leading-relaxed ${
                                                    !notification.isRead ? 'text-charcoal' : 'text-gray-600'
                                                }`}
                                            >
                                                {notification.message}
                                            </p>

                                            {isInvite && (
                                                <div className="mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('invitations')}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:text-orange/80"
                                                    >
                                                        <span>View Invitations</span>
                                                        <LuExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
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
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Content Tab 2: Job Invitations */}
            {activeTab === 'invitations' && (
                <div className="space-y-4">
                    {isInvitesLoading ? (
                        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-200/80">
                            <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs">Loading invitations...</p>
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-sm border border-gray-200/80">
                            <LuMailOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-semibold text-charcoal">No invitations yet</p>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                When verified employers find your profile and invite you to apply for their roles, they will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 space-y-4 hover:shadow-md transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            {invitation.companyLogo ? (
                                                <img
                                                    src={getFileUrl(invitation.companyLogo)}
                                                    alt={invitation.companyName}
                                                    className="w-11 h-11 rounded-xl object-contain border border-gray-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl bg-orange/10 text-orange font-bold flex items-center justify-center shrink-0">
                                                    <LuBriefcase className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-charcoal text-base">
                                                        {invitation.jobTitle}
                                                    </h3>
                                                    {invitation.status === 'Pending' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            Pending Action
                                                        </span>
                                                    )}
                                                    {invitation.status === 'Accepted' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Accepted
                                                        </span>
                                                    )}
                                                    {invitation.status === 'Declined' && (
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                            Declined
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs font-semibold text-gray-600 mt-0.5">
                                                    {invitation.companyName}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                                                    {invitation.jobLocation && (
                                                        <span className="flex items-center gap-1">
                                                            <LuMapPin className="w-3.5 h-3.5" />
                                                            {invitation.jobLocation}
                                                        </span>
                                                    )}
                                                    {invitation.jobType && (
                                                        <span className="flex items-center gap-1">
                                                            <LuClock className="w-3.5 h-3.5" />
                                                            {invitation.jobType}
                                                        </span>
                                                    )}
                                                    <span>
                                                        Received{' '}
                                                        {new Date(invitation.createdAt).toLocaleDateString([], {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Message Note */}
                                    {invitation.message && (
                                        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 leading-relaxed border border-gray-100">
                                            <span className="font-semibold text-charcoal">Employer Note: </span>
                                            {invitation.message}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-xs text-gray-500">
                                            {invitation.status === 'Pending' ? (
                                                <span>Accepting will share your contact info with {invitation.companyName} so they can reach out.</span>
                                            ) : invitation.status === 'Accepted' ? (
                                                <span className="text-emerald-700 font-medium">Your contact info has been shared with {invitation.companyName}.</span>
                                            ) : (
                                                <span className="text-gray-400">You declined this invitation.</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {invitation.status === 'Pending' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            respondMutation.mutate({
                                                                id: invitation.id,
                                                                status: 'Declined'
                                                            })
                                                        }
                                                        disabled={respondMutation.isPending}
                                                        className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            respondMutation.mutate({
                                                                id: invitation.id,
                                                                status: 'Accepted'
                                                            })
                                                        }
                                                        disabled={respondMutation.isPending}
                                                        className="inline-flex items-center gap-1.5 bg-orange hover:bg-orange/90 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
                                                    >
                                                        <LuCheck className="w-3.5 h-3.5" />
                                                        Accept Invitation
                                                    </button>
                                                </>
                                            )}

                                            {invitation.status === 'Accepted' && (
                                                <Link
                                                    href={`/jobs/${invitation.jobId}`}
                                                    className="inline-flex items-center gap-1.5 bg-orange hover:bg-orange/90 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
                                                >
                                                    <span>View Job & Apply</span>
                                                    <LuExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
