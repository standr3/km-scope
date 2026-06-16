import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTeacherClassesWithProjectsApi } from "../api/teacher";

import GroupedClassSection from "../components/GroupedClassSection";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FolderKanban,
  GraduationCap,
  Layers3,
  Loader2,
} from "lucide-react";

const GROUP_BY_OPTIONS = [
  { value: "classroom", label: "Classroom" },
  { value: "subject", label: "Subject" },
];

const sortByText = (a, b) =>
  String(a || "").localeCompare(String(b || ""), undefined, {
    sensitivity: "base",
  });

function getProgramKey(c) {
  return [c.school_id || "no-school", c.program_name || "no-program"].join(":");
}

function getGroupKey(c, groupBy) {
  if (groupBy === "subject") {
    return c.subject_id || c.subject_name || "no-subject";
  }

  return c.classroom_id || c.classroom_name || "no-classroom";
}

function getGroupTitle(c, groupBy) {
  if (groupBy === "subject") {
    return c.subject_name || "No subject";
  }

  return c.classroom_name || "No classroom";
}

function StatCard({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div
      className={[
        "min-w-0 rounded-md border px-4 py-3",
        tones[tone],
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="min-w-0 break-words text-[10px] font-semibold uppercase leading-tight">
          {label}
        </p>

        <Icon className="h-4 w-4 shrink-0" />
      </div>

      <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
        {value}
      </p>
    </div>
  );
}

export default function TeacherClasses() {
  const q = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: listTeacherClassesWithProjectsApi,
  });

  const classes = useMemo(() => {
    if (Array.isArray(q.data)) return q.data;
    if (Array.isArray(q.data?.classes)) return q.data.classes;
    return [];
  }, [q.data]);

  console.log(classes)

  const [selectedProgramKey, setSelectedProgramKey] = useState("");
  const [groupBy, setGroupBy] = useState("classroom");

  const programs = useMemo(() => {
    const programMap = new Map();

    classes.forEach((c) => {
      const programKey = getProgramKey(c);

      if (!programMap.has(programKey)) {
        programMap.set(programKey, {
          key: programKey,
          programName: c.program_name || "No program",
          schoolName: c.school_name || "-",
          classes: [],
          classCount: 0,
          subjectCount: 0,
          classroomCount: 0,
          projectCount: 0,
        });
      }

      const program = programMap.get(programKey);

      program.classes.push(c);
      program.classCount += 1;
      program.projectCount += c.projects?.length ?? 0;
    });

    return Array.from(programMap.values())
      .map((program) => ({
        ...program,
        subjectCount: new Set(
          program.classes
            .map((c) => c.subject_id || c.subject_name)
            .filter(Boolean)
        ).size,
        classroomCount: new Set(
          program.classes
            .map((c) => c.classroom_id || c.classroom_name)
            .filter(Boolean)
        ).size,
      }))
      .sort((a, b) => sortByText(a.programName, b.programName));
  }, [classes]);

  useEffect(() => {
    if (!programs.length) {
      setSelectedProgramKey("");
      return;
    }

    const selectedStillExists = programs.some(
      (program) => program.key === selectedProgramKey
    );

    if (!selectedProgramKey || !selectedStillExists) {
      setSelectedProgramKey(programs[0].key);
    }
  }, [programs, selectedProgramKey]);

  const selectedProgram = programs.find(
    (program) => program.key === selectedProgramKey
  );

  const groupedSections = useMemo(() => {
    if (!selectedProgram) return [];

    const groupMap = new Map();

    selectedProgram.classes.forEach((c) => {
      const groupKey = getGroupKey(c, groupBy);

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          key: groupKey,
          title: getGroupTitle(c, groupBy),
          classes: [],
          projectCount: 0,
        });
      }

      const group = groupMap.get(groupKey);
      group.classes.push(c);
      group.projectCount += c.projects?.length ?? 0;
    });

    return Array.from(groupMap.values())
      .map((group) => ({
        ...group,
        classes: group.classes.sort((a, b) => sortByText(a.name, b.name)),
      }))
      .sort((a, b) => sortByText(a.title, b.title));
  }, [selectedProgram, groupBy]);

  const totalClasses = classes.length;
  const totalPrograms = programs.length;
  const totalSubjects = new Set(
    classes.map((c) => c.subject_id || c.subject_name).filter(Boolean)
  ).size;
  const totalProjects = classes.reduce(
    (sum, c) => sum + (c.projects?.length ?? 0),
    0
  );

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
    <div className="flex min-h-full w-full max-w-full flex-col overflow-hidden pb-6">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
            <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Classes
                </p>

                <h1 className="mt-2 max-w-full break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Manage your classes
                </h1>

                <p className="mt-2 max-w-xl break-words text-sm text-slate-500">
                  Select a program, choose how classes are grouped, and open a class to
                  manage its projects.
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(180px,220px)]">
                <div className="min-w-0">
                  <label
                    htmlFor="program-select"
                    className="mb-1 block truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Program
                  </label>

                  <select
                    id="program-select"
                    value={selectedProgramKey}
                    onChange={(e) => setSelectedProgramKey(e.target.value)}
                    disabled={!programs.length}
                    className="h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {programs.map((program) => (
                      <option key={program.key} value={program.key}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <span className="mb-1 block truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Group by
                  </span>

                  <div className="grid h-10 min-w-0 grid-cols-2 rounded-md border border-slate-200 bg-white p-1">
                    {GROUP_BY_OPTIONS.map((option) => {
                      const isSelected = groupBy === option.value;

                      return (
                        <label
                          key={option.value}
                          className={[
                            "flex min-w-0 cursor-pointer items-center justify-center rounded px-2 text-sm transition",
                            isSelected
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name="groupBy"
                            value={option.value}
                            checked={isSelected}
                            onChange={() => setGroupBy(option.value)}
                            className="sr-only"
                          />

                          <span className="truncate">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Classes"
                value={totalClasses}
                icon={BookOpen}
                tone="sky"
              />

              <StatCard
                label="Programs"
                value={totalPrograms}
                icon={Layers3}
                tone="amber"
              />

              <StatCard
                label="Subjects"
                value={totalSubjects}
                icon={GraduationCap}
                tone="emerald"
              />

              <StatCard
                label="Projects"
                value={totalProjects}
                icon={FolderKanban}
                tone="violet"
              />
            </div>

          </div>
        </section>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-950">
                  {groupBy === "subject" ? "Subjects" : "Classrooms"}
                </h3>

                <p className="mt-1 break-words text-xs text-slate-500">
                  Expand a section and open a class to view its projects.
                </p>
              </div>

              <Badge className="w-fit shrink-0 rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
                {groupedSections.length}{" "}
                {groupedSections.length === 1 ? "section" : "sections"}
              </Badge>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-3 sm:p-4">
            {!classes.length && (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No classes available
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  You do not have any assigned classes yet.
                </p>
              </div>
            )}

            {!!classes.length && selectedProgram && (
              <div className="space-y-6">
                {groupedSections.map((section) => (
                  <GroupedClassSection
                    key={section.key}
                    title={section.title}
                    groupBy={groupBy}
                    classes={section.classes}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}