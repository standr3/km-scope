// src/debug/devFlags.js

// Central place for toggling debug helpers.
// Keep it JS-only and runtime-configurable.
//
// Usage:
//   import { devFlags } from '../debug/devFlags';
//   if (devFlags.showRenderBadges) { ... }
//
// Optional: override in browser console:
//   window.__DEV_FLAGS__ = { showRenderBadges: true };

const DEFAULT_FLAGS = {
  showRenderBadges: false,   // overlays render counts on nodes/edges
  logRenders: false,         // console.log render events
  logPolicyDecisions: false, // verbose policy logs in adapter/hook if you wire them
};

function readWindowOverrides() {
  try {
    if (typeof window === 'undefined') return null;
    const v = window.__DEV_FLAGS__;
    if (!v || typeof v !== 'object') return null;
    return v;
  } catch {
    return null;
  }
}

export const devFlags = {
  ...DEFAULT_FLAGS,
  ...(readWindowOverrides() || {}),
};
