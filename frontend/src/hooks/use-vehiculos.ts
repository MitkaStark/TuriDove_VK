import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiculosService } from '@/services/vehiculos.service';
import type { QueryParams, Vehiculo } from '@/types';

const KEYS = {
  all: ['vehiculos'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (params?: QueryParams) => [...KEYS.lists(), params] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  mine: () => [...KEYS.all, 'mine'] as const,
};

export function useVehiculos(params?: QueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => vehiculosService.getAll(params),
  });
}

export function useVehiculo(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => vehiculosService.getById(id),
    enabled: !!id,
  });
}

export function useMisVehiculos() {
  return useQuery({
    queryKey: KEYS.mine(),
    queryFn: () => vehiculosService.getMine(),
  });
}

export function useCreateVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vehiculo>) => vehiculosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehiculo> }) =>
      vehiculosService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: KEYS.lists() });
    },
  });
}

export function useDeleteVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiculosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
