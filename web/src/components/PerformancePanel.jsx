import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usePerformanceSessions,
  useCreatePerformanceSession,
  useSessionScores,
  useScoringConfig,
  useUpsertScoringConfig,
  useRecalculateSession
} from '../hooks/useProjectScoring';
import { setProjectLockedApi } from '../api/project';

// ─── helpers ──────────────────────────────────────────────────────────────────

const PERSONALITY_LABELS = {
  initiator: '🚀 Inițiator',
  idea_generator: '💡 Generator de idei',
  connector: '🔗 Conector',
  risk_taker: '🎯 Risk taker',
  follower: '👥 Urmăritor',
  contrarian: '⚡ Contradictoriu',
  passive: '😴 Pasiv',
  engaged: '✅ Implicat',
};

const REASON_LABELS = {
  node_created_accepted: 'Nod creat acceptat',
  edge_created_accepted: 'Link creat acceptat',
  node_agreed_correct: 'Acord corect pe nod',
  edge_agreed_correct: 'Acord corect pe link',
  node_disagreed_correct: 'Dezacord corect pe nod',
  edge_disagreed_correct: 'Dezacord corect pe link',
  node_created_rejected: 'Nod creat respins',
  edge_created_rejected: 'Link creat respins',
  node_agreed_wrong: 'Acord greșit pe nod',
  edge_agreed_wrong: 'Acord greșit pe link',
  undecided: 'Nedecis',
};

function TrustBar({ value }) {
  const num = parseFloat(value) || 0;  // ← adaugă asta
  const pct = Math.min(100, (num / 2) * 100);
  const color = num > 1.2 ? '#16a34a' : num > 0.6 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32 }}>
        {num.toFixed(2)}
      </span>
    </div>
  );
}

function PerformanceBar({ value }) {
  const num = parseFloat(value) || 0;  // ← adaugă asta
  const color = num > 70 ? '#16a34a' : num > 40 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${num}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36 }}>
        {num.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Quick view per user ──────────────────────────────────────────────────────

function UserScoreRow({ score, expanded, onToggle }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <div onClick={onToggle} style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{score.user_name}</span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{expanded ? '▲' : '▼'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Performanță</div>
          <PerformanceBar value={score.performance_pct} />
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2, marginTop: 4 }}>Încredere</div>
          <TrustBar value={score.trust_factor} />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
          {(score.personality_tags || []).map(tag => (
            <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: '#f3f4f6', color: '#374151', fontWeight: 600 }}>
              {PERSONALITY_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {score.rewards_breakdown?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>Recompense</div>
              {score.rewards_breakdown.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151', marginBottom: 2 }}>
                  <span>{REASON_LABELS[r.reason] ?? r.reason} ×{r.count}</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>
                    +{parseFloat(r.points || 0).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {score.penalties_breakdown?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Penalizări</div>
              {score.penalties_breakdown.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151', marginBottom: 2 }}>
                  <span>{REASON_LABELS[p.reason] ?? p.reason} ×{p.count}</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>
                    -{parseFloat(p.points || 0).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>Detalii</div>
            <div>Noduri create: {score.nodes_created} ({score.nodes_created_accepted} ✓ / {score.nodes_created_rejected} ✗)</div>
            <div>Linkuri create: {score.edges_created} ({score.edges_created_accepted} ✓ / {score.edges_created_rejected} ✗)</div>
            <div>Acorduri noduri: {score.nodes_agreed} ({score.nodes_agreed_correct} ✓ / {score.nodes_agreed_wrong} ✗)</div>
            <div>Acorduri linkuri: {score.edges_agreed} ({score.edges_agreed_correct} ✓ / {score.edges_agreed_wrong} ✗)</div>
            <div>Nedecis: {score.nodes_undecided + score.edges_undecided}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session history ──────────────────────────────────────────────────────────

function SessionRow({ session, projectId, isOwner, selectedSessionId, setSelectedSessionId, scores, expandedUser, setExpandedUser }) {
  const { mutate: recalculate, isPending } = useRecalculateSession(projectId, session.id);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <div
        onClick={() => setSelectedSessionId(selectedSessionId === session.id ? null : session.id)}
        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedSessionId === session.id ? '#f9fafb' : '#fff' }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
            {session.label || `Sesiunea ${new Date(session.created_at).toLocaleDateString('ro-RO')}`}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{session.scored_users} studenți evaluați</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isOwner && (
            <button
              onClick={e => { e.stopPropagation(); recalculate(); }}
              disabled={isPending}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#6b7280' }}
            >
              {isPending ? '...' : '🔄'}
            </button>
          )}
          <span style={{ fontSize: 11, color: '#6b7280' }}>{selectedSessionId === session.id ? '▲' : '▼'}</span>
        </div>
      </div>

      {selectedSessionId === session.id && scores && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {scores.map(score => (
            <UserScoreRow
              key={score.user_id}
              score={score}
              expanded={expandedUser === score.user_id}
              onToggle={() => setExpandedUser(expandedUser === score.user_id ? null : score.user_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionHistory({ projectId, isOwner }) {
  const { data: sessions, isLoading } = usePerformanceSessions(projectId);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const { data: scores } = useSessionScores(projectId, selectedSessionId);
  const [expandedUser, setExpandedUser] = useState(null);

  if (isLoading) return <div style={{ fontSize: 12, color: '#6b7280', padding: 8 }}>Se încarcă...</div>;
  if (!sessions?.length) return <div style={{ fontSize: 12, color: '#6b7280', padding: 8 }}>Nicio sesiune înregistrată.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Sesiuni anterioare</div>
      {sessions.map(session => (
        <SessionRow
          key={session.id}
          session={session}
          projectId={projectId}
          isOwner={isOwner}
          selectedSessionId={selectedSessionId}
          setSelectedSessionId={setSelectedSessionId}
          scores={selectedSessionId === session.id ? scores : null}
          expandedUser={expandedUser}
          setExpandedUser={setExpandedUser}
        />
      ))}
    </div>
  );
}

// ─── Scoring config ───────────────────────────────────────────────────────────

function ScoringConfig({ projectId }) {
  const { data: config } = useScoringConfig(projectId);
  const { mutate: saveConfig, isPending } = useUpsertScoringConfig(projectId);
  const [local, setLocal] = useState(null);
  const cfg = local ?? config;

  const fields = [
    { key: 'weight_node_create', label: 'Creare nod' },
    { key: 'weight_edge_create', label: 'Creare link' },
    { key: 'weight_node_agree', label: 'Acord nod' },
    { key: 'weight_edge_agree', label: 'Acord link' },
    { key: 'weight_node_disagree', label: 'Dezacord nod' },
    { key: 'weight_edge_disagree', label: 'Dezacord link' },
    { key: 'penalty_undecided', label: 'Penalizare nedecis' },
  ];

  if (!cfg) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Configurare weights</div>
      {fields.map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
          <input
            type="number" step="0.25" min="0" max="5"
            value={cfg[key] ?? ''}
            onChange={e => setLocal(prev => ({ ...(prev ?? cfg), [key]: parseFloat(e.target.value) || 0 }))}
            style={{ width: 64, padding: '3px 6px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6, textAlign: 'right' }}
          />
        </div>
      ))}
      <button
        onClick={() => saveConfig(local ?? cfg)}
        disabled={isPending || !local}
        style={{
          marginTop: 4, padding: '6px 12px', fontSize: 12, fontWeight: 700,
          background: local ? '#111827' : '#e5e7eb',
          color: local ? '#fff' : '#9ca3af',
          border: 'none', borderRadius: 8, cursor: local ? 'pointer' : 'default',
        }}
      >
        {isPending ? 'Se salvează...' : 'Salvează'}
      </button>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

// Props:
//   projectId    — id-ul proiectului
//   projectRole  — 'OWNER' sau 'STUDENT'
//   onLockProject — callback(locked: boolean) din ProjectView care setează flag-ul în Yjs
//   isLocked     — starea curentă de lock citită din Yjs în ProjectView

export default function PerformancePanel({ projectId, projectRole, onLockProject, isLocked }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [sessionLabel, setSessionLabel] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [localLocked, setLocalLocked] = useState(false);
  const effectiveLocked = localLocked || isLocked;



  const { data: sessions } = usePerformanceSessions(projectId);
  const latestSession = sessions?.[0];
  const { data: latestScores } = useSessionScores(projectId, latestSession?.id);

  const { mutate: createSession, isPending: isScoring } = useCreatePerformanceSession(projectId);

  // mutație pentru lock în DB
  const { mutate: setLockedInDb } = useMutation({
    mutationFn: (locked) => setProjectLockedApi(projectId, locked),
  });

  const isOwner = projectRole === 'OWNER';

  const handleScore = () => {
    console.log("handleScore called");

    setLocalLocked(true);
    onLockProject?.(true);
    setLockedInDb(true);

    createSession(
      { label: sessionLabel || undefined },
      {
        onSuccess: (data) => {
          console.log("createSession success:", data);
          // NU deblocăm automat — owner deblochează manual
          // setLocalLocked(false);
          // onLockProject?.(false);
          // setLockedInDb(false);
        },
        onError: (err) => {
          console.error("createSession error:", err);
          setLocalLocked(false);
          onLockProject?.(false);
          setLockedInDb(false);
        },
      }
    );
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 16,
      width: isExpanded ? 380 : 320,
      zIndex: 1000,
      background: '#ffffff',
      border: effectiveLocked ? '2px solid #f59e0b' : '1px solid #e5e7eb',

      borderRadius: 18,
      boxShadow: '0 16px 40px rgba(17, 24, 39, 0.14)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: isExpanded ? '80vh' : 'auto',
    }}>

      {/* Banner lock — vizibil pentru toți când proiectul e blocat */}
      {effectiveLocked && (
        <div style={{
          background: '#fef3c7',
          borderRadius: '16px 16px 0 0',
          padding: '6px 14px',
          fontSize: 11,
          fontWeight: 700,
          color: '#92400e',
          textAlign: 'center',
        }}>
          🔒 Proiect blocat — evaluare în curs
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            📊 Performance
          </div>
          {latestSession && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
              Ultima sesiune: {new Date(latestSession.created_at).toLocaleDateString('ro-RO')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isOwner && (
            <>
              {/* Input opțional pentru label sesiune */}
              <input
                placeholder="Label sesiune..."
                value={sessionLabel}
                onChange={e => setSessionLabel(e.target.value)}
                style={{
                  width: 100, padding: '4px 8px', fontSize: 11,
                  border: '1px solid #e5e7eb', borderRadius: 6,
                  display: isExpanded ? 'block' : 'none',
                }}
              />
              <button
                onClick={handleScore}
                disabled={isScoring || effectiveLocked}
                style={{
                  padding: '5px 10px', fontSize: 11, fontWeight: 700,
                  border: 'none', borderRadius: 8,
                  background: isScoring || effectiveLocked ? '#e5e7eb' : '#111827',
                  color: isScoring || effectiveLocked ? '#9ca3af' : '#fff',
                  cursor: isScoring || effectiveLocked ? 'default' : 'pointer',
                }}
              >
                {isScoring ? '⏳ ...' : '⚡ Scorează'}
              </button>
              {effectiveLocked && !isScoring && (
                <button
                  onClick={() => {
                    setLocalLocked(false);
                    onLockProject?.(false);
                    setLockedInDb(false);
                  }}
                  style={{
                    padding: '5px 10px', fontSize: 11, fontWeight: 700,
                    background: '#16a34a', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                  }}
                >
                  🔓
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setIsExpanded(v => !v)}
            style={{
              border: 'none', background: '#f3f4f6', color: '#6b7280',
              width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontWeight: 700,
            }}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Quick view — scoruri ultima sesiune */}
      {
        latestScores?.length > 0 && (
          <div style={{
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            borderBottom: isExpanded ? '1px solid #f3f4f6' : 'none',
          }}>
            {latestScores.map(score => (
              <UserScoreRow
                key={score.user_id}
                score={score}
                expanded={expandedUser === score.user_id}
                onToggle={() => setExpandedUser(expandedUser === score.user_id ? null : score.user_id)}
              />
            ))}
          </div>
        )
      }

      {
        !latestScores?.length && (
          <div style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af' }}>
            {isOwner
              ? 'Apasă ⚡ Scorează pentru a genera prima evaluare.'
              : 'Nicio evaluare disponibilă încă.'}
          </div>
        )
      }

      {/* Panou extensibil */}
      {
        isExpanded && (
          <>
            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 14px' }}>
              {[
                { key: 'history', label: 'Istoric' },
                ...(isOwner ? [{ key: 'config', label: 'Configurare' }] : []),
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '8px 12px', fontSize: 12, fontWeight: 600,
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: activeTab === tab.key ? '#111827' : '#9ca3af',
                    borderBottom: activeTab === tab.key ? '2px solid #111827' : '2px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
              {activeTab === 'history' && <SessionHistory projectId={projectId} isOwner={isOwner} />}
              {activeTab === 'config' && isOwner && <ScoringConfig projectId={projectId} />}
            </div>
          </>
        )
      }
    </div >
  );
}