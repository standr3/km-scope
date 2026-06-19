import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Clock3,
  DoorOpen,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

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

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTime(value) {
  if (!value) {
    return "-";
  }

  const time = String(value);

  if (/^\d{1,2}:\d{2}/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
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
  return (
    year.name ??
    `${year.start_date ?? ""} - ${year.end_date ?? ""}`
  );
}

function getPeriodLabel(period) {
  return `${formatTime(period.start_time)} - ${formatTime(
    period.end_time
  )}`;
}

function ClassCard({
  classItem,
  isBusy,
  isDeleting,
  onDelete,
}) {
  const className = classItem.name || "Untitled class";

  return (
    <article className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-slate-300 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-medium text-slate-950">
            {className}
          </h2>

          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
            Class
          </span>
        </div>

        <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-slate-400">
          <BookOpen
            className="h-4 w-4 shrink-0"
            strokeWidth={1.8}
          />

          <span className="truncate">
            {classItem.subject_name || "No subject"}

            {classItem.program_name
              ? ` · ${classItem.program_name}`
              : ""}
          </span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
            <UserRound
              className="h-3.5 w-3.5"
              strokeWidth={1.8}
            />

            {classItem.teacher_email || "No teacher"}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
            <DoorOpen
              className="h-3.5 w-3.5"
              strokeWidth={1.8}
            />

            {classItem.classroom_name || "No classroom"}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
            <Clock3
              className="h-3.5 w-3.5"
              strokeWidth={1.8}
            />

            {classItem.start_period_id
              ? "Start set"
              : "No start"}{" "}
            /{" "}
            {classItem.end_period_id
              ? "End set"
              : "No end"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={isBusy}
        title={`Delete ${className}`}
        aria-label={`Delete ${className}`}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-end rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2
          className={[
            "h-5 w-5",
            isDeleting ? "animate-pulse" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          strokeWidth={1.8}
        />
      </button>
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
    if (!isOpen) {
      return;
    }

    setError("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

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

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Assign a subject to a teacher and optionally connect
                the class to a classroom and periods.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close modal"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" strokeWidth={1.8} />
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
                  <label
                    htmlFor="class-program"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Program
                  </label>

                  <select
                    id="class-program"
                    value={programId}
                    onChange={(event) =>
                      onProgramChange(event.target.value)
                    }
                    disabled={isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">Select program</option>

                    {programs.map((program) => (
                      <option
                        key={program.id}
                        value={program.id}
                      >
                        {getProgramName(program)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="class-subject"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Subject
                  </label>

                  <select
                    id="class-subject"
                    value={formValue.subject_id}
                    onChange={(event) =>
                      onFormChange(
                        "subject_id",
                        event.target.value
                      )
                    }
                    disabled={
                      !programId ||
                      isSubjectsLoading ||
                      isSaving
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {!programId
                        ? "Select program first"
                        : "Select subject"}
                    </option>

                    {subjects.map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
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
                  <label
                    htmlFor="class-teacher"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Teacher
                  </label>

                  <select
                    id="class-teacher"
                    value={formValue.teacher_id}
                    onChange={(event) =>
                      onFormChange(
                        "teacher_id",
                        event.target.value
                      )
                    }
                    disabled={isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">Select teacher</option>

                    {teachers.map((teacher) => (
                      <option
                        key={getTeacherId(teacher)}
                        value={getTeacherId(teacher)}
                      >
                        {getTeacherLabel(teacher)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="class-name"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Class name
                  </label>

                  <input
                    id="class-name"
                    value={formValue.name}
                    onChange={(event) =>
                      onFormChange("name", event.target.value)
                    }
                    disabled={isSaving}
                    placeholder="e.g. Math 10A"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
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
                  <label
                    htmlFor="class-classroom"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Classroom
                  </label>

                  <select
                    id="class-classroom"
                    value={formValue.classroom_id}
                    onChange={(event) =>
                      onFormChange(
                        "classroom_id",
                        event.target.value
                      )
                    }
                    disabled={isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">No classroom</option>

                    {classrooms.map((classroom) => (
                      <option
                        key={classroom.id}
                        value={classroom.id}
                      >
                        {getClassroomName(classroom)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="class-year"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Year for periods
                  </label>

                  <select
                    id="class-year"
                    value={yearId}
                    onChange={(event) =>
                      onYearChange(event.target.value)
                    }
                    disabled={isSaving}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">No periods</option>

                    {years.map((year) => (
                      <option
                        key={year.id}
                        value={year.id}
                      >
                        {getSchoolYearName(year)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="class-start-period"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Start period
                  </label>

                  <select
                    id="class-start-period"
                    value={formValue.start_period_id}
                    onChange={(event) =>
                      onFormChange(
                        "start_period_id",
                        event.target.value
                      )
                    }
                    disabled={
                      !yearId ||
                      isPeriodsLoading ||
                      isSaving
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {!yearId
                        ? "Select year first"
                        : "No start period"}
                    </option>

                    {periods.map((period) => (
                      <option
                        key={period.id}
                        value={period.id}
                      >
                        {getPeriodLabel(period)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="class-end-period"
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    End period
                  </label>

                  <select
                    id="class-end-period"
                    value={formValue.end_period_id}
                    onChange={(event) =>
                      onFormChange(
                        "end_period_id",
                        event.target.value
                      )
                    }
                    disabled={
                      !yearId ||
                      isPeriodsLoading ||
                      isSaving
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {!yearId
                        ? "Select year first"
                        : "No end period"}
                    </option>

                    {periods.map((period) => (
                      <option
                        key={period.id}
                        value={period.id}
                      >
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
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canCreate || isSaving}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
  const [deletingClassId, setDeletingClassId] =
    useState(null);

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
    queryKey: [
      "programs",
      {
        sort: "name",
        dir: "asc",
      },
    ],
    queryFn: () =>
      listProgramsApi({
        sort: "name",
        dir: "asc",
      }),
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
    queryKey: [
      "subjects-admin",
      {
        program: programId,
      },
    ],
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
    queryKey: [
      "periods",
      {
        school_year_id: yearId,
      },
    ],
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
      queryClient.invalidateQueries({
        queryKey: ["classes-admin"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassAdminApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classes-admin"],
      });
    },

    onSettled: () => {
      setDeletingClassId(null);
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

  const isBusy =
    createMutation.isPending ||
    deleteMutation.isPending;

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
    if (createMutation.isPending) {
      return;
    }

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
      classroom_id:
        formValue.classroom_id || undefined,
      start_period_id:
        formValue.start_period_id || undefined,
      end_period_id:
        formValue.end_period_id || undefined,
    });
  };

  const handleDeleteClass = async (classItem) => {
    const confirmed = window.confirm(
      `Delete class "${classItem.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingClassId(String(classItem.id));

    try {
      await deleteMutation.mutateAsync(classItem.id);
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not delete this class."
      );
    }
  };

  if (isLoading) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <p className="text-sm text-slate-500">
          Loading classes...
        </p>
      </main>
    );
  }

  if (isError) {
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
      {/* Header fix */}
      <header className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

        <div className="relative flex min-h-[112px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {classes.length} configured
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
              Classes
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Assign subjects to teachers and optionally connect
              classes to classrooms and periods.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={isBusy}
            className={[
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition",
              "sm:w-auto sm:min-w-[140px]",
              "hover:bg-slate-100",
              "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
              "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
            ].join(" ")}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Create
          </button>
        </div>
      </header>

      {/* Informații fixe */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 bg-transparent px-4 py-5 text-sm sm:px-6 lg:px-8">
        <span className="text-slate-500">
          Teachers:
        </span>

        <span className="font-semibold text-slate-900">
          {teachers.length}
        </span>

        <span
          aria-hidden="true"
          className="h-4 border-l border-slate-300"
        />

        <span className="text-slate-500">
          Programs:
        </span>

        <span className="font-semibold text-slate-900">
          {programs.length}
        </span>

        <span
          aria-hidden="true"
          className="h-4 border-l border-slate-300"
        />

        <span className="text-slate-500">
          Classrooms:
        </span>

        <span className="font-semibold text-slate-900">
          {classrooms.length}
        </span>
      </div>

      {/* Doar lista are scroll */}
      <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent [scrollbar-gutter:stable]">
        <div className="space-y-3 bg-transparent px-4 pb-8 pt-1 sm:px-6 lg:px-8">
          {classesQuery.isFetching && (
            <p className="text-xs text-slate-400">
              Refreshing classes...
            </p>
          )}

          {!classes.length && (
            <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No classes yet
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Create a class by assigning a subject and a
                  teacher.
                </p>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  disabled={isBusy}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Plus
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                  Create class
                </button>
              </div>
            </div>
          )}

          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              isBusy={isBusy}
              isDeleting={
                deleteMutation.isPending &&
                deletingClassId === String(classItem.id)
              }
              onDelete={() =>
                handleDeleteClass(classItem)
              }
            />
          ))}
        </div>
      </section>

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
        isSubjectsLoading={
          subjectsQuery.isLoading ||
          subjectsQuery.isFetching
        }
        isPeriodsLoading={
          periodsQuery.isLoading ||
          periodsQuery.isFetching
        }
        canCreate={canCreate}
        onClose={handleCloseCreate}
        onProgramChange={setProgramId}
        onYearChange={setYearId}
        onFormChange={handleFormChange}
        onSave={handleCreateClass}
      />
    </main>
  );
}