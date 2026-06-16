import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  listSchoolYearsAdminApi,
  createSchoolYearApi,
  updateSchoolYearApi,
  deleteSchoolYearApi,
} from "../api/admin";
import YearIntervalScroller from "../components/school-years/YearIntervalScroller";

function getCurrentSchoolYearStart() {
  const today = new Date();

  return today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
}

function toDateValue(value) {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
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

  if (!normalizedValue) return null;

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
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateSchoolYearApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchoolYearApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });

  const schools = overviewQuery.data?.schools ?? [];
  const defaultSchoolId = schools[0]?.id ?? "";
  const years = schoolYearsQuery.data ?? [];

  const schoolYearRecords = useMemo(() => {
    return normalizeSchoolYearRecords(years);
  }, [years]);

  const handleSaveSchoolYearRecord = async (startYear, record) => {
    if (record.id) {
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
      name: record.name || `${startYear}-${startYear + 1}`,
      start_date: record.startDate,
      end_date: record.endDate,
    });
  };

  const handleDeleteSchoolYearRecord = async (startYear) => {
    const record = schoolYearRecords[startYear];

    if (!record?.id) return;

    await deleteMutation.mutateAsync(record.id);
  };

  const isLoading = overviewQuery.isLoading || schoolYearsQuery.isLoading;
  const isError = overviewQuery.isError || schoolYearsQuery.isError;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  if (isLoading) {
    return (
      <main className="h-dvh min-h-0 overflow-hidden bg-slate-50 p-3 sm:p-4 lg:p-6">
        <section className="mx-auto flex h-full min-h-0 max-w-5xl items-center justify-center rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Loading school years...</p>
        </section>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="h-dvh min-h-0 overflow-hidden bg-slate-50 p-3 sm:p-4 lg:p-6">
        <section className="mx-auto flex h-full min-h-0 max-w-5xl items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">Error loading school years.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-slate-50">
      <section className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        <YearIntervalScroller
          value={selectedSchoolYearStart}
          onChange={setSelectedSchoolYearStart}
          currentStartYear={currentStartYear}
          records={schoolYearRecords}
          canCreate={Boolean(defaultSchoolId)}
          onSaveRecord={handleSaveSchoolYearRecord}
          onDeleteRecord={handleDeleteSchoolYearRecord}
          isSaving={isSaving}
          isDeleting={isDeleting}
          showDebug={false}
          className="min-h-0"
        />
      </section>
    </main>
  );
}