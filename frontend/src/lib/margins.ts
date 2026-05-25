export interface Margins {
  hospedajes: number;
  actividades: number;
  transfers: number;
  vehiculos: number;
  global: number;
}

const DEFAULT_MARGINS: Margins = {
  hospedajes: 15,
  actividades: 12,
  transfers: 10,
  vehiculos: 10,
  global: 15,
};

export function getMargins(): Margins {
  if (typeof window === 'undefined') return DEFAULT_MARGINS;
  try {
    const saved = localStorage.getItem('admin-margins');
    return saved ? JSON.parse(saved) : DEFAULT_MARGINS;
  } catch {
    return DEFAULT_MARGINS;
  }
}

export function applyMargin(basePrice: number, serviceType: 'hospedajes' | 'actividades' | 'transfers' | 'vehiculos'): number {
  const margins = getMargins();
  const margin = margins[serviceType] || margins.global || 0;
  return basePrice * (1 + margin / 100);
}

export function getMarginPercent(serviceType: 'hospedajes' | 'actividades' | 'transfers' | 'vehiculos'): number {
  const margins = getMargins();
  return margins[serviceType] || margins.global || 0;
}
