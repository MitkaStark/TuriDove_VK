'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';

export default function ResendVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resendVerification(email);
      toast.success('Si el email existe, te enviamos un link de verificación.');
      router.push('/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white rounded-2xl shadow-card p-8">
        <Mail className="w-10 h-10 text-gold-500 mx-auto" />
        <h1 className="mt-4 text-xl font-display font-bold text-navy-800 text-center">Reenviar verificación</h1>
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
      </form>
    </div>
  );
}
