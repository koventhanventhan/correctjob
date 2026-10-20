import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5189/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for refresh token cookie
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to attach access token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Concurrency control for token refreshing
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor to handle 401 and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const url = (originalRequest.url || '').toLowerCase();
        const isAuthEndpoint =
            url.includes('/auth/login') ||
            url.includes('/auth/refresh-token') ||
            url.includes('/auth/register');

        // Do not attempt refresh on auth endpoints (login/register/refresh) or already retried requests
        if (error.response?.status === 401 && (isAuthEndpoint || originalRequest._retry)) {
            return Promise.reject(error);
        }

        // Handle 401 with single shared refresh request + queue
        if (error.response?.status === 401) {
            if (isRefreshing) {
                // If a refresh is already in-flight, queue this request
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await axios.post(
                    `${API_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );
                const { token } = res.data;

                useAuthStore.getState().setToken(token);
                processQueue(null, token);

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response?.status === 403 && error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
            if (typeof window !== 'undefined' && window.location.pathname !== '/change-password') {
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = '/change-password';
            }
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;
