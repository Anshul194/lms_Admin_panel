import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API base URL
const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.edrilla.com/';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3600000, // 1 hour in milliseconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor — attaches the JWT from localStorage to every request
axiosInstance.interceptors.request.use(
  (config: import('axios').InternalAxiosRequestConfig): import('axios').InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        config.headers['x-refresh-token'] = refreshToken;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Clear ALL auth data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');

      // Fire a custom event so the Redux store can also clear its state.
      // The AuthGuard/ProtectedRoute listens for this and dispatches clearCredentials.
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));

      // Hard redirect to signin — no React state needed
      if (window.location.pathname !== '/signin') {
        window.location.replace('/signin');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
