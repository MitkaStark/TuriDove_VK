import { api } from '@/lib/axios';
import type { AuthResponse, RegisterPayload, User } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/profile');
    return data;
  },

  async refreshToken(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh');
    return data;
  },

  async refreshSession(): Promise<{ accessToken: string }> {
    const { data } = await api.post('/auth/refresh');
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async verifyEmail(token: string): Promise<{ userId: string }> {
    const { data } = await api.post('/auth/verify-email', { token });
    return data;
  },

  async resendVerification(email: string): Promise<{ ok: boolean }> {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  },
};
