'use client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isInitializing && (!user || user.role !== 'Employer')) {
            router.push('/login');
        }
    }, [user, isInitializing, router]);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user || user.role !== 'Employer') return null;

    return <>{children}</>;
}
