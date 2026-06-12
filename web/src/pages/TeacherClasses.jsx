import React from "react";
import { useQuery } from "@tanstack/react-query";
import { listTeacherClassesApi } from "../api/teacher";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  GraduationCap,
  FolderKanban,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function TeacherClasses() {
  const q = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: listTeacherClassesApi,
  });

  const classes = q.data || [];

  const totalClasses = classes.length;
  const totalSubjects = new Set(classes.map((c) => c.subject_name)).size;
  const totalPrograms = new Set(classes.map((c) => c.program_name)).size;

  const getStableIndex = (value, max) => {
    const str = String(value || "");
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }

    return hash % max;
  };

  const classAccents = [
    {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
    },
    {
      bg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-700",
    },
    {
      bg: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-700",
    },
    {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
    },
    {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
    },
  ];

  if (q.isLoading) {
    return (
      <div className="flex min-h-[220px] items-center rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading classes...
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Error loading classes.
      </div>
    );
  }

  return (
    <div className="min-h-full w-full max-w-full overflow-y-auto overflow-x-hidden pb-6">
      <div className="flex min-w-0 flex-col gap-4">
        {/* Page header */}
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="grid min-w-0 grid-cols-1 lg:grid-cols-9">
            <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5 lg:col-span-3 lg:border-b-0 lg:border-r">
              <p className="break-words text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xl sm:tracking-[0.16em]">
                My Classes
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                {totalClasses}
              </h1>

              <p className="mt-2 max-w-xs text-sm text-slate-500">
                Teaching groups assigned to you
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-5 lg:col-span-6 lg:justify-between">
              <div className="flex min-w-0 flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
                    Manage your teaching groups
                  </h2>

                  <p className="mt-1 max-w-xl text-sm text-slate-500">
                    View the classes assigned to you and open their project
                    spaces. Each class is linked to a subject and a teaching
                    program.
                  </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 2xl:w-auto 2xl:min-w-[420px]">
                  <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase leading-none text-sky-700">
                        Classes
                      </p>

                      <BookOpen className="h-4 w-4 text-sky-700" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                      {totalClasses}
                    </p>
                  </div>

                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase leading-none text-emerald-700">
                        Subjects
                      </p>

                      <GraduationCap className="h-4 w-4 text-emerald-700" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                      {totalSubjects}
                    </p>
                  </div>

                  <div className="rounded-md border border-violet-200 bg-violet-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase leading-none text-violet-700">
                        Programs
                      </p>

                      <FolderKanban className="h-4 w-4 text-violet-700" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                      {totalPrograms}
                    </p>
                  </div>
                </div>
              </div>

              <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
                {totalClasses} active {totalClasses === 1 ? "class" : "classes"}
              </Badge>
            </div>
          </div>
        </section>

        {/* Classes list */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950">
                Class list
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Open a class to view and manage its projects.
              </p>
            </div>

            <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
              {totalClasses} total
            </Badge>
          </div>

          <div className="p-3 sm:p-4">
            {!classes.length && (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No classes available
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  You do not have any assigned teaching groups yet.
                </p>
              </div>
            )}

            {!!classes.length && (
              <div className="space-y-2">
                {classes.map((c, index) => {
                  const accent =
                    classAccents[
                      getStableIndex(c.id || c.name, classAccents.length)
                    ];

                  return (
                    <article
                      key={c.id}
                      className="grid min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-slate-300 hover:bg-slate-50/60 md:grid-cols-12"
                    >
                      <div
                        className={[
                          "flex items-center border-b px-4 py-2 md:col-span-1 md:justify-center md:border-b-0 md:border-r md:px-3 md:py-3",
                          accent.bg,
                          accent.border,
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "text-xs font-semibold",
                            accent.text,
                          ].join(" ")}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="min-w-0 px-4 py-3 md:col-span-8">
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h4 className="max-w-full truncate text-sm font-semibold text-slate-950">
                              {c.name}
                            </h4>

                            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-50">
                              Active
                            </Badge>
                          </div>

                          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:flex-wrap">
                            <span className="w-fit rounded-full bg-slate-100 px-2 py-1">
                              Subject:{" "}
                              <span className="font-medium text-slate-700">
                                {c.subject_name || "-"}
                              </span>
                            </span>

                            <span className="w-fit rounded-full bg-slate-100 px-2 py-1">
                              Program:{" "}
                              <span className="font-medium text-slate-700">
                                {c.program_name || "-"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end border-t px-4 py-3 md:col-span-3 md:border-t-0">
                        <Button
                          asChild
                          size="sm"
                          className="w-full gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c] sm:w-auto"
                        >
                          <Link
                            to={`/dashboard/teacher/classes/${c.id}/projects`}
                          >
                            View projects
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}