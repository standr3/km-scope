import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  listSchoolYearsAdminApi,
  listPeriodsAdminApi,
  createPeriodApi,
  updatePeriodApi,
  deletePeriodApi,
} from "../api/admin";
import TimePicker from "../components/time-picker/TimePicker";

const DAY_START_MINUTE = 0;
const DAY_END_MINUTE = 24 * 60;

const ZOOM_PRESETS = [
  {
    id: "hour",
    label: "1h",
    gridStepMinutes: 60,
    pxPerMinute: 0.85,
  },
  {
    id: "half-hour",
    label: "30m",
    gridStepMinutes: 30,
    pxPerMinute: 1.15,
  },
  {
    id: "quarter-hour",
    label: "15m",
    gridStepMinutes: 15,
    pxPerMinute: 1.55,
  },
  {
    id: "ten-minute",
    label: "10m",
    gridStepMinutes: 10,
    pxPerMinute: 2,
  },
];

function TimerIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM18 5l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function minutesToInputValue(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${pad2(hours)}:${pad2(mins)}`;
}

function inputValueToMinutes(value) {
  if (!value) return null;

  const [hours, minutes] = String(value).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function normalizeApiTimeValue(value) {
  if (!value) return "";

  const time = String(value);

  if (/^\d{1,2}:\d{2}/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return "";
    }

    return `${pad2(hours)}:${pad2(minutes)}`;
  }

  return "";
}

function apiTimeToMinutes(value) {
  const normalizedValue = normalizeApiTimeValue(value);

  if (!normalizedValue) return null;

  return inputValueToMinutes(normalizedValue);
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

function getDurationLabel(startMinute, endMinute) {
  const duration = endMinute - startMinute;

  if (duration < 60) {
    return `${duration} min`;
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (!minutes) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function doPeriodsOverlap(firstPeriod, secondPeriod) {
  return (
    firstPeriod.startMinute < secondPeriod.endMinute &&
    firstPeriod.endMinute > secondPeriod.startMinute
  );
}

function findOverlap(periods, candidate, ignoredPeriodId = null) {
  return periods.find((period) => {
    if (period.id === ignoredPeriodId) {
      return false;
    }

    return doPeriodsOverlap(period, candidate);
  });
}

function getNextZoomPresetId(currentZoomPresetId) {
  const currentIndex = ZOOM_PRESETS.findIndex(
    (preset) => preset.id === currentZoomPresetId
  );

  const nextIndex =
    currentIndex === -1 ? 0 : (currentIndex + 1) % ZOOM_PRESETS.length;

  return ZOOM_PRESETS[nextIndex].id;
}

function getSchoolYearLabel(schoolYear) {
  return schoolYear.name ?? schoolYear.label ?? "School year";
}

function getSchoolYearId(schoolYear) {
  return String(schoolYear.id);
}

function normalizePeriod(apiPeriod) {
  const startMinute = apiTimeToMinutes(
    apiPeriod.start_time ?? apiPeriod.startTime
  );

  const endMinute = apiTimeToMinutes(apiPeriod.end_time ?? apiPeriod.endTime);

  if (
    startMinute == null ||
    endMinute == null ||
    endMinute <= startMinute
  ) {
    return null;
  }

  return {
    id: apiPeriod.id,
    schoolYearId:
      apiPeriod.school_year_id ?? apiPeriod.schoolYearId ?? apiPeriod.year_id,
    startMinute,
    endMinute,
  };
}

function normalizePeriods(apiPeriods) {
  return apiPeriods
    .map(normalizePeriod)
    .filter(Boolean)
    .sort(
      (firstPeriod, secondPeriod) =>
        firstPeriod.startMinute - secondPeriod.startMinute
    );
}

function TimelineGrid({
  periods,
  selectedZoom,
  timeFormat,
  isLoading,
  isError,
  canCreate,
  onCreatePeriod,
  onEditPeriod,
}) {
  const timelineHeight = DAY_END_MINUTE * selectedZoom.pxPerMinute;

  const gridLines = useMemo(() => {
    const lines = [];

    for (
      let minute = DAY_START_MINUTE;
      minute <= DAY_END_MINUTE;
      minute += selectedZoom.gridStepMinutes
    ) {
      lines.push(minute);
    }

    return lines;
  }, [selectedZoom.gridStepMinutes]);

  return (
    <div className="h-full min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm [scrollbar-gutter:stable]">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/85 px-3 py-3 backdrop-blur">
        <div className="min-w-0">
          {isLoading && (
            <p className="truncate text-xs font-medium text-slate-500">
              Loading periods...
            </p>
          )}

          {isError && (
            <p className="truncate text-xs font-medium text-red-600">
              Error loading periods.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onCreatePeriod}
          disabled={!canCreate}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Add period
        </button>
      </div>

      <div
        className="relative mx-2 mb-6 mt-3 sm:mx-3"
        style={{
          height: timelineHeight,
        }}
      >
        {gridLines.map((minute) => {
          const isHourLine = minute % 60 === 0;
          const isDayEnd = minute === DAY_END_MINUTE;

          return (
            <div
              key={minute}
              className="absolute left-0 right-0"
              style={{
                top: minute * selectedZoom.pxPerMinute,
              }}
            >
              <div className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[68px_minmax(0,1fr)] sm:gap-3">
                <div className="-translate-y-2 text-right text-[11px] font-medium text-slate-400 sm:text-xs">
                  {isDayEnd ? "24:00" : formatMinutes(minute, timeFormat)}
                </div>

                <div
                  className={[
                    "border-t",
                    isHourLine
                      ? "border-slate-300"
                      : "border-dashed border-slate-200",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-0 left-[62px] right-0 border-t border-slate-300 sm:left-[80px]" />

        {periods.map((period) => {
          const top = period.startMinute * selectedZoom.pxPerMinute;
          const height = Math.max(
            (period.endMinute - period.startMinute) * selectedZoom.pxPerMinute,
            32
          );

          return (
            <button
              key={period.id}
              type="button"
              onClick={() => onEditPeriod(period)}
              className="absolute left-[62px] right-1 z-20 overflow-hidden rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-left text-sky-950 shadow-md ring-1 ring-sky-100 transition hover:border-sky-300 hover:bg-sky-100 sm:left-[80px] sm:right-2 sm:px-4 sm:py-3"
              style={{
                top,
                height,
              }}
            >
              <div className="flex h-full min-h-0 items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold sm:text-sm">
                    {formatMinutes(period.startMinute, timeFormat)} -{" "}
                    {formatMinutes(period.endMinute, timeFormat)}
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-sky-500 px-2 py-1 text-[11px] font-semibold text-white sm:px-2.5 sm:text-xs">
                  {getDurationLabel(period.startMinute, period.endMinute)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodModal({
  isOpen,
  mode,
  period,
  periods,
  timeFormat,
  isSaving = false,
  isDeleting = false,
  onClose,
  onSave,
  onDelete,
}) {
  const [formValue, setFormValue] = useState({
    startTime: "08:00",
    endTime: "08:30",
  });

  const [error, setError] = useState("");

  const isBusy = isSaving || isDeleting;

  useEffect(() => {
    if (!isOpen) return;

    if (period) {
      setFormValue({
        startTime: minutesToInputValue(period.startMinute),
        endTime: minutesToInputValue(period.endMinute),
      });
    } else {
      setFormValue({
        startTime: "08:00",
        endTime: "08:30",
      });
    }

    setError("");
  }, [isOpen, period]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isBusy) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field, value) => {
    setFormValue((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));

    setError("");
  };

  const handleStartTimeChange = (nextStartTime) => {
    const nextStartMinute = inputValueToMinutes(nextStartTime);

    setFormValue((currentValue) => {
      const currentEndMinute = inputValueToMinutes(currentValue.endTime);
      let nextEndTime = currentValue.endTime;

      if (
        nextStartMinute != null &&
        (currentEndMinute == null || currentEndMinute < nextStartMinute + 1)
      ) {
        const adjustedEndMinute = Math.min(
          nextStartMinute + 30,
          DAY_END_MINUTE - 1
        );

        nextEndTime = minutesToInputValue(adjustedEndMinute);
      }

      return {
        ...currentValue,
        startTime: nextStartTime,
        endTime: nextEndTime,
      };
    });

    setError("");
  };

  const handleSave = async () => {
    const startMinute = inputValueToMinutes(formValue.startTime);
    const endMinute = inputValueToMinutes(formValue.endTime);

    if (startMinute == null || endMinute == null) {
      setError("Use valid start and end times.");
      return;
    }

    if (startMinute < DAY_START_MINUTE || endMinute > DAY_END_MINUTE) {
      setError("Period must stay inside the same day.");
      return;
    }

    if (endMinute < startMinute + 1) {
      setError("End time must be at least one minute after start time.");
      return;
    }

    const candidate = {
      id: period?.id ?? null,
      startMinute,
      endMinute,
    };

    const overlappingPeriod = findOverlap(periods, candidate, period?.id);

    if (overlappingPeriod) {
      setError(
        `This period overlaps with ${formatMinutes(
          overlappingPeriod.startMinute,
          timeFormat
        )} - ${formatMinutes(overlappingPeriod.endMinute, timeFormat)}.`
      );
      return;
    }

    try {
      await onSave?.(candidate);
      onClose?.();
    } catch {
      setError("Could not save this period.");
    }
  };

  const handleDelete = async () => {
    if (!period?.id) return;

    try {
      await onDelete?.(period.id);
      onClose?.();
    } catch {
      setError("Could not delete this period.");
    }
  };

  const startMinute = inputValueToMinutes(formValue.startTime);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Period form"
      onMouseDown={() => {
        if (!isBusy) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Edit period" : "Create period"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set a non-overlapping time block for the selected academic year.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TimePicker
              label="Start time"
              value={formValue.startTime}
              onChange={handleStartTimeChange}
              timeFormat={timeFormat}
              minuteStep={1}
              minMinute={DAY_START_MINUTE}
              maxMinute={DAY_END_MINUTE - 2}
              disabled={isBusy}
            />

            <TimePicker
              label="End time"
              value={formValue.endTime}
              onChange={(nextEndTime) => handleChange("endTime", nextEndTime)}
              timeFormat={timeFormat}
              minuteStep={1}
              minMinute={(startMinute ?? DAY_START_MINUTE) + 1}
              maxMinute={DAY_END_MINUTE - 1}
              disabled={isBusy}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Current display format:{" "}
            <span className="font-semibold text-slate-700">
              {timeFormat === "24h" ? "24h" : "12h AM/PM"}
            </span>
            .
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {mode === "edit" && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isBusy}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPeriods() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const schoolYearIdFromUrl = searchParams.get("school_year_id") || "";

  const schoolYearsQuery = useQuery({
    queryKey: ["schoolYears"],
    queryFn: listSchoolYearsAdminApi,
    retry: false,
  });

  const schoolYears = schoolYearsQuery.data ?? [];

  const selectedSchoolYearId = useMemo(() => {
    if (!schoolYears.length) return "";

    const hasUrlYear = schoolYears.some(
      (schoolYear) => getSchoolYearId(schoolYear) === schoolYearIdFromUrl
    );

    if (hasUrlYear) {
      return schoolYearIdFromUrl;
    }

    return getSchoolYearId(schoolYears[0]);
  }, [schoolYears, schoolYearIdFromUrl]);

  const periodsQuery = useQuery({
    queryKey: ["periods", { school_year_id: selectedSchoolYearId }],
    queryFn: () =>
      listPeriodsAdminApi({
        school_year_id: selectedSchoolYearId || undefined,
      }),
    enabled: Boolean(selectedSchoolYearId),
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createPeriodApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updatePeriodApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePeriodApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
  });

  const [timeFormat, setTimeFormat] = useState("24h");
  const [zoomPresetId, setZoomPresetId] = useState("hour");

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    period: null,
  });

  const selectedZoom = useMemo(() => {
    return (
      ZOOM_PRESETS.find((preset) => preset.id === zoomPresetId) ??
      ZOOM_PRESETS[0]
    );
  }, [zoomPresetId]);

  const periods = useMemo(() => {
    return normalizePeriods(periodsQuery.data ?? []);
  }, [periodsQuery.data]);

  const selectedSchoolYear = useMemo(() => {
    return schoolYears.find(
      (schoolYear) => getSchoolYearId(schoolYear) === selectedSchoolYearId
    );
  }, [schoolYears, selectedSchoolYearId]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isBusy = isSaving || isDeleting;

  const handleSchoolYearChange = (nextSchoolYearId) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set("school_year_id", nextSchoolYearId);

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleCreatePeriod = () => {
    if (!selectedSchoolYearId) return;

    setModalState({
      isOpen: true,
      mode: "create",
      period: null,
    });
  };

  const handleEditPeriod = (period) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      period,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: "create",
      period: null,
    });
  };

  const handleSavePeriod = async (nextPeriod) => {
    if (!selectedSchoolYearId) {
      throw new Error("Missing school year.");
    }

    const payload = {
      start_time: minutesToInputValue(nextPeriod.startMinute),
      end_time: minutesToInputValue(nextPeriod.endMinute),
    };

    if (nextPeriod.id) {
      await updateMutation.mutateAsync({
        id: nextPeriod.id,
        body: payload,
      });

      return;
    }

    await createMutation.mutateAsync({
      school_year_id: selectedSchoolYearId,
      ...payload,
    });
  };

  const handleDeletePeriod = async (periodId) => {
    if (!periodId) return;

    await deleteMutation.mutateAsync(periodId);
  };

  const handleToggleTimeFormat = () => {
    setTimeFormat((currentFormat) =>
      currentFormat === "24h" ? "12h" : "24h"
    );
  };

  const handleCycleZoom = () => {
    setZoomPresetId((currentZoomPresetId) =>
      getNextZoomPresetId(currentZoomPresetId)
    );
  };

  if (schoolYearsQuery.isLoading) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <p className="text-sm text-slate-500">Loading periods...</p>
        </section>
      </main>
    );
  }

  if (schoolYearsQuery.isError) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm sm:p-4">
          <p className="text-sm text-red-600">Error loading periods.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-slate-50">
      <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        <header className="min-h-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <h1 className="truncate text-base font-semibold text-slate-900">
                  Periods
                </h1>

                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {periods.length} configured
                </span>
              </div>

              <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">
                {selectedSchoolYear
                  ? `Manage daily time blocks for ${getSchoolYearLabel(
                      selectedSchoolYear
                    )}.`
                  : "Select an academic year to manage periods."}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Academic year
              </label>

              <select
                value={selectedSchoolYearId}
                onChange={(event) => handleSchoolYearChange(event.target.value)}
                disabled={!schoolYears.length || isBusy}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                {!schoolYears.length && (
                  <option value="">No school years</option>
                )}

                {schoolYears.map((schoolYear) => (
                  <option
                    key={getSchoolYearId(schoolYear)}
                    value={getSchoolYearId(schoolYear)}
                  >
                    {getSchoolYearLabel(schoolYear)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="relative min-h-0 overflow-hidden">
          <TimelineGrid
            periods={periods}
            selectedZoom={selectedZoom}
            timeFormat={timeFormat}
            isLoading={periodsQuery.isLoading || periodsQuery.isFetching}
            isError={periodsQuery.isError}
            canCreate={Boolean(selectedSchoolYearId) && !isBusy}
            onCreatePeriod={handleCreatePeriod}
            onEditPeriod={handleEditPeriod}
          />

          <div className="absolute bottom-3 right-3 z-40 flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTimeFormat}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg hover:bg-slate-50"
            >
              {timeFormat}
            </button>

            <button
              type="button"
              onClick={handleCycleZoom}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg hover:bg-slate-50"
            >
              <TimerIcon className="h-4 w-4" />
              {selectedZoom.label}
            </button>
          </div>
        </div>

        <PeriodModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          period={modalState.period}
          periods={periods}
          timeFormat={timeFormat}
          isSaving={isSaving}
          isDeleting={isDeleting}
          onClose={handleCloseModal}
          onSave={handleSavePeriod}
          onDelete={handleDeletePeriod}
        />
      </section>
    </main>
  );
}