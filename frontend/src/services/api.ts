import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5037/api'; // Or your backend URL

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

// Response interceptor to handle 401 and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Since refresh token is httpOnly, we just call the refresh endpoint
                // Wait, we didn't implement refresh endpoint in AuthController yet! Let's mock the call and I'll add the endpoint next.
                const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
                const { token } = res.data;
                
                useAuthStore.getState().setToken(token);
                
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
