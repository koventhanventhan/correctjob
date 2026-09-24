'use client';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { Briefcase, LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
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
                </div>
            </div>
        </nav>
    );
}
