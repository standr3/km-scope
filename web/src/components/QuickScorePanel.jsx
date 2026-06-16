import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { calculateSessionScores, DEFAULT_WEIGHTS } from "../utils/scoring";

const PERSONALITY_LABELS = {
  initiator: "Initiator",
  idea_generator: "Idea generator",
  connector: "Connector",
  risk_taker: "Risk taker",
  follower: "Follower",
  contrarian: "Contrarian",
  passive: "Passive",
  engaged: "Engaged",
};

const REASON_LABELS = {
  node_created_accepted: "Concept created accepted",
  edge_created_accepted: "Link created accepted",
  node_agreed_correct: "Correct concept agreement",
  edge_agreed_correct: "Correct link agreement",
  node_disagreed_correct: "Correct concept disagreement",
  edge_disagreed_correct: "Correct link disagreement",
  node_created_rejected: "Concept created rejected",
  edge_created_rejected: "Link created rejected",
  node_agreed_wrong: "Wrong concept agreement",
  edge_agreed_wrong: "Wrong link agreement",
  undecided: "Undecided",
};

function getPerformanceTone(value) {
  const num = parseFloat(value) || 0;

  if (num > 70) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    };
  }

  if (num > 40) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-700",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    };
  }

  return {
    bar: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    ring: "ring-rose-200",
  };
}

function getTrustTone(value) {
  const num = parseFloat(value) || 0;

  if (num > 1.2) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-700",
    };
  }

  if (num > 0.6) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-700",
    };
  }

  return {
    bar: "bg-rose-500",
    text: "text-rose-700",
  };
}

function PerformanceBar({ value }) {
  const num = parseFloat(value) || 0;
  const tone = getPerformanceTone(num);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={[
            "h-full rounded-full transition-[width] duration-300",
            tone.bar,
          ].join(" ")}
          style={{ width: `${Math.min(100, Math.max(0, num))}%` }}
        />
      </div>

      <span
        className={[
          "w-10 shrink-0 text-right text-[11px] font-semibold",
          tone.text,
        ].join(" ")}
      >
        {num.toFixed(1)}%
      </span>
    </div>
  );
}

function TrustBar({ value }) {
  const num = parseFloat(value) || 0;
  const pct = Math.min(100, Math.max(0, (num / 2) * 100));
  const tone = getTrustTone(num);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={[
            "h-full rounded-full transition-[width] duration-300",
            tone.bar,
          ].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span
        className={[
          "w-9 shrink-0 text-right text-[11px] font-semibold",
          tone.text,
        ].join(" ")}
      >
        {num.toFixed(2)}
      </span>
    </div>
  );
}

function MetricBlock({ label, children }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium text-slate-500">
        {label}
      </div>

      {children}
    </div>
  );
}

function ScoreTag({ children }) {
  return (
    <span className="inline-flex h-5 max-w-full items-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
      {children}
    </span>
  );
}

function ScoreDetailRow({ label, value, tone = "slate" }) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-rose-700"
        : "text-slate-700";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-600">
      <span className="min-w-0 flex-1 truncate">{label}</span>

      <span className={["shrink-0 font-semibold", valueClass].join(" ")}>
        {value}
      </span>
    </div>
  );
}

function GuestRow({ score }) {
  const [expanded, setExpanded] = useState(false);

  const performanceTone = getPerformanceTone(score.performancePct);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="block w-full p-3 text-left transition hover:bg-slate-50"
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-950">
                {score.guestName}
              </span>

              <span
                className={[
                  "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold ring-1 ring-inset",
                  performanceTone.bg,
                  performanceTone.text,
                  performanceTone.ring,
                ].join(" ")}
              >
                {parseFloat(score.performancePct || 0).toFixed(1)}%
              </span>
            </div>

            {score.tags?.length > 0 && (
              <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                {score.tags.map((tag) => (
                  <ScoreTag key={tag}>
                    {PERSONALITY_LABELS[tag] ?? tag}
                  </ScoreTag>
                ))}
              </div>
            )}
          </div>

          <ChevronDown
            size={16}
            className={[
              "mt-0.5 shrink-0 text-slate-400 transition-transform duration-200",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </div>

        <div className="mt-3 grid gap-2">
          <MetricBlock label="Performance">
            <PerformanceBar value={score.performancePct} />
          </MetricBlock>

          <MetricBlock label="Trust">
            <TrustBar value={score.trustFactor} />
          </MetricBlock>
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-3">
          {score.rewards?.length > 0 && (
            <section>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Rewards
              </h4>

              <div className="space-y-1.5">
                {score.rewards.map((reward, index) => (
                  <ScoreDetailRow
                    key={index}
                    label={`${REASON_LABELS[reward.reason] ?? reward.reason} ×${reward.count}`}
                    value={`+${reward.points.toFixed(1)}`}
                    tone="positive"
                  />
                ))}
              </div>
            </section>
          )}

          {score.penalties?.length > 0 && (
            <section>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                Penalties
              </h4>

              <div className="space-y-1.5">
                {score.penalties.map((penalty, index) => (
                  <ScoreDetailRow
                    key={index}
                    label={`${REASON_LABELS[penalty.reason] ?? penalty.reason} ×${penalty.count}`}
                    value={`-${penalty.points.toFixed(1)}`}
                    tone="negative"
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Details
            </h4>

            <div className="space-y-1.5">
              <ScoreDetailRow
                label="Concepts"
                value={`${score.nodesCreated} created`}
              />

              <ScoreDetailRow
                label="Concept validation"
                value={`${score.nodesCreatedAccepted}✓ ${score.nodesCreatedRejected}✗`}
              />

              <ScoreDetailRow
                label="Links"
                value={`${score.edgesCreated} created`}
              />

              <ScoreDetailRow
                label="Link validation"
                value={`${score.edgesCreatedAccepted}✓ ${score.edgesCreatedRejected}✗`}
              />

              <ScoreDetailRow
                label="Agreements"
                value={`${score.nodesAgreed} concepts, ${score.edgesAgreed} links`}
              />

              <ScoreDetailRow
                label="Undecided"
                value={score.nodesUndecided + score.edgesUndecided}
              />
            </div>
          </section>
        </div>
      )}
    </article>
  );
}

export default function QuickScorePanel({ events, members, projectOwnerId }) {
  const scores = useMemo(() => {
    if (!events?.length || !members?.length) return [];

    return calculateSessionScores(
      events,
      members,
      projectOwnerId,
      DEFAULT_WEIGHTS
    );
  }, [events, members, projectOwnerId]);

  if (!scores.length) {
    return (
      <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
        <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-3">
          <div className="flex min-h-[120px] w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                No scoring data yet
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Scores will appear after students create, approve or reject
                concepts and links.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3">
        <div className="space-y-2">
          {scores.map((score) => (
            <GuestRow key={score.guestId} score={score} />
          ))}
        </div>
      </div>
    </section>
  );
}