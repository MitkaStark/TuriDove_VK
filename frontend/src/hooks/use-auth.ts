import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import type { LoginPayload, RegisterPayload } from '@/types';
import { useEffect } from 'react';

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, token, isAuthenticated, login, logout, updateUser } = useAuthStore();

  const profileQuery = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (profileQuery.data) {
      updateUser(profileQuery.data);
    }
  }, [profileQuery.data, updateUser]);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) =>
      authService.login(payload.email, payload.password),
    onSuccess: (data) => {
      login(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      login(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return {
    user,
    token,
    isAuthenticated,
    profileQuery,
    loginMutation,
    registerMutation,
    logout: handleLogout,
  };
}
