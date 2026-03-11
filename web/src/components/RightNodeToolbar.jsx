import { NodeToolbar } from '@xyflow/react';
import { Pencil, Info, Pin, PinOff, Trash2 } from 'lucide-react';

import './CustomNode.css'


/**
 * Use this inside your custom node component.
 * - Uses NodeToolbar from @xyflow/react (it follows the node while dragging/zooming)
 * - Renders a right-side vertical toolbar with your actions
 */
export function RightNodeToolbar({
  // visible,
  isLocked,
  onEdit,
  onInfo,
  onToggleLock,
  onDelete,
  isOwned,
}) {
  return (
    <NodeToolbar
      // isVisible={visible}
      position="right"
      offset={8} // gap from the node

    >


      <div className='toolbar' aria-label="Node toolbar">

        <div className="row">
          <button title="Edit" aria-label="Edit">
            <svg viewBox="0 0 24 24">
              <path d="M12 20h9" />
              <path
                d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
              />
            </svg>
          </button>
          <div className="lbl">Edit</div>
        </div>
        <div className="row">
          <button title="Info" aria-label="Info">
            <svg viewBox="0 0 24 24">
              <path d="M12 16v-5" />
              <path d="M12 8h.01" />
              <path
                d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
              />
            </svg>
          </button>
          <div className="lbl">Info</div>
        </div>
        <div className="row">
          <button title="Lock" aria-label="Lock">
            <svg viewBox="0 0 24 24">
              <path d="M12 17v5" />
              <path d="M9 7l3-3 3 3" />
              <path d="M8 17h8" />
              <path d="M5 17a7 7 0 0 1 14 0" />
            </svg>
          </button>
          <div className="lbl">Lock</div>
        </div>
        <div className="row warn">
          <button title="Delete" aria-label="Delete">
            <svg viewBox="0 0 24 24">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
          <div className="lbl">Delete</div>
        </div>

      </div>




      {/* <button
          type="button"
          style={{ ...btnStyle, ...btnBlueStyle }}
          onClick={onEdit}
          aria-label="Edit"
          title="Edit"
        >
          <Pencil style={{ ...iconStyle, ...iconBlueStyle }} />
        </button>

        <button
          type="button"
          style={{ ...btnStyle, ...btnGrayStyle }}
          onClick={onInfo}
          aria-label="Info"
          title="Info"
        >
          <Info style={{ ...iconStyle, ...iconGrayStyle }} />
        </button>

        <button
          type="button"
          style={{ ...btnStyle, ...btnAmberStyle, ...(isLocked ? btnActiveStyle : null) }}
          onClick={onToggleLock}
          aria-label={isLocked ? 'Unlock' : 'Lock'}
          title={isLocked ? 'Unlock' : 'Lock'}
        >
          {isLocked ? (
            <PinOff style={{ ...iconStyle, ...iconAmberStyle }} />
          ) : (
            <Pin style={{ ...iconStyle, ...iconAmberStyle }} />
          )}
        </button>

        {isOwned && (
          <button
            type="button"
            style={{ ...btnStyle, ...btnRedStyle }}
            onClick={onDelete}
            aria-label="Delete"
            title="Delete"
          >
            <Trash2 style={{ ...iconStyle, ...iconRedStyle }} />
          </button>
        )} */}
    </NodeToolbar>
  );
}

/* ---- styles (match node radius 4px) ---- */

// const toolbarStackStyle = {
//   display: 'flex',
//   flexDirection: 'column',
//   gap: '6px',
// };

// const btnStyle = {
//   width: '32px',
//   height: '32px',
//   borderRadius: '4px',
//   border: '1px solid rgba(0,0,0,0.12)',
//   backgroundColor: '#ffffff',
//   padding: 0,
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   cursor: 'pointer',
//   boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
// };

// const btnActiveStyle = {
//   outline: '2px solid rgba(0,0,0,0.12)',
//   outlineOffset: '1px',
// };

// const iconStyle = {
//   width: '16px',
//   height: '16px',
//   strokeWidth: 2,
// };

// const btnBlueStyle = { backgroundColor: 'rgba(37,99,235,0.08)' };
// const btnGrayStyle = { backgroundColor: 'rgba(71,85,105,0.08)' };
// const btnAmberStyle = { backgroundColor: 'rgba(245,158,11,0.10)' };
// const btnRedStyle = { backgroundColor: 'rgba(220,38,38,0.10)' };

// const iconBlueStyle = { color: 'rgb(37,99,235)' };
// const iconGrayStyle = { color: 'rgb(71,85,105)' };
// const iconAmberStyle = { color: 'rgb(245,158,11)' };
// const iconRedStyle = { color: 'rgb(220,38,38)' };
export default RightNodeToolbar;