import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  FolderKanban,
  GraduationCap,
  Layers3,
  Loader2,
} from "lucide-react";

import { listTeacherClassesWithProjectsApi } from "../api/teacher";
import GroupedClassSection from "../components/GroupedClassSection";

const GROUP_BY_OPTIONS = [
  {
    value: "classroom",
    label: "Classroom",
  },
  {
    value: "subject",
    label: "Subject",
  },
];

function sortByText(firstValue, secondValue) {
  return String(firstValue || "").localeCompare(
    String(secondValue || ""),
    undefined,
    {
      sensitivity: "base",
    }
  );
}

function getProgramKey(classItem) {
  return [
    classItem.school_id || "no-school",
    classItem.program_name || "no-program",
  ].join(":");
}

function getGroupKey(classItem, groupBy) {
  if (groupBy === "subject") {
    return (
      classItem.subject_id ||
      classItem.subject_name ||
      "no-subject"
    );
  }

  return (
    classItem.classroom_id ||
    classItem.classroom_name ||
    "no-classroom"
  );
}

function getGroupTitle(classItem, groupBy) {
  if (groupBy === "subject") {
    return classItem.subject_name || "No subject";
  }

  return classItem.classroom_name || "No classroom";
}

function StatItem({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
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

export default function TeacherClasses() {
  const classesQuery = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: listTeacherClassesWithProjectsApi,
    retry: false,
  });

  const classes = useMemo(() => {
    if (Array.isArray(classesQuery.data)) {
      return classesQuery.data;
    }

    if (Array.isArray(classesQuery.data?.classes)) {
      return classesQuery.data.classes;
    }

    return [];
  }, [classesQuery.data]);

  const [selectedProgramKey, setSelectedProgramKey] =
    useState("");

  const [groupBy, setGroupBy] =
    useState("classroom");

  const programs = useMemo(() => {
    const programMap = new Map();

    classes.forEach((classItem) => {
      const programKey =
        getProgramKey(classItem);

      if (!programMap.has(programKey)) {
        programMap.set(programKey, {
          key: programKey,
          programName:
            classItem.program_name ||
            "No program",
          schoolName:
            classItem.school_name ||
            "No school",
          classes: [],
          classCount: 0,
          subjectCount: 0,
          classroomCount: 0,
          projectCount: 0,
        });
      }

      const program =
        programMap.get(programKey);

      program.classes.push(classItem);
      program.classCount += 1;
      program.projectCount +=
        classItem.projects?.length ?? 0;
    });

    return Array.from(programMap.values())
      .map((program) => ({
        ...program,

        subjectCount: new Set(
          program.classes
            .map(
              (classItem) =>
                classItem.subject_id ||
                classItem.subject_name
            )
            .filter(Boolean)
        ).size,

        classroomCount: new Set(
          program.classes
            .map(
              (classItem) =>
                classItem.classroom_id ||
                classItem.classroom_name
            )
            .filter(Boolean)
        ).size,
      }))
      .sort((firstProgram, secondProgram) =>
        sortByText(
          firstProgram.programName,
          secondProgram.programName
        )
      );
  }, [classes]);

  useEffect(() => {
    if (!programs.length) {
      setSelectedProgramKey("");
      return;
    }

    const selectedProgramStillExists =
      programs.some(
        (program) =>
          program.key === selectedProgramKey
      );

    if (
      !selectedProgramKey ||
      !selectedProgramStillExists
    ) {
      setSelectedProgramKey(
        programs[0].key
      );
    }
  }, [programs, selectedProgramKey]);

  const selectedProgram = useMemo(() => {
    return programs.find(
      (program) =>
        program.key === selectedProgramKey
    );
  }, [programs, selectedProgramKey]);

  const groupedSections = useMemo(() => {
    if (!selectedProgram) {
      return [];
    }

    const groupMap = new Map();

    selectedProgram.classes.forEach(
      (classItem) => {
        const groupKey = getGroupKey(
          classItem,
          groupBy
        );

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            key: groupKey,
            title: getGroupTitle(
              classItem,
              groupBy
            ),
            classes: [],
            projectCount: 0,
          });
        }

        const group =
          groupMap.get(groupKey);

        group.classes.push(classItem);

        group.projectCount +=
          classItem.projects?.length ?? 0;
      }
    );

    return Array.from(groupMap.values())
      .map((group) => ({
        ...group,

        classes: [...group.classes].sort(
          (firstClass, secondClass) =>
            sortByText(
              firstClass.name,
              secondClass.name
            )
        ),
      }))
      .sort((firstGroup, secondGroup) =>
        sortByText(
          firstGroup.title,
          secondGroup.title
        )
      );
  }, [selectedProgram, groupBy]);

  const totalClasses = classes.length;
  const totalPrograms = programs.length;

  const totalSubjects = useMemo(() => {
    return new Set(
      classes
        .map(
          (classItem) =>
            classItem.subject_id ||
            classItem.subject_name
        )
        .filter(Boolean)
    ).size;
  }, [classes]);

  const totalProjects = useMemo(() => {
    return classes.reduce(
      (total, classItem) =>
        total +
        (classItem.projects?.length ?? 0),
      0
    );
  }, [classes]);

  if (classesQuery.isLoading) {
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
            Error loading classes.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      <header className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

        <div className="relative grid min-h-[136px] gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-center lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">
              {totalClasses}{" "}
              {totalClasses === 1
                ? "class"
                : "classes"}{" "}
              across {totalPrograms}{" "}
              {totalPrograms === 1
                ? "program"
                : "programs"}
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
              Classes
            </h1>

            <p className="mt-2 truncate text-sm text-slate-400">
              {selectedProgram
                ? `${selectedProgram.programName} · ${selectedProgram.schoolName}`
                : "No program selected"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0">
              <label
                htmlFor="teacher-program-select"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Program
              </label>

              <select
                id="teacher-program-select"
                value={selectedProgramKey}
                onChange={(event) =>
                  setSelectedProgramKey(
                    event.target.value
                  )
                }
                disabled={!programs.length}
                className="h-11 w-full min-w-0 rounded-lg border border-white bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition hover:bg-slate-100 focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-700 disabled:text-slate-400"
              >
                {!programs.length && (
                  <option value="">
                    No programs
                  </option>
                )}

                {programs.map((program) => (
                  <option
                    key={program.key}
                    value={program.key}
                  >
                    {program.programName}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                Group by
              </span>

              <div className="grid h-11 grid-cols-2 rounded-lg bg-white p-1">
                {GROUP_BY_OPTIONS.map(
                  (option) => {
                    const isSelected =
                      groupBy === option.value;

                    return (
                      <label
                        key={option.value}
                        className={[
                          "flex min-w-0 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors",
                          isSelected
                            ? "bg-slate-950 text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="teacher-class-group"
                          value={option.value}
                          checked={isSelected}
                          onChange={() =>
                            setGroupBy(
                              option.value
                            )
                          }
                          className="sr-only"
                        />

                        <span className="truncate">
                          {option.label}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="shrink-0 bg-transparent px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          <StatItem
            label="Classes"
            value={totalClasses}
            icon={BookOpen}
          />

          <StatItem
            label="Programs"
            value={totalPrograms}
            icon={Layers3}
          />

          <StatItem
            label="Subjects"
            value={totalSubjects}
            icon={GraduationCap}
          />

          <StatItem
            label="Projects"
            value={totalProjects}
            icon={FolderKanban}
          />
        </div>
      </section>

      <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-transparent">
        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {groupBy === "subject" ? (
                <GraduationCap
                  className="h-4 w-4 text-slate-400"
                  strokeWidth={1.8}
                />
              ) : (
                <Building2
                  className="h-4 w-4 text-slate-400"
                  strokeWidth={1.8}
                />
              )}

              <h2 className="truncate text-sm font-semibold text-slate-950">
                {groupBy === "subject"
                  ? "Subjects"
                  : "Classrooms"}
              </h2>
            </div>

            <p className="mt-1 truncate text-xs text-slate-500">
              Expand a section and open a class to manage its projects.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">
              Sections:
            </span>

            <span className="font-semibold text-slate-950">
              {groupedSections.length}
            </span>

            {selectedProgram && (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 border-l border-slate-300"
                />

                <span className="text-slate-500">
                  Program classes:
                </span>

                <span className="font-semibold text-slate-950">
                  {selectedProgram.classCount}
                </span>

                <span
                  aria-hidden="true"
                  className="h-4 border-l border-slate-300"
                />

                <span className="text-slate-500">
                  Projects:
                </span>

                <span className="font-semibold text-slate-950">
                  {selectedProgram.projectCount}
                </span>
              </>
            )}

            {classesQuery.isFetching && (
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Refreshing...
              </span>
            )}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-4 [scrollbar-gutter:stable] sm:px-6 lg:px-8">
          {!classes.length && (
            <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No classes available
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  You do not have any assigned classes yet.
                </p>
              </div>
            </div>
          )}

          {!!classes.length &&
            !selectedProgram && (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    No program selected
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Select a program from the header to view its classes.
                  </p>
                </div>
              </div>
            )}

          {!!classes.length &&
            selectedProgram &&
            !groupedSections.length && (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    No grouped classes
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    There are no classes available for the selected grouping.
                  </p>
                </div>
              </div>
            )}

          {!!groupedSections.length && (
            <div className="space-y-6">
              {groupedSections.map(
                (section) => (
                  <GroupedClassSection
                    key={section.key}
                    title={section.title}
                    groupBy={groupBy}
                    classes={section.classes}
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