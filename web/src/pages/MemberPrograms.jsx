import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Clock3,
  Loader2,
} from "lucide-react";

import { catalogProgramsApi } from "../api/catalog";

function getProgramName(program) {
  return program.name ?? "Untitled program";
}

function getProgramSchoolName(program) {
  return (
    program.school_name ??
    program.schoolName ??
    "No school assigned"
  );
}

function getProgramDescription(program) {
  return (
    program.descr ??
    program.description ??
    "No description available."
  );
}

function ProgramCard({ program }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-slate-300 sm:px-6">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-medium text-slate-950">
          {getProgramName(program)}
        </h2>

        <p className="mt-2 truncate text-sm text-slate-400">
          {getProgramSchoolName(program)}
        </p>

        <div className="mt-4 ">
          <p className="text-sm leading-6 text-slate-600">
            {getProgramDescription(program)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function MemberPrograms() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const sort =
    searchParams.get("sort") === "name"
      ? "name"
      : "created";

  const dir =
    searchParams.get("dir") === "desc"
      ? "desc"
      : "asc";

  const programsQuery = useQuery({
    queryKey: [
      "catalog-programs",
      {
        sort,
        dir,
      },
    ],

    queryFn: () =>
      catalogProgramsApi({
        sort,
        dir,
      }),

    placeholderData: (previousData) =>
      previousData,

    retry: false,
  });

  const programs = programsQuery.data ?? [];

  const handleSort = (nextSort) => {
    const nextDirection =
      sort === nextSort
        ? dir === "asc"
          ? "desc"
          : "asc"
        : "asc";

    const nextSearchParams =
      new URLSearchParams(searchParams);

    nextSearchParams.set("sort", nextSort);
    nextSearchParams.set("dir", nextDirection);

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
          Loading programs...
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
              {programs.length}{" "}
              total
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
              Programs
            </h1>

             
          </div>

          
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-3 bg-transparent px-4 py-5 text-sm sm:px-6 lg:px-8">
        <span className="text-slate-500">
          Sort by:
        </span>

        <span
          aria-hidden="true"
          className="h-4 border-l border-slate-300"
        />

        <button
          type="button"
          onClick={() => handleSort("name")}
          className={[
            "inline-flex items-center gap-1.5 font-medium transition-colors",
            sort === "name"
              ? "text-slate-950"
              : "text-blue-500 hover:text-blue-700",
          ].join(" ")}
        >
          {sort === "name" && dir === "desc" ? (
            <ArrowUpAZ
              className="h-4 w-4"
              strokeWidth={1.8}
            />
          ) : (
            <ArrowDownAZ
              className="h-4 w-4"
              strokeWidth={1.8}
            />
          )}

          Name

          {sort === "name" && (
            <span className="text-xs text-slate-400">
              {dir === "asc"
                ? "A to Z"
                : "Z to A"}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSort("created")}
          className={[
            "inline-flex items-center gap-1.5 font-medium transition-colors",
            sort === "created"
              ? "text-slate-950"
              : "text-blue-500 hover:text-blue-700",
          ].join(" ")}
        >
          <Clock3
            className="h-4 w-4"
            strokeWidth={1.8}
          />

          Created

          {sort === "created" && (
            <span className="text-xs text-slate-400">
              {dir === "asc"
                ? "Oldest first"
                : "Newest first"}
            </span>
          )}
        </button>

        {programsQuery.isFetching && (
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Refreshing...
          </span>
        )}
      </div>

      <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent [scrollbar-gutter:stable]">
        <div className="space-y-3 bg-transparent px-4 pb-8 pt-1 sm:px-6 lg:px-8">
          {!programs.length && (
            <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No programs available
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  There are currently no programs in
                  the catalog.
                </p>
              </div>
            </div>
          )}

          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

