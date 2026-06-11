'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/axios';

export default function PasswordResetRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/password-reset/request', { email });
      toast.success('Si el email existe, te enviamos un link de recuperación.');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <form onSubmit={submit} className="max-w-md w-full bg-white rounded-2xl shadow-card p-8">
        <KeyRound className="w-10 h-10 text-gold-500 mx-auto" />
        <h1 className="mt-4 text-xl font-display font-bold text-navy-800 text-center">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-navy-400 font-body text-center">
          Ingresa tu email y te enviaremos un link para crear una nueva contraseña.
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
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
    </div>
  );
}
