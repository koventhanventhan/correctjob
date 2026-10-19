'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getFileUrl } from '@/utils/imageUrl';
import {
    LuUser,
    LuLayoutDashboard,
    LuLogOut,
    LuShieldCheck,
    LuBriefcase,
    LuUserCheck,
    LuBell
} from 'react-icons/lu';

interface ProfileMenuProps {
    className?: string;
    profileHref?: string;
    onItemClick?: () => void;
}

const roleToDashboardPath: Record<string, string> = {
    Admin: '/admin/dashboard',
    Employer: '/employer/dashboard',
    JobSeeker: '/seeker/dashboard',
};

const roleToProfilePath: Record<string, string> = {
    Admin: '/admin/settings',
    Employer: '/employer/company-profile',
    JobSeeker: '/seeker/profile',
};

export default function ProfileMenu({ className = '', profileHref, onItemClick }: ProfileMenuProps) {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Reset image error when user or profile image changes
    useEffect(() => {
        setImageError(false);
    }, [user?.profileImage]);

    // Close on click outside or escape key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
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

    if (!user) return null;

    const initials = user.fullName
        ? user.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'U';

    const dashboardPath = roleToDashboardPath[user.role] || `/${user.role.toLowerCase()}/dashboard`;
    const targetProfilePath = profileHref || roleToProfilePath[user.role] || dashboardPath;
    const avatarUrl = user.profileImage ? getFileUrl(user.profileImage) : null;

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed on backend', error);
        }
        logout();
        setIsOpen(false);
        if (onItemClick) onItemClick();
        router.push('/');
    };

    const getRoleIcon = () => {
        if (user.role === 'Admin') return <LuShieldCheck className="w-3 h-3 text-orange" />;
        if (user.role === 'Employer') return <LuBriefcase className="w-3 h-3 text-blue-500" />;
        return <LuUserCheck className="w-3 h-3 text-emerald-500" />;
    };

    return (
        <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
            {/* Avatar Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label="User profile menu"
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-orange/40 focus:outline-none focus:ring-2 focus:ring-orange transition-all duration-150"
            >
                {avatarUrl && !imageError ? (
                    <img
                        src={avatarUrl}
                        alt={user.fullName || 'User Avatar'}
                        onError={() => setImageError(true)}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange to-amber-500 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
                        {initials}
                    </div>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                    {/* User Header */}
                    <div className="px-4 py-3 flex items-center gap-3 bg-gradient-to-b from-gray-50/80 to-white rounded-t-xl">
                        {avatarUrl && !imageError ? (
                            <img
                                src={avatarUrl}
                                alt={user.fullName}
                                className="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-xs flex-shrink-0"
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange to-amber-500 text-white font-bold flex items-center justify-center text-base shadow-xs flex-shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-charcoal truncate leading-tight">
                                {user.fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange/10 text-orange border border-orange/20">
                                {getRoleIcon()}
                                {user.role}
                            </span>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <div className="py-1">
                        <Link
                            href={dashboardPath}
                            role="menuitem"
                            onClick={() => {
                                setIsOpen(false);
                                if (onItemClick) onItemClick();
                            }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange/5 hover:text-orange transition-colors"
                        >
                            <LuLayoutDashboard className="w-4 h-4 text-gray-400 group-hover:text-orange" />
                            <span>Dashboard</span>
                        </Link>
                        {user.role === 'Employer' && (
                            <Link
                                href="/employer/candidates"
                                role="menuitem"
                                onClick={() => {
                                    setIsOpen(false);
                                    if (onItemClick) onItemClick();
                                }}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange/5 hover:text-orange transition-colors"
                            >
                                <LuBriefcase className="w-4 h-4 text-gray-400 group-hover:text-orange" />
                                <span>Find Talent</span>
                            </Link>
                        )}
                        <Link
                            href={targetProfilePath}
                            role="menuitem"
                            onClick={() => {
                                setIsOpen(false);
                                if (onItemClick) onItemClick();
                            }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange/5 hover:text-orange transition-colors"
                        >
                            <LuUser className="w-4 h-4 text-gray-400 group-hover:text-orange" />
                            <span>My Profile</span>
                        </Link>
                        <Link
                            href={user.role === 'Employer' ? '/employer/notifications' : user.role === 'Admin' ? '/admin/dashboard' : '/seeker/notifications'}
                            role="menuitem"
                            onClick={() => {
                                setIsOpen(false);
                                if (onItemClick) onItemClick();
                            }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange/5 hover:text-orange transition-colors"
                        >
                            <LuBell className="w-4 h-4 text-gray-400 group-hover:text-orange" />
                            <span>Notifications</span>
                        </Link>
                    </div>

                    {/* Logout */}
                    <div className="py-1">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                        >
                            <LuLogOut className="w-4 h-4 text-red-400" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
