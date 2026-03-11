import React from 'react';
import { Link } from 'react-router-dom';

export default function SignupChoice() {
  const card = { border:'1px solid #ddd', padding:16, borderRadius:8, width:260 };
  return (
    <div style={{ maxWidth: 700, margin:'48px auto', display:'flex', gap:24, justifyContent:'center' }}>
      <Link to="/signup/school" style={{ textDecoration:'none', color:'inherit' }}>
        <div style={card}>
          <h3>Register your school</h3>
          <p>Create a school + admin account.</p>
          <button>Continue</button>
        </div>
      </Link>
      <Link to="/signup/member" style={{ textDecoration:'none', color:'inherit' }}>
        <div style={card}>
          <h3>Register as teacher or student</h3>
          <p>Join an existing school.</p>
          <button>Continue</button>
        </div>
      </Link>
    </div>
  );
}