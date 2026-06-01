import { api } from '@/lib/axios';
import type { ItinerarioItem } from '@/types';
import type { ItinerarioItemPayload } from '@/types/itinerario';

export const itinerarioService = {
  async list(actividadId: string) {
    const { data } = await api.get(`/actividades/${actividadId}/itinerario`);
    return data as ItinerarioItem[];
  },

  async replace(actividadId: string, items: ItinerarioItemPayload[]) {
    const { data } = await api.put(`/actividades/${actividadId}/itinerario`, { items });
    return data as ItinerarioItem[];
  },
};
