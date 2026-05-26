'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPaqueteById } from '@/services/paquetes.service';
import { PaqueteForm } from '@/components/paquetes/paquete-form';
import type { Paquete } from '@/types/paquete';

export default function EditarPaquetePage() {
  const params = useParams<{ id: string }>();
  const [paquete, setPaquete] = useState<Paquete | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    getPaqueteById(params.id)
      .then((p) => setPaquete(p))
      .catch(() => setPaquete(null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!paquete) {
    return <p className="text-navy-400 font-body">Paquete no encontrado.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-800 mb-6">
        Editar paquete
      </h1>
      <PaqueteForm paquete={paquete} isAdmin basePath="/admin/paquetes" />
    </div>
  );
}
