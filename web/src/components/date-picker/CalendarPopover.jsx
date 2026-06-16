import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "./calendarUtils";

const POPOVER_WIDTH = 340;
const VIEWPORT_MARGIN = 8;

export default function CalendarPopover({
  anchorRef,
  children,
  onClose,
  align = "right",
  lockPageScroll = true,
  className = "",
}) {
  const popoverRef = useRef(null);

  const [style, setStyle] = useState({
    position: "fixed",
    top: 0,
    left: 0,
    width: POPOVER_WIDTH,
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchorElement = anchorRef.current;
      const popoverElement = popoverRef.current;

      if (!anchorElement) return;

      const anchorRect = anchorElement.getBoundingClientRect();
      const popoverHeight = popoverElement?.offsetHeight || 420;

      const availableWidth = window.innerWidth - VIEWPORT_MARGIN * 2;
      const width = Math.min(POPOVER_WIDTH, availableWidth);

      let left =
        align === "right"
          ? anchorRect.right - width
          : anchorRect.left;

      left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN)
      );

      let top = anchorRect.bottom + 8;

      if (top + popoverHeight > window.innerHeight - VIEWPORT_MARGIN) {
        top = anchorRect.top - popoverHeight - 8;
      }

      if (top < VIEWPORT_MARGIN) {
        top = VIEWPORT_MARGIN;
      }

      setStyle({
        position: "fixed",
        top,
        left,
        width,
        visibility: "visible",
      });
    };

    updatePosition();

    const rafId = window.requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, align]);

  useEffect(() => {
    const handleMouseDown = (event) => {
      const anchorElement = anchorRef.current;
      const popoverElement = popoverRef.current;

      if (anchorElement?.contains(event.target)) {
        return;
      }

      if (popoverElement?.contains(event.target)) {
        return;
      }

      onClose?.();
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorRef, onClose]);

  useEffect(() => {
    if (!lockPageScroll) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lockPageScroll]);

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Calendar selector"
      style={style}
      className={cx(
        "z-50 overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-xl",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}