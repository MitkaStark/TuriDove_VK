import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospedajesService } from '@/services/hospedajes.service';
import type { QueryParams, Hospedaje } from '@/types';

const KEYS = {
  all: ['hospedajes'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (params?: QueryParams) => [...KEYS.lists(), params] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  mine: () => [...KEYS.all, 'mine'] as const,
};

export function useHospedajes(params?: QueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => hospedajesService.getAll(params),
  });
}

export function useHospedaje(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => hospedajesService.getById(id),
    enabled: !!id,
  });
}

export function useMisHospedajes() {
  return useQuery({
    queryKey: KEYS.mine(),
    queryFn: () => hospedajesService.getMine(),
  });
}

export function useCreateHospedaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Hospedaje>) => hospedajesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateHospedaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Hospedaje> }) =>
      hospedajesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: KEYS.lists() });
    },
  });
}

export function useDeleteHospedaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hospedajesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
