import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, refetchAuth, roles } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email:'', password:'' });
  const on = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    await login({ email: f.email, password: f.password });
    const r = await refetchAuth();
    const rs = r.data?.roles || [];
    nav(rs.includes('admin') ? '/dashboard/admin' : '/dashboard/teacher');
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', display:'grid', gap:12 }}>
      <h2>Sign in</h2>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:8 }}>
        <input placeholder="Email" value={f.email} onChange={on('email')} />
        <input placeholder="Password" type="password" value={f.password} onChange={on('password')} />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
