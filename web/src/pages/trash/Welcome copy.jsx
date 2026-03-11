import React from 'react';
import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div style={{ maxWidth: 600, margin: '64px auto', display:'grid', gap:16, textAlign:'center' }}>
      <h1>Welcome</h1>
      <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
        <Link to="/login"><button>Sign in</button></Link>
        <Link to="/signup"><button>Sign up</button></Link>
      </div>
    </div>
  );
}
