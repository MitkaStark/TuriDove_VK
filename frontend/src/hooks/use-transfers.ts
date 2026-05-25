import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersService } from '@/services/transfers.service';
import type { QueryParams, Transfer } from '@/types';

const KEYS = {
  all: ['transfers'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (params?: QueryParams) => [...KEYS.lists(), params] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  mine: () => [...KEYS.all, 'mine'] as const,
};

export function useTransfers(params?: QueryParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => transfersService.getAll(params),
  });
}

export function useTransfer(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => transfersService.getById(id),
    enabled: !!id,
  });
}

export function useMisTransfers() {
  return useQuery({
    queryKey: KEYS.mine(),
    queryFn: () => transfersService.getMine(),
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Transfer>) => transfersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transfer> }) =>
      transfersService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: KEYS.lists() });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
