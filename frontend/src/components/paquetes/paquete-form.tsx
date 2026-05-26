'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { createPaquete, updatePaquete } from '@/services/paquetes.service';
import type { Paquete } from '@/types/paquete';

interface PaqueteFormProps {
  paquete?: Paquete;
  isAdmin?: boolean;
  /** Base path for redirect after save, e.g. "/admin/paquetes" */
  basePath?: string;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractList(data: any): any[] {
  const raw = data?.data?.data ?? data?.data ?? data?.items ?? data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export function PaqueteForm({
  paquete,
  isAdmin = false,
  basePath = '/admin/paquetes',
}: PaqueteFormProps) {
  const router = useRouter();
  const [hospedajes, setHospedajes] = useState<any[]>([]);
  const [habitaciones, setHabitaciones] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);

  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 365 * 24 * 3600e3).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    nombre: paquete?.nombre ?? '',
    slug: paquete?.slug ?? '',
    descripcion: paquete?.descripcion ?? '',
    hospedajeId: paquete?.hospedajeId ?? '',
    habitacionId: paquete?.habitacionId ?? '',
    actividadId: paquete?.actividadId ?? '',
    vehiculoId: paquete?.vehiculoId ?? '',
    diasDuracion: paquete?.diasDuracion ?? 3,
    noches: paquete?.noches ?? 3,
    descuentoPorcentaje: paquete?.descuentoPorcentaje ?? 0,
    isFeatured: paquete?.isFeatured ?? false,
    validoDesde: paquete?.validoDesde?.slice(0, 10) ?? today,
    validoHasta: paquete?.validoHasta?.slice(0, 10) ?? nextYear,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dropdowns on mount
  useEffect(() => {
    api
      .get('/hospedajes', { params: { limit: 100 } })
      .then((r) => setHospedajes(extractList(r.data)))
      .catch(() => setHospedajes([]));

    api
      .get('/actividades', { params: { limit: 100 } })
      .then((r) => setActividades(extractList(r.data)))
      .catch(() => setActividades([]));

    api
      .get('/vehiculos', { params: { limit: 100 } })
      .then((r) => setVehiculos(extractList(r.data)))
      .catch(() => setVehiculos([]));
  }, []);

  // Load habitaciones when hospedajeId changes
  useEffect(() => {
    if (!form.hospedajeId) {
      setHabitaciones([]);
      return;
    }
    api
      .get(`/hospedajes/${form.hospedajeId}/habitaciones`)
      .then((r) => {
        const list = extractList(r.data);
        setHabitaciones(list);
      })
      .catch(() => setHabitaciones([]));
  }, [form.hospedajeId]);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        actividadId: form.actividadId || undefined,
        vehiculoId: form.vehiculoId || undefined,
        descuentoPorcentaje: Number(form.descuentoPorcentaje),
        diasDuracion: Number(form.diasDuracion),
        noches: Number(form.noches),
        validoDesde: new Date(form.validoDesde).toISOString(),
        validoHasta: new Date(form.validoHasta).toISOString(),
      };
      if (paquete) {
        await updatePaquete(paquete.id, payload as any);
      } else {
        await createPaquete(payload as any);
      }
      router.push(basePath);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar'));
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors bg-white disabled:bg-navy-50 disabled:cursor-not-allowed';
  const labelCls = 'block text-sm font-body font-medium text-navy-700 mb-1.5';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-card p-8 space-y-6 max-w-3xl"
    >
      {/* Nombre + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nombre</label>
          <input
            className={inputCls}
            value={form.nombre}
            onChange={(e) => {
              setField('nombre', e.target.value);
              if (!paquete) setField('slug', slugify(e.target.value));
            }}
            placeholder="Aventura en las montañas"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Slug (URL)</label>
          <input
            className={inputCls}
            value={form.slug}
            onChange={(e) => setField('slug', e.target.value)}
            placeholder="aventura-montanas"
            required
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          className={inputCls + ' min-h-[100px] resize-y'}
          value={form.descripcion}
          onChange={(e) => setField('descripcion', e.target.value)}
          placeholder="Describe qué hace especial a este paquete..."
          required
        />
      </div>

      {/* Hospedaje + Habitación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Hospedaje</label>
          <select
            className={inputCls}
            value={form.hospedajeId}
            onChange={(e) => {
              setField('hospedajeId', e.target.value);
              setField('habitacionId', '');
            }}
            required
          >
            <option value="">— Seleccionar —</option>
            {hospedajes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre} ({h.provincia ?? h.ciudad ?? ''})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Habitación</label>
          <select
            className={inputCls}
            value={form.habitacionId}
            onChange={(e) => setField('habitacionId', e.target.value)}
            required
            disabled={!form.hospedajeId || habitaciones.length === 0}
          >
            <option value="">— Seleccionar —</option>
            {habitaciones.map((h: any) => (
              <option key={h.id} value={h.id}>
                {h.nombre} ({h.tipo ?? ''})
              </option>
            ))}
          </select>
          {form.hospedajeId && habitaciones.length === 0 && (
            <p className="text-xs text-navy-400 mt-1">
              Este hospedaje no tiene habitaciones registradas.
            </p>
          )}
        </div>
      </div>

      {/* Actividad + Vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Actividad (opcional)</label>
          <select
            className={inputCls}
            value={form.actividadId ?? ''}
            onChange={(e) => setField('actividadId', e.target.value)}
          >
            <option value="">— Ninguna —</option>
            {actividades.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Vehículo (opcional)</label>
          <select
            className={inputCls}
            value={form.vehiculoId ?? ''}
            onChange={(e) => setField('vehiculoId', e.target.value)}
          >
            <option value="">— Ninguno —</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.marca} {v.modelo} ({v.placa})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Días / Noches / Descuento / Featured */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Días</label>
          <input
            type="number"
            min={1}
            max={30}
            className={inputCls}
            value={form.diasDuracion}
            onChange={(e) => setField('diasDuracion', Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Noches</label>
          <input
            type="number"
            min={0}
            max={29}
            className={inputCls}
            value={form.noches}
            onChange={(e) => setField('noches', Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Descuento %</label>
          <input
            type="number"
            min={0}
            max={50}
            step={0.5}
            className={inputCls}
            value={form.descuentoPorcentaje}
            onChange={(e) => setField('descuentoPorcentaje', Number(e.target.value))}
          />
        </div>
        <div className="flex items-end pb-1">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm font-body text-navy-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setField('isFeatured', e.target.checked)}
                className="w-4 h-4 rounded border-navy-300 accent-gold-500"
              />
              Destacado
            </label>
          )}
        </div>
      </div>

      {/* Validez */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Válido desde</label>
          <input
            type="date"
            className={inputCls}
            value={form.validoDesde}
            onChange={(e) => setField('validoDesde', e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Válido hasta</label>
          <input
            type="date"
            className={inputCls}
            value={form.validoHasta}
            onChange={(e) => setField('validoHasta', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-navy-100/50">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50 font-body transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : paquete ? 'Guardar cambios' : 'Crear paquete'}
        </button>
      </div>
    </form>
  );
}
