import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actividadesService } from '@/services/actividades.service';
import type { QueryParams, Actividad } from '@/types';

const KEYS = {
  all: ['actividades'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (params?: QueryParams) => [...KEYS.lists(), params] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  mine: () => [...KEYS.all, 'mine'] as const,
};

export function useActividades(params?: QueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => actividadesService.getAll(params),
  });
}

export function useActividad(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => actividadesService.getById(id),
    enabled: !!id,
  });
}

export function useMisActividades() {
  return useQuery({
    queryKey: KEYS.mine(),
    queryFn: () => actividadesService.getMine(),
  });
}

export function useCreateActividad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Actividad>) => actividadesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateActividad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Actividad> }) =>
      actividadesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: KEYS.lists() });
    },
  });
}

export function useDeleteActividad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actividadesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
