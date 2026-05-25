import { api } from '@/lib/axios';
import type {
  ResumenFinanciero,
  Comision,
  Liquidacion,
  ReporteIngresos,
  ReporteReservas,
  PaginatedResponse,
  QueryParams,
} from '@/types';

export const financieroService = {
  async getResumen(params?: QueryParams): Promise<ResumenFinanciero> {
    const { data } = await api.get('/financiero/resumen', { params });
    return data;
  },

  async getComisiones(params?: QueryParams): Promise<PaginatedResponse<Comision>> {
    const { data } = await api.get('/financiero/comisiones', { params });
    return data;
  },

  async getLiquidaciones(params?: QueryParams): Promise<PaginatedResponse<Liquidacion>> {
    const { data } = await api.get('/financiero/liquidaciones', { params });
    return data;
  },

  async liquidar(comisionId: string): Promise<Liquidacion> {
    const { data } = await api.post(`/financiero/comisiones/${comisionId}/liquidar`);
    return data;
  },

  async getReporteIngresos(desde: string, hasta: string): Promise<ReporteIngresos[]> {
    const { data } = await api.get('/financiero/reportes/ingresos', {
      params: { desde, hasta },
    });
    return data;
  },

  async getReporteReservas(desde: string, hasta: string): Promise<ReporteReservas[]> {
    const { data } = await api.get('/financiero/reportes/reservas', {
      params: { desde, hasta },
    });
    return data;
  },
};
