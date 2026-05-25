import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservasService } from '@/services/reservas.service';
import type { QueryParams, Reserva } from '@/types';

const KEYS = {
  all: ['reservas'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (params?: QueryParams) => [...KEYS.lists(), params] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  calendario: (params?: QueryParams) => [...KEYS.all, 'calendario', params] as const,
};

export function useReservas(params?: QueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => reservasService.getAll(params),
  });
}

export function useReserva(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => reservasService.getById(id),
    enabled: !!id,
  });
}

export function useCalendarioReservas(params?: QueryParams) {
  return useQuery({
    queryKey: KEYS.calendario(params),
    queryFn: () => reservasService.getCalendario(params),
  });
}

export function useCreateReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Reserva>) => reservasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useChangeEstadoReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      reservasService.changeEstado(id, estado),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: KEYS.lists() });
    },
  });
}

export function useCancelReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservasService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
