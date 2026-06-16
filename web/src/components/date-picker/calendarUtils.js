export const CalendarView = {
  DAYS: "days",
  MONTHS: "months",
  YEARS: "years",
};

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function startOfDay(date) {
  if (!date) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

export function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function getStartOfWeek(date, weekStartsOn = 1) {
  const normalizedDate = startOfDay(date);
  const offset = (normalizedDate.getDay() - weekStartsOn + 7) % 7;

  return addDays(normalizedDate, -offset);
}

export function getMonthStartCalendarDate(date, weekStartsOn = 1) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

  return getStartOfWeek(firstDayOfMonth, weekStartsOn);
}

export function isSameDay(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function isSameMonth(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth()
  );
}

export function buildDayCells(calendarStartDate) {
  return Array.from({ length: 42 }, (_, index) => {
    return addDays(calendarStartDate, index);
  });
}

export function buildMonthCells(monthPanelStartDate) {
  return Array.from({ length: 16 }, (_, index) => {
    return addMonths(monthPanelStartDate, index);
  });
}

export function buildYearCells(yearPanelStartYear) {
  return Array.from({ length: 16 }, (_, index) => {
    return yearPanelStartYear + index;
  });
}

export function getDisplayMonthDate(calendarCells) {
  return calendarCells[20];
}

export function getDecadeStart(year) {
  return Math.floor(year / 10) * 10;
}

export function getYearPanelStartYear(year) {
  return getDecadeStart(year) - 2;
}

export function getWeekdayLabels(locale = "ro-RO", weekStartsOn = 1) {
  const baseSunday = new Date(2026, 5, 14);

  return Array.from({ length: 7 }, (_, index) => {
    const dayOffset = (weekStartsOn + index) % 7;
    const date = addDays(baseSunday, dayOffset);

    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
    })
      .format(date)
      .replace(".", "");
  });
}

export function getMonthShortLabel(date, locale = "ro-RO") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

export function formatDateForInput(date, locale = "ro-RO") {
  if (!date) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function toLocalDateValue(date) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isDateDisabled(
  date,
  { minDate, maxDate, disablePast, disableFuture, disabledDate } = {}
) {
  const normalizedDate = startOfDay(date);
  const today = startOfDay(new Date());

  if (disablePast && normalizedDate < today) {
    return true;
  }

  if (disableFuture && normalizedDate > today) {
    return true;
  }

  if (minDate && normalizedDate < startOfDay(minDate)) {
    return true;
  }

  if (maxDate && normalizedDate > startOfDay(maxDate)) {
    return true;
  }

  if (disabledDate?.(normalizedDate)) {
    return true;
  }

  return false;
}