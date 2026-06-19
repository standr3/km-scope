import React, { useMemo } from "react";
import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  FolderKanban,
  GraduationCap,
  Loader2,
} from "lucide-react";

import {
  listStudentClassesApi,
  listStudentProjectsApi,
} from "../api/student";

function extractClasses(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.classes)) {
    return data.classes;
  }

  return [];
}

function extractProjects(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.projects)) {
    return data.projects;
  }

  return [];
}

function getClassName(classItem) {
  return (
    classItem.name ??
    "Untitled class"
  );
}

function getSubjectName(classItem) {
  return (
    classItem.subject_name ??
    classItem.subjectName ??
    "No subject"
  );
}

function getProgramName(classItem) {
  return (
    classItem.program_name ??
    classItem.programName ??
    "No program"
  );
}

function getClassroomName(classItem) {
  return (
    classItem.classroom_name ??
    classItem.classroomName ??
    "No classroom"
  );
}

function StatItem({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
        <Icon
          className="h-4 w-4"
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-semibold text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProjectLink({
  project,
  classId,
}) {
  return (
    <Link
      to={`/dashboard/student/classes/${classId}/projects/${project.id}`}
      className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700">
          <FolderKanban
            className="h-4 w-4"
            strokeWidth={1.8}
          />
        </div>

        <span className="truncate text-sm font-medium text-slate-900">
          {project.name ??
            "Untitled project"}
        </span>
      </div>

      <ArrowRight
        className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700"
        strokeWidth={1.8}
      />
    </Link>
  );
}

function ClassCard({
  classItem,
  projects,
  isLoading,
  isError,
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700">
            <BookOpen
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-950">
              {getClassName(classItem)}
            </h2>

            <p className="mt-1 truncate text-sm text-slate-500">
              {getSubjectName(classItem)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap
                  className="h-3.5 w-3.5"
                  strokeWidth={1.8}
                />

                {getProgramName(classItem)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Building2
                  className="h-3.5 w-3.5"
                  strokeWidth={1.8}
                />

                {getClassroomName(classItem)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Projects
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Open a project to view and contribute to its content.
            </p>
          </div>

          {!isLoading && !isError && (
            <span className="shrink-0 text-xs font-medium text-slate-400">
              {projects.length}{" "}
              {projects.length === 1
                ? "project"
                : "projects"}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading projects...
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Projects could not be loaded.
          </div>
        )}

        {!isLoading &&
          !isError &&
          !projects.length && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center">
              <p className="text-sm font-medium text-slate-700">
                No projects available
              </p>

              <p className="mt-1 text-xs text-slate-500">
                This class does not have any projects yet.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          Boolean(projects.length) && (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectLink
                  key={project.id}
                  project={project}
                  classId={classItem.id}
                />
              ))}
            </div>
          )}
      </div>
    </article>
  );
}

export default function StudentClasses() {
  const classesQuery = useQuery({
    queryKey: ["student-classes"],
    queryFn: listStudentClassesApi,
    retry: false,
  });

  const classes = useMemo(
    () =>
      extractClasses(
        classesQuery.data
      ),
    [classesQuery.data]
  );

  const projectQueries = useQueries({
    queries: classes.map(
      (classItem) => ({
        queryKey: [
          "student-projects",
          classItem.id,
        ],

        queryFn: () =>
          listStudentProjectsApi(
            classItem.id
          ),

        enabled: Boolean(
          classItem.id
        ),

        retry: false,
      })
    ),
  });

  const projectsByClass =
    useMemo(() => {
      const result = {};

      classes.forEach(
        (classItem, index) => {
          result[classItem.id] =
            extractProjects(
              projectQueries[index]?.data
            );
        }
      );

      return result;
    }, [classes, projectQueries]);

  const totalProjects =
    classes.reduce(
      (total, classItem) =>
        total +
        (
          projectsByClass[
            classItem.id
          ] ?? []
        ).length,
      0
    );

  const totalSubjects =
    new Set(
      classes
        .map(
          (classItem) =>
            classItem.subject_id ??
            classItem.subject_name
        )
        .filter(Boolean)
    ).size;

  const totalClassrooms =
    new Set(
      classes
        .map(
          (classItem) =>
            classItem.classroom_id ??
            classItem.classroom_name
        )
        .filter(Boolean)
    ).size;

  const projectsAreLoading =
    projectQueries.some(
      (query) => query.isLoading
    );

  if (
    classesQuery.isLoading &&
    !classes.length
  ) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading classes...
        </div>
      </main>
    );
  }

  if (classesQuery.isError) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            Classes could not be loaded.
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
              {classes.length}{" "}
              {classes.length === 1
                ? "class"
                : "classes"}
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
              My classes
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Access your assigned classes and projects.
            </p>
          </div>

        </div>
      </header>

      <section className="shrink-0 bg-transparent px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          <StatItem
            label="Classes"
            value={classes.length}
            icon={BookOpen}
          />

          <StatItem
            label="Projects"
            value={
              projectsAreLoading
                ? "—"
                : totalProjects
            }
            icon={FolderKanban}
          />

          <StatItem
            label="Subjects"
            value={totalSubjects}
            icon={GraduationCap}
          />

          <StatItem
            label="Classrooms"
            value={totalClassrooms}
            icon={Building2}
          />
        </div>
      </section>

      <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-transparent">
        <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Assigned classes
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Select a project from one of your classes.
            </p>
          </div>

          {(classesQuery.isFetching ||
            projectQueries.some(
              (query) =>
                query.isFetching
            )) && (
            <span className="inline-flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing...
            </span>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-4 [scrollbar-gutter:stable] sm:px-6 lg:px-8">
          {!classes.length && (
            <div className="grid min-h-[280px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                  <BookOpen
                    className="h-6 w-6"
                    strokeWidth={1.8}
                  />
                </div>

                <h2 className="mt-4 text-sm font-semibold text-slate-900">
                  No classes assigned
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  You are not currently assigned to any classes.
                </p>
              </div>
            </div>
          )}

          {!!classes.length && (
            <div className="space-y-4">
              {classes.map(
                (classItem, index) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    projects={
                      projectsByClass[
                        classItem.id
                      ] ?? []
                    }
                    isLoading={
                      projectQueries[index]
                        ?.isLoading
                    }
                    isError={
                      projectQueries[index]
                        ?.isError
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}