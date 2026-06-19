import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Clock3, Plus, X } from "lucide-react";

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

function pad2(value) {
  return String(value).padStart(2, "0");
}

function minutesToInputValue(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${pad2(hours)}:${pad2(mins)}`;
}

function inputValueToMinutes(value) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = String(value)
    .split(":")
    .map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function normalizeApiTimeValue(value) {
  if (!value) {
    return "";
  }

  const time = String(value);

  if (/^\d{1,2}:\d{2}/.test(time)) {
    const [hours, minutes] = time
      .split(":")
      .map(Number);

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
      return "";
    }

    return `${pad2(hours)}:${pad2(minutes)}`;
  }

  return "";
}

function apiTimeToMinutes(value) {
  const normalizedValue = normalizeApiTimeValue(value);

  if (!normalizedValue) {
    return null;
  }

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

function findOverlap(
  periods,
  candidate,
  ignoredPeriodId = null
) {
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
    currentIndex === -1
      ? 0
      : (currentIndex + 1) % ZOOM_PRESETS.length;

  return ZOOM_PRESETS[nextIndex].id;
}

function getSchoolYearLabel(schoolYear) {
  return (
    schoolYear.name ??
    schoolYear.label ??
    "School year"
  );
}

function getSchoolYearId(schoolYear) {
  return String(schoolYear.id);
}

function normalizePeriod(apiPeriod) {
  const startMinute = apiTimeToMinutes(
    apiPeriod.start_time ?? apiPeriod.startTime
  );

  const endMinute = apiTimeToMinutes(
    apiPeriod.end_time ?? apiPeriod.endTime
  );

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
      apiPeriod.school_year_id ??
      apiPeriod.schoolYearId ??
      apiPeriod.year_id,
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
        firstPeriod.startMinute -
        secondPeriod.startMinute
    );
}

function TimelineGrid({
  periods,
  selectedZoom,
  timeFormat,
  isLoading,
  isError,
  onEditPeriod,
}) {
  const timelineHeight =
    DAY_END_MINUTE * selectedZoom.pxPerMinute;

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
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-transparent [scrollbar-gutter:stable]">
      {(isLoading || isError) && (
        <div className="sticky top-0 z-30 px-4 py-2">
          <div
            className={[
              "rounded-xl border px-3 py-2 text-xs font-medium backdrop-blur",
              isError
                ? "border-red-200 bg-red-50/90 text-red-600"
                : "border-slate-200 bg-white/90 text-slate-500",
            ].join(" ")}
          >
            {isError
              ? "Error loading periods."
              : "Refreshing periods..."}
          </div>
        </div>
      )}

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
                  {isDayEnd
                    ? "24:00"
                    : formatMinutes(
                        minute,
                        timeFormat
                      )}
                </div>

                <div
                  className={[
                    "border-t",
                    isHourLine
                      ? "border-slate-300"
                      : "border-dashed border-slate-200",
                  ].join(" ")}
                />
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-0 left-[62px] right-0 border-t border-slate-300 sm:left-[80px]" />

        {periods.map((period) => {
          const top =
            period.startMinute *
            selectedZoom.pxPerMinute;

          const height = Math.max(
            (period.endMinute - period.startMinute) *
              selectedZoom.pxPerMinute,
            32
          );

          return (
            <button
              key={period.id}
              type="button"
              onClick={() => onEditPeriod(period)}
              className="absolute left-[62px] right-1 z-20 overflow-hidden rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-left text-sky-950 ring-1 ring-sky-100 transition hover:border-sky-300 hover:bg-sky-100 sm:left-[80px] sm:right-2 sm:px-4 sm:py-3"
              style={{
                top,
                height,
              }}
            >
              <div className="flex h-full min-h-0 items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold sm:text-sm">
                    {formatMinutes(
                      period.startMinute,
                      timeFormat
                    )}{" "}
                    -{" "}
                    {formatMinutes(
                      period.endMinute,
                      timeFormat
                    )}
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-sky-500 px-2 py-1 text-[11px] font-semibold text-white sm:px-2.5 sm:text-xs">
                  {getDurationLabel(
                    period.startMinute,
                    period.endMinute
                  )}
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
    if (!isOpen) {
      return;
    }

    if (period) {
      setFormValue({
        startTime: minutesToInputValue(
          period.startMinute
        ),
        endTime: minutesToInputValue(
          period.endMinute
        ),
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
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isBusy) {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );
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

  const handleStartTimeChange = (
    nextStartTime
  ) => {
    const nextStartMinute =
      inputValueToMinutes(nextStartTime);

    setFormValue((currentValue) => {
      const currentEndMinute =
        inputValueToMinutes(
          currentValue.endTime
        );

      let nextEndTime = currentValue.endTime;

      if (
        nextStartMinute != null &&
        (currentEndMinute == null ||
          currentEndMinute <
            nextStartMinute + 1)
      ) {
        const adjustedEndMinute = Math.min(
          nextStartMinute + 30,
          DAY_END_MINUTE - 1
        );

        nextEndTime = minutesToInputValue(
          adjustedEndMinute
        );
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
    const startMinute = inputValueToMinutes(
      formValue.startTime
    );

    const endMinute = inputValueToMinutes(
      formValue.endTime
    );

    if (
      startMinute == null ||
      endMinute == null
    ) {
      setError(
        "Use valid start and end times."
      );
      return;
    }

    if (
      startMinute < DAY_START_MINUTE ||
      endMinute > DAY_END_MINUTE
    ) {
      setError(
        "Period must stay inside the same day."
      );
      return;
    }

    if (endMinute < startMinute + 1) {
      setError(
        "End time must be at least one minute after start time."
      );
      return;
    }

    const candidate = {
      id: period?.id ?? null,
      startMinute,
      endMinute,
    };

    const overlappingPeriod = findOverlap(
      periods,
      candidate,
      period?.id
    );

    if (overlappingPeriod) {
      setError(
        `This period overlaps with ${formatMinutes(
          overlappingPeriod.startMinute,
          timeFormat
        )} - ${formatMinutes(
          overlappingPeriod.endMinute,
          timeFormat
        )}.`
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
    if (!period?.id) {
      return;
    }

    try {
      await onDelete?.(period.id);
      onClose?.();
    } catch {
      setError(
        "Could not delete this period."
      );
    }
  };

  const startMinute = inputValueToMinutes(
    formValue.startTime
  );

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
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit"
                ? "Edit period"
                : "Create period"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set a non-overlapping time block for
              the selected academic year.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              className="h-5 w-5"
              strokeWidth={1.8}
            />
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
              onChange={(nextEndTime) =>
                handleChange(
                  "endTime",
                  nextEndTime
                )
              }
              timeFormat={timeFormat}
              minuteStep={1}
              minMinute={
                (startMinute ??
                  DAY_START_MINUTE) + 1
              }
              maxMinute={DAY_END_MINUTE - 1}
              disabled={isBusy}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Current display format:{" "}
            <span className="font-semibold text-slate-700">
              {timeFormat === "24h"
                ? "24h"
                : "12h AM/PM"}
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
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving
                ? "Saving..."
                : mode === "edit"
                  ? "Save changes"
                  : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPeriods() {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const schoolYearIdFromUrl =
    searchParams.get("school_year_id") || "";

  const schoolYearsQuery = useQuery({
    queryKey: ["schoolYears"],
    queryFn: listSchoolYearsAdminApi,
    retry: false,
  });

  const schoolYears =
    schoolYearsQuery.data ?? [];

  const selectedSchoolYearId = useMemo(() => {
    if (!schoolYears.length) {
      return "";
    }

    const hasUrlYear = schoolYears.some(
      (schoolYear) =>
        getSchoolYearId(schoolYear) ===
        schoolYearIdFromUrl
    );

    if (hasUrlYear) {
      return schoolYearIdFromUrl;
    }

    return getSchoolYearId(schoolYears[0]);
  }, [schoolYears, schoolYearIdFromUrl]);

  const periodsQuery = useQuery({
    queryKey: [
      "periods",
      {
        school_year_id:
          selectedSchoolYearId,
      },
    ],

    queryFn: () =>
      listPeriodsAdminApi({
        school_year_id:
          selectedSchoolYearId || undefined,
      }),

    enabled: Boolean(selectedSchoolYearId),
    placeholderData: (previousData) =>
      previousData,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createPeriodApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["periods"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) =>
      updatePeriodApi(id, body),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["periods"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePeriodApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["periods"],
      });
    },
  });

  const [timeFormat, setTimeFormat] =
    useState("24h");

  const [zoomPresetId, setZoomPresetId] =
    useState("hour");

  const [modalState, setModalState] =
    useState({
      isOpen: false,
      mode: "create",
      period: null,
    });

  const selectedZoom = useMemo(() => {
    return (
      ZOOM_PRESETS.find(
        (preset) =>
          preset.id === zoomPresetId
      ) ?? ZOOM_PRESETS[0]
    );
  }, [zoomPresetId]);

  const periods = useMemo(() => {
    return normalizePeriods(
      periodsQuery.data ?? []
    );
  }, [periodsQuery.data]);

  const selectedSchoolYear = useMemo(() => {
    return schoolYears.find(
      (schoolYear) =>
        getSchoolYearId(schoolYear) ===
        selectedSchoolYearId
    );
  }, [schoolYears, selectedSchoolYearId]);

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending;

  const isDeleting =
    deleteMutation.isPending;

  const isBusy = isSaving || isDeleting;

  const handleSchoolYearChange = (
    nextSchoolYearId
  ) => {
    const nextSearchParams =
      new URLSearchParams(searchParams);

    nextSearchParams.set(
      "school_year_id",
      nextSchoolYearId
    );

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleCreatePeriod = () => {
    if (!selectedSchoolYearId) {
      return;
    }

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
    if (isBusy) {
      return;
    }

    setModalState({
      isOpen: false,
      mode: "create",
      period: null,
    });
  };

  const handleSavePeriod = async (
    nextPeriod
  ) => {
    if (!selectedSchoolYearId) {
      throw new Error(
        "Missing school year."
      );
    }

    const payload = {
      start_time: minutesToInputValue(
        nextPeriod.startMinute
      ),
      end_time: minutesToInputValue(
        nextPeriod.endMinute
      ),
    };

    const isExistingPeriod =
      nextPeriod.id !== null &&
      nextPeriod.id !== undefined;

    if (isExistingPeriod) {
      await updateMutation.mutateAsync({
        id: nextPeriod.id,
        body: payload,
      });

      return;
    }

    await createMutation.mutateAsync({
      school_year_id:
        selectedSchoolYearId,
      ...payload,
    });
  };

  const handleDeletePeriod = async (
    periodId
  ) => {
    if (!periodId) {
      return;
    }

    await deleteMutation.mutateAsync(
      periodId
    );
  };

  const handleToggleTimeFormat = () => {
    setTimeFormat((currentFormat) =>
      currentFormat === "24h"
        ? "12h"
        : "24h"
    );
  };

  const handleCycleZoom = () => {
    setZoomPresetId(
      (currentZoomPresetId) =>
        getNextZoomPresetId(
          currentZoomPresetId
        )
    );
  };

  if (schoolYearsQuery.isLoading) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <p className="text-sm text-slate-500">
          Loading periods...
        </p>
      </main>
    );
  }

  if (schoolYearsQuery.isError) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            Error loading periods.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      {/* Header și controale fixe */}
      <div className="shrink-0 bg-transparent">
        <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

          <div className="relative flex min-h-[112px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {periods.length} configured
              </p>

              <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
                Periods
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                {selectedSchoolYear
                  ? getSchoolYearLabel(
                      selectedSchoolYear
                    )
                  : "No academic year selected"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreatePeriod}
              disabled={
                !selectedSchoolYearId ||
                isBusy
              }
              className={[
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition",
                "sm:w-auto sm:min-w-[140px]",
                "hover:bg-slate-100",
                "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
              ].join(" ")}
            >
              <Plus
                className="h-4 w-4"
                strokeWidth={2}
              />

              Create
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-3 bg-transparent px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="w-full lg:max-w-xs">
            <label
              htmlFor="period-school-year"
              className="mb-1.5 block text-xs font-medium text-slate-500"
            >
              Academic year
            </label>

            <select
              id="period-school-year"
              value={selectedSchoolYearId}
              onChange={(event) =>
                handleSchoolYearChange(
                  event.target.value
                )
              }
              disabled={
                !schoolYears.length ||
                isBusy
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {!schoolYears.length && (
                <option value="">
                  No school years
                </option>
              )}

              {schoolYears.map(
                (schoolYear) => (
                  <option
                    key={getSchoolYearId(
                      schoolYear
                    )}
                    value={getSchoolYearId(
                      schoolYear
                    )}
                  >
                    {getSchoolYearLabel(
                      schoolYear
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">
              Display:
            </span>

            <span
              aria-hidden="true"
              className="h-4 border-l border-slate-300"
            />

            <button
              type="button"
              onClick={
                handleToggleTimeFormat
              }
              disabled={isBusy}
              className="font-medium text-blue-500 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {timeFormat === "24h"
                ? "24 hours"
                : "12 hours"}
            </button>

            <span className="ml-2 text-slate-500">
              Zoom:
            </span>

            <span
              aria-hidden="true"
              className="h-4 border-l border-slate-300"
            />

            <button
              type="button"
              onClick={handleCycleZoom}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 font-medium text-blue-500 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <Clock3
                className="h-4 w-4"
                strokeWidth={1.8}
              />

              {selectedZoom.label}
            </button>
          </div>
        </div>
      </div>

      {/* Doar timeline-ul are scroll */}
      <section className="min-h-0 flex-1 overflow-hidden bg-transparent">
        {!schoolYears.length ? (
          <div className="grid h-full min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                No school years available
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create an academic year before
                adding periods.
              </p>
            </div>
          </div>
        ) : (
          <TimelineGrid
            periods={periods}
            selectedZoom={selectedZoom}
            timeFormat={timeFormat}
            isLoading={
              periodsQuery.isLoading ||
              periodsQuery.isFetching
            }
            isError={periodsQuery.isError}
            onEditPeriod={handleEditPeriod}
          />
        )}
      </section>

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
    </main>
  );
}