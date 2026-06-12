import axios from 'axios';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
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

// State para la cola de refresh
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(token: string | null, err: unknown = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (err || !token) reject(err);
    else resolve(token);
  });
  pendingQueue = [];
}

function doLogoutAndRedirect(message?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
  } catch {}
  // Dynamic import para evitar circular deps con react-hot-toast en SSR
  import('react-hot-toast').then((mod) => {
    mod.default.error(message ?? 'Tu sesión expiró. Inicia sesión de nuevo.', { duration: 4000 });
  }).catch(() => {});
  window.location.href = '/login';
}

// Response interceptor: unwrap { data, meta } envelope and handle errors con auto-refresh
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'meta' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;
    const originalConfig = error.config;

    // 401 en /auth/refresh → refresh muerto. Logout sin retry.
    if (status === 401 && originalConfig?.url?.includes('/auth/refresh')) {
      doLogoutAndRedirect();
      return Promise.reject(error);
    }

    // 401 con _retry ya marcado → ya intentamos rotar una vez. Logout.
    if (status === 401 && originalConfig?._retry) {
      doLogoutAndRedirect();
      return Promise.reject(error);
    }

    if (status === 401 && originalConfig) {
      originalConfig._retry = true;

      // Otro refresh en curso: encolar
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (newToken: string) => {
              originalConfig.headers = originalConfig.headers ?? {};
              originalConfig.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalConfig));
            },
            reject,
          });
        });
      }

      // Disparar refresh
      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const newAccessToken = (data as any)?.accessToken;
        if (!newAccessToken) {
          throw new Error('Refresh response sin accessToken');
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', newAccessToken);
          // Actualizar también el zustand store si está hidratado
          try {
            const stored = localStorage.getItem('auth-storage');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.state) {
                parsed.state.token = newAccessToken;
                localStorage.setItem('auth-storage', JSON.stringify(parsed));
              }
            }
          } catch {}
        }

        flushQueue(newAccessToken);

        originalConfig.headers = originalConfig.headers ?? {};
        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalConfig);
      } catch (refreshError: any) {
        flushQueue(null, refreshError);
        // Distinguir: 401 → sesión muerta; otros → propagar el error sin logout
        if (refreshError?.response?.status === 401) {
          doLogoutAndRedirect();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      console.error('Acceso denegado: no tienes permisos para esta acción.');
    }
    if (status === 500) {
      console.error('Error interno del servidor.');
    }

    return Promise.reject(error);
  },
);

export default api;
