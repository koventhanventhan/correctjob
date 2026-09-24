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
    setAuth: (user: User, token: string) => void;
    setToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null, // Stored in memory only to prevent XSS
    setAuth: (user, token) => set({ user, token }),
    setToken: (token) => set({ token }),
    logout: () => set({ user: null, token: null }),
}));
