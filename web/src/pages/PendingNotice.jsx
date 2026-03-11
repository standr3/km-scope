import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function PendingNotice() {
  const { pendingRequests } = useAuth();
  const pend = pendingRequests.filter(r => !r.accepted);
  const first = pend[0];
  const txt = first
    ? `Your membership request to school "${first.school_name}" as ${first.user_role} is still pending.`
    : `You do not have an active membership.`;

  return (
    <div style={{ border:'1px solid #f0c36d', background:'#fff8e1', padding:16, borderRadius:8 }}>
      <p>{txt}</p>
    </div>
  );
}
