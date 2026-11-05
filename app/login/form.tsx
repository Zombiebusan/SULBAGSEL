'use client';
import { useState } from 'react';

export default function LoginForm() {
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Login gagal.');
      window.location.assign('/dashboard');
    } catch (e) { setError(e instanceof Error ? e.message : 'Login gagal.'); setLoading(false); }
  }
  return <form onSubmit={submit}>
    <label>Username<input name="username" autoComplete="username" required maxLength={100} /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
    {error && <p className="login-error" role="alert">{error}</p>}
    <button disabled={loading} type="submit">{loading ? 'Memproses…' : 'Masuk'}</button>
  </form>;
}
