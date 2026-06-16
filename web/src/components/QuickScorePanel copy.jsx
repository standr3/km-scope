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
    };
  }

  if (num > 40) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-700",
    };
  }

  return {
    bar: "bg-red-500",
    text: "text-red-700",
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
    bar: "bg-red-500",
    text: "text-red-700",
  };
}

function PerformanceBar({ value }) {
  const num = parseFloat(value) || 0;
  const tone = getPerformanceTone(num);

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={["h-full rounded-full transition-[width] duration-300", tone.bar].join(" ")}
          style={{ width: `${Math.min(100, num)}%` }}
        />
      </div>

      <span className={["w-9 shrink-0 text-right text-[10px] font-semibold", tone.text].join(" ")}>
        {num.toFixed(1)}%
      </span>
    </div>
  );
}

function TrustBar({ value }) {
  const num = parseFloat(value) || 0;
  const pct = Math.min(100, (num / 2) * 100);
  const tone = getTrustTone(num);

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={["h-full rounded-full transition-[width] duration-300", tone.bar].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className={["w-8 shrink-0 text-right text-[10px] font-semibold", tone.text].join(" ")}>
        {num.toFixed(2)}
      </span>
    </div>
  );
}

function MetricBlock({ label, children }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium text-slate-500">
        {label}
      </div>
      {children}
    </div>
  );
}

function GuestRow({ score }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="block w-full px-2.5 py-2 text-left hover:bg-slate-50"
      >
        <div className="mb-2 flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
            {score.guestName}
          </span>

          <ChevronDown
            size={14}
            className={[
              "shrink-0 text-slate-400 transition-transform duration-200",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </div>

        <div className="space-y-1.5">
          <MetricBlock label="Performance">
            <PerformanceBar value={score.performancePct} />
          </MetricBlock>

          <MetricBlock label="Trust">
            <TrustBar value={score.trustFactor} />
          </MetricBlock>
        </div>

        {score.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {score.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600"
              >
                {PERSONALITY_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50 px-2.5 py-2">
          {score.rewards?.length > 0 && (
            <section>
              <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Rewards
              </h4>

              <div className="space-y-0.5">
                {score.rewards.map((reward, index) => (
                  <div
                    key={index}
                    className="flex gap-2 text-[10px] text-slate-600"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {REASON_LABELS[reward.reason] ?? reward.reason} ×{reward.count}
                    </span>
                    <span className="shrink-0 font-semibold text-emerald-700">
                      +{reward.points.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {score.penalties?.length > 0 && (
            <section>
              <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                Penalties
              </h4>

              <div className="space-y-0.5">
                {score.penalties.map((penalty, index) => (
                  <div
                    key={index}
                    className="flex gap-2 text-[10px] text-slate-600"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {REASON_LABELS[penalty.reason] ?? penalty.reason} ×{penalty.count}
                    </span>
                    <span className="shrink-0 font-semibold text-red-700">
                      -{penalty.points.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="text-[10px] leading-4 text-slate-500">
            <h4 className="mb-1 font-semibold uppercase tracking-wide text-slate-600">
              Details
            </h4>

            <div>
              Concepts: {score.nodesCreated} created ({score.nodesCreatedAccepted}✓ {score.nodesCreatedRejected}✗)
            </div>
            <div>
              Links: {score.edgesCreated} created ({score.edgesCreatedAccepted}✓ {score.edgesCreatedRejected}✗)
            </div>
            <div>
              Agreements: {score.nodesAgreed} concepts, {score.edgesAgreed} links
            </div>
            <div>
              Undecided: {score.nodesUndecided + score.edgesUndecided}
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
          <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">
            No scoring data yet.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-2 py-2">
        <div className="space-y-1.5">
          {scores.map((score) => (
            <GuestRow key={score.guestId} score={score} />
          ))}
        </div>
      </div>
    </section>
  );
}