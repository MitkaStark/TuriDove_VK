'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { itinerarioService } from '@/services/itinerario.service';
import type { ItinerarioItemPayload } from '@/types/itinerario';
import toast from 'react-hot-toast';

interface Props {
  actividadId: string;
  initialItems?: ItinerarioItemPayload[];
  onChange?: (items: ItinerarioItemPayload[]) => void;
}

export function ItinerarioEditor({ actividadId, initialItems = [], onChange }: Props) {
  const [items, setItems] = useState<ItinerarioItemPayload[]>(initialItems);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onChange?.(items);
  }, [items, onChange]);

  function addDay() {
    const nextDay = items.length === 0 ? 1 : Math.max(...items.map((i) => i.dia)) + 1;
    setItems([...items, { dia: nextDay, titulo: '', descripcion: '' }]);
  }

  function updateItem(idx: number, patch: Partial<ItinerarioItemPayload>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!actividadId) {
      toast.error('Guarda primero la actividad para poder editar el itinerario');
      return;
    }
    const dias = items.map((i) => i.dia);
    if (new Set(dias).size !== dias.length) {
      toast.error('Hay días duplicados en el itinerario');
      return;
    }

    setSaving(true);
    try {
      await itinerarioService.replace(actividadId, items);
      toast.success('Itinerario guardado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar itinerario');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-display font-bold text-navy-800">Itinerario</h3>
        <button
          type="button"
          onClick={addDay}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-50 text-gold-700 text-sm font-body font-medium hover:bg-gold-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar día
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-navy-400 font-body py-6 text-center border border-dashed border-navy-200 rounded-lg">
          Sin etapas. Pulsa "Agregar día" para comenzar.
        </p>
      )}

      <div className="space-y-3">
        {items
          .slice()
          .sort((a, b) => a.dia - b.dia)
          .map((it, idx) => (
            <div key={idx} className="bg-cream-100 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">Día</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={it.dia}
                    onChange={(e) => updateItem(idx, { dia: Number(e.target.value) })}
                    className="w-16 px-2 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800 text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">Título</label>
                  <input
                    type="text"
                    value={it.titulo}
                    onChange={(e) => updateItem(idx, { titulo: e.target.value })}
                    placeholder="Ej. Llegada y bienvenida"
                    className="w-full px-3 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="shrink-0 mt-5 text-red-500 hover:text-red-600 transition-colors"
                  aria-label="Eliminar día"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">Descripción</label>
                <textarea
                  value={it.descripcion}
                  onChange={(e) => updateItem(idx, { descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">Lugar</label>
                  <input
                    type="text"
                    value={it.nombreUbicacion ?? ''}
                    onChange={(e) => updateItem(idx, { nombreUbicacion: e.target.value || undefined })}
                    placeholder="Opcional"
                    className="w-full px-2 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">Lat</label>
                  <input
                    type="number"
                    step="any"
                    value={it.lat ?? ''}
                    onChange={(e) => updateItem(idx, { lat: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="-90 a 90"
                    className="w-full px-2 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-navy-400 mb-1">Lng</label>
                  <input
                    type="number"
                    step="any"
                    value={it.lng ?? ''}
                    onChange={(e) => updateItem(idx, { lng: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="-180 a 180"
                    className="w-full px-2 py-1.5 rounded-md border border-navy-200 text-sm font-body text-navy-800"
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !actividadId}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold hover:from-gold-500 hover:to-gold-600 transition-all shadow-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar itinerario'}
        </button>
      </div>
    </div>
  );
}
