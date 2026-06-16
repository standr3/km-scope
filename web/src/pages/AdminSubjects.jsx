import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  adminOverviewApi,
  listProgramsApi,
  listSubjectsAdminApi,
  createSubjectApi,
  updateSubjectApi,
  deleteSubjectApi,
} from "../api/admin";

const SORT_KEYS = ["program", "name", "weekly_hours", "weight"];

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

function EditIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m4 20 4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20ZM13.5 6.5l3 3"
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

function SortIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M8 7h11M8 12h8M8 17h5M4 6v12M4 18l2-2M4 18l-2-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getProgramId(program) {
  return String(program.id);
}

function getProgramName(program) {
  return program.name ?? "Untitled program";
}

function numberInputToPayloadValue(value) {
  if (value === "" || value == null) {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function getSortLabel(sort) {
  if (sort === "weekly_hours") return "Weekly hours";

  return sort.charAt(0).toUpperCase() + sort.slice(1);
}

function getSortedHint(sort, dir) {
  return `${getSortLabel(sort)} · ${dir === "asc" ? "Ascending" : "Descending"}`;
}

function SubjectCard({ subject, isBusy, onEdit, onDelete }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50/70">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {subject.name}
            </h2>

            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                subject.is_required
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              ].join(" ")}
            >
              {subject.is_required ? "Required" : "Optional"}
            </span>
          </div>

          <p className="mt-1 truncate text-xs text-slate-500">
            {subject.program_name || "No program assigned."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
            Year:{" "}
            <span className="font-semibold text-slate-800">
              {subject.year ?? "-"}
            </span>
          </span>

          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
            Hours:{" "}
            <span className="font-semibold text-slate-800">
              {subject.weekly_hours ?? "-"}
            </span>
          </span>

          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
            Weight:{" "}
            <span className="font-semibold text-slate-800">
              {subject.weight ?? "-"}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <EditIcon className="h-4 w-4" />
          Edit
        </button>

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
    </article>
  );
}

function SubjectModal({
  isOpen,
  mode,
  subject,
  programs,
  isSaving = false,
  onClose,
  onSave,
}) {
  const [formValue, setFormValue] = useState({
    program_id: "",
    name: "",
    year: "",
    weekly_hours: "",
    weight: "",
    is_required: true,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (subject) {
      setFormValue({
        program_id: subject.program_id ?? "",
        name: subject.name ?? "",
        year: subject.year != null ? String(subject.year) : "",
        weekly_hours:
          subject.weekly_hours != null ? String(subject.weekly_hours) : "",
        weight: subject.weight != null ? String(subject.weight) : "",
        is_required: Boolean(subject.is_required),
      });
    } else {
      setFormValue({
        program_id: programs[0]?.id ?? "",
        name: "",
        year: "",
        weekly_hours: "",
        weight: "",
        is_required: true,
      });
    }

    setError("");
  }, [isOpen, subject, programs]);

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

  const handleChange = (field, value) => {
    setFormValue((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));

    setError("");
  };

  const handleSave = async () => {
    const nextSubject = {
      id: subject?.id ?? null,
      program_id: formValue.program_id,
      name: formValue.name.trim(),
      year: numberInputToPayloadValue(formValue.year),
      weekly_hours: numberInputToPayloadValue(formValue.weekly_hours),
      weight: numberInputToPayloadValue(formValue.weight),
      is_required: formValue.is_required,
    };

    if (mode === "create" && !nextSubject.program_id) {
      setError("Select a program.");
      return;
    }

    if (!nextSubject.name) {
      setError("Add a subject name.");
      return;
    }

    try {
      await onSave?.(nextSubject);
      onClose?.();
    } catch {
      setError("Could not save this subject.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Subject form"
      onMouseDown={() => {
        if (!isSaving) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Edit subject" : "Create subject"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {mode === "edit"
                ? "Update the subject metadata."
                : "Create a subject inside a program."}
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

        <div className="space-y-4">
          {mode === "create" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Program
              </label>

              <select
                value={formValue.program_id}
                onChange={(event) =>
                  handleChange("program_id", event.target.value)
                }
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
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Name
            </label>

            <input
              value={formValue.name}
              onChange={(event) => handleChange("name", event.target.value)}
              disabled={isSaving}
              placeholder="Subject name"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Year
              </label>

              <input
                type="number"
                value={formValue.year}
                onChange={(event) => handleChange("year", event.target.value)}
                disabled={isSaving}
                placeholder="1"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Weekly hours
              </label>

              <input
                type="number"
                value={formValue.weekly_hours}
                onChange={(event) =>
                  handleChange("weekly_hours", event.target.value)
                }
                disabled={isSaving}
                placeholder="2"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Weight
              </label>

              <input
                type="number"
                value={formValue.weight}
                onChange={(event) => handleChange("weight", event.target.value)}
                disabled={isSaving}
                placeholder="1"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
          </div>

          <label
            className={[
              "flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3",
              formValue.is_required
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                Required subject
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Control whether this subject is mandatory.
              </p>
            </div>

            <input
              type="checkbox"
              checked={formValue.is_required}
              onChange={(event) =>
                handleChange("is_required", event.target.checked)
              }
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
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
            disabled={isSaving}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSubjects() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const program = searchParams.get("program") || "";
  const sort = SORT_KEYS.includes(searchParams.get("sort"))
    ? searchParams.get("sort")
    : "name";
  const dir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const required = searchParams.get("required") === "true";

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    subject: null,
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

  const subjectsQuery = useQuery({
    queryKey: ["subjects", { program, required, sort, dir }],
    queryFn: () =>
      listSubjectsAdminApi({
        program: program || undefined,
        required,
        sort,
        dir,
      }),
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createSubjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateSubjectApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const programs = programsQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isBusy = isSaving || isDeleting;

  const totalSubjects = subjects.length;
  const requiredCount = subjects.filter((subject) => subject.is_required).length;
  const optionalCount = totalSubjects - requiredCount;
  const hasActiveFilters = Boolean(program) || required;
  const sortedHint = getSortedHint(sort, dir);

  const handleSetParam = (key, value) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (value === "" || value == null) {
      nextSearchParams.delete(key);
    } else {
      nextSearchParams.set(key, value);
    }

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleToggleSort = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    const nextDir = dir === "asc" ? "desc" : "asc";

    nextSearchParams.set("dir", nextDir);

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleSortChange = (nextSort) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set("sort", nextSort);
    nextSearchParams.set("dir", "asc");

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleClearFilters = () => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.delete("program");
    nextSearchParams.delete("required");

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      mode: "create",
      subject: null,
    });
  };

  const handleOpenEdit = (subject) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      subject,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: "create",
      subject: null,
    });
  };

  const handleSaveSubject = async (nextSubject) => {
    if (nextSubject.id) {
      await updateMutation.mutateAsync({
        id: nextSubject.id,
        body: {
          name: nextSubject.name,
          year: nextSubject.year,
          weekly_hours: nextSubject.weekly_hours,
          weight: nextSubject.weight,
          is_required: nextSubject.is_required,
        },
      });

      return;
    }

    await createMutation.mutateAsync({
      program_id: nextSubject.program_id,
      name: nextSubject.name,
      year: nextSubject.year,
      weekly_hours: nextSubject.weekly_hours,
      weight: nextSubject.weight,
      is_required: nextSubject.is_required,
    });
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!subjectId) return;

    await deleteMutation.mutateAsync(subjectId);
  };

  if (overviewQuery.isLoading || programsQuery.isLoading) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <p className="text-sm text-slate-500">Loading subjects...</p>
        </section>
      </main>
    );
  }

  if (overviewQuery.isError || programsQuery.isError) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm sm:p-4">
          <p className="text-sm text-red-600">Error loading subjects.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-slate-50">
      <section className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        <header className="min-h-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <h1 className="truncate text-base font-semibold text-slate-900">
                  Subjects
                </h1>

                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {totalSubjects} shown
                </span>
              </div>

              <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">
                Manage subjects, program assignment, and workload metadata.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_auto]">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-[11px] font-semibold text-emerald-700">
                  Required
                </div>

                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {requiredCount}
                </div>
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                <div className="text-[11px] font-semibold text-sky-700">
                  Optional
                </div>

                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {optionalCount}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                disabled={!programs.length || isBusy}
                className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add subject
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto] lg:items-center">
          <select
            value={program}
            onChange={(event) => handleSetParam("program", event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          >
            <option value="">All programs</option>

            {programs.map((programItem) => (
              <option key={programItem.id} value={programItem.id}>
                {getProgramName(programItem)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleSetParam("required", required ? "" : "true")}
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium",
              required
                ? "border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            <CheckIcon className="h-4 w-4" />
            Required only
          </button>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <select
              value={sort}
              onChange={(event) => handleSortChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            >
              <option value="program">Program</option>
              <option value="name">Name</option>
              <option value="weekly_hours">Weekly hours</option>
              <option value="weight">Weight</option>
            </select>

            <button
              type="button"
              onClick={handleToggleSort}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              title={sortedHint}
            >
              <SortIcon className="h-4 w-4" />
              {dir === "asc" ? "Asc" : "Desc"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <XIcon className="h-4 w-4" />
            Clear
          </button>
        </section>

        <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm [scrollbar-gutter:stable]">
          {subjectsQuery.isFetching && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Refreshing subjects...
            </div>
          )}

          {subjectsQuery.isError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              Error loading subjects.
            </div>
          )}

          {!subjects.length && !subjectsQuery.isLoading && (
            <div className="grid h-full min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No subjects found
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Add a subject or adjust the active filters.
                </p>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  disabled={!programs.length || isBusy}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Add subject
                </button>
              </div>
            </div>
          )}

          {!!subjects.length && (
            <div className="space-y-2">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  isBusy={isBusy}
                  onEdit={() => handleOpenEdit(subject)}
                  onDelete={() => handleDeleteSubject(subject.id)}
                />
              ))}
            </div>
          )}
        </div>

        <SubjectModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          subject={modalState.subject}
          programs={programs}
          isSaving={isSaving}
          onClose={handleCloseModal}
          onSave={handleSaveSubject}
        />
      </section>
    </main>
  );
}