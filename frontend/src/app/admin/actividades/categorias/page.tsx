'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { categoriasActividadService } from '@/services/categorias-actividad.service';
import type { CategoriaActividad } from '@/types';

export default function AdminCategoriasActividadPage() {
  const qc = useQueryClient();
  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['admin', 'categorias-actividad'],
    queryFn: () => categoriasActividadService.getAll({ soloActivas: false }),
  });

  const [editing, setEditing] = useState<CategoriaActividad | null>(null);
  const [form, setForm] = useState({ nombre: '', icono: '', descripcion: '', activo: true });

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', icono: '', descripcion: '', activo: true });
  }

  function openEdit(c: CategoriaActividad) {
    setEditing(c);
    setForm({
      nombre: c.nombre,
      icono: c.icono ?? '',
      descripcion: c.descripcion ?? '',
      activo: c.activo,
    });
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre,
        icono: form.icono || undefined,
        descripcion: form.descripcion || undefined,
        activo: form.activo,
      };
      if (editing) return categoriasActividadService.update(editing.id, payload);
      return categoriasActividadService.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Categoría actualizada' : 'Categoría creada');
      qc.invalidateQueries({ queryKey: ['admin', 'categorias-actividad'] });
      setEditing(null);
      setForm({ nombre: '', icono: '', descripcion: '', activo: true });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => categoriasActividadService.remove(id),
    onSuccess: () => {
      toast.success('Categoría eliminada');
      qc.invalidateQueries({ queryKey: ['admin', 'categorias-actividad'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al eliminar'),
  });

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-800">Categorías de actividades</h1>
          <p className="text-sm text-navy-400 font-body mt-1">
            <Link href="/admin/actividades" className="text-gold-600 hover:text-gold-700">
              ← Volver a actividades
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold shadow-sm hover:from-gold-500 hover:to-gold-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <p className="text-sm text-navy-400">Cargando...</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-navy-100/50">
              <table className="w-full">
                <thead className="bg-cream-100 border-b border-navy-100/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Nombre</th>
                    <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Slug</th>
                    <th className="text-left px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Estado</th>
                    <th className="text-right px-4 py-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-navy-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((c) => (
                    <tr key={c.id} className="border-b border-navy-100/30 hover:bg-navy-50/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-body text-navy-700">{c.nombre}</td>
                      <td className="px-4 py-3 text-xs font-mono text-navy-500">{c.slug}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${c.activo ? 'bg-green-50 text-green-700' : 'bg-navy-100 text-navy-500'}`}>
                          {c.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(c)} className="text-navy-600 hover:text-navy-800" aria-label="Editar">
                          <Pencil className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => confirm('¿Eliminar esta categoría?') && deleteMut.mutate(c.id)}
                          className="text-red-600 hover:text-red-700"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categorias.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-navy-400 font-body py-12 text-sm">
                        Sin categorías.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-base font-display font-bold text-navy-800 mb-4">
            {editing ? 'Editar' : 'Nueva'} categoría
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-body font-medium text-navy-700 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-800"
                placeholder="Ej. Aventura"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-navy-700 mb-1">Icono (lucide)</label>
              <input
                value={form.icono}
                onChange={(e) => setForm({ ...form, icono: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-800"
                placeholder="mountain, sun, tree-pine..."
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-navy-700 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-800"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-body text-navy-700">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Activa
            </label>
            <div className="flex justify-end gap-2 pt-2">
              {editing && (
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => saveMut.mutate()}
                disabled={!form.nombre || saveMut.isPending}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold disabled:opacity-50"
              >
                {saveMut.isPending ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
