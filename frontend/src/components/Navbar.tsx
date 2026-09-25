'use client';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { Briefcase, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setIsMobileMenuOpen(false);
        router.push('/');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <Briefcase className="h-8 w-8 text-indigo-600" />
                            <span className="font-bold text-xl text-gray-900 tracking-tight">HireConnect</span>
                        </Link>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                            <Link href="/jobs" className="border-transparent text-gray-500 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                Find Jobs
                            </Link>
                            <Link href="/companies" className="border-transparent text-gray-500 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                Companies
                            </Link>
                        </div>
                    </div>
                    {/* Desktop Menu */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        {!user ? (
                            <>
                                <Link href="/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Log in
                                </Link>
                                <Link href="/register" className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                                    Sign up
                                </Link>
                                <div className="h-6 w-px bg-gray-300 mx-2"></div>
                                <Link href="/register?role=employer" className="text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Employers / Post Job
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">
                                    Welcome, <span className="font-medium text-gray-900">{user.fullName}</span>
                                </span>
                                <Link 
                                    href={`/${user.role.toLowerCase()}/dashboard`}
                                    className="text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                                >
                                    <UserIcon className="h-5 w-5" />
                                    <span>Dashboard</span>
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
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
                            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Find Jobs
                        </Link>
                        <Link 
                            href="/companies" 
                            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Companies
                        </Link>
                    </div>
                    
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        {!user ? (
                            <div className="space-y-1">
                                <Link 
                                    href="/login" 
                                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Log in
                                </Link>
                                <Link 
                                    href="/register" 
                                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign up
                                </Link>
                                <Link 
                                    href="/register?role=employer" 
                                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-300"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Employers / Post Job
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center px-4 mb-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                                            {user.fullName.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-800">{user.fullName}</div>
                                        <div className="text-sm font-medium text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <Link
                                        href={`/${user.role.toLowerCase()}/dashboard`}
                                        className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
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
