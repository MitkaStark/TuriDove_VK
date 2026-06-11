'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/axios';

export default function PasswordResetConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, newPassword: pw });
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      router.push('/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <form onSubmit={submit} className="max-w-md w-full bg-white rounded-2xl shadow-card p-8">
        <KeyRound className="w-10 h-10 text-gold-500 mx-auto" />
        <h1 className="mt-4 text-xl font-display font-bold text-navy-800 text-center">Nueva contraseña</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          minLength={8}
          placeholder="Nueva contraseña (mín 8, May/min/núm)"
          className="mt-5 w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body"
        />
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          required
          placeholder="Confirmar"
          className="mt-3 w-full px-3 py-2 rounded-lg border border-navy-200 text-sm font-body"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </form>
    </div>
  );
}
