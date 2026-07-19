import { FormEvent, useState } from 'react';
import { useAuth } from '../lib/auth';
import { mapAppError } from '../lib/errors';

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) { setError('Email dan password wajib diisi.'); return; }
    setLoading(true);
    try { await signIn(email, password); }
    catch (err) { setError(mapAppError(err)); }
    finally { setLoading(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <h1 className="mb-1 text-xl font-bold text-gray-900">Register Dokumen</h1>
      <p className="mb-6 text-sm text-gray-500">Masuk dengan akun Supabase Auth.</p>
      <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2" autoComplete="email" />
      <label htmlFor="password" className="mb-1 block text-sm font-semibold text-gray-700">Password</label>
      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2" autoComplete="current-password" />
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{loading ? 'Masuk...' : 'Login'}</button>
    </form>
  </main>;
}
