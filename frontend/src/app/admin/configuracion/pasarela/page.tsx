'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, RefreshCw, Copy } from 'lucide-react';
import { stripeAdminService } from '@/services/stripe-admin.service';
import toast from 'react-hot-toast';

export default function PasarelaConfigPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'stripe-status'],
    queryFn: () => stripeAdminService.getStatus(),
  });

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copiado al portapapeles`),
      () => toast.error('No se pudo copiar'),
    );
  }

  const modeLabel: Record<string, { text: string; cls: string }> = {
    test: { text: 'Test (sandbox)', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    live: { text: 'Live (producción)', cls: 'bg-green-50 text-green-700 border-green-200' },
    unset: { text: 'Sin configurar', cls: 'bg-red-50 text-red-700 border-red-200' },
    invalid: { text: 'Clave inválida', cls: 'bg-red-50 text-red-700 border-red-200' },
  };

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

      {/* Aviso de seguridad */}
      <div className="bg-cream-100 border border-navy-100/50 rounded-2xl p-5 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
          <div className="text-sm font-body text-navy-700 leading-relaxed">
            Las claves de Stripe se configuran a nivel de servidor (variables de entorno), no desde
            esta pantalla. Es un estándar de seguridad: las claves nunca tocan la base de datos.
            Esta sección solo muestra el estado actual.
            <br />
            <Link
              href="/STRIPE.md"
              target="_blank"
              className="text-gold-600 hover:text-gold-700 font-semibold inline-flex items-center gap-1 mt-2"
            >
              Ver guía de activación (STRIPE.md) <ExternalLink className="w-3 h-3" />
            </Link>
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
                <h2 className="text-base font-display font-bold text-navy-800">Estado general</h2>
                <p className="text-sm text-navy-400 font-body mt-1">
                  {data.configured
                    ? 'La pasarela está lista para procesar pagos.'
                    : 'Faltan claves por configurar. El endpoint /pagos/checkout responderá con error.'}
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
          </div>

          {/* Claves */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-4">Claves</h2>
            <div className="space-y-3">
              <KeyRow label="Secret key (servidor)" configured={data.secret.configured} masked={data.secret.masked} envVar="STRIPE_SECRET_KEY" />
              <KeyRow label="Publishable key" configured={data.public.configured} masked={data.public.masked} envVar="STRIPE_PUBLIC_KEY" />
              <KeyRow label="Webhook signing secret" configured={data.webhook.configured} masked={data.webhook.masked} envVar="STRIPE_WEBHOOK_SECRET" />
            </div>
          </div>

          {/* Webhook */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-2">Webhook</h2>
            <p className="text-sm text-navy-400 font-body mb-4">
              Stripe envía eventos a esta ruta cuando un pago se completa, expira, falla o se reembolsa.
            </p>

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
                  aria-label="Copiar"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-navy-400 font-body mt-1">
                En desarrollo: usa <code className="bg-white px-1 rounded">stripe listen --forward-to http://localhost:3002{data.webhook.endpointPath}</code>.
                <br />
                En producción: configura un endpoint en Stripe Dashboard apuntando a <code className="bg-white px-1 rounded">https://tu-dominio.com{data.webhook.endpointPath}</code>.
              </p>
            </div>

            <p className="text-[10px] uppercase tracking-wider text-navy-400 font-body mb-2">
              Eventos procesados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.eventsHandled.map((ev) => (
                <code key={ev} className="text-[11px] font-mono bg-navy-50 text-navy-700 px-2 py-0.5 rounded">
                  {ev}
                </code>
              ))}
            </div>
          </div>

          {/* Redirects */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-4">
              URLs de redirección
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-navy-400 font-body mb-1">
                  Pago exitoso
                </p>
                <code className="text-xs font-mono text-navy-700 break-all">
                  {data.redirects.successUrl || '(sin configurar)'}
                </code>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-navy-400 font-body mb-1">
                  Pago cancelado
                </p>
                <code className="text-xs font-mono text-navy-700 break-all">
                  {data.redirects.cancelUrl || '(sin configurar)'}
                </code>
              </div>
            </div>
            <p className="text-[11px] text-navy-400 font-body mt-3">
              <code>{'{RESERVA_ID}'}</code> se reemplaza por el id de la reserva al momento del checkout.
            </p>
          </div>

          {/* Accesos directos */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-4">Accesos directos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-navy-100 hover:bg-navy-50 transition-colors"
              >
                <span className="text-sm font-body text-navy-700">Dashboard Stripe</span>
                <ExternalLink className="w-3.5 h-3.5 text-navy-400" />
              </a>
              <a
                href="https://dashboard.stripe.com/test/apikeys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-navy-100 hover:bg-navy-50 transition-colors"
              >
                <span className="text-sm font-body text-navy-700">Mis claves API</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyRow({
  label,
  configured,
  masked,
  envVar,
}: {
  label: string;
  configured: boolean;
  masked: string | null;
  envVar: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
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
