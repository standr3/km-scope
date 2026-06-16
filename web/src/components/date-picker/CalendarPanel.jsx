import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarView,
  addDays,
  addMonths,
  buildDayCells,
  buildMonthCells,
  buildYearCells,
  cx,
  getDisplayMonthDate,
  getMonthShortLabel,
  getMonthStartCalendarDate,
  getWeekdayLabels,
  getYearPanelStartYear,
  isDateDisabled,
  isSameDay,
  isSameMonth,
  startOfDay,
} from "./calendarUtils";

export default function CalendarPanel({
  value,
  onChange,
  onClear,
  onClose,
  locale = "ro-RO",
  weekStartsOn = 1,
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  disabledDate,
  closeOnSelect = true,
  showClear = true,
  showToday = true,
  className = "",
}) {
  const panelRef = useRef(null);
  const lastWheelTimeRef = useRef(0);

  const today = startOfDay(new Date());

  const [view, setView] = useState(CalendarView.DAYS);

  const [calendarStartDate, setCalendarStartDate] = useState(() => {
    const baseDate = value || today;

    return getMonthStartCalendarDate(baseDate, weekStartsOn);
  });

  const dayCells = useMemo(() => {
    return buildDayCells(calendarStartDate);
  }, [calendarStartDate]);

  const displayMonthDate = getDisplayMonthDate(dayCells);
  const displayMonth = displayMonthDate.getMonth();
  const displayYear = displayMonthDate.getFullYear();

  const [monthPanelStartDate, setMonthPanelStartDate] = useState(() => {
    return new Date(displayYear, 0, 1);
  });

  const monthCells = useMemo(() => {
    return buildMonthCells(monthPanelStartDate);
  }, [monthPanelStartDate]);

  const monthPanelMainYear = monthCells[5].getFullYear();

  const [yearPanelStartYear, setYearPanelStartYear] = useState(() => {
    return getYearPanelStartYear(displayYear);
  });

  const yearCells = useMemo(() => {
    return buildYearCells(yearPanelStartYear);
  }, [yearPanelStartYear]);

  const yearPanelMainStart = yearPanelStartYear + 2;
  const yearPanelMainEnd = yearPanelMainStart + 9;

  const weekdayLabels = useMemo(() => {
    return getWeekdayLabels(locale, weekStartsOn);
  }, [locale, weekStartsOn]);

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(displayMonthDate);

  useEffect(() => {
    if (view !== CalendarView.MONTHS) {
      return;
    }

    setMonthPanelStartDate(new Date(displayYear, 0, 1));
  }, [view, displayYear]);

  useEffect(() => {
    if (view !== CalendarView.YEARS) {
      return;
    }

    setYearPanelStartYear(getYearPanelStartYear(monthPanelMainYear));
  }, [view, monthPanelMainYear]);

  useEffect(() => {
    const panelElement = panelRef.current;

    if (!panelElement) {
      return;
    }

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const now = Date.now();

      if (now - lastWheelTimeRef.current < 160) {
        return;
      }

      lastWheelTimeRef.current = now;

      if (view === CalendarView.DAYS) {
        setCalendarStartDate((currentDate) => {
          return addDays(currentDate, event.deltaY > 0 ? 7 : -7);
        });

        return;
      }

      if (view === CalendarView.MONTHS) {
        setMonthPanelStartDate((currentDate) => {
          return addMonths(currentDate, event.deltaY > 0 ? 4 : -4);
        });

        return;
      }

      setYearPanelStartYear((currentYear) => {
        return currentYear + (event.deltaY > 0 ? 4 : -4);
      });
    };

    panelElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      panelElement.removeEventListener("wheel", handleWheel);
    };
  }, [view]);

  const disabledOptions = {
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    disabledDate,
  };

  const handleHeaderClick = () => {
    if (view === CalendarView.DAYS) {
      setMonthPanelStartDate(new Date(displayYear, 0, 1));
      setView(CalendarView.MONTHS);
      return;
    }

    if (view === CalendarView.MONTHS) {
      setYearPanelStartYear(getYearPanelStartYear(monthPanelMainYear));
      setView(CalendarView.YEARS);
      return;
    }

    setMonthPanelStartDate(new Date(displayYear, 0, 1));
    setView(CalendarView.MONTHS);
  };

  const goOneRowUp = () => {
    if (view === CalendarView.DAYS) {
      setCalendarStartDate((currentDate) => addDays(currentDate, -7));
      return;
    }

    if (view === CalendarView.MONTHS) {
      setMonthPanelStartDate((currentDate) => addMonths(currentDate, -4));
      return;
    }

    setYearPanelStartYear((currentYear) => currentYear - 4);
  };

  const goOneRowDown = () => {
    if (view === CalendarView.DAYS) {
      setCalendarStartDate((currentDate) => addDays(currentDate, 7));
      return;
    }

    if (view === CalendarView.MONTHS) {
      setMonthPanelStartDate((currentDate) => addMonths(currentDate, 4));
      return;
    }

    setYearPanelStartYear((currentYear) => currentYear + 4);
  };

  const goToPreviousPeriod = () => {
    if (view === CalendarView.DAYS) {
      const previousMonth = new Date(displayYear, displayMonth - 1, 1);
      setCalendarStartDate(getMonthStartCalendarDate(previousMonth, weekStartsOn));
      return;
    }

    if (view === CalendarView.MONTHS) {
      setMonthPanelStartDate((currentDate) => {
        return new Date(currentDate.getFullYear() - 1, 0, 1);
      });

      return;
    }

    setYearPanelStartYear((currentYear) => currentYear - 10);
  };

  const goToNextPeriod = () => {
    if (view === CalendarView.DAYS) {
      const nextMonth = new Date(displayYear, displayMonth + 1, 1);
      setCalendarStartDate(getMonthStartCalendarDate(nextMonth, weekStartsOn));
      return;
    }

    if (view === CalendarView.MONTHS) {
      setMonthPanelStartDate((currentDate) => {
        return new Date(currentDate.getFullYear() + 1, 0, 1);
      });

      return;
    }

    setYearPanelStartYear((currentYear) => currentYear + 10);
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date, disabledOptions)) {
      return;
    }

    onChange?.(date);

    if (closeOnSelect) {
      onClose?.();
    }
  };

  const handleMonthClick = (date) => {
    setCalendarStartDate(getMonthStartCalendarDate(date, weekStartsOn));
    setView(CalendarView.DAYS);
  };

  const handleYearClick = (year) => {
    setMonthPanelStartDate(new Date(year, 0, 1));
    setView(CalendarView.MONTHS);
  };

  const handleTodayClick = () => {
    if (isDateDisabled(today, disabledOptions)) {
      setCalendarStartDate(getMonthStartCalendarDate(today, weekStartsOn));
      setView(CalendarView.DAYS);
      return;
    }

    onChange?.(today);

    if (closeOnSelect) {
      onClose?.();
    }
  };

  const handleClearClick = () => {
    onClear?.();

    if (closeOnSelect) {
      onClose?.();
    }
  };

  const getHeaderLabel = () => {
    if (view === CalendarView.DAYS) {
      return monthLabel;
    }

    if (view === CalendarView.MONTHS) {
      return monthPanelMainYear;
    }

    return `${yearPanelMainStart} - ${yearPanelMainEnd}`;
  };

  return (
    <div ref={panelRef} className={cx("select-none", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleHeaderClick}
          className="rounded-lg px-2 py-1 text-left text-sm font-semibold capitalize text-slate-900 hover:bg-slate-100"
          title="Schimbă nivelul de selecție"
        >
          {getHeaderLabel()}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goOneRowUp}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            title="Mută cu un rând în sus"
          >
            ↑
          </button>

          <button
            type="button"
            onClick={goOneRowDown}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            title="Mută cu un rând în jos"
          >
            ↓
          </button>

          <button
            type="button"
            onClick={goToPreviousPeriod}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            title="Perioada anterioară"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goToNextPeriod}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            title="Perioada următoare"
          >
            ›
          </button>
        </div>
      </div>

      {view === CalendarView.DAYS && (
        <div className="grid grid-cols-7 gap-y-2">
          {weekdayLabels.map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-xs font-medium text-slate-400"
            >
              {day}
            </div>
          ))}

          {dayCells.map((date) => {
            const normalizedDate = startOfDay(date);
            const isPast = normalizedDate < today;
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, value);
            const isDisabled = isDateDisabled(date, disabledOptions);

            const isCurrentDisplayMonth =
              date.getMonth() === displayMonth &&
              date.getFullYear() === displayYear;

            return (
              <div
                key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                className="flex h-10 items-center justify-center"
              >
                <button
                  type="button"
                  disabled={isDisabled}
                  aria-selected={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => handleDateClick(date)}
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                    isCurrentDisplayMonth
                      ? "text-slate-800 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50",
                    isPast && isCurrentDisplayMonth && "text-slate-400",
                    isToday &&
                      !isSelected &&
                      "border border-slate-400 font-semibold",
                    isSelected && "bg-sky-500 text-white hover:bg-sky-500",
                    isDisabled &&
                      "cursor-not-allowed text-slate-200 hover:bg-transparent"
                  )}
                >
                  {date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {view === CalendarView.MONTHS && (
        <div className="grid grid-cols-4 gap-y-5 py-3">
          {monthCells.map((date) => {
            const isCurrentPanelYear =
              date.getFullYear() === monthPanelMainYear;

            const isActiveMonth = isSameMonth(date, displayMonthDate);
            const isCurrentMonth = isSameMonth(date, today);

            return (
              <div
                key={`${date.getFullYear()}-${date.getMonth()}`}
                className="flex h-12 items-center justify-center"
              >
                <button
                  type="button"
                  onClick={() => handleMonthClick(date)}
                  className={cx(
                    "flex h-11 w-14 items-center justify-center rounded-full text-sm transition",
                    isCurrentPanelYear
                      ? "text-slate-800 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50",
                    isCurrentMonth &&
                      !isActiveMonth &&
                      "border border-slate-400 font-semibold",
                    isActiveMonth &&
                      "bg-sky-500 text-white hover:bg-sky-500"
                  )}
                >
                  {getMonthShortLabel(date, locale)}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {view === CalendarView.YEARS && (
        <div className="grid grid-cols-4 gap-y-5 py-3">
          {yearCells.map((year) => {
            const isCurrentMainRange =
              year >= yearPanelMainStart && year <= yearPanelMainEnd;

            const isActiveYear = year === displayYear;
            const isCurrentYear = year === today.getFullYear();

            return (
              <div key={year} className="flex h-12 items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleYearClick(year)}
                  className={cx(
                    "flex h-11 w-16 items-center justify-center rounded-full text-sm transition",
                    isCurrentMainRange
                      ? "text-slate-800 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50",
                    isCurrentYear &&
                      !isActiveYear &&
                      "border border-slate-400 font-semibold",
                    isActiveYear &&
                      "bg-sky-500 text-white hover:bg-sky-500"
                  )}
                >
                  {year}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(showClear || showToday) && (
        <div className="mt-4 flex justify-between border-t border-slate-100 pt-3">
          {showClear ? (
            <button
              type="button"
              onClick={handleClearClick}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              Clear
            </button>
          ) : (
            <span />
          )}

          {showToday && (
            <button
              type="button"
              onClick={handleTodayClick}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Azi
            </button>
          )}
        </div>
      )}
    </div>
  );
}