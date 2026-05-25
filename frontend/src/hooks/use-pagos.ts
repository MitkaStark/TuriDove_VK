import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagosService } from '@/services/pagos.service';
import type { QueryParams, Pago } from '@/types';

const KEYS = {
  all: ['pagos'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (params?: QueryParams) => [...KEYS.lists(), params] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  byReserva: (reservaId: string) => [...KEYS.all, 'reserva', reservaId] as const,
};

export function usePagos(params?: QueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => pagosService.getAll(params),
  });
}

export function usePago(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => pagosService.getById(id),
    enabled: !!id,
  });
}

export function usePagosByReserva(reservaId: string) {
  return useQuery({
    queryKey: KEYS.byReserva(reservaId),
    queryFn: () => pagosService.getByReserva(reservaId),
    enabled: !!reservaId,
  });
}

export function useCreatePago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pago>) => pagosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
