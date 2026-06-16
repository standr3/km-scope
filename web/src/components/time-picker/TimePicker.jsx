import React, { useEffect, useMemo, useRef, useState } from "react";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function minutesToInputValue(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${pad2(hours)}:${pad2(mins)}`;
}

function inputValueToMinutes(value) {
  if (!value) return null;

  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutes(minutes, timeFormat) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (timeFormat === "24h") {
    return `${pad2(hours)}:${pad2(mins)}`;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${pad2(mins)} ${period}`;
}

function ClockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getSelectedParts(value, timeFormat) {
  const minutes = inputValueToMinutes(value) ?? 0;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;

  if (timeFormat === "24h") {
    return {
      hour24,
      displayHour: hour24,
      minute,
      period: hour24 >= 12 ? "PM" : "AM",
    };
  }

  return {
    hour24,
    displayHour: hour24 % 12 || 12,
    minute,
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

function toHour24(displayHour, period, timeFormat) {
  if (timeFormat === "24h") {
    return displayHour;
  }

  if (period === "AM") {
    return displayHour === 12 ? 0 : displayHour;
  }

  return displayHour === 12 ? 12 : displayHour + 12;
}

function buildHourOptions(timeFormat) {
  if (timeFormat === "24h") {
    return Array.from({ length: 24 }, (_, index) => ({
      value: index,
      label: pad2(index),
    }));
  }

  return Array.from({ length: 12 }, (_, index) => {
    const value = index + 1;

    return {
      value,
      label: String(value),
    };
  });
}

function buildMinuteOptions(step) {
  return Array.from({ length: Math.ceil(60 / step) }, (_, index) => {
    const value = index * step;

    return {
      value,
      label: pad2(value),
    };
  });
}

export default function TimePicker({
  value,
  onChange,
  label,
  timeFormat = "24h",
  minuteStep = 1,
  minMinute = 0,
  maxMinute = 23 * 60 + 59,
  disabled = false,
  placeholder = "Select time",
  className = "",
}) {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedParts = getSelectedParts(value, timeFormat);
  const selectedMinuteTotal = inputValueToMinutes(value);

  const hourOptions = useMemo(() => {
    return buildHourOptions(timeFormat);
  }, [timeFormat]);

  const minuteOptions = useMemo(() => {
    return buildMinuteOptions(minuteStep);
  }, [minuteStep]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const isCandidateDisabled = (displayHour, minute, period) => {
    const hour24 = toHour24(displayHour, period, timeFormat);
    const candidateMinute = hour24 * 60 + minute;

    return candidateMinute < minMinute || candidateMinute > maxMinute;
  };

  const emitChange = ({ displayHour, minute, period }) => {
    const hour24 = toHour24(displayHour, period, timeFormat);
    const nextMinute = hour24 * 60 + minute;

    if (nextMinute < minMinute || nextMinute > maxMinute) {
      return;
    }

    onChange?.(minutesToInputValue(nextMinute));
  };

  const handleHourSelect = (displayHour) => {
    emitChange({
      displayHour,
      minute: selectedParts.minute,
      period: selectedParts.period,
    });
  };

  const handleMinuteSelect = (minute) => {
    emitChange({
      displayHour: selectedParts.displayHour,
      minute,
      period: selectedParts.period,
    });
  };

  const handlePeriodSelect = (period) => {
    emitChange({
      displayHour: selectedParts.displayHour,
      minute: selectedParts.minute,
      period,
    });
  };

  const displayValue =
    selectedMinuteTotal == null
      ? ""
      : formatMinutes(selectedMinuteTotal, timeFormat);

  const scrollListClassName =
    "max-h-44 space-y-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div ref={rootRef} className={cx("relative w-full", className)}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-slate-600">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={cx(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm outline-none",
          "hover:bg-slate-50 focus:border-slate-300 focus:ring-2 focus:ring-slate-100",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        )}
      >
        <span
          className={cx(
            "truncate",
            displayValue ? "text-slate-900" : "text-slate-400"
          )}
        >
          {displayValue || placeholder}
        </span>

        <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Time selector"
          className="absolute left-0 right-0 z-[130] mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <div
            className={cx(
              "grid gap-2",
              timeFormat === "12h" ? "grid-cols-3" : "grid-cols-2"
            )}
          >
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Hour
              </div>

              <div className={scrollListClassName}>
                {hourOptions.map((hour) => {
                  const isDisabled = isCandidateDisabled(
                    hour.value,
                    selectedParts.minute,
                    selectedParts.period
                  );

                  const isSelected = hour.value === selectedParts.displayHour;

                  return (
                    <button
                      key={hour.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleHourSelect(hour.value)}
                      className={cx(
                        "w-full rounded-lg px-2 py-1.5 text-sm font-medium",
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100",
                        isDisabled &&
                          "cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {hour.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Minute
              </div>

              <div className={scrollListClassName}>
                {minuteOptions.map((minute) => {
                  const isDisabled = isCandidateDisabled(
                    selectedParts.displayHour,
                    minute.value,
                    selectedParts.period
                  );

                  const isSelected = minute.value === selectedParts.minute;

                  return (
                    <button
                      key={minute.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleMinuteSelect(minute.value)}
                      className={cx(
                        "w-full rounded-lg px-2 py-1.5 text-sm font-medium",
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100",
                        isDisabled &&
                          "cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {minute.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {timeFormat === "12h" && (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Period
                </div>

                <div className="space-y-1">
                  {["AM", "PM"].map((period) => {
                    const isDisabled = isCandidateDisabled(
                      selectedParts.displayHour,
                      selectedParts.minute,
                      period
                    );

                    const isSelected = period === selectedParts.period;

                    return (
                      <button
                        key={period}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handlePeriodSelect(period)}
                        className={cx(
                          "w-full rounded-lg px-2 py-1.5 text-sm font-medium",
                          isSelected
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-100",
                          isDisabled &&
                            "cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {period}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Allowed range:{" "}
            <span className="font-semibold text-slate-700">
              {formatMinutes(minMinute, timeFormat)} -{" "}
              {formatMinutes(maxMinute, timeFormat)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}