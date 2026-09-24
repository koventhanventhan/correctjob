import { create } from 'zustand';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isInitializing: boolean;
    setAuth: (user: User, token: string) => void;
    setToken: (token: string) => void;
    logout: () => void;
    setInitializing: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null, // Stored in memory only to prevent XSS
    isInitializing: true, // Default to true on initial load
    setAuth: (user, token) => set({ user, token }),
    setToken: (token) => set({ token }),
    logout: () => set({ user: null, token: null }),
    setInitializing: (val) => set({ isInitializing: val }),
}));
