import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  listProgramsApi,
  listSubjectsAdminApi,
  listClassroomsAdminApi,
  listPeriodsAdminApi,
  listClassesAdminApi,
  createClassAdminApi,
  deleteClassAdminApi,
  listSchoolYearsAdminApi,
} from "../api/admin";

function PlusIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 19.5V5.75A2.75 2.75 0 0 1 6.75 3H20v15H6.75A2.75 2.75 0 0 0 4 20.75M4 19.5A2.5 2.5 0 0 0 6.5 22H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoorIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 21h16M6 21V4.5A1.5 1.5 0 0 1 7.5 3H18v18M10 12h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
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

function formatTime(value) {
  if (!value) return "-";

  const time = String(value);

  if (/^\d{1,2}:\d{2}/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return "-";
    }

    return `${pad2(hours)}:${pad2(minutes)}`;
  }

  return time;
}

function getTeacherId(teacher) {
  return teacher.user_id ?? teacher.id;
}

function getTeacherLabel(teacher) {
  return teacher.email ?? teacher.name ?? "Teacher";
}

function getProgramName(program) {
  return program.name ?? "Untitled program";
}

function getSubjectName(subject) {
  return subject.name ?? "Untitled subject";
}

function getClassroomName(classroom) {
  return classroom.name ?? "Untitled classroom";
}

function getSchoolYearName(year) {
  return year.name ?? `${year.start_date ?? ""} - ${year.end_date ?? ""}`;
}

function getPeriodLabel(period) {
  return `${formatTime(period.start_time)} - ${formatTime(period.end_time)}`;
}

function ClassCard({ classItem, isBusy, onDelete }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50/70">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {classItem.name}
            </h2>

            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              Class
            </span>
          </div>

          <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
            <BookIcon className="h-3.5 w-3.5 shrink-0" />
            {classItem.subject_name || "No subject"}
            {classItem.program_name ? ` · ${classItem.program_name}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
          <UserIcon className="h-3.5 w-3.5" />
          {classItem.teacher_email || "-"}
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
          <DoorIcon className="h-3.5 w-3.5" />
          {classItem.classroom_name || "-"}
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
          <ClockIcon className="h-3.5 w-3.5" />
          {classItem.start_period_id ? "Start set" : "No start"} /{" "}
          {classItem.end_period_id ? "End set" : "No end"}
        </span>
      </div>
    </article>
  );
}

function ClassModal({
  isOpen,
  programs,
  subjects,
  teachers,
  classrooms,
  years,
  periods,
  programId,
  yearId,
  formValue,
  isSaving = false,
  isSubjectsLoading = false,
  isPeriodsLoading = false,
  canCreate = false,
  onClose,
  onProgramChange,
  onYearChange,
  onFormChange,
  onSave,
}) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setError("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSaving) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSave = async () => {
    if (!formValue.subject_id) {
      setError("Select a subject.");
      return;
    }

    if (!formValue.teacher_id) {
      setError("Select a teacher.");
      return;
    }

    if (!formValue.name.trim()) {
      setError("Add a class name.");
      return;
    }

    try {
      await onSave?.();
      onClose?.();
    } catch {
      setError("Could not create this class.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Class form"
      onMouseDown={() => {
        if (!isSaving) {
          onClose?.();
        }
      }}
    >
      <div
        className="grid max-h-[90vh] w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create class
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Assign a subject to a teacher and optionally connect the class to a classroom and periods.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 [scrollbar-gutter:stable]">
          <div className="grid gap-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Required setup
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Program
                  </label>

                  <select
                    value={programId}
                    onChange={(event) => onProgramChange(event.target.value)}
                    disabled={isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">Select program</option>

                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {getProgramName(program)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Subject
                  </label>

                  <select
                    value={formValue.subject_id}
                    onChange={(event) =>
                      onFormChange("subject_id", event.target.value)
                    }
                    disabled={!programId || isSubjectsLoading || isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {!programId ? "Select program first" : "Select subject"}
                    </option>

                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {getSubjectName(subject)}
                      </option>
                    ))}
                  </select>

                  {isSubjectsLoading && (
                    <p className="mt-1 text-xs text-slate-500">
                      Loading subjects...
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Teacher
                  </label>

                  <select
                    value={formValue.teacher_id}
                    onChange={(event) =>
                      onFormChange("teacher_id", event.target.value)
                    }
                    disabled={isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">Select teacher</option>

                    {teachers.map((teacher) => (
                      <option key={getTeacherId(teacher)} value={getTeacherId(teacher)}>
                        {getTeacherLabel(teacher)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Class name
                  </label>

                  <input
                    value={formValue.name}
                    onChange={(event) => onFormChange("name", event.target.value)}
                    disabled={isSaving}
                    placeholder="e.g. Math 10A"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Optional scheduling
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Classroom
                  </label>

                  <select
                    value={formValue.classroom_id}
                    onChange={(event) =>
                      onFormChange("classroom_id", event.target.value)
                    }
                    disabled={isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">No classroom</option>

                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {getClassroomName(classroom)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Year for periods
                  </label>

                  <select
                    value={yearId}
                    onChange={(event) => onYearChange(event.target.value)}
                    disabled={isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">No periods</option>

                    {years.map((year) => (
                      <option key={year.id} value={year.id}>
                        {getSchoolYearName(year)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Start period
                  </label>

                  <select
                    value={formValue.start_period_id}
                    onChange={(event) =>
                      onFormChange("start_period_id", event.target.value)
                    }
                    disabled={!yearId || isPeriodsLoading || isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {!yearId ? "Select year first" : "No start period"}
                    </option>

                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {getPeriodLabel(period)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    End period
                  </label>

                  <select
                    value={formValue.end_period_id}
                    onChange={(event) =>
                      onFormChange("end_period_id", event.target.value)
                    }
                    disabled={!yearId || isPeriodsLoading || isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {!yearId ? "Select year first" : "No end period"}
                    </option>

                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {getPeriodLabel(period)}
                      </option>
                    ))}
                  </select>

                  {isPeriodsLoading && (
                    <p className="mt-1 text-xs text-slate-500">
                      Loading periods...
                    </p>
                  )}
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canCreate || isSaving}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminClasses() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [programId, setProgramId] = useState("");
  const [yearId, setYearId] = useState("");

  const [formValue, setFormValue] = useState({
    subject_id: "",
    teacher_id: "",
    name: "",
    classroom_id: "",
    start_period_id: "",
    end_period_id: "",
  });

  const overviewQuery = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const programsQuery = useQuery({
    queryKey: ["programs", { sort: "name", dir: "asc" }],
    queryFn: () => listProgramsApi({ sort: "name", dir: "asc" }),
    retry: false,
  });

  const classroomsQuery = useQuery({
    queryKey: ["classrooms"],
    queryFn: listClassroomsAdminApi,
    retry: false,
  });

  const yearsQuery = useQuery({
    queryKey: ["schoolYears"],
    queryFn: listSchoolYearsAdminApi,
    retry: false,
  });

  const classesQuery = useQuery({
    queryKey: ["classes-admin"],
    queryFn: listClassesAdminApi,
    retry: false,
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects-admin", { program: programId }],
    queryFn: () =>
      listSubjectsAdminApi({
        program: programId || undefined,
        sort: "name",
        dir: "asc",
      }),
    enabled: Boolean(programId),
    retry: false,
  });

  const periodsQuery = useQuery({
    queryKey: ["periods", { school_year_id: yearId }],
    queryFn: () =>
      listPeriodsAdminApi({
        school_year_id: yearId || undefined,
      }),
    enabled: Boolean(yearId),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createClassAdminApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes-admin"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassAdminApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes-admin"] });
    },
  });

  const teachers = useMemo(() => {
    return overviewQuery.data?.teachers ?? [];
  }, [overviewQuery.data]);

  const programs = programsQuery.data ?? [];
  const classrooms = classroomsQuery.data ?? [];
  const years = yearsQuery.data ?? [];
  const classes = classesQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const periods = periodsQuery.data ?? [];

  const isLoading =
    overviewQuery.isLoading ||
    programsQuery.isLoading ||
    classroomsQuery.isLoading ||
    yearsQuery.isLoading ||
    classesQuery.isLoading;

  const isError =
    overviewQuery.isError ||
    programsQuery.isError ||
    classroomsQuery.isError ||
    yearsQuery.isError ||
    classesQuery.isError;

  const isBusy = createMutation.isPending || deleteMutation.isPending;
  const canCreate =
    Boolean(formValue.subject_id) &&
    Boolean(formValue.teacher_id) &&
    Boolean(formValue.name.trim());

  useEffect(() => {
    setFormValue((currentValue) => ({
      ...currentValue,
      subject_id: "",
    }));
  }, [programId]);

  useEffect(() => {
    setFormValue((currentValue) => ({
      ...currentValue,
      start_period_id: "",
      end_period_id: "",
    }));
  }, [yearId]);

  const resetCreate = () => {
    setFormValue({
      subject_id: "",
      teacher_id: "",
      name: "",
      classroom_id: "",
      start_period_id: "",
      end_period_id: "",
    });

    setProgramId("");
    setYearId("");
  };

  const handleOpenCreate = () => {
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    resetCreate();
  };

  const handleFormChange = (field, value) => {
    setFormValue((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  };

  const handleCreateClass = async () => {
    if (!canCreate) {
      throw new Error("Missing required fields.");
    }

    await createMutation.mutateAsync({
      subject_id: formValue.subject_id,
      teacher_id: formValue.teacher_id,
      name: formValue.name.trim(),
      classroom_id: formValue.classroom_id || undefined,
      start_period_id: formValue.start_period_id || undefined,
      end_period_id: formValue.end_period_id || undefined,
    });

    resetCreate();
  };

  const handleDeleteClass = async (classItem) => {
    if (!window.confirm(`Delete class "${classItem.name}"?`)) {
      return;
    }

    await deleteMutation.mutateAsync(classItem.id);
  };

  if (isLoading) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <p className="text-sm text-slate-500">Loading classes...</p>
        </section>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm sm:p-4">
          <p className="text-sm text-red-600">Error loading classes.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-slate-50">
      <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        <header className="min-h-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <h1 className="truncate text-base font-semibold text-slate-900">
                  Classes
                </h1>

                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {classes.length} configured
                </span>
              </div>

              <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">
                Assign subjects to teachers and optionally connect classes to classrooms and periods.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_auto]">
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                <div className="text-[11px] font-semibold text-sky-700">
                  Teachers
                </div>

                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {teachers.length}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-[11px] font-semibold text-emerald-700">
                  Programs
                </div>

                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {programs.length}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                disabled={isBusy}
                className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-1"
              >
                <PlusIcon className="h-4 w-4" />
                Create class
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm [scrollbar-gutter:stable]">
          {classesQuery.isFetching && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Refreshing classes...
            </div>
          )}

          {!classes.length && (
            <div className="grid h-full min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No classes yet
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Create a class by assigning a subject and a teacher.
                </p>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  disabled={isBusy}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Create class
                </button>
              </div>
            </div>
          )}

          {!!classes.length && (
            <div className="space-y-2">
              {classes.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  isBusy={isBusy}
                  onDelete={() => handleDeleteClass(classItem)}
                />
              ))}
            </div>
          )}
        </div>

        <ClassModal
          isOpen={createOpen}
          programs={programs}
          subjects={subjects}
          teachers={teachers}
          classrooms={classrooms}
          years={years}
          periods={periods}
          programId={programId}
          yearId={yearId}
          formValue={formValue}
          isSaving={createMutation.isPending}
          isSubjectsLoading={subjectsQuery.isLoading}
          isPeriodsLoading={periodsQuery.isLoading}
          canCreate={canCreate}
          onClose={handleCloseCreate}
          onProgramChange={setProgramId}
          onYearChange={setYearId}
          onFormChange={handleFormChange}
          onSave={handleCreateClass}
        />
      </section>
    </main>
  );
}