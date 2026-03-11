// src/debug/useRenderCount.js
import { useEffect, useRef } from 'react';
import { devFlags } from './devFlags';

/**
 * Counts renders for a component instance.
 *
 * - Returns current count (starts at 1 on first render).
 * - Optionally logs to console if devFlags.logRenders is true.
 *
 * Usage:
 *   const count = useRenderCount(`CustomNode:${id}`);
 *   // show badge with count
 */
export function useRenderCount(label) {
  const countRef = useRef(0);
  countRef.current += 1;

  useEffect(() => {
    if (!devFlags?.logRenders) return;
    // eslint-disable-next-line no-console
    console.log(`[render] ${label}`, { count: countRef.current });
  });

  return countRef.current;
}
