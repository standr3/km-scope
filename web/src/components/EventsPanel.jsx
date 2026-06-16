import React from "react";

function formatTimestamp(ts) {
  if (!ts) return "";

  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getEntityLabel(entityType) {
  switch (entityType) {
    case "node":
      return "Concept";
    case "edge":
      return "Link";
    default:
      return entityType;
  }
}

function getActionLabel(action) {
  switch (action) {
    case "create":
      return "created";
    case "up":
      return "approved";
    case "down":
      return "rejected";
    default:
      return action;
  }
}

function getScopeLabel(scope) {
  switch (scope) {
    case "local":
      return "by guest";
    case "global":
      return "by owner";
    default:
      return scope;
  }
}

function getActionClass(action) {
  switch (action) {
    case "create":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "up":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "down":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function getEntityClass(entityType) {
  switch (entityType) {
    case "node":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "edge":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function getScopeClass(scope) {
  switch (scope) {
    case "global":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    case "local":
      return "bg-teal-50 text-teal-700 ring-teal-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export default function EventsPanel({ events = [] }) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3">
        {events.length === 0 ? (
          <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                No events yet
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Activity will appear here after concepts or links are changed.
              </p>
            </div>
          </div>
        ) : (
          <ol className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">
                    #{event.index}
                  </span>

                  <time className="shrink-0 text-[11px] font-medium text-slate-400">
                    {formatTimestamp(event.createdAt)}
                  </time>
                </div>

                <div className="mt-2 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
                  {event.entityType && (
                    <span
                      className={[
                        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold ring-1 ring-inset",
                        getEntityClass(event.entityType),
                      ].join(" ")}
                    >
                      {getEntityLabel(event.entityType)}
                    </span>
                  )}

                  {event.action && (
                    <span
                      className={[
                        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold ring-1 ring-inset",
                        getActionClass(event.action),
                      ].join(" ")}
                    >
                      {getActionLabel(event.action)}
                    </span>
                  )}

                  {event.scope && (
                    <span
                      className={[
                        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold ring-1 ring-inset",
                        getScopeClass(event.scope),
                      ].join(" ")}
                    >
                      {getScopeLabel(event.scope)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}