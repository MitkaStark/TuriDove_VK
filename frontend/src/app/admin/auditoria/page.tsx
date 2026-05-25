"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";

const accionColor: Record<string, string> = { CREATE: "bg-green-100 text-green-800", UPDATE: "bg-blue-100 text-blue-800", DELETE: "bg-red-100 text-red-800", LOGIN: "bg-purple-100 text-purple-800" };

export default function AdminAuditoriaPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "auditoria", search],
    queryFn: async () => { const { data } = await api.get('/auditoria', { params: { search: search || undefined, limit: 50 } }); return data; },
  });

  const items = (data as any)?.data || data || [];

  const columns: DataTableColumn<any>[] = [
    { key: "accion", header: "Accion", render: (l) => <Badge variant="outline" className={accionColor[l.accion] || ""}>{l.accion}</Badge> },
    { key: "entidad", header: "Entidad" },
    { key: "entidadId", header: "ID Entidad", render: (l) => <span className="font-mono text-xs">{l.entidadId?.substring(0, 8)}...</span> },
    { key: "user", header: "Usuario", render: (l) => l.user ? `${l.user.nombre} ${l.user.apellido}` : "-" },
    { key: "ip", header: "IP", render: (l) => l.ip || "-" },
    { key: "createdAt", header: "Fecha", render: (l) => new Date(l.createdAt).toLocaleString("es-PA") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" description="Registro de actividad del sistema" />
      <DataTable columns={columns} data={Array.isArray(items) ? items : []} loading={isLoading} onSearch={setSearch} searchValue={search} searchPlaceholder="Buscar..." emptyMessage="No hay registros de auditoria" />
    </div>
  );
}
