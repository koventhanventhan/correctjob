'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

function AuthRehydrator({ children }: { children: React.ReactNode }) {
    const { setAuth, setInitializing, isInitializing, token } = useAuthStore();

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                // If token exists in memory, user is already hydrated
                setInitializing(false);
                return;
            }

            // Check if refreshToken cookie might exist (since we can't read httpOnly, we just try the endpoint)
            try {
                // Try to refresh token
                const refreshRes = await api.post('/auth/refresh-token', {});
                const newToken = refreshRes.data.token;
                
                // If successful, we need the user details. We could get it from a /me endpoint, 
                // but let's call it with the new token.
                const meRes = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${newToken}` }
                });

                setAuth(meRes.data, newToken);
            } catch (error) {
                // Not authenticated, that's fine
            } finally {
                setInitializing(false);
            }
        };

        initializeAuth();
    }, [setAuth, setInitializing, token]);

    return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    
    return (
        <QueryClientProvider client={queryClient}>
            <AuthRehydrator>
                {children}
            </AuthRehydrator>
        </QueryClientProvider>
    );
}
