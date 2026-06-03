'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Copy,
  Save,
  Eye,
  EyeOff,
  Plug,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { stripeAdminService } from '@/services/stripe-admin.service';

const modeLabel: Record<string, { text: string; cls: string }> = {
  test: { text: 'Test (sandbox)', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  live: { text: 'Live (producción)', cls: 'bg-green-50 text-green-700 border-green-200' },
  unset: { text: 'Sin configurar', cls: 'bg-red-50 text-red-700 border-red-200' },
  invalid: { text: 'Clave inválida', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const sourceLabel: Record<string, string> = {
  db: 'Configurada desde admin (BD cifrada)',
  env: 'Configurada por variables de entorno',
  mixed: 'Mixta: algunas claves en BD, otras en env vars',
};

export default function PasarelaConfigPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'stripe-status'],
    queryFn: () => stripeAdminService.getStatus(),
  });

  const [form, setForm] = useState({ secretKey: '', publicKey: '', webhookSecret: '' });
  const [show, setShow] = useState({ secret: false, webhook: false });
  const [confirmingLive, setConfirmingLive] = useState(false);

  const saveMut = useMutation({
    mutationFn: () =>
      stripeAdminService.updateConfig({
        secretKey: form.secretKey || undefined,
        publicKey: form.publicKey || undefined,
        webhookSecret: form.webhookSecret || undefined,
      }),
    onSuccess: () => {
      toast.success('Configuración guardada y cliente Stripe recargado');
      setForm({ secretKey: '', publicKey: '', webhookSecret: '' });
      setConfirmingLive(false);
      qc.invalidateQueries({ queryKey: ['admin', 'stripe-status'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const resetMut = useMutation({
    mutationFn: () => stripeAdminService.resetConfig(),
    onSuccess: () => {
      toast.success('Configuración eliminada. Volviendo a env vars.');
      qc.invalidateQueries({ queryKey: ['admin', 'stripe-status'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al resetear'),
  });

  const testMut = useMutation({
    mutationFn: () => stripeAdminService.testConnection(),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(`${r.message}${r.livemode ? ' (modo LIVE)' : ' (modo test)'}`);
      } else {
        toast.error(r.message);
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al probar conexión'),
  });

  // Detectar si hay claves Live en el form actual
  const hasLiveKey =
    form.secretKey.startsWith('sk_live_') || form.publicKey.startsWith('pk_live_');

  function handleSave() {
    if (hasLiveKey && !confirmingLive) {
      setConfirmingLive(true);
      toast('Estás guardando claves LIVE. Confirma con "Guardar de todas formas".', {
        icon: '⚠️',
      });
      return;
    }
    saveMut.mutate();
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copiado`),
      () => toast.error('No se pudo copiar'),
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-800">Pasarela de pago</h1>
          <p className="text-sm text-navy-400 font-body mt-1">
            <Link href="/admin/configuracion" className="text-gold-600 hover:text-gold-700">
              ← Volver a configuración
            </Link>
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-700 hover:bg-navy-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* Advertencia de seguridad */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm font-body text-amber-900 leading-relaxed">
            <strong>Aviso de seguridad.</strong> Las claves se guardan cifradas (AES-256-GCM) en la
            base de datos. Aún así, las variables de entorno son más seguras para producción —
            cualquier vulnerabilidad que dé acceso a la BD también puede exponer la clave de
            descifrado. <strong>Recomendación:</strong> usa esta UI solo para claves de TEST. En
            producción, deja las claves LIVE en variables de entorno del servidor.
          </div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-navy-400 font-body">Cargando estado...</p>}

      {data && (
        <div className="space-y-4">
          {/* Estado general */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-display font-bold text-navy-800">Estado actual</h2>
                <p className="text-sm text-navy-400 font-body mt-1">
                  {data.configured
                    ? 'La pasarela está lista para procesar pagos.'
                    : 'Faltan claves por configurar.'}
                </p>
                <p className="text-xs text-navy-400 font-body mt-2 italic">
                  Fuente: {sourceLabel[data.source] ?? data.source}
                </p>
              </div>
              {data.configured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Operativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold border border-red-200">
                  <XCircle className="w-3.5 h-3.5" />
                  No configurada
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-navy-100/50">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-navy-400 font-body mb-1">
                  Modo
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    modeLabel[data.mode]?.cls ?? 'bg-navy-50 text-navy-500'
                  }`}
                >
                  {modeLabel[data.mode]?.text ?? data.mode}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-navy-400 font-body mb-1">
                  Moneda
                </p>
                <span className="text-sm font-body text-navy-800 uppercase">{data.currency}</span>
              </div>
            </div>

            <div className="space-y-3 mt-5 pt-5 border-t border-navy-100/50">
              <KeyRow
                label="Secret key"
                envVar="STRIPE_SECRET_KEY"
                configured={data.secret.configured}
                masked={data.secret.masked}
              />
              <KeyRow
                label="Publishable key"
                envVar="STRIPE_PUBLIC_KEY"
                configured={data.public.configured}
                masked={data.public.masked}
              />
              <KeyRow
                label="Webhook signing secret"
                envVar="STRIPE_WEBHOOK_SECRET"
                configured={data.webhook.configured}
                masked={data.webhook.masked}
              />
            </div>

            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-navy-100/50">
              <button
                type="button"
                onClick={() => testMut.mutate()}
                disabled={testMut.isPending || !data.secret.configured}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-600 text-white text-sm font-body font-medium hover:bg-navy-700 disabled:opacity-50"
              >
                <Plug className={`w-4 h-4 ${testMut.isPending ? 'animate-pulse' : ''}`} />
                Probar conexión con Stripe
              </button>
              {data.source !== 'env' && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Borrar las claves guardadas en BD y volver a usar las de variables de entorno?')) {
                      resetMut.mutate();
                    }
                  }}
                  disabled={resetMut.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-body hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Borrar claves de BD
                </button>
              )}
            </div>
          </div>

          {/* Editor de claves */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-1">
              Actualizar claves
            </h2>
            <p className="text-sm text-navy-400 font-body mb-5">
              Pega las claves del{' '}
              <a
                href="https://dashboard.stripe.com/test/apikeys"
                target="_blank"
                rel="noreferrer"
                className="text-gold-600 hover:text-gold-700 underline"
              >
                Dashboard Stripe
              </a>
              . Solo se guardan los campos que llenas; los demás conservan su valor actual.
            </p>

            <div className="space-y-4">
              {/* Secret key */}
              <div>
                <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">
                  Secret key
                </label>
                <div className="relative">
                  <input
                    type={show.secret ? 'text' : 'password'}
                    value={form.secretKey}
                    onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
                    placeholder="sk_test_... o sk_live_..."
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-navy-200 text-sm font-mono text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, secret: !s.secret }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                  >
                    {show.secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.secretKey.startsWith('sk_live_') && (
                  <p className="text-xs text-red-600 font-body mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Esta es una clave LIVE. Procesará pagos reales.
                  </p>
                )}
              </div>

              {/* Public key */}
              <div>
                <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">
                  Publishable key
                </label>
                <input
                  type="text"
                  value={form.publicKey}
                  onChange={(e) => setForm({ ...form, publicKey: e.target.value })}
                  placeholder="pk_test_... o pk_live_..."
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-mono text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400"
                />
              </div>

              {/* Webhook secret */}
              <div>
                <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">
                  Webhook signing secret
                </label>
                <div className="relative">
                  <input
                    type={show.webhook ? 'text' : 'password'}
                    value={form.webhookSecret}
                    onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                    placeholder="whsec_..."
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-navy-200 text-sm font-mono text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, webhook: !s.webhook }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                  >
                    {show.webhook ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-navy-400 font-body mt-1">
                  En desarrollo: obtenerlo corriendo{' '}
                  <code className="bg-navy-50 px-1 rounded">
                    stripe listen --forward-to http://localhost:3002{data.webhook.endpointPath}
                  </code>
                </p>
              </div>

              {confirmingLive && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  <strong>Confirmación requerida.</strong> Estás a punto de guardar claves LIVE.
                  Stripe procesará pagos reales con esta configuración.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {confirmingLive && (
                  <button
                    type="button"
                    onClick={() => setConfirmingLive(false)}
                    className="px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    saveMut.isPending ||
                    (!form.secretKey && !form.publicKey && !form.webhookSecret)
                  }
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-white text-sm font-body font-semibold shadow-sm disabled:opacity-50 ${
                    confirmingLive
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {saveMut.isPending
                    ? 'Guardando...'
                    : confirmingLive
                      ? 'Guardar de todas formas'
                      : 'Guardar'}
                </button>
              </div>
            </div>
          </div>

          {/* Webhook info */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-2">Webhook</h2>
            <div className="bg-cream-100 rounded-lg p-3 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-navy-400 font-body mb-1">
                Ruta del endpoint
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-navy-800 break-all">
                  {data.webhook.endpointPath}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.webhook.endpointPath, 'Endpoint')}
                  className="shrink-0 text-navy-400 hover:text-navy-600"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-navy-400 font-body mb-2">
              Eventos procesados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.eventsHandled.map((ev) => (
                <code
                  key={ev}
                  className="text-[11px] font-mono bg-navy-50 text-navy-700 px-2 py-0.5 rounded"
                >
                  {ev}
                </code>
              ))}
            </div>
          </div>

          {/* Accesos directos */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-4">
              Accesos directos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://dashboard.stripe.com/test/apikeys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-navy-100 hover:bg-navy-50 transition-colors"
              >
                <span className="text-sm font-body text-navy-700">Mis claves API (test)</span>
                <ExternalLink className="w-3.5 h-3.5 text-navy-400" />
              </a>
              <a
                href="https://dashboard.stripe.com/test/payments"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-navy-100 hover:bg-navy-50 transition-colors"
              >
                <span className="text-sm font-body text-navy-700">Pagos (test)</span>
                <ExternalLink className="w-3.5 h-3.5 text-navy-400" />
              </a>
              <a
                href="https://stripe.com/docs/testing"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-navy-100 hover:bg-navy-50 transition-colors"
              >
                <span className="text-sm font-body text-navy-700">Tarjetas de prueba</span>
                <ExternalLink className="w-3.5 h-3.5 text-navy-400" />
              </a>
              <a
                href="https://stripe.com/docs/stripe-cli"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-navy-100 hover:bg-navy-50 transition-colors"
              >
                <span className="text-sm font-body text-navy-700">Stripe CLI (webhooks)</span>
                <ExternalLink className="w-3.5 h-3.5 text-navy-400" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyRow({
  label,
  envVar,
  configured,
  masked,
}: {
  label: string;
  envVar: string;
  configured: boolean;
  masked: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex items-center gap-3">
        {configured ? (
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        )}
        <div>
          <p className="text-sm font-body font-medium text-navy-800">{label}</p>
          <code className="text-[11px] font-mono text-navy-400">{envVar}</code>
        </div>
      </div>
      <div className="text-right">
        {configured ? (
          <code className="text-xs font-mono text-navy-700">{masked}</code>
        ) : (
          <span className="text-xs font-body text-red-500">No configurada</span>
        )}
      </div>
    </div>
  );
}
