'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get('email') ?? '';
  const justRegistered = !!prefilledEmail;

  const [email, setEmail] = useState(prefilledEmail);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resendVerification(email);
      toast.success('Si el email existe, te enviamos un link de verificación.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8">
        {justRegistered ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h1 className="mt-4 text-xl font-display font-bold text-navy-800 text-center">
              ¡Cuenta creada!
            </h1>
            <p className="mt-3 text-sm text-navy-500 font-body text-center">
              Te enviamos un correo a <strong>{prefilledEmail}</strong> con un link para
              confirmar tu cuenta. Revisa tu bandeja de entrada (y la carpeta de spam por
              las dudas).
            </p>
            <p className="mt-3 text-sm text-navy-400 font-body text-center">
              Una vez confirmes, puedes iniciar sesión.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex w-full justify-center px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold"
            >
              Ir al login
            </Link>
            <div className="mt-6 pt-5 border-t border-navy-100/50">
              <p className="text-xs text-navy-400 font-body text-center mb-3">
                ¿No te llegó el email?
              </p>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="flex-1 px-3 py-2 rounded-lg border border-navy-200 text-sm font-body"
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="px-4 py-2 rounded-full border border-navy-200 text-sm font-body text-navy-700 hover:bg-navy-50 disabled:opacity-50"
                >
                  {loading ? '...' : 'Reenviar'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <Mail className="w-10 h-10 text-gold-500 mx-auto" />
            <h1 className="mt-4 text-xl font-display font-bold text-navy-800 text-center">
              Reenviar verificación
            </h1>
            <p className="mt-2 text-sm text-navy-400 font-body text-center">
              Te enviaremos un nuevo link de verificación si la cuenta existe.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="mt-5 w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Reenviar'}
            </button>
            <p className="mt-4 text-sm text-navy-400 font-body text-center">
              <Link href="/login" className="text-gold-600 hover:text-gold-700">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
