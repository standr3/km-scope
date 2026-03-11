import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const nav = useNavigate();
  const { register, login, refetchUser } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name:'', email:'', password:'' });
  const on = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    try {
      if (mode === 'login') {
        const r = await login({ email: f.email, password: f.password });
        console.log('[login] response', r);
      } else {
        const r = await register({ name: f.name, email: f.email, password: f.password });
        console.log('[signup] response', r);
      }
      await refetchUser();          // cere user după auth
      nav('/dashboard');
    } catch (e) {
      alert('Auth failed');
      console.error(e);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', display:'grid', gap:16 }}>
      <h1>{mode === 'login' ? 'Sign in' : 'Sign up'}</h1>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:8 }}>
        {mode === 'signup' && <input placeholder="Name" value={f.name} onChange={on('name')} />}
        <input placeholder="Email" value={f.email} onChange={on('email')} />
        <input placeholder="Password" type="password" value={f.password} onChange={on('password')} />
        <button type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Create new account' : 'Have an account? Sign in'}
      </button>
    </div>
  );
}
