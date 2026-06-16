import React, { useEffect, useId, useRef, useState } from "react";
import CalendarPanel from "./CalendarPanel";
import CalendarPopover from "./CalendarPopover";
import { cx, formatDateForInput, toLocalDateValue } from "./calendarUtils";

function CalendarIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  buttonLabel,
  buttonAriaLabel = "Open calendar",
  locale = "en-US",
  weekStartsOn = 1,
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  disabledDate,
  closeOnSelect = true,
  showClear = true,
  showToday = true,
  disabled = false,
  name,
  id,
  className = "",
  inputClassName = "",
  buttonClassName = "",
  popoverClassName = "",
  calendarClassName = "",
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const anchorRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  const displayValue = formatDateForInput(value, locale);

  const handleClear = () => {
    onChange?.(null);
  };

  return (
    <div className={cx("w-full max-w-sm", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <div className="flex gap-2">
        <input
          id={inputId}
          name={name}
          readOnly
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          data-local-date-value={toLocalDateValue(value)}
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          className={cx(
            "min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400",
            "focus:border-slate-300 focus:ring-2 focus:ring-slate-100",
            disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
            inputClassName
          )}
        />

        <div ref={anchorRef} className="shrink-0">
          <button
            type="button"
            disabled={disabled}
            aria-label={buttonAriaLabel}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className={cx(
              "flex h-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-medium text-white hover:bg-slate-800",
              buttonLabel ? "px-4" : "w-10 px-0",
              "disabled:cursor-not-allowed disabled:bg-slate-300",
              buttonClassName
            )}
          >
            {buttonLabel ? (
              buttonLabel
            ) : (
              <CalendarIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <CalendarPopover
          anchorRef={anchorRef}
          onClose={() => setIsOpen(false)}
          className={popoverClassName}
        >
          <CalendarPanel
            value={value}
            onChange={onChange}
            onClear={handleClear}
            onClose={() => setIsOpen(false)}
            locale={locale}
            weekStartsOn={weekStartsOn}
            minDate={minDate}
            maxDate={maxDate}
            disablePast={disablePast}
            disableFuture={disableFuture}
            disabledDate={disabledDate}
            closeOnSelect={closeOnSelect}
            showClear={showClear}
            showToday={showToday}
            className={calendarClassName}
          />
        </CalendarPopover>
      )}
    </div>
  );
}