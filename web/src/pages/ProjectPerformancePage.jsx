import React, { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  ChevronDown,
  FolderKanban,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  getProjectWithMembersApi,
  getPerformanceSessionsApi,
  getSessionScoresApi,
} from "../api/project";

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
  node_created_accepted:
    "Concept created accepted",
  edge_created_accepted:
    "Link created accepted",
  node_agreed_correct:
    "Correct concept agreement",
  edge_agreed_correct:
    "Correct link agreement",
  node_disagreed_correct:
    "Correct concept disagreement",
  edge_disagreed_correct:
    "Correct link disagreement",
  node_created_rejected:
    "Concept created rejected",
  edge_created_rejected:
    "Link created rejected",
  node_agreed_wrong:
    "Wrong concept agreement",
  edge_agreed_wrong:
    "Wrong link agreement",
  undecided: "Undecided",
};

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#65a30d",
];

const TABS = [
  {
    key: "overview",
    label: "Overview",
  },
  {
    key: "evolution",
    label: "Student evolution",
  },
  {
    key: "sessions",
    label: "Sessions",
  },
  {
    key: "legend",
    label: "Scoring guide",
  },
];

const METRIC_DESCRIPTIONS = [
  {
    icon: TrendingUp,
    title: "Performance (%)",
    color: "#2563eb",
    description:
      "The ratio between the raw score earned and the maximum possible score. A score of 100% means the student made correct decisions and created entities that were accepted.",
  },
  {
    icon: Users,
    title: "Trust factor (0–2)",
    color: "#7c3aed",
    description:
      "The proportion of correct decisions out of all decisions made. Students who create accepted entities receive an additional bonus.",
  },
  {
    icon: BarChart3,
    title: "Raw score",
    color: "#d97706",
    description:
      "The sum of earned rewards minus penalties. It can become negative when the student makes incorrect decisions or remains undecided.",
  },
  {
    icon: Sparkles,
    title: "Personality profile",
    color: "#16a34a",
    description:
      "A behavioral profile based on actual activity, such as initiator, follower, risk taker, connector, or contrarian.",
  },
];

const PERSONALITY_DESCRIPTIONS = [
  {
    key: "initiator",
    description:
      "Created more than two concepts or links in total.",
  },
  {
    key: "idea_generator",
    description:
      "Created at least twice as many concepts as links.",
  },
  {
    key: "connector",
    description:
      "Created at least twice as many links as concepts.",
  },
  {
    key: "risk_taker",
    description:
      "More than 70% of the created concepts were accepted.",
  },
  {
    key: "follower",
    description:
      "Voted more often than creating new entities.",
  },
  {
    key: "contrarian",
    description:
      "Submitted more disagreement votes than agreement votes.",
  },
  {
    key: "passive",
    description:
      "Remained undecided on more than three evaluated entities.",
  },
  {
    key: "engaged",
    description:
      "Did not remain undecided and made at least one decision.",
  },
];

const REWARD_ITEMS = [
  {
    label:
      "Concept created and accepted by the teacher",
    description:
      "The student proposed a new concept that was validated by the teacher. This action receives a double coefficient.",
    value: "1.50 × 2 = 3.00",
  },
  {
    label:
      "Link created and accepted by the teacher",
    description:
      "The student proposed a relationship between concepts that was validated by the teacher.",
    value: "1.25 × 2 = 2.50",
  },
  {
    label: "Correct agreement on a concept",
    description:
      "The student agreed with a concept that was later accepted by the teacher.",
    value: "1.00",
  },
  {
    label: "Correct agreement on a link",
    description:
      "The student agreed with a link that was later accepted by the teacher.",
    value: "1.00",
  },
  {
    label: "Correct disagreement on a concept",
    description:
      "The student correctly rejected a concept that was later rejected by the teacher.",
    value: "0.75",
  },
  {
    label: "Correct disagreement on a link",
    description:
      "The student correctly rejected a link that was later rejected by the teacher.",
    value: "0.75",
  },
];

const PENALTY_ITEMS = [
  {
    label:
      "Concept created and rejected by the teacher",
    description:
      "The student proposed an incorrect concept. The penalty is lower than the acceptance reward to encourage initiative.",
    value: "-1.50",
  },
  {
    label:
      "Link created and rejected by the teacher",
    description:
      "The student proposed an incorrect relationship between concepts.",
    value: "-1.25",
  },
  {
    label: "Incorrect agreement on a concept",
    description:
      "The student agreed with a concept that was later rejected by the teacher.",
    value: "-1.00",
  },
  {
    label: "Incorrect agreement on a link",
    description:
      "The student agreed with a link that was later rejected by the teacher.",
    value: "-1.00",
  },
  {
    label: "Undecided per entity",
    description:
      "The student did not vote on an entity that had already been evaluated by the teacher.",
    value: "-0.50",
  },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function parseArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function extractSessions(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.sessions)) {
    return data.sessions;
  }

  return [];
}

function extractScores(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.scores)) {
    return data.scores;
  }

  return [];
}

function normalizeScore(score) {
  return {
    guestId:
      score.user_id ??
      score.guestId ??
      score.guest_id,

    guestName:
      score.guest_name ??
      score.guestName ??
      score.name ??
      "Student",

    trustFactor: toNumber(
      score.trust_factor ??
        score.trustFactor
    ),

    performancePct: toNumber(
      score.performance_pct ??
        score.performancePct
    ),

    rawScore: toNumber(
      score.raw_score ??
        score.rawScore
    ),

    nodesCreated: toNumber(
      score.nodes_created ??
        score.nodesCreated
    ),

    nodesCreatedAccepted: toNumber(
      score.nodes_created_accepted ??
        score.nodesCreatedAccepted
    ),

    nodesCreatedRejected: toNumber(
      score.nodes_created_rejected ??
        score.nodesCreatedRejected
    ),

    edgesCreated: toNumber(
      score.edges_created ??
        score.edgesCreated
    ),

    edgesCreatedAccepted: toNumber(
      score.edges_created_accepted ??
        score.edgesCreatedAccepted
    ),

    edgesCreatedRejected: toNumber(
      score.edges_created_rejected ??
        score.edgesCreatedRejected
    ),

    nodesAgreed: toNumber(
      score.nodes_agreed ??
        score.nodesAgreed
    ),

    nodesAgreedCorrect: toNumber(
      score.nodes_agreed_correct ??
        score.nodesAgreedCorrect
    ),

    nodesAgreedWrong: toNumber(
      score.nodes_agreed_wrong ??
        score.nodesAgreedWrong
    ),

    edgesAgreed: toNumber(
      score.edges_agreed ??
        score.edgesAgreed
    ),

    edgesAgreedCorrect: toNumber(
      score.edges_agreed_correct ??
        score.edgesAgreedCorrect
    ),

    edgesAgreedWrong: toNumber(
      score.edges_agreed_wrong ??
        score.edgesAgreedWrong
    ),

    nodesDisagreed: toNumber(
      score.nodes_disagreed ??
        score.nodesDisagreed
    ),

    nodesDisagreedCorrect: toNumber(
      score.nodes_disagreed_correct ??
        score.nodesDisagreedCorrect
    ),

    nodesDisagreedWrong: toNumber(
      score.nodes_disagreed_wrong ??
        score.nodesDisagreedWrong
    ),

    edgesDisagreed: toNumber(
      score.edges_disagreed ??
        score.edgesDisagreed
    ),

    edgesDisagreedCorrect: toNumber(
      score.edges_disagreed_correct ??
        score.edgesDisagreedCorrect
    ),

    edgesDisagreedWrong: toNumber(
      score.edges_disagreed_wrong ??
        score.edgesDisagreedWrong
    ),

    nodesUndecided: toNumber(
      score.nodes_undecided ??
        score.nodesUndecided
    ),

    edgesUndecided: toNumber(
      score.edges_undecided ??
        score.edgesUndecided
    ),

    tags: parseArray(score.tags),
    rewards: parseArray(score.rewards),
    penalties: parseArray(score.penalties),
  };
}

function formatDateTime(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  try {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  } catch {
    return String(value);
  }
}

function getMemberId(member) {
  return (
    member.user_id ??
    member.id ??
    member.membership_id
  );
}

function getMemberName(member) {
  return (
    member.name ??
    member.email ??
    "Student"
  );
}

function getRankClass(rank) {
  if (rank === 1) {
    return "bg-amber-400 text-white";
  }

  if (rank === 2) {
    return "bg-slate-400 text-white";
  }

  if (rank === 3) {
    return "bg-orange-500 text-white";
  }

  return "bg-slate-100 text-slate-600";
}

function getProgressColor(
  value,
  maximum
) {
  const percentage =
    maximum > 0
      ? (value / maximum) * 100
      : 0;

  if (percentage > 70) {
    return "#16a34a";
  }

  if (percentage > 40) {
    return "#d97706";
  }

  return "#dc2626";
}

function MiniLineChart({
  data,
  color = "#2563eb",
  height = 56,
}) {
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-400"
        style={{ height }}
      >
        Not enough data
      </div>
    );
  }

  const maximum = Math.max(
    ...data,
    1
  );

  const minimum = Math.min(
    ...data,
    0
  );

  const range =
    maximum - minimum || 1;

  const width = 240;
  const padding = 5;

  const points = data.map(
    (value, index) => {
      const x =
        padding +
        (index /
          (data.length - 1)) *
          (width - padding * 2);

      const y =
        height -
        padding -
        ((value - minimum) /
          range) *
          (height - padding * 2);

      return {
        x,
        y,
      };
    }
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      role="img"
      aria-label="Performance trend chart"
    >
      <polyline
        points={points
          .map(
            (point) =>
              `${point.x},${point.y}`
          )
          .join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map(
        (point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={color}
          />
        )
      )}
    </svg>
  );
}

function PerformanceBarChart({
  data,
  color = "#2563eb",
  height = 160,
}) {
  if (!data.length) {
    return (
      <div className="grid min-h-[160px] place-items-center text-sm text-slate-400">
        No data available.
      </div>
    );
  }

  const maximum = Math.max(
    ...data.map(
      (item) => item.value
    ),
    1
  );

  return (
    <div
      className="flex items-end gap-2 overflow-x-auto px-1"
      style={{ height }}
    >
      {data.map(
        (item, index) => {
          const barHeight =
            Math.max(
              8,
              (item.value /
                maximum) *
                (height - 48)
            );

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex min-w-[58px] flex-1 flex-col items-center"
            >
              <span className="mb-1 text-[10px] font-semibold text-slate-600">
                {item.value.toFixed(0)}
              </span>

              <div
                className="w-full max-w-[56px] rounded-t-md opacity-85"
                style={{
                  height: barHeight,
                  backgroundColor:
                    color,
                }}
              />

              <span className="mt-2 max-w-[72px] truncate text-center text-[10px] text-slate-400">
                {item.label}
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}

function HorizontalBar({
  value,
  maximum = 100,
  color,
  decimals = 1,
  suffix,
}) {
  const safeValue =
    toNumber(value);

  const percentage = Math.max(
    0,
    Math.min(
      100,
      maximum > 0
        ? (safeValue / maximum) *
            100
        : 0
    )
  );

  const barColor =
    color ||
    getProgressColor(
      safeValue,
      maximum
    );

  const displaySuffix =
    suffix ??
    (maximum === 100 ? "%" : "");

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-[width]"
          style={{
            width: `${percentage}%`,
            backgroundColor:
              barColor,
          }}
        />
      </div>

      <span
        className="min-w-[54px] text-right text-xs font-semibold"
        style={{
          color: barColor,
        }}
      >
        {safeValue.toFixed(decimals)}
        {displaySuffix}
      </span>
    </div>
  );
}

function PersonalityTags({
  tags,
  limit,
}) {
  const visibleTags =
    typeof limit === "number"
      ? tags.slice(0, limit)
      : tags;

  if (!visibleTags.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"
        >
          {PERSONALITY_LABELS[tag] ??
            tag}
        </span>
      ))}
    </div>
  );
}

function GuestScoreDetail({
  score,
  rank,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const undecidedTotal =
    score.nodesUndecided +
    score.edgesUndecided;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() =>
          setExpanded(
            (currentValue) =>
              !currentValue
          )
        }
        aria-expanded={expanded}
        className="block w-full bg-slate-50/70 px-4 py-4 text-left transition-colors hover:bg-slate-100"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={[
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                getRankClass(rank),
              ].join(" ")}
            >
              {rank}
            </span>

            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-950">
                {score.guestName}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Raw score:{" "}
                {score.rawScore.toFixed(
                  1
                )}
              </p>
            </div>
          </div>

          <ChevronDown
            className={[
              "h-4 w-4 shrink-0 text-slate-400 transition-transform",
              expanded
                ? "rotate-180"
                : "rotate-0",
            ].join(" ")}
            strokeWidth={1.8}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] text-slate-500">
              Performance
            </p>

            <HorizontalBar
              value={
                score.performancePct
              }
            />
          </div>

          <div>
            <p className="mb-1 text-[11px] text-slate-500">
              Trust factor
            </p>

            <HorizontalBar
              value={
                score.trustFactor
              }
              maximum={2}
              color="#7c3aed"
              decimals={2}
              suffix=""
            />
          </div>
        </div>

        {score.tags.length > 0 && (
          <div className="mt-3">
            <PersonalityTags
              tags={score.tags}
            />
          </div>
        )}
      </button>

      {expanded && (
        <div className="grid gap-5 border-t border-slate-100 px-4 py-4 lg:grid-cols-3">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Rewards
            </h4>

            {!score.rewards.length && (
              <p className="text-xs text-slate-400">
                No rewards.
              </p>
            )}

            <div className="space-y-2">
              {score.rewards.map(
                (reward, index) => (
                  <div
                    key={`${reward.reason}-${index}`}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <span className="text-slate-600">
                      {REASON_LABELS[
                        reward.reason
                      ] ??
                        reward.reason}{" "}
                      ×{reward.count}
                    </span>

                    <span className="shrink-0 font-semibold text-emerald-700">
                      +
                      {toNumber(
                        reward.points
                      ).toFixed(1)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-red-600">
              Penalties
            </h4>

            {!score.penalties
              .length && (
              <p className="text-xs text-slate-400">
                No penalties.
              </p>
            )}

            <div className="space-y-2">
              {score.penalties.map(
                (penalty, index) => (
                  <div
                    key={`${penalty.reason}-${index}`}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <span className="text-slate-600">
                      {REASON_LABELS[
                        penalty.reason
                      ] ??
                        penalty.reason}{" "}
                      ×{penalty.count}
                    </span>

                    <span className="shrink-0 font-semibold text-red-600">
                      -
                      {Math.abs(
                        toNumber(
                          penalty.points
                        )
                      ).toFixed(1)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Activity details
            </h4>

            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">
                  Concepts created
                </dt>

                <dd className="font-semibold text-slate-900">
                  {score.nodesCreated}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">
                  Concepts accepted
                </dt>

                <dd className="font-semibold text-emerald-700">
                  {
                    score.nodesCreatedAccepted
                  }
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">
                  Concepts rejected
                </dt>

                <dd className="font-semibold text-red-600">
                  {
                    score.nodesCreatedRejected
                  }
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">
                  Links created
                </dt>

                <dd className="font-semibold text-slate-900">
                  {score.edgesCreated}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">
                  Agreements
                </dt>

                <dd className="font-semibold text-slate-900">
                  {score.nodesAgreed +
                    score.edgesAgreed}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">
                  Undecided
                </dt>

                <dd className="font-semibold text-amber-700">
                  {undecidedTotal}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </article>
  );
}

function SessionCard({
  session,
  index,
  scores,
  isLoading,
  isError,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const normalizedScores =
    useMemo(
      () =>
        extractScores(scores).map(
          normalizeScore
        ),
      [scores]
    );

  const sortedScores = useMemo(
    () =>
      [
        ...normalizedScores,
      ].sort(
        (
          firstScore,
          secondScore
        ) =>
          secondScore.performancePct -
          firstScore.performancePct
      ),
    [normalizedScores]
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() =>
          setExpanded(
            (currentValue) =>
              !currentValue
          )
        }
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-950">
            {session.label ||
              `Session ${index + 1}`}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(
              session.created_at
            )}{" "}
            ·{" "}
            {session.scored_users ??
              sortedScores.length}{" "}
            {Number(
              session.scored_users ??
                sortedScores.length
            ) === 1
              ? "student"
              : "students"}
          </p>
        </div>

        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            expanded
              ? "rotate-180"
              : "rotate-0",
          ].join(" ")}
          strokeWidth={1.8}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading scores...
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              The session scores could not be loaded.
            </div>
          )}

          {!isLoading &&
            !isError &&
            !sortedScores.length && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No scores are available for this session.
              </div>
            )}

          {!isLoading &&
            !isError &&
            Boolean(
              sortedScores.length
            ) && (
              <div className="space-y-3">
                {sortedScores.map(
                  (
                    score,
                    scoreIndex
                  ) => (
                    <GuestScoreDetail
                      key={
                        score.guestId ??
                        scoreIndex
                      }
                      score={score}
                      rank={
                        scoreIndex + 1
                      }
                    />
                  )
                )}
              </div>
            )}
        </div>
      )}
    </article>
  );
}

function GuestEvolutionCard({
  guestId,
  guestName,
  sessions,
  scoreDataBySession,
  color,
}) {
  const chronologicalSessions =
    useMemo(
      () => [...sessions].reverse(),
      [sessions]
    );

  const sessionData = useMemo(
    () =>
      chronologicalSessions.map(
        (session, index) => {
          const scores =
            extractScores(
              scoreDataBySession[
                String(session.id)
              ]
            ).map(normalizeScore);

          const score = scores.find(
            (candidate) =>
              String(
                candidate.guestId
              ) === String(guestId)
          );

          return {
            label:
              session.label ||
              `S${index + 1}`,

            performancePct:
              score?.performancePct ??
              0,

            trustFactor:
              score?.trustFactor ??
              0,

            tags:
              score?.tags ?? [],
          };
        }
      ),
    [
      chronologicalSessions,
      scoreDataBySession,
      guestId,
    ]
  );

  const performanceData =
    sessionData.map(
      (item) =>
        item.performancePct
    );

  const latestSession =
    sessionData[
      sessionData.length - 1
    ];

  const previousSession =
    sessionData[
      sessionData.length - 2
    ];

  const trend =
    latestSession &&
    previousSession
      ? latestSession.performancePct -
        previousSession.performancePct
      : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{
              backgroundColor: color,
            }}
          />

          <h2 className="truncate text-sm font-semibold text-slate-950">
            {guestName}
          </h2>
        </div>

        {trend !== null && (
          <span
            className={[
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold",
              trend >= 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-600",
            ].join(" ")}
          >
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}

            {Math.abs(trend).toFixed(
              1
            )}
            %
          </span>
        )}
      </div>

      {latestSession?.tags?.length >
        0 && (
        <div className="mt-3">
          <PersonalityTags
            tags={latestSession.tags}
          />
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs text-slate-500">
          Performance by session
        </p>

        <MiniLineChart
          data={performanceData}
          color={color}
        />

        <div className="mt-1 flex justify-between gap-2 overflow-hidden text-[9px] text-slate-400">
          {sessionData.map(
            (item, index) => (
              <span
                key={`${item.label}-${index}`}
                className="truncate"
              >
                {item.label}
              </span>
            )
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] text-slate-500">
            Latest performance
          </p>

          <HorizontalBar
            value={
              latestSession?.performancePct ??
              0
            }
          />
        </div>

        <div>
          <p className="mb-1 text-[11px] text-slate-500">
            Latest trust factor
          </p>

          <HorizontalBar
            value={
              latestSession?.trustFactor ??
              0
            }
            maximum={2}
            color="#7c3aed"
            decimals={2}
            suffix=""
          />
        </div>
      </div>
    </article>
  );
}

function OverviewStat({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}) {
  return (
    <article className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50"
        style={{
          color,
        }}
      >
        <Icon
          className="h-5 w-5"
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p
          className="mt-1 truncate text-base font-semibold"
          style={{
            color,
          }}
        >
          {value}
        </p>

        <p className="mt-1 truncate text-[11px] text-slate-400">
          {subtitle}
        </p>
      </div>
    </article>
  );
}

function OverviewStats({
  latestScores,
  isLoading,
}) {
  const statistics =
    useMemo(() => {
      if (!latestScores.length) {
        return {
          averagePerformance: null,
          averageTrust: null,
          topPerformer: null,
          topTag: null,
        };
      }

      const averagePerformance =
        latestScores.reduce(
          (total, score) =>
            total +
            score.performancePct,
          0
        ) / latestScores.length;

      const averageTrust =
        latestScores.reduce(
          (total, score) =>
            total +
            score.trustFactor,
          0
        ) / latestScores.length;

      const topPerformer = [
        ...latestScores,
      ].sort(
        (
          firstScore,
          secondScore
        ) =>
          secondScore.performancePct -
          firstScore.performancePct
      )[0];

      const tagCounts =
        latestScores
          .flatMap(
            (score) => score.tags
          )
          .reduce(
            (
              accumulator,
              tag
            ) => {
              accumulator[tag] =
                (accumulator[tag] ||
                  0) + 1;

              return accumulator;
            },
            {}
          );

      const topTag =
        Object.entries(
          tagCounts
        ).sort(
          (
            firstEntry,
            secondEntry
          ) =>
            secondEntry[1] -
            firstEntry[1]
        )[0] ?? null;

      return {
        averagePerformance,
        averageTrust,
        topPerformer,
        topTag,
      };
    }, [latestScores]);

  const performanceColor =
    statistics.averagePerformance ===
    null
      ? "#64748b"
      : getProgressColor(
          statistics.averagePerformance,
          100
        );

  return (
    <section className="shrink-0 bg-transparent px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStat
          label="Average performance"
          value={
            isLoading
              ? "—"
              : statistics.averagePerformance !==
                  null
                ? `${statistics.averagePerformance.toFixed(
                    1
                  )}%`
                : "—"
          }
          subtitle="Latest session"
          icon={TrendingUp}
          color={performanceColor}
        />

        <OverviewStat
          label="Top performer"
          value={
            isLoading
              ? "—"
              : statistics.topPerformer
                  ?.guestName ?? "—"
          }
          subtitle={
            statistics.topPerformer
              ? `${statistics.topPerformer.performancePct.toFixed(
                  1
                )}%`
              : "No data"
          }
          icon={Award}
          color="#2563eb"
        />

        <OverviewStat
          label="Average trust"
          value={
            isLoading
              ? "—"
              : statistics.averageTrust !==
                  null
                ? statistics.averageTrust.toFixed(
                    2
                  )
                : "—"
          }
          subtitle="Maximum value: 2.00"
          icon={Users}
          color="#7c3aed"
        />

        <OverviewStat
          label="Dominant profile"
          value={
            isLoading
              ? "—"
              : statistics.topTag
                ? PERSONALITY_LABELS[
                    statistics.topTag[0]
                  ] ??
                  statistics.topTag[0]
                : "—"
          }
          subtitle={
            statistics.topTag
              ? `${statistics.topTag[1]} ${
                  statistics.topTag[1] ===
                  1
                    ? "student"
                    : "students"
                }`
              : "No data"
          }
          icon={AlertCircle}
          color="#d97706"
        />
      </div>
    </section>
  );
}

function RankingPanel({
  scores,
  isLoading,
  isError,
}) {
  const sortedScores = useMemo(
    () =>
      [...scores].sort(
        (
          firstScore,
          secondScore
        ) =>
          secondScore.performancePct -
          firstScore.performancePct
      ),
    [scores]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-950">
          Latest session ranking
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Students ranked by calculated performance.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading scores...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          The scores could not be loaded.
        </div>
      )}

      {!isLoading &&
        !isError &&
        !sortedScores.length && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No scores are available for the latest session.
          </div>
        )}

      {!isLoading &&
        !isError &&
        Boolean(
          sortedScores.length
        ) && (
          <div className="space-y-4">
            {sortedScores.map(
              (score, index) => (
                <div
                  key={
                    score.guestId ??
                    index
                  }
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={[
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          getRankClass(
                            index + 1
                          ),
                        ].join(" ")}
                      >
                        {index + 1}
                      </span>

                      <span className="truncate text-sm font-medium text-slate-900">
                        {score.guestName}
                      </span>
                    </div>

                    <PersonalityTags
                      tags={score.tags}
                      limit={2}
                    />
                  </div>

                  <HorizontalBar
                    value={
                      score.performancePct
                    }
                  />
                </div>
              )
            )}
          </div>
        )}
    </section>
  );
}

function ComparisonPanel({
  scores,
  isLoading,
}) {
  const chartData = useMemo(
    () =>
      [...scores]
        .sort(
          (
            firstScore,
            secondScore
          ) =>
            secondScore.performancePct -
            firstScore.performancePct
        )
        .map((score) => ({
          label:
            score.guestName
              ?.split(" ")[0] ||
            "Student",

          value:
            score.performancePct,
        })),
    [scores]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-950">
          Performance comparison
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Individual performance from the latest session.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[160px] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comparison...
        </div>
      ) : (
        <PerformanceBarChart
          data={chartData}
        />
      )}
    </section>
  );
}

function LegendSection({
  title,
  color,
  items,
}) {
  return (
    <section>
      <h3
        className="mb-3 text-xs font-semibold uppercase tracking-wide"
        style={{
          color,
        }}
      >
        {title}
      </h3>

      <div className="space-y-2">
        {items.map(
          (item, index) => (
            <article
              key={`${item.label}-${index}`}
              className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: color,
              }}
            >
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {item.label}
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {item.description}
                </p>
              </div>

              <span
                className="h-fit rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                style={{
                  color,
                  backgroundColor: `${color}12`,
                }}
              >
                ×{item.value}
              </span>
            </article>
          )
        )}
      </div>
    </section>
  );
}

function ScoringLegend() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Main metrics
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Indicators used to evaluate student performance.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {METRIC_DESCRIPTIONS.map(
            (metric) => {
              const Icon =
                metric.icon;

              return (
                <article
                  key={metric.title}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  style={{
                    borderTopWidth: 4,
                    borderTopColor:
                      metric.color,
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50"
                    style={{
                      color:
                        metric.color,
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={1.8}
                    />
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-slate-950">
                    {metric.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {
                      metric.description
                    }
                  </p>
                </article>
              );
            }
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-950">
            Scoring coefficients
          </h2>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            Each action is multiplied by its corresponding coefficient. Accepted creations receive an additional bonus.
          </p>
        </div>

        <div className="space-y-8">
          <LegendSection
            title="Rewards"
            color="#16a34a"
            items={REWARD_ITEMS}
          />

          <LegendSection
            title="Penalties"
            color="#dc2626"
            items={PENALTY_ITEMS}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Maximum performance calculation
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          A performance score of 100% means the student earned the maximum possible score for the current project state.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs leading-6 text-slate-600">
          <p>
            max = accepted concepts × 1.50 × 2
          </p>

          <p>
            + accepted links × 1.25 × 2
          </p>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-400">
          The maximum reflects the total potential of the project, not only the actions available to one individual student.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Personality profiles
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            A student can have multiple personality profiles at the same time.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PERSONALITY_DESCRIPTIONS.map(
            (profile) => (
              <article
                key={profile.key}
                className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {PERSONALITY_LABELS[
                    profile.key
                  ] ?? profile.key}
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {
                    profile.description
                  }
                </p>
              </article>
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProjectPerformancePage() {
  const { classId, projectId } =
    useParams();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState("overview");

  const projectQuery = useQuery({
    queryKey: [
      "project",
      projectId,
    ],

    queryFn: () =>
      getProjectWithMembersApi(
        projectId
      ),

    enabled: Boolean(projectId),
    retry: false,
  });

  const sessionsQuery = useQuery({
    queryKey: [
      "performance-sessions",
      projectId,
    ],

    queryFn: () =>
      getPerformanceSessionsApi(
        projectId
      ),

    enabled: Boolean(projectId),
    retry: false,
  });

  const project =
    projectQuery.data?.project ??
    projectQuery.data;

  const sessions = useMemo(
    () =>
      extractSessions(
        sessionsQuery.data
      ),
    [sessionsQuery.data]
  );

  const scoreQueries = useQueries({
    queries: sessions.map(
      (session) => ({
        queryKey: [
          "performance-session-scores",
          projectId,
          session.id,
        ],

        queryFn: () =>
          getSessionScoresApi(
            projectId,
            session.id
          ),

        enabled: Boolean(
          projectId &&
            session.id
        ),

        retry: false,
      })
    ),
  });

  const scoreDataBySession =
    useMemo(() => {
      const result = {};

      sessions.forEach(
        (session, index) => {
          result[String(session.id)] =
            scoreQueries[index]?.data;
        }
      );

      return result;
    }, [sessions, scoreQueries]);

  const guests = useMemo(() => {
    const members =
      project?.members ?? [];

    return members.filter(
      (member) =>
        String(
          getMemberId(member)
        ) !==
        String(project?.owner_id)
    );
  }, [project]);

  const latestScoreQuery =
    scoreQueries[0];

  const latestScores = useMemo(
    () =>
      extractScores(
        latestScoreQuery?.data
      ).map(normalizeScore),
    [latestScoreQuery?.data]
  );

  const isInitialLoading =
    projectQuery.isLoading ||
    sessionsQuery.isLoading;

  const isInitialError =
    projectQuery.isError ||
    sessionsQuery.isError ||
    !project;

  if (isInitialLoading) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading performance analysis...
        </div>
      </main>
    );
  }

  if (isInitialError) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            The project could not be loaded.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      <header className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

        <div className="relative flex min-h-[128px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft
                className="h-4 w-4"
                strokeWidth={1.8}
              />

              Back to projects
            </button>

            <h1 className="mt-3 text-2xl font-semibold leading-none tracking-tight text-white">
              Performance analysis
            </h1>

            <p className="mt-2 truncate text-sm text-slate-400">
              {project.name} ·{" "}
              {guests.length}{" "}
              {guests.length === 1
                ? "student"
                : "students"}{" "}
              · {sessions.length}{" "}
              {sessions.length === 1
                ? "session"
                : "sessions"}
            </p>
          </div>

          <Link
            to={`/dashboard/teacher/classes/${classId}/projects/${projectId}`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto sm:min-w-[150px]"
          >
            <FolderKanban
              className="h-4 w-4"
              strokeWidth={1.8}
            />

            Open project
          </Link>
        </div>
      </header>

      {sessions.length > 0 && (
        <OverviewStats
          latestScores={latestScores}
          isLoading={
            latestScoreQuery?.isLoading
          }
        />
      )}

      {sessions.length > 0 && (
        <nav className="shrink-0 overflow-x-auto border-b border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-max gap-1">
            {TABS.map((tab) => {
              const isActive =
                activeTab === tab.key;

              const label =
                tab.key === "sessions"
                  ? `${tab.label} (${sessions.length})`
                  : tab.label;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.key
                    )
                  }
                  className={[
                    "relative h-12 px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "text-slate-950"
                      : "text-slate-400 hover:text-slate-700",
                  ].join(" ")}
                >
                  {label}

                  {isActive && (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-950" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-5 [scrollbar-gutter:stable] sm:px-6 lg:px-8">
        {!sessions.length && (
          <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                <TrendingUp
                  className="h-6 w-6"
                  strokeWidth={1.8}
                />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-slate-900">
                No scoring sessions
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Open the project and use the scoring action to record the first performance session.
              </p>

              <Link
                to={`/dashboard/teacher/classes/${classId}/projects/${projectId}`}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <FolderKanban
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />

                Open project
              </Link>
            </div>
          </div>
        )}

        {sessions.length > 0 &&
          activeTab ===
            "overview" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]">
              <RankingPanel
                scores={latestScores}
                isLoading={
                  latestScoreQuery?.isLoading
                }
                isError={
                  latestScoreQuery?.isError
                }
              />

              <ComparisonPanel
                scores={latestScores}
                isLoading={
                  latestScoreQuery?.isLoading
                }
              />
            </div>
          )}

        {sessions.length > 0 &&
          activeTab ===
            "evolution" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {!guests.length && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-sm text-slate-500">
                  This project has no students.
                </div>
              )}

              {guests.map(
                (guest, index) => (
                  <GuestEvolutionCard
                    key={
                      getMemberId(
                        guest
                      ) ?? index
                    }
                    guestId={getMemberId(
                      guest
                    )}
                    guestName={getMemberName(
                      guest
                    )}
                    sessions={sessions}
                    scoreDataBySession={
                      scoreDataBySession
                    }
                    color={
                      CHART_COLORS[
                        index %
                          CHART_COLORS.length
                      ]
                    }
                  />
                )
              )}
            </div>
          )}

        {sessions.length > 0 &&
          activeTab ===
            "sessions" && (
            <div className="space-y-3">
              {sessions.map(
                (session, index) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    index={index}
                    scores={
                      scoreQueries[index]
                        ?.data
                    }
                    isLoading={
                      scoreQueries[index]
                        ?.isLoading
                    }
                    isError={
                      scoreQueries[index]
                        ?.isError
                    }
                  />
                )
              )}
            </div>
          )}

        {sessions.length > 0 &&
          activeTab ===
            "legend" && (
            <ScoringLegend />
          )}
      </section>
    </main>
  );
}