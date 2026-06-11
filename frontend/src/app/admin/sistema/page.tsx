'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RefreshCcw, Activity, Database, Server, Mail, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sistemaService } from '@/services/sistema.service';
import { PageHeader } from '@/components/shared/page-header';

function HealthCard({ icon: Icon, label, ok, subtitle }: { icon: any; label: string; ok: boolean; subtitle?: string }) {
  return (
    <div className={`rounded-2xl shadow-card p-4 border ${ok ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${ok ? 'text-green-600' : 'text-red-600'}`} />
        {ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
      </div>
      <p className="mt-2 text-sm font-display font-semibold text-navy-800">{label}</p>
      <p className="text-xs text-navy-400 font-body">{subtitle ?? ''}</p>
    </div>
  );
}

export default function SistemaPage() {
  const qc = useQueryClient();
  const [eventStatus, setEventStatus] = useState<'all' | 'failed' | 'ok'>('failed');
  const [emailStatus, setEmailStatus] = useState<'all' | 'sent' | 'failed'>('all');

  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ['sistema', 'health'],
    queryFn: () => sistemaService.getHealth(),
    refetchInterval: 15_000,
  });

  const { data: events } = useQuery({
    queryKey: ['sistema', 'stripe-events', eventStatus],
    queryFn: () => sistemaService.listStripeEvents(eventStatus),
  });

  const { data: emails } = useQuery({
    queryKey: ['sistema', 'email-logs', emailStatus],
    queryFn: () => sistemaService.listEmailLogs(emailStatus),
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => sistemaService.retryStripeEvent(id),
    onSuccess: () => {
      toast.success('Evento reintentado');
      qc.invalidateQueries({ queryKey: ['sistema', 'stripe-events'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al reintentar'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Sistema" description="Estado de servicios + webhooks Stripe + emails" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard icon={Database} label="Base de datos" ok={health?.checks.database.ok ?? false} subtitle={`${health?.checks.database.latencyMs ?? '—'}ms`} />
        <HealthCard icon={Server} label="Redis" ok={health?.checks.redis.ok ?? false} subtitle={`${health?.checks.redis.latencyMs ?? '—'}ms`} />
        <HealthCard icon={CreditCard} label="Stripe" ok={health?.checks.stripe?.configured ?? false} subtitle={health?.checks.stripe?.mode ?? '—'} />
        <HealthCard icon={Mail} label="Email" ok={health?.checks.email?.configured ?? false} subtitle={health?.checks.email?.provider ?? '—'} />
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5">
        <h2 className="flex items-center gap-2 text-base font-display font-bold text-navy-800 mb-4">
          <Activity className="w-5 h-5 text-gold-500" />Colas BullMQ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {health?.checks.queues && Object.entries(health.checks.queues).map(([name, counts]) => (
            <div key={name} className="border border-navy-100/50 rounded-xl p-4">
              <p className="text-sm font-display font-semibold text-navy-800">{name}</p>
              <div className="mt-2 grid grid-cols-5 gap-2 text-xs font-body text-navy-500">
                {['waiting', 'active', 'delayed', 'completed', 'failed'].map((k) => (
                  <div key={k} className="text-center">
                    <div className={`text-base font-bold ${k === 'failed' && (counts[k] ?? 0) > 0 ? 'text-red-600' : 'text-navy-700'}`}>{counts[k] ?? 0}</div>
                    <div className="capitalize">{k}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-navy-400">
          <span><Clock className="inline w-3 h-3 mr-1" />Uptime: {Math.floor((health?.uptimeSeconds ?? 0) / 60)} min</span>
          <button onClick={() => refetchHealth()} className="inline-flex items-center gap-1 text-gold-600 hover:underline">
            <RefreshCcw className="w-3 h-3" />Actualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-display font-bold text-navy-800">
            <CreditCard className="w-5 h-5 text-gold-500" />Webhooks Stripe
          </h2>
          <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value as any)} className="text-xs border border-navy-200 rounded-lg px-2 py-1">
            <option value="failed">Solo fallidos</option>
            <option value="ok">Solo exitosos</option>
            <option value="all">Todos</option>
          </select>
        </div>
        {events && events.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="text-navy-400 text-left">
              <tr><th className="py-1.5">Tipo</th><th>Stripe Event ID</th><th>Procesado</th><th>Estado</th><th>Reintentos</th><th></th></tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t border-navy-100/40">
                  <td className="py-1.5 font-body text-navy-700">{ev.type}</td>
                  <td className="font-mono text-navy-500">{ev.stripeEventId.slice(0, 18)}...</td>
                  <td className="text-navy-500">{new Date(ev.processedAt).toLocaleString('es-PA')}</td>
                  <td>
                    {ev.processedSuccessfully ? (
                      <span className="text-green-700">OK</span>
                    ) : (
                      <span title={ev.errorMessage ?? ''} className="text-red-700">FALLO</span>
                    )}
                  </td>
                  <td className="text-navy-500">{ev.retries}</td>
                  <td>
                    {!ev.processedSuccessfully && (
                      <button
                        onClick={() => retryMut.mutate(ev.id)}
                        disabled={retryMut.isPending}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                      >
                        <RefreshCcw className="w-3 h-3" />Reintentar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-navy-400 font-body italic">Sin eventos en este filtro.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-display font-bold text-navy-800">
            <Mail className="w-5 h-5 text-gold-500" />Emails recientes
          </h2>
          <select value={emailStatus} onChange={(e) => setEmailStatus(e.target.value as any)} className="text-xs border border-navy-200 rounded-lg px-2 py-1">
            <option value="all">Todos</option>
            <option value="sent">Solo enviados</option>
            <option value="failed">Solo fallidos</option>
          </select>
        </div>
        {emails && emails.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="text-navy-400 text-left">
              <tr><th className="py-1.5">Plantilla</th><th>Para</th><th>Asunto</th><th>Estado</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {emails.slice(0, 50).map((em) => (
                <tr key={em.id} className="border-t border-navy-100/40">
                  <td className="py-1.5 font-body text-navy-700">{em.template}</td>
                  <td className="font-mono text-navy-500">{em.toEmail}</td>
                  <td className="text-navy-700">{em.subject}</td>
                  <td>
                    {em.status === 'sent' ? (
                      <span className="text-green-700">SENT</span>
                    ) : (
                      <span title={em.errorMsg ?? ''} className="text-red-700">FAIL</span>
                    )}
                  </td>
                  <td className="text-navy-500">{new Date(em.createdAt).toLocaleString('es-PA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-navy-400 font-body italic">Sin emails en este filtro.</p>
        )}
      </div>
    </div>
  );
}
