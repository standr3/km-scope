import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SignupSchool() {
  const { registerSchool, refetchAuth } = useAuth();
  const nav = useNavigate();

  const [school, setSchool] = useState({ name:'', address:'', contact_email:'', contact_phone:'' });
  const [admin, setAdmin] = useState({ email:'', password:'' });

  const onS = k => e => setSchool(s => ({ ...s, [k]: e.target.value }));
  const onA = k => e => setAdmin(s => ({ ...s, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    await registerSchool({ school, admin });
    const r = await refetchAuth();
    const roles = r.data?.roles || [];
    // admin merge la dashboard admin
    nav(roles.includes('admin') ? '/dashboard/admin' : '/dashboard/teacher');
  }

  return (
    <div style={{ maxWidth: 720, margin:'32px auto', display:'grid', gap:16 }}>
      <h2>Register your school</h2>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:16 }}>
        <fieldset style={{ border:'1px solid #ddd', padding:12 }}>
          <legend>School info</legend>
          <input placeholder="Name" value={school.name} onChange={onS('name')} required />
          <input placeholder="Address" value={school.address} onChange={onS('address')} />
          <input placeholder="Contact email" value={school.contact_email} onChange={onS('contact_email')} />
          <input placeholder="Contact phone" value={school.contact_phone} onChange={onS('contact_phone')} />
        </fieldset>

        <fieldset style={{ border:'1px solid #ddd', padding:12 }}>
          <legend>Administrator creation</legend>
          <input placeholder="Email" value={admin.email} onChange={onA('email')} required />
          <input placeholder="Password" type="password" value={admin.password} onChange={onA('password')} required />
        </fieldset>

        <button type="submit">Create school + admin</button>
      </form>
    </div>
  );
}
