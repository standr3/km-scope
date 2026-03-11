// src/components/EdgeToolbar.jsx
import React, { memo, useMemo } from 'react';
import '../CustomEdge.css';

/**
 * Props contract:
 * - mode: "guest-review" | "owner-decide"
 * - uiState: baseline|pending|accepted|rejected|needs_review|locked
 * - choice: up|down|none  (selected state)
 * - disabled: disables up/down
 * - onUp/onDown
 * - canDelete/onDelete
 * - onClose
 * - reviewsTotal, approvalRatePct
 */
function EdgeToolbar({
  mode,
  uiState,
  choice,
  disabled,
  onUp,
  onDown,
  canDelete,
  onDelete,
  onClose,
  onMouseDownStop,
  showLockedHint,
  lockedHintText,
  reviewsTotal,
  approvalRatePct,
}) {
  const upTitle = useMemo(() => (mode === 'owner-decide' ? 'Accept' : 'Like'), [mode]);
  const downTitle = useMemo(() => (mode === 'owner-decide' ? 'Reject' : 'Dislike'), [mode]);

  return (
    <div className="edge-toolbar" role="dialog" aria-label="Edge actions" onMouseDown={onMouseDownStop}>
      {showLockedHint && <div className="edge-locked-hint">{lockedHintText}</div>}

      <div className="edge-toolbar__row">
        <div className="edge-vote" role="group" aria-label="Edge controls">
          <button
            type="button"
            className={`edge-vote-btn edge-vote-btn--up ${choice === 'up' ? 'is-on' : ''}`}
            aria-pressed={choice === 'up' ? 'true' : 'false'}
            disabled={disabled}
            onClick={onUp}
            title={upTitle}
          >
            {/* keep SVG default; you can swap later to checkmark */}
            <svg viewBox="0 0 24 24">
              <path d="M7 10v12" />
              <path d="M15 9l-2-6-3 7v12h8a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-3z" />
            </svg>
          </button>

          <button
            type="button"
            className={`edge-vote-btn edge-vote-btn--down ${choice === 'down' ? 'is-on' : ''}`}
            aria-pressed={choice === 'down' ? 'true' : 'false'}
            disabled={disabled}
            onClick={onDown}
            title={downTitle}
          >
            <svg viewBox="0 0 24 24">
              <path d="M17 14V2" />
              <path d="M9 15l2 6 3-7V2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3z" />
            </svg>
          </button>
        </div>

        <div className="edge-toolbar__right">
          {canDelete && (
            <button type="button" className="edge-delete" onClick={onDelete} title="Delete edge">
              🗑
            </button>
          )}

          <button type="button" className="edge-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      <div className="edge-toolbar__meta">
        <span>
          <b>REV</b> {reviewsTotal}
        </span>
        <span>
          <b>ACC</b> {approvalRatePct}%
        </span>
      </div>
    </div>
  );
}

export default memo(EdgeToolbar);
