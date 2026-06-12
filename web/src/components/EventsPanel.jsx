import { X } from "lucide-react";
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

export default function EventsPanel({ events = [] }) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
       

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-2 py-2">
        {events.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">
            No events yet.
          </div>
        ) : (
          <ol className="space-y-1.5">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 text-[10px] font-medium text-slate-400">
                    #{event.index}
                  </span>

                  {event.entityType && (
                    <span className="truncate text-[10px] font-medium text-indigo-700">
                      {getEntityLabel(event.entityType)}
                    </span>
                  )}

                  {event.action && (
                    <span className="truncate text-[10px] font-medium text-cyan-700">
                      {getActionLabel(event.action)}
                    </span>
                  )}

                  {event.scope && (
                    <span
                      className={[
                        "truncate text-[10px] font-medium",
                        event.scope === "global"
                          ? "text-purple-700"
                          : "text-green-700",
                      ].join(" ")}
                    >
                      {getScopeLabel(event.scope)}
                    </span>
                  )}

                  <time className="ml-auto shrink-0 text-[10px] text-slate-400">
                    {formatTimestamp(event.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}