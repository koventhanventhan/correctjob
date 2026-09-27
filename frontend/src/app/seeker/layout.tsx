'use client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
    const { user, isInitializing } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isInitializing && (!user || user.role !== 'JobSeeker')) {
            router.push('/login');
        }
    }, [user, isInitializing, router]);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-warmwhite">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
            </div>
        );
    }

    if (!user || user.role !== 'JobSeeker') return null;

    return <>{children}</>;
}
