import React from "react";

function formatEventLine(event) {
  const parts = [];

  if (event.entityId) parts.push(event.entityId);
  if (event.action) parts.push(event.action);
  if (event.scope) parts.push(event.scope);
  if (event.userId) parts.push(event.userId);
  if (event.sourceId) parts.push(event.sourceId);
  if (event.targetId) parts.push(event.targetId);

  return parts.join(" - ");
}

function formatTimestamp(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return "";
  }
}

export default function EventsPanel({ events, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 88,
        right: 16,
        width: 360,
        maxHeight: "70vh",
        overflow: "hidden",
        zIndex: 1000,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        boxShadow: "0 16px 40px rgba(17, 24, 39, 0.14)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "14px 14px 10px 14px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Event log
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginTop: 2,
            }}
          >
            In creation order
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "#f9fafb",
            color: "#6b7280",
            width: 30,
            height: 30,
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          overflowY: "auto",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {events.length === 0 ? (
          <div
            style={{
              padding: 14,
              color: "#6b7280",
              fontSize: 13,
            }}
          >
            No events yet.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              style={{
                border: "1px solid #eef2f7",
                background: "#fbfdff",
                borderRadius: 14,
                padding: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 28,
                    height: 22,
                    padding: "0 8px",
                    borderRadius: 999,
                    background: "#f3f4f6",
                    color: "#374151",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  #{event.index}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatTimestamp(event.createdAt)}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "#111827",
                  fontWeight: 600,
                  marginBottom: 6,
                  wordBreak: "break-word",
                }}
              >
                {formatEventLine(event)}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {event.entityType && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#eef2ff",
                      color: "#4338ca",
                      fontWeight: 600,
                    }}
                  >
                    {event.entityType}
                  </span>
                )}

                {event.action && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#ecfeff",
                      color: "#155e75",
                      fontWeight: 600,
                    }}
                  >
                    {event.action}
                  </span>
                )}

                {event.scope && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background:
                        event.scope === "global" ? "#f3e8ff" : "#f0fdf4",
                      color:
                        event.scope === "global" ? "#7e22ce" : "#166534",
                      fontWeight: 600,
                    }}
                  >
                    {event.scope}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}