'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Eye, EyeOff, Save, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { emailAdminService } from '@/services/email-admin.service';

export default function ConfigEmailPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin', 'email-status'],
    queryFn: () => emailAdminService.getStatus(),
  });

  const [form, setForm] = useState({
    provider: 'resend' as 'resend' | 'smtp',
    resendApiKey: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: '',
  });
  const [showKeys, setShowKeys] = useState(false);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: any = { provider: form.provider, fromEmail: form.fromEmail || undefined, fromName: form.fromName || undefined };
      if (form.provider === 'resend') {
        if (form.resendApiKey) payload.resendApiKey = form.resendApiKey;
      } else {
        if (form.smtpHost) payload.smtpHost = form.smtpHost;
        if (form.smtpPort) payload.smtpPort = form.smtpPort;
        if (form.smtpUser) payload.smtpUser = form.smtpUser;
        if (form.smtpPass) payload.smtpPass = form.smtpPass;
      }
      return emailAdminService.updateConfig(payload);
    },
    onSuccess: () => {
      toast.success('Configuracion guardada');
      qc.invalidateQueries({ queryKey: ['admin', 'email-status'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const testMut = useMutation({
    mutationFn: () => emailAdminService.test(),
    onSuccess: (r) => {
      if (r.ok) toast.success(`Email de prueba enviado (id: ${r.id ?? '-'})`);
      else toast.error(r.error ?? 'Error al enviar');
    },
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy-800">Email transaccional</h1>
        <p className="text-sm text-navy-400 font-body mt-1">
          <Link href="/admin/configuracion" className="text-gold-600">&larr; Volver a configuracion</Link>
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm font-body text-amber-900">
          Las claves se guardan cifradas (AES-256-GCM) en la base de datos. Las usamos para enviar emails de verificacion, password reset, y notificaciones de pago.
        </div>
      </div>

      {data && (
        <>
          <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-display font-bold text-navy-800">Estado actual</h2>
                <p className="text-sm text-navy-400 font-body mt-1">Provider: <strong>{data.provider}</strong></p>
                <p className="text-sm text-navy-400 font-body">From: <strong>{data.fromName} &lt;{data.fromEmail}&gt;</strong></p>
              </div>
              {data.configured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />Operativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold border border-red-200">
                  <XCircle className="w-3.5 h-3.5" />Sin configurar
                </span>
              )}
            </div>
            {data.resendKeyMasked && <p className="mt-3 text-xs text-navy-500"><strong>Resend API key:</strong> <code className="font-mono">{data.resendKeyMasked}</code></p>}
            {data.smtpHost && <p className="text-xs text-navy-500"><strong>SMTP:</strong> {data.smtpUserMasked} @ {data.smtpHost}:{data.smtpPort}</p>}

            <div className="mt-5 pt-5 border-t border-navy-100/50">
              <button onClick={() => testMut.mutate()} disabled={!data.configured || testMut.isPending} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-600 text-white text-sm font-body font-medium hover:bg-navy-700 disabled:opacity-50">
                <Send className="w-4 h-4" />
                {testMut.isPending ? 'Enviando...' : 'Enviar email de prueba'}
              </button>
              <p className="text-xs text-navy-400 mt-1">Llegara a tu email de admin.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-base font-display font-bold text-navy-800 mb-4">Actualizar configuracion</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">Provider</label>
                <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as any })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body text-navy-800">
                  <option value="resend">Resend (recomendado)</option>
                  <option value="smtp">SMTP generico</option>
                </select>
              </div>

              {form.provider === 'resend' ? (
                <div>
                  <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">Resend API key</label>
                  <div className="relative">
                    <input type={showKeys ? 'text' : 'password'} value={form.resendApiKey} onChange={(e) => setForm({ ...form, resendApiKey: e.target.value })} placeholder="re_..." className="w-full px-3 py-2 pr-10 rounded-lg border border-navy-200 text-sm font-mono text-navy-800" />
                    <button type="button" onClick={() => setShowKeys((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-400">
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-navy-400 mt-1">Obten la clave en <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-gold-600">resend.com/api-keys</a>.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">SMTP Host</label>
                      <input value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                    </div>
                    <div>
                      <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">Port</label>
                      <input type="number" value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">SMTP user</label>
                    <input value={form.smtpUser} onChange={(e) => setForm({ ...form, smtpUser: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">SMTP password</label>
                    <input type={showKeys ? 'text' : 'password'} value={form.smtpPass} onChange={(e) => setForm({ ...form, smtpPass: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">From email</label>
                  <input value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} placeholder="noreply@turidove.com" className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-navy-700 mb-1.5">From name</label>
                  <input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="TuriDove" className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body" />
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-body font-semibold shadow-sm disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saveMut.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
