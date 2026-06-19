import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  Check,
  Loader2,
} from "lucide-react";

import {
  catalogProgramsApi,
  catalogSubjectsApi,
} from "../api/catalog";

const SORT_KEYS = [
  "program",
  "name",
  "weekly_hours",
  "weight",
];

const SORT_OPTIONS = [
  {
    key: "program",
    label: "Program",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "weekly_hours",
    label: "Weekly hours",
  },
  {
    key: "weight",
    label: "Weight",
  },
];

function getSubjectName(subject) {
  return subject.name ?? "Untitled subject";
}

function getProgramName(subject) {
  return (
    subject.program_name ??
    subject.programName ??
    "No program"
  );
}

function SortButton({
  label,
  sortKey,
  activeSort,
  direction,
  onToggle,
}) {
  const isActive = activeSort === sortKey;

  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      className={[
        "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
        isActive
          ? "text-slate-950"
          : "text-blue-500 hover:text-blue-700",
      ].join(" ")}
    >
      <ArrowUpDown
        className="h-4 w-4"
        strokeWidth={1.8}
      />

      {label}

      {isActive && (
        <span className="text-xs font-normal text-slate-400">
          {direction === "asc"
            ? "Ascending"
            : "Descending"}
        </span>
      )}
    </button>
  );
}

export default function MemberSubjects() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const program =
    searchParams.get("program") || "";

  const sortParam =
    searchParams.get("sort");

  const sort = SORT_KEYS.includes(sortParam)
    ? sortParam
    : "name";

  const dir =
    searchParams.get("dir") === "desc"
      ? "desc"
      : "asc";

  const required =
    searchParams.get("required") === "true";

  const programsQuery = useQuery({
    queryKey: [
      "catalog-programs",
      {
        sort: "name",
        dir: "asc",
      },
    ],

    queryFn: () =>
      catalogProgramsApi({
        sort: "name",
        dir: "asc",
      }),

    retry: false,
  });

  const subjectsQuery = useQuery({
    queryKey: [
      "catalog-subjects",
      {
        program,
        required,
        sort,
        dir,
      },
    ],

    queryFn: () =>
      catalogSubjectsApi({
        program: program || undefined,
        required,
        sort,
        dir,
      }),

    placeholderData: (previousData) =>
      previousData,

    retry: false,
  });

  const programs =
    programsQuery.data ?? [];

  const subjects =
    subjectsQuery.data ?? [];

  const requiredCount = subjects.filter(
    (subject) => subject.is_required
  ).length;

  const optionalCount =
    subjects.length - requiredCount;

  const setParam = (key, value) => {
    const nextSearchParams =
      new URLSearchParams(searchParams);

    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      nextSearchParams.delete(key);
    } else {
      nextSearchParams.set(key, value);
    }

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const toggleSort = (nextSort) => {
    const nextDirection =
      sort === nextSort
        ? dir === "asc"
          ? "desc"
          : "asc"
        : "asc";

    const nextSearchParams =
      new URLSearchParams(searchParams);

    nextSearchParams.set(
      "sort",
      nextSort
    );

    nextSearchParams.set(
      "dir",
      nextDirection
    );

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  if (
    programsQuery.isLoading &&
    !programs.length
  ) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />

          Loading subjects...
        </div>
      </main>
    );
  }

  if (programsQuery.isError) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            Error loading programs.
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
              {subjects.length}{" "}
              {subjects.length === 1
                ? "subject"
                : "subjects"}
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
              Subjects
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Read-only catalog view
            </p>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[240px]">
            <label
              htmlFor="header-subject-program"
              className="sr-only"
            >
              Select program
            </label>

            <select
              id="header-subject-program"
              value={program}
              onChange={(event) =>
                setParam(
                  "program",
                  event.target.value
                )
              }
              disabled={
                programsQuery.isLoading ||
                programsQuery.isError
              }
              className="h-11 w-full rounded-lg border border-white bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition hover:bg-slate-100 focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-700 disabled:text-slate-400"
            >
              <option value="">
                All programs
              </option>

              {programs.map((programItem) => (
                <option
                  key={programItem.id}
                  value={String(programItem.id)}
                >
                  {programItem.name ??
                    "Untitled program"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="shrink-0 bg-transparent px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={required}
              onChange={(event) =>
                setParam(
                  "required",
                  event.target.checked
                    ? "true"
                    : ""
                )
              }
              className="peer sr-only"
            />

            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white text-white transition peer-checked:border-slate-950 peer-checked:bg-slate-950 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-300 peer-focus-visible:ring-offset-2">
              {required && (
                <Check
                  className="h-3.5 w-3.5"
                  strokeWidth={2.2}
                />
              )}
            </span>

            Required only
          </label>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">
              Required:
            </span>

            <span className="font-semibold text-slate-900">
              {requiredCount}
            </span>

            <span
              aria-hidden="true"
              className="h-4 border-l border-slate-300"
            />

            <span className="text-slate-500">
              Optional:
            </span>

            <span className="font-semibold text-slate-900">
              {optionalCount}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="text-sm text-slate-500">
            Sort by:
          </span>

          <span
            aria-hidden="true"
            className="h-4 border-l border-slate-300"
          />

          {SORT_OPTIONS.map((option) => (
            <SortButton
              key={option.key}
              label={option.label}
              sortKey={option.key}
              activeSort={sort}
              direction={dir}
              onToggle={toggleSort}
            />
          ))}

          {subjectsQuery.isFetching && (
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />

              Refreshing...
            </span>
          )}
        </div>
      </div>

      <section className="min-h-0 flex-1 overflow-auto bg-transparent px-4 pb-8 [scrollbar-gutter:stable] sm:px-6 lg:px-8">
        {subjectsQuery.isLoading &&
          !subjects.length && (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />

              Loading subjects...
            </div>
          )}

        {subjectsQuery.isError && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              Error loading subjects.
            </p>
          </div>
        )}

        {!subjectsQuery.isLoading &&
          !subjectsQuery.isError &&
          !subjects.length && (
            <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No subjects found
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Select another program or disable
                  the required filter.
                </p>
              </div>
            </div>
          )}

        {!subjectsQuery.isError &&
          Boolean(subjects.length) && (
            <div className="min-w-[820px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Program
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Year
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Weekly hours
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Weight
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Required
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {subjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {getProgramName(subject)}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-slate-950">
                        {getSubjectName(subject)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {subject.year ?? "—"}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-slate-600">
                        {subject.weekly_hours ??
                          "—"}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-slate-600">
                        {subject.weight ?? "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                            subject.is_required
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600",
                          ].join(" ")}
                        >
                          {subject.is_required
                            ? "Required"
                            : "Optional"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </main>
  );
}