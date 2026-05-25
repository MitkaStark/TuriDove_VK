import axios from 'axios';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Update last activity timestamp on each API request
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          if (parsed?.state?.isAuthenticated) {
            parsed.state.lastActivity = Date.now();
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          }
        }
      } catch {}
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: unwrap { data, meta } envelope and handle errors
api.interceptors.response.use(
  (response) => {
    // Backend wraps responses in { data: ..., meta: ... }
    // Unwrap so services receive the inner data directly
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'meta' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401) {
      if (typeof window !== 'undefined') {
        // Only redirect if we actually had a token (avoid redirect loops during hydration)
        const hadToken = localStorage.getItem('token');
        if (hadToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
      }
    }

    if (status === 403) {
      console.error('Acceso denegado: no tienes permisos para esta acción.');
    }

    if (status === 500) {
      console.error('Error interno del servidor. Intenta de nuevo más tarde.');
    }

    return Promise.reject(error);
  },
);

export default api;
