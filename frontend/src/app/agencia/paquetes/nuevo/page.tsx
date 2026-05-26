import { PaqueteForm } from '@/components/paquetes/paquete-form';

export default function NuevoPaqueteAgenciaPage() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-800 mb-6">
        Nuevo paquete
      </h1>
      <PaqueteForm basePath="/agencia/paquetes" />
    </div>
  );
}
