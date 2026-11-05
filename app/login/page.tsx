import { redirect } from 'next/navigation';
import { authenticated } from '@/lib/auth';
import LoginForm from './form';

export default async function Login() {
  if (await authenticated()) redirect('/dashboard');
  return <main className="login-shell"><section className="login-card">
    <div className="login-heading"><small>SULBAGSEL / PERFORMANCE MONITOR</small><h1>MONITORING UNSPEC SULBAGSEL</h1><p>Masuk untuk memantau performansi UNSPEC.</p></div>
    <LoginForm /><p className="login-caption">Executive Sulbagsel · Target UNSPEC ≤ 0,10%</p>
  </section></main>;
}
