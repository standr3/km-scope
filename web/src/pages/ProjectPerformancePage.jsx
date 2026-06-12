import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProjectWithMembersApi, getPerformanceSessionsApi, getSessionScoresApi } from '../api/project';
import { ArrowLeft, TrendingUp, Users, Award, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ─── helpers ──────────────────────────────────────────────────────────────────

const PERSONALITY_LABELS = {
  initiator:      '🚀 Inițiator',
  idea_generator: '💡 Generator idei',
  connector:      '🔗 Conector',
  risk_taker:     '🎯 Risk taker',
  follower:       '👥 Urmăritor',
  contrarian:     '⚡ Contradictoriu',
  passive:        '😴 Pasiv',
  engaged:        '✅ Implicat',
};

const REASON_LABELS = {
  node_created_accepted:  'Nod creat acceptat',
  edge_created_accepted:  'Link creat acceptat',
  node_agreed_correct:    'Acord corect nod',
  edge_agreed_correct:    'Acord corect link',
  node_disagreed_correct: 'Dezacord corect nod',
  edge_disagreed_correct: 'Dezacord corect link',
  node_created_rejected:  'Nod creat respins',
  edge_created_rejected:  'Link creat respins',
  node_agreed_wrong:      'Acord greșit nod',
  edge_agreed_wrong:      'Acord greșit link',
  undecided:              'Nedecis',
};

const COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#be185d', '#65a30d',
];

// normalizare score din DB — DB returnează snake_case și numerele ca string
function normalizeScore(s) {
  return {
    guestId: s.user_id ?? s.guestId,
    guestName: s.guest_name ?? s.guestName,
    trustFactor: parseFloat(s.trust_factor ?? s.trustFactor ?? 0),
    performancePct: parseFloat(s.performance_pct ?? s.performancePct ?? 0),
    rawScore: parseFloat(s.raw_score ?? s.rawScore ?? 0),
    nodesCreated: s.nodes_created ?? s.nodesCreated ?? 0,
    nodesCreatedAccepted: s.nodes_created_accepted ?? s.nodesCreatedAccepted ?? 0,
    nodesCreatedRejected: s.nodes_created_rejected ?? s.nodesCreatedRejected ?? 0,
    edgesCreated: s.edges_created ?? s.edgesCreated ?? 0,
    edgesCreatedAccepted: s.edges_created_accepted ?? s.edgesCreatedAccepted ?? 0,
    edgesCreatedRejected: s.edges_created_rejected ?? s.edgesCreatedRejected ?? 0,
    nodesAgreed: s.nodes_agreed ?? s.nodesAgreed ?? 0,
    nodesAgreedCorrect: s.nodes_agreed_correct ?? s.nodesAgreedCorrect ?? 0,
    nodesAgreedWrong: s.nodes_agreed_wrong ?? s.nodesAgreedWrong ?? 0,
    edgesAgreed: s.edges_agreed ?? s.edgesAgreed ?? 0,
    edgesAgreedCorrect: s.edges_agreed_correct ?? s.edgesAgreedCorrect ?? 0,
    edgesAgreedWrong: s.edges_agreed_wrong ?? s.edgesAgreedWrong ?? 0,
    nodesDisagreed: s.nodes_disagreed ?? s.nodesDisagreed ?? 0,
    nodesDisagreedCorrect: s.nodes_disagreed_correct ?? s.nodesDisagreedCorrect ?? 0,
    nodesDisagreedWrong: s.nodes_disagreed_wrong ?? s.nodesDisagreedWrong ?? 0,
    edgesDisagreed: s.edges_disagreed ?? s.edgesDisagreed ?? 0,
    edgesDisagreedCorrect: s.edges_disagreed_correct ?? s.edgesDisagreedCorrect ?? 0,
    edgesDisagreedWrong: s.edges_disagreed_wrong ?? s.edgesDisagreedWrong ?? 0,
    nodesUndecided: s.nodes_undecided ?? s.nodesUndecided ?? 0,
    edgesUndecided: s.edges_undecided ?? s.edgesUndecided ?? 0,
    tags: typeof s.tags === 'string' ? JSON.parse(s.tags) : (s.tags ?? []),
    rewards: typeof s.rewards === 'string' ? JSON.parse(s.rewards) : (s.rewards ?? []),
    penalties: typeof s.penalties === 'string' ? JSON.parse(s.penalties) : (s.penalties ?? []),
  };
}

// ─── chart components ─────────────────────────────────────────────────────────

function MiniLineChart({ data, color = '#2563eb', height = 48 }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, color: '#9ca3af' }}>date insuficiente</span>
    </div>
  );

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 200; const h = height; const pad = 4;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }}>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function BarChart({ data, color = '#2563eb', height = 100 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
            {d.value.toFixed(0)}
          </div>
          <div style={{
            width: '100%',
            height: Math.max(4, (d.value / max) * (height - 20)),
            background: color, borderRadius: '3px 3px 0 0', opacity: 0.85,
          }} />
          <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2, textAlign: 'center', lineHeight: 1.2 }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function HorizontalBar({ value, max = 100, color }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || (pct > 70 ? '#16a34a' : pct > 40 ? '#d97706' : '#dc2626');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: c, minWidth: 36, textAlign: 'right' }}>
        {value.toFixed(1)}{max === 100 ? '%' : ''}
      </span>
    </div>
  );
}

// ─── guest score detail ───────────────────────────────────────────────────────

function GuestScoreDetail({ score, rank }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div onClick={() => setExpanded(v => !v)}
        style={{ padding: '8px 10px', cursor: 'pointer', background: '#fafafa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              background: rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : rank === 3 ? '#d97706' : '#e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{rank}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{score.guestName}</span>
          </div>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>Performanță</div>
          <HorizontalBar value={score.performancePct} />
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Încredere</div>
          <HorizontalBar value={score.trustFactor} max={2} />
        </div>
        {score.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {score.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 999,
                background: '#f3f4f6', color: '#374151', fontWeight: 600,
              }}>
                {PERSONALITY_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '8px 10px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {score.rewards?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', marginBottom: 3 }}>Recompense</div>
              {score.rewards.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#374151', marginBottom: 2 }}>
                  <span>{REASON_LABELS[r.reason] ?? r.reason} ×{r.count}</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>+{parseFloat(r.points).toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
          {score.penalties?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 3 }}>Penalizări</div>
              {score.penalties.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#374151', marginBottom: 2 }}>
                  <span>{REASON_LABELS[p.reason] ?? p.reason} ×{p.count}</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>-{parseFloat(p.points).toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10, color: '#6b7280' }}>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 3 }}>Detalii</div>
            <div>Noduri: {score.nodesCreated} create ({score.nodesCreatedAccepted}✓ {score.nodesCreatedRejected}✗)</div>
            <div>Linkuri: {score.edgesCreated} create ({score.edgesCreatedAccepted}✓ {score.edgesCreatedRejected}✗)</div>
            <div>Acorduri: {score.nodesAgreed} noduri, {score.edgesAgreed} linkuri</div>
            <div>Nedecis: {score.nodesUndecided + score.edgesUndecided}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── session card ─────────────────────────────────────────────────────────────

function SessionCard({ session, index, scores }) {
  const [expanded, setExpanded] = useState(false);
  const normalizedScores = (scores ?? []).map(normalizeScore);
  const sortedScores = [...normalizedScores].sort((a, b) => b.performancePct - a.performancePct);

  return (
    <Card className="rounded-none">
      <CardHeader className="cursor-pointer px-3 py-2" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[13px]">
              {session.label || `Sesiunea ${index + 1}`}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(session.created_at).toLocaleString('ro-RO')}
              {' · '}{session.scored_users} studenți
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{expanded ? '▲' : '▼'}</span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="px-3 pb-3 pt-0">
          {!scores ? (
            <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 12 }}>
              Se încarcă...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedScores.map((score, i) => (
                <GuestScoreDetail key={score.guestId} score={score} rank={i + 1} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── guest evolution card ─────────────────────────────────────────────────────

function GuestEvolutionCard({ guestId, guestName, sessions, allScores, color }) {
  const sessionData = [...sessions].reverse().map((session, i) => {
    const scores = (allScores[session.id] ?? []).map(normalizeScore);
    const score = scores.find(s => s.guestId === guestId);
    return {
      label: session.label || `S${i + 1}`,
      performancePct: score?.performancePct ?? 0,
      trustFactor: score?.trustFactor ?? 0,
      tags: score?.tags ?? [],
    };
  });

  const perfData = sessionData.map(d => d.performancePct);
  const lastSession = sessionData[sessionData.length - 1];
  const prevSession = sessionData[sessionData.length - 2];
  const trend = lastSession && prevSession
    ? lastSession.performancePct - prevSession.performancePct
    : null;

  return (
    <Card className="rounded-none">
      <CardHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {guestName}
          </CardTitle>
          {trend !== null && (
            <Badge variant="outline" className={`text-[10px] rounded-none ${trend >= 0 ? 'text-green-700 border-green-300' : 'text-red-700 border-red-300'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </Badge>
          )}
        </div>
        {lastSession?.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {lastSession.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 999,
                background: '#f3f4f6', color: '#374151', fontWeight: 600,
              }}>
                {PERSONALITY_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>Performanță pe sesiuni</div>
          <MiniLineChart data={perfData} color={color} height={48} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
            {sessionData.map((d, i) => <span key={i}>{d.label}</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Ultima performanță</div>
            <HorizontalBar value={lastSession?.performancePct ?? 0} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Ultima încredere</div>
            <HorizontalBar value={(lastSession?.trustFactor ?? 0) * 50} color="#7c3aed" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── overview stats ───────────────────────────────────────────────────────────

function OverviewStats({ latestScores }) {
  if (!latestScores?.length) return null;

  const avgPerformance = latestScores.reduce((s, x) => s + x.performancePct, 0) / latestScores.length;
  const avgTrust = latestScores.reduce((s, x) => s + x.trustFactor, 0) / latestScores.length;
  const topPerformer = [...latestScores].sort((a, b) => b.performancePct - a.performancePct)[0];

  const allTags = latestScores.flatMap(s => s.tags);
  const tagCounts = {};
  allTags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
      {[
        {
          icon: <TrendingUp size={14} />,
          label: 'Performanță medie',
          value: `${avgPerformance.toFixed(1)}%`,
          sub: 'ultima sesiune',
          color: avgPerformance > 70 ? '#16a34a' : avgPerformance > 40 ? '#d97706' : '#dc2626',
        },
        {
          icon: <Award size={14} />,
          label: 'Top performer',
          value: topPerformer?.guestName ?? '-',
          sub: topPerformer ? `${topPerformer.performancePct.toFixed(1)}%` : '',
          color: '#2563eb',
        },
        {
          icon: <Users size={14} />,
          label: 'Încredere medie',
          value: avgTrust.toFixed(2),
          sub: 'din max 2.00',
          color: '#7c3aed',
        },
        {
          icon: <AlertCircle size={14} />,
          label: 'Tag dominant',
          value: topTag ? (PERSONALITY_LABELS[topTag[0]] ?? topTag[0]) : '-',
          sub: topTag ? `${topTag[1]} studenți` : '',
          color: '#d97706',
        },
      ].map((stat, i) => (
        <Card key={i} className="rounded-none">
          <CardContent className="px-3 py-2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{stat.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── scoring legend ───────────────────────────────────────────────────────────

function LegendSection({ title, color, items }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color, marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: 16, padding: '6px 10px', background: '#f9fafb',
            borderRadius: 6, borderLeft: `3px solid ${color}`,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </div>
            {item.value !== undefined && (
              <div style={{
                fontSize: 13, fontWeight: 700, color, flexShrink: 0,
                background: `${color}15`, padding: '2px 8px', borderRadius: 4,
              }}>
                ×{item.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringLegend() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Metrici principale */}
      <Card className="rounded-none">
        <CardHeader className="px-3 py-2">
          <CardTitle className="text-[13px]">Metrici principale</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0 flex flex-col gap-4">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              {
                icon: '📈',
                title: 'Performanță (%)',
                color: '#2563eb',
                desc: 'Raportul dintre scorul brut obținut și scorul maxim posibil. 100% înseamnă că studentul a votat corect pe toate entitățile pe care putea să le voteze și a creat entități acceptate de profesor.',
              },
              {
                icon: '🤝',
                title: 'Factor de încredere (0–2)',
                color: '#7c3aed',
                desc: 'Proporția deciziilor corecte din totalul deciziilor luate. Creatorii de entități acceptate primesc un bonus suplimentar. Valoare maximă: 2.0.',
              },
              {
                icon: '📊',
                title: 'Scor brut',
                color: '#d97706',
                desc: 'Suma punctelor obținute din recompense minus penalizări. Poate fi negativ dacă studentul a luat decizii greșite sau a rămas nedecis pe multe entități.',
              },
              {
                icon: '🎭',
                title: 'Profil personalitate',
                color: '#16a34a',
                desc: 'Caracterizare bazată pe comportamentul real: inițiator (a creat multe entități), follower (a votat mai mult decât a creat), risk taker (rata mare de acceptare a creărilor sale), etc.',
              },
            ].map((m, i) => (
              <div key={i} style={{
                padding: '10px 12px', border: '1px solid #e5e7eb',
                borderRadius: 8, borderTop: `3px solid ${m.color}`,
              }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                  {m.desc}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coeficienți de scoring */}
      <Card className="rounded-none">
        <CardHeader className="px-3 py-2">
          <CardTitle className="text-[13px]">Coeficienți de scoring</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Fiecare acțiune este multiplicată cu coeficientul corespunzător. Creările acceptate aduc dublul coeficientului.
          </p>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0 flex flex-col gap-10">
          <LegendSection
            title="✅ Recompense"
            color="#16a34a"
            items={[
              {
                label: 'Nod creat și acceptat de profesor',
                desc: 'Cel mai riscant tip de acțiune — studentul a propus un concept nou care s-a dovedit corect. Aduce dublul coeficientului.',
                value: '1.50 × 2 = 3.00',
              },
              {
                label: 'Link creat și acceptat de profesor',
                desc: 'Studentul a propus o relație între concepte validată de profesor.',
                value: '1.25 × 2 = 2.50',
              },
              {
                label: 'Acord corect pe nod',
                desc: 'Studentul a dat up pe un nod pe care profesorul l-a acceptat ulterior.',
                value: '1.00',
              },
              {
                label: 'Acord corect pe link',
                desc: 'Studentul a dat up pe un link pe care profesorul l-a acceptat.',
                value: '1.00',
              },
              {
                label: 'Dezacord corect pe nod',
                desc: 'Studentul a dat down pe un nod pe care profesorul l-a respins — a identificat corect o idee greșită.',
                value: '0.75',
              },
              {
                label: 'Dezacord corect pe link',
                desc: 'Studentul a dat down pe un link pe care profesorul l-a respins.',
                value: '0.75',
              },
            ]}
          />

          <LegendSection
            title="❌ Penalizări"
            color="#dc2626"
            items={[
              {
                label: 'Nod creat și respins de profesor',
                desc: 'Studentul a propus un concept greșit. Penalizare mai mică decât recompensa pentru a încuraja asumarea riscului.',
                value: '-1.50',
              },
              {
                label: 'Link creat și respins de profesor',
                desc: 'Studentul a propus o relație incorectă între concepte.',
                value: '-1.25',
              },
              {
                label: 'Acord greșit pe nod',
                desc: 'Studentul a dat up pe un nod pe care profesorul l-a respins — a susținut o idee greșită.',
                value: '-1.00',
              },
              {
                label: 'Acord greșit pe link',
                desc: 'Studentul a dat up pe un link pe care profesorul l-a respins.',
                value: '-1.00',
              },
              {
                label: 'Nedecis (per entitate)',
                desc: 'Studentul nu a votat pe o entitate unde profesorul a luat deja o decizie. Penalizează pasivitatea — un student implicat ar fi trebuit să aibă o opinie.',
                value: '-0.50',
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Scoruri maxime posibile */}
      <Card className="rounded-none">
        <CardHeader className="px-3 py-2">
          <CardTitle className="text-[13px]">Cum se calculează performanța maximă</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
            Performanța 100% înseamnă că studentul a obținut scorul maxim posibil dat de situația proiectului.
            Scorul maxim se calculează astfel:
          </div>
          <div style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace',
            fontSize: 12, color: '#374151', lineHeight: 1.8,
          }}>
            <div>max = (noduri acceptate × 1.50 × 2)</div>
            <div>    + (linkuri acceptate × 1.25 × 2)</div>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, lineHeight: 1.5 }}>
            Notă: Studentul nu putea crea toate nodurile/linkurile acceptate, dar putea să fie de acord cu toate.
            Maximul reflectă potențialul total al proiectului, nu doar ce era accesibil unui singur student.
          </div>
        </CardContent>
      </Card>

      {/* Profil personalitate */}
      <Card className="rounded-none">
        <CardHeader className="px-3 py-2">
          <CardTitle className="text-[13px]">Profiluri de personalitate</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Bazate pe comportamentul real al studentului în proiect. Un student poate avea mai multe profiluri simultan.
          </p>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {[
              { tag: '🚀 Inițiator', desc: 'A creat mai mult de 2 noduri sau linkuri în total.' },
              { tag: '💡 Generator idei', desc: 'A creat mai multe noduri decât linkuri (de 2× mai multe).' },
              { tag: '🔗 Conector', desc: 'A creat mai multe linkuri decât noduri (de 2× mai multe).' },
              { tag: '🎯 Risk taker', desc: 'Peste 70% din nodurile create au fost acceptate de profesor.' },
              { tag: '👥 Urmăritor', desc: 'A votat mai mult decât a creat — preferă să evalueze ideile altora.' },
              { tag: '⚡ Contradictoriu', desc: 'A dat mai multe voturi de dezacord decât de acord.' },
              { tag: '😴 Pasiv', desc: 'A rămas nedecis pe mai mult de 3 entități unde profesorul a decis.' },
              { tag: '✅ Implicat', desc: 'Nu a rămas nedecis pe nicio entitate și a luat cel puțin o decizie.' },
            ].map((p, i) => (
              <div key={i} style={{
                padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  {p.tag}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ProjectPerformancePage() {
  const { classId, projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [allScores, setAllScores] = useState({});

  const projectQ = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectWithMembersApi(projectId),
    retry: 0,
  });

  const sessionsQ = useQuery({
    queryKey: ['performance-sessions', projectId],
    queryFn: () => getPerformanceSessionsApi(projectId),
    enabled: !!projectId,
  });

  const project = projectQ.data;
  const sessions = sessionsQ.data ?? [];

  // carcă scorurile pentru toate sesiunile
  useEffect(() => {
    if (!sessions.length) return;
    sessions.forEach(async (session) => {
      if (allScores[session.id]) return;
      try {
        const scores = await getSessionScoresApi(projectId, session.id);
        setAllScores(prev => ({ ...prev, [session.id]: scores }));
      } catch (e) {
        console.error('Failed to load scores for session', session.id, e);
      }
    });
  }, [sessions, projectId]);

  const guests = useMemo(() => {
    if (!project?.members) return [];
    return project.members.filter(m => m.id !== project.owner_id);
  }, [project]);

  // scorurile normalizate ale ultimei sesiuni pentru overview
  const latestScores = useMemo(() => {
    if (!sessions.length) return [];
    const latest = sessions[0];
    return (allScores[latest.id] ?? []).map(normalizeScore);
  }, [sessions, allScores]);

  if (projectQ.isLoading || sessionsQ.isLoading) {
    return <div style={{ padding: 24 }}>Se încarcă...</div>;
  }
  if (projectQ.isError || !project) {
    return <div style={{ padding: 24 }}>Eroare la încărcarea proiectului.</div>;
  }

  const tabs = [
    { key: 'overview', label: 'Prezentare generală' },
    { key: 'evolution', label: 'Evoluție per student' },
    { key: 'sessions', label: `Sesiuni (${sessions.length})` },
    { key: 'legend', label: '📖 Legendă' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Button variant="outline" className="h-7 rounded-none px-2.5 text-[11px]" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back
        </Button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>Performance Analysis</h1>
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            {project.name} · {guests.length} studenți · {sessions.length} sesiuni
          </p>
        </div>
      </div>

      {/* No sessions */}
      {!sessions.length && (
        <Card className="rounded-none">
          <CardContent className="px-4 py-8 text-center">
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Nicio sesiune înregistrată
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              Intră în proiect și apasă ⚡ Scorează sesiunea pentru a înregistra prima evaluare.
            </div>
          </CardContent>
        </Card>
      )}

      {sessions.length > 0 && (
        <>
          <OverviewStats latestScores={latestScores} />

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 600,
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: activeTab === tab.key ? '#111827' : '#9ca3af',
                  borderBottom: activeTab === tab.key ? '2px solid #111827' : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Card className="rounded-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-[13px]">Clasament — ultima sesiune</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  {!latestScores.length ? (
                    <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 12 }}>Se încarcă...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[...latestScores].sort((a, b) => b.performancePct - a.performancePct).map((score, i) => (
                        <div key={score.guestId}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                width: 18, height: 18, borderRadius: '50%',
                                background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                              }}>{i + 1}</span>
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{score.guestName}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {score.tags.slice(0, 2).map(tag => (
                                <span key={tag} style={{
                                  fontSize: 9, padding: '1px 5px', borderRadius: 999,
                                  background: '#f3f4f6', color: '#374151', fontWeight: 600,
                                }}>
                                  {PERSONALITY_LABELS[tag] ?? tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <HorizontalBar value={score.performancePct} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-[13px]">Comparație performanță</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <BarChart
                    data={[...latestScores]
                      .sort((a, b) => b.performancePct - a.performancePct)
                      .map(s => ({ label: s.guestName.split(' ')[0], value: s.performancePct }))}
                    color="#2563eb"
                    height={100}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Evolution */}
          {activeTab === 'evolution' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {guests.map((guest, i) => (
                <GuestEvolutionCard
                  key={guest.id}
                  guestId={guest.id}
                  guestName={guest.name}
                  sessions={sessions}
                  allScores={allScores}
                  color={COLORS[i % COLORS.length]}
                />
              ))}
            </div>
          )}

          {/* Sessions */}
          {activeTab === 'sessions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map((session, i) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={i}
                  scores={allScores[session.id]}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          {activeTab === 'legend' && <ScoringLegend />}
        </>
      )}
    </div>
  );
}