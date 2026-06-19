import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";

import {
  adminOverviewApi,
  listSchoolYearsAdminApi,
  createSchoolYearApi,
  updateSchoolYearApi,
  deleteSchoolYearApi,
} from "../api/admin";

import YearIntervalScroller from "../components/school-years/YearIntervalScroller";
import SchoolYearRecordModal from "../components/school-years/SchoolYearRecordModal";

function getCurrentSchoolYearStart() {
  const today = new Date();

  return today.getMonth() >= 8
    ? today.getFullYear()
    : today.getFullYear() - 1;
}

function toDateValue(value) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getYearFromDateValue(value) {
  const normalizedValue = toDateValue(value);

  if (!normalizedValue) {
    return null;
  }

  return Number(normalizedValue.slice(0, 4));
}

function normalizeSchoolYearRecords(years) {
  return years.reduce((records, year) => {
    const startDate = toDateValue(year.start_date);
    const endDate = toDateValue(year.end_date);
    const startYear = getYearFromDateValue(startDate);

    if (!startYear) {
      return records;
    }

    return {
      ...records,
      [startYear]: {
        id: year.id,
        name: year.name ?? `${startYear}-${startYear + 1}`,
        startDate,
        endDate,
      },
    };
  }, {});
}

export default function AdminSchoolYears() {
  const queryClient = useQueryClient();
  const currentStartYear = getCurrentSchoolYearStart();

  const [selectedSchoolYearStart, setSelectedSchoolYearStart] =
    useState(currentStartYear);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const schoolYearsQuery = useQuery({
    queryKey: ["schoolYears"],
    queryFn: listSchoolYearsAdminApi,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createSchoolYearApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["schoolYears"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) =>
      updateSchoolYearApi(id, body),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["schoolYears"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchoolYearApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["schoolYears"],
      });
    },
  });

  const schools = overviewQuery.data?.schools ?? [];
  const defaultSchoolId = schools[0]?.id ?? "";
  const years = schoolYearsQuery.data ?? [];

  const schoolYearRecords = useMemo(() => {
    return normalizeSchoolYearRecords(years);
  }, [years]);

  const selectedRecord =
    schoolYearRecords[selectedSchoolYearStart];

  const hasSelectedRecord = Boolean(selectedRecord);

  const registeredCount = Object.keys(
    schoolYearRecords
  ).length;

  const selectedSchoolYearLabel =
    `${selectedSchoolYearStart} - ${
      selectedSchoolYearStart + 1
    }`;

  const isLoading =
    overviewQuery.isLoading ||
    schoolYearsQuery.isLoading;

  const isError =
    overviewQuery.isError ||
    schoolYearsQuery.isError;

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending;

  const isDeleting = deleteMutation.isPending;
  const isBusy = isSaving || isDeleting;

  const canOpenEditor =
    hasSelectedRecord || Boolean(defaultSchoolId);

  const handleSaveSchoolYearRecord = async (
    startYear,
    record
  ) => {
    const isExistingRecord =
      record.id !== null &&
      record.id !== undefined;

    if (isExistingRecord) {
      await updateMutation.mutateAsync({
        id: record.id,
        body: {
          name: record.name,
          start_date: record.startDate,
          end_date: record.endDate,
        },
      });

      return;
    }

    await createMutation.mutateAsync({
      school_id: defaultSchoolId,
      name:
        record.name ||
        `${startYear}-${startYear + 1}`,
      start_date: record.startDate,
      end_date: record.endDate,
    });
  };

  const handleDeleteSchoolYearRecord = async (
    startYear
  ) => {
    const record = schoolYearRecords[startYear];

    if (!record?.id) {
      return;
    }

    const recordName =
      record.name ||
      `${startYear}-${startYear + 1}`;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${recordName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(record.id);
      setIsModalOpen(false);
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not delete this school year."
      );
    }
  };

  if (isLoading) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <p className="text-sm text-slate-500">
          Loading school years...
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            Error loading school years.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      <header className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

        <div className="relative flex min-h-[112px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {registeredCount} registered
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
              School Years
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Selected: {selectedSchoolYearLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={!canOpenEditor || isBusy}
            className={[
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition",
              "sm:w-auto sm:min-w-[130px]",
              "hover:bg-slate-100",
              "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
              "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
            ].join(" ")}
          >
            {hasSelectedRecord ? (
              <Pencil
                className="h-4 w-4"
                strokeWidth={1.8}
              />
            ) : (
              <Plus
                className="h-4 w-4"
                strokeWidth={2}
              />
            )}

            {hasSelectedRecord ? "Edit" : "Create"}
          </button>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-hidden">
        <YearIntervalScroller
          value={selectedSchoolYearStart}
          onChange={setSelectedSchoolYearStart}
          currentStartYear={currentStartYear}
          records={schoolYearRecords}
          showDebug={false}
          className="h-full min-h-0"
        />
      </section>

      <SchoolYearRecordModal
        isOpen={isModalOpen}
        startYear={selectedSchoolYearStart}
        record={selectedRecord}
        canCreate={Boolean(defaultSchoolId)}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isBusy) {
            setIsModalOpen(false);
          }
        }}
        onSave={handleSaveSchoolYearRecord}
        onDelete={handleDeleteSchoolYearRecord}
      />
    </main>
  );
}