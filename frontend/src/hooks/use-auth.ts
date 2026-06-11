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
    // No auto-login. El usuario debe verificar su email antes de poder iniciar sesion.
    // La pagina de registro redirige a /verify-email tras un onSuccess exitoso.
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
