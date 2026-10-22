'use client';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { LuBriefcase, LuMenu, LuX } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/services/api';

import ProfileMenu from './ProfileMenu';
import NotificationBell from './NotificationBell';
import { getFileUrl } from '@/utils/imageUrl';

const roleToPath: Record<string, string> = {
    JobSeeker: 'seeker',
    Employer: 'employer',
    Admin: 'admin',
};

const roleToProfilePath: Record<string, string> = {
    Admin: '/admin/settings',
    Employer: '/employer/company-profile',
    JobSeeker: '/seeker/profile',
};

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed on backend', error);
        }
        logout();
        setIsMobileMenuOpen(false);
        router.push('/');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <LuBriefcase className="h-8 w-8 text-orange" />
                            <span className="font-bold text-xl text-charcoal tracking-tight">HireConnect</span>
                        </Link>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                            <Link href="/jobs" className="border-transparent text-gray-500 hover:border-orange hover:text-charcoal inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                Find Jobs
                            </Link>
                            {user?.role === 'Employer' && (
                                <Link href="/employer/candidates" className="border-transparent text-gray-500 hover:border-orange hover:text-charcoal inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    Find Talent
                                </Link>
                            )}
                            <Link href="/companies" className="border-transparent text-gray-500 hover:border-orange hover:text-charcoal inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                Companies
                            </Link>
                            <Link href="/salary-guide" className="border-transparent text-gray-500 hover:border-orange hover:text-charcoal inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                Salary Guide
                            </Link>
                            <Link href="/career-advice" className="border-transparent text-gray-500 hover:border-orange hover:text-charcoal inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                Career Advice
                            </Link>
                        </div>
                    </div>
                    {/* Desktop Menu */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        {!user ? (
                            <>
                                <Link href="/login" className="text-gray-500 hover:text-charcoal px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Log in
                                </Link>
                                <Link href="/register" className="bg-orange text-white hover:bg-orange/90 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                                    Sign up
                                </Link>
                                <div className="h-6 w-px bg-gray-300 mx-2"></div>
                                <Link href="/register?role=employer" className="text-orange hover:text-orange px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Employers / Post Job
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <NotificationBell />
                                <ProfileMenu />
                            </div>
                        )}
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 sm:hidden">
                        {user && <NotificationBell />}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-expanded={isMobileMenuOpen}
                            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-peach focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange cursor-pointer"
                        >
                            <span className="sr-only">{isMobileMenuOpen ? "Close main menu" : "Open main menu"}</span>
                            {isMobileMenuOpen ? (
                                <LuX className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <LuMenu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="sm:hidden border-t border-gray-200">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link 
                            href="/jobs" 
                            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Find Jobs
                        </Link>
                        <Link 
                            href="/companies" 
                            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Companies
                        </Link>
                        <Link 
                            href="/salary-guide" 
                            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Salary Guide
                        </Link>
                        <Link 
                            href="/career-advice" 
                            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Career Advice
                        </Link>
                    </div>
                    
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        {!user ? (
                            <div className="space-y-1">
                                <Link 
                                    href="/login" 
                                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Log in
                                </Link>
                                <Link 
                                    href="/register" 
                                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign up
                                </Link>
                                <Link 
                                    href="/register?role=employer" 
                                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-charcoal hover:text-charcoal hover:bg-peach hover:border-peach"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Employers / Post Job
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center px-4 mb-3">
                                    <div className="flex-shrink-0">
                                        {user.profileImage ? (
                                            <img
                                                src={getFileUrl(user.profileImage)}
                                                alt={user.fullName}
                                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-orange flex items-center justify-center text-white font-bold text-sm shadow-xs">
                                                {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3 min-w-0 flex-1">
                                        <div className="text-base font-medium text-charcoal truncate">{user.fullName}</div>
                                        <div className="text-sm font-medium text-gray-500 truncate">{user.email}</div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <Link
                                        href={`/${user && roleToPath[user.role] ? roleToPath[user.role] : user?.role.toLowerCase()}/dashboard`}
                                        className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href={roleToProfilePath[user.role] || `/${user && roleToPath[user.role] ? roleToPath[user.role] : user?.role.toLowerCase()}/dashboard`}
                                        className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        My Profile
                                    </Link>
                                    {user.role === 'Employer' && (
                                        <>
                                            <Link
                                                href="/employer/candidates"
                                                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Find Talent
                                            </Link>
                                            <Link
                                                href="/employer/post-job"
                                                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Post a Job
                                            </Link>
                                            <Link
                                                href="/employer/manage-jobs"
                                                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Manage Jobs
                                            </Link>
                                        </>
                                    )}
                                    {user.role === 'JobSeeker' && (
                                        <>
                                            <Link
                                                href="/seeker/applied-jobs"
                                                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Applied Jobs
                                            </Link>
                                            <Link
                                                href="/seeker/saved-jobs"
                                                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-charcoal hover:bg-peach hover:border-gray-300"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Saved Jobs
                                            </Link>
                                        </>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 hover:border-red-300"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
