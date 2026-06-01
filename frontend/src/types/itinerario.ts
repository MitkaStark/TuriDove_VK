export type { ItinerarioItem } from './index';

export interface ItinerarioItemPayload {
  dia: number;
  titulo: string;
  descripcion: string;
  lat?: number;
  lng?: number;
  nombreUbicacion?: string;
}
