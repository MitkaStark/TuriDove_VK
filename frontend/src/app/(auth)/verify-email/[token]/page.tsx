'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';

export default function VerifyEmailTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    authService
      .verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch((e: any) => {
        setStatus('fail');
        setError(e?.response?.data?.message ?? 'Token inválido o expirado');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-gold-500 mx-auto animate-spin" />
            <h1 className="mt-4 text-xl font-display font-bold text-navy-800">Verificando tu email...</h1>
          </>
        )}
        {status === 'ok' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h1 className="mt-4 text-xl font-display font-bold text-navy-800">¡Email verificado!</h1>
            <p className="mt-2 text-sm text-navy-400 font-body">Tu cuenta está lista. Ya puedes iniciar sesión.</p>
            <button onClick={() => router.push('/login')} className="mt-5 inline-flex px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold">
              Ir al login
            </button>
          </>
        )}
        {status === 'fail' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h1 className="mt-4 text-xl font-display font-bold text-navy-800">No se pudo verificar</h1>
            <p className="mt-2 text-sm text-navy-400 font-body">{error}</p>
            <button onClick={() => router.push('/verify-email')} className="mt-5 inline-flex px-5 py-2 rounded-full border border-navy-200 text-sm text-navy-700">
              Solicitar nuevo link
            </button>
          </>
        )}
      </div>
    </div>
  );
}
