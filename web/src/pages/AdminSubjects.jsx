import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  adminOverviewApi,
  listProgramsApi,
  listSubjectsAdminApi,
  createSubjectApi,
  updateSubjectApi,
  deleteSubjectApi,
} from "../api/admin";

const SORT_KEYS = ["program", "name", "weekly_hours", "weight"];

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
  if (sort === "weekly_hours") {
    return "Weekly hours";
  }

  return sort.charAt(0).toUpperCase() + sort.slice(1);
}

function getSortedHint(sort, dir) {
  return `${getSortLabel(sort)} · ${
    dir === "asc" ? "Ascending" : "Descending"
  }`;
}

function SubjectCard({
  subject,
  isBusy,
  isDeleting,
  onEdit,
  onDelete,
}) {
  const subjectName = subject.name || "Untitled subject";
  const isRequired = Boolean(subject.is_required);

  return (
    <article className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-6 transition-colors hover:border-slate-300 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-xl font-medium text-slate-950">
            {subjectName}
          </h2>

          <span
            className={[
              "rounded-full border px-2.5 py-1 text-xs font-semibold",
              isRequired
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            {isRequired ? "Required" : "Optional"}
          </span>
        </div>

        <p className="mt-2 truncate text-sm text-slate-400">
          {subject.program_name || "No program assigned."}
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:items-end">
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
            Year:{" "}
            <span className="font-semibold text-slate-900">
              {subject.year ?? "-"}
            </span>
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
            Hours:{" "}
            <span className="font-semibold text-slate-900">
              {subject.weekly_hours ?? "-"}
            </span>
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
            Weight:{" "}
            <span className="font-semibold text-slate-900">
              {subject.weight ?? "-"}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={isBusy}
            title={`Edit ${subjectName}`}
            aria-label={`Edit ${subjectName}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="h-5 w-5" strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            title={`Delete ${subjectName}`}
            aria-label={`Delete ${subjectName}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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
        </div>
      </div>
    </article>
  );
}

function SubjectModal({
  isOpen,
  mode,
  subject,
  programs,
  defaultProgramId = "",
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
    if (!isOpen) {
      return;
    }

    if (subject) {
      setFormValue({
        program_id:
          subject.program_id != null
            ? String(subject.program_id)
            : "",
        name: subject.name ?? "",
        year:
          subject.year != null
            ? String(subject.year)
            : "",
        weekly_hours:
          subject.weekly_hours != null
            ? String(subject.weekly_hours)
            : "",
        weight:
          subject.weight != null
            ? String(subject.weight)
            : "",
        is_required: Boolean(subject.is_required),
      });
    } else {
      setFormValue({
        program_id: String(
          defaultProgramId || programs[0]?.id || ""
        ),
        name: "",
        year: "",
        weekly_hours: "",
        weight: "",
        is_required: true,
      });
    }

    setError("");
  }, [
    isOpen,
    subject,
    programs,
    defaultProgramId,
  ]);

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
      weekly_hours: numberInputToPayloadValue(
        formValue.weekly_hours
      ),
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit"
                ? "Edit subject"
                : "Create subject"}
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
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="space-y-4">
          {mode === "create" && (
            <div>
              <label
                htmlFor="subject-program"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Program
              </label>

              <select
                id="subject-program"
                value={formValue.program_id}
                onChange={(event) =>
                  handleChange(
                    "program_id",
                    event.target.value
                  )
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
          )}

          <div>
            <label
              htmlFor="subject-name"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Name
            </label>

            <input
              id="subject-name"
              value={formValue.name}
              onChange={(event) =>
                handleChange("name", event.target.value)
              }
              disabled={isSaving}
              placeholder="Subject name"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="subject-year"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Year
              </label>

              <input
                id="subject-year"
                type="number"
                value={formValue.year}
                onChange={(event) =>
                  handleChange("year", event.target.value)
                }
                disabled={isSaving}
                placeholder="1"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="subject-weekly-hours"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Weekly hours
              </label>

              <input
                id="subject-weekly-hours"
                type="number"
                value={formValue.weekly_hours}
                onChange={(event) =>
                  handleChange(
                    "weekly_hours",
                    event.target.value
                  )
                }
                disabled={isSaving}
                placeholder="2"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="subject-weight"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Weight
              </label>

              <input
                id="subject-weight"
                type="number"
                value={formValue.weight}
                onChange={(event) =>
                  handleChange(
                    "weight",
                    event.target.value
                  )
                }
                disabled={isSaving}
                placeholder="1"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
          </div>

          <label
            className={[
              "flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
              formValue.is_required
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50",
              isSaving
                ? "cursor-not-allowed opacity-60"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
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
                handleChange(
                  "is_required",
                  event.target.checked
                )
              }
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
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
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving
              ? "Saving..."
              : mode === "edit"
                ? "Save changes"
                : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSubjects() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const program = searchParams.get("program") || "";

  const sort = SORT_KEYS.includes(
    searchParams.get("sort")
  )
    ? searchParams.get("sort")
    : "name";

  const dir =
    searchParams.get("dir") === "desc"
      ? "desc"
      : "asc";

  const required =
    searchParams.get("required") === "true";

  const [deletingSubjectId, setDeletingSubjectId] =
    useState(null);

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

  const subjectsQuery = useQuery({
    queryKey: [
      "subjects",
      {
        program,
        required,
        sort,
        dir,
      },
    ],
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
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) =>
      updateSubjectApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });
    },
    onSettled: () => {
      setDeletingSubjectId(null);
    },
  });

  const programs = programsQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending;

  const isDeleting = deleteMutation.isPending;
  const isBusy = isSaving || isDeleting;

  const totalSubjects = subjects.length;

  const requiredCount = subjects.filter(
    (subject) => subject.is_required
  ).length;

  const optionalCount =
    totalSubjects - requiredCount;

  const hasActiveFilters =
    Boolean(program) || required;

  const sortedHint = getSortedHint(sort, dir);

  const handleSetParam = (key, value) => {
    const nextSearchParams = new URLSearchParams(
      searchParams
    );

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
    const nextSearchParams = new URLSearchParams(
      searchParams
    );

    const nextDir =
      dir === "asc" ? "desc" : "asc";

    nextSearchParams.set("dir", nextDir);

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleSortChange = (nextSort) => {
    const nextSearchParams = new URLSearchParams(
      searchParams
    );

    nextSearchParams.set("sort", nextSort);
    nextSearchParams.set("dir", "asc");

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleClearFilters = () => {
    const nextSearchParams = new URLSearchParams(
      searchParams
    );

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
    if (isSaving) {
      return;
    }

    setModalState({
      isOpen: false,
      mode: "create",
      subject: null,
    });
  };

  const handleSaveSubject = async (nextSubject) => {
    const isExistingSubject =
      nextSubject.id !== null &&
      nextSubject.id !== undefined;

    if (isExistingSubject) {
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

  const handleDeleteSubject = async (subject) => {
    const subjectId = String(subject.id);
    const subjectName =
      subject.name || "this subject";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${subjectName}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingSubjectId(subjectId);

    try {
      await deleteMutation.mutateAsync(subject.id);
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not delete this subject."
      );
    }
  };

  if (
    overviewQuery.isLoading ||
    programsQuery.isLoading ||
    subjectsQuery.isLoading
  ) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <p className="text-sm text-slate-500">
          Loading subjects...
        </p>
      </main>
    );
  }

  if (
    overviewQuery.isError ||
    programsQuery.isError
  ) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            Error loading subjects.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      {/* Zona fixă */}
      <div className="shrink-0 bg-transparent">
        <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

          <div className="relative flex min-h-[112px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {totalSubjects}{" "}
                {totalSubjects === 1
                  ? "item"
                  : "items"}
              </p>

              <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
                Subjects
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                {requiredCount} required ·{" "}
                {optionalCount} optional
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={!programs.length || isBusy}
              className={[
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition",
                "sm:w-auto sm:min-w-[140px]",
                "hover:bg-slate-100",
                "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
              ].join(" ")}
            >
              Create
            </button>
          </div>
        </header>

        <section className="grid gap-2 bg-transparent px-4 py-5 sm:px-6 lg:grid-cols-[minmax(200px,1fr)_auto_minmax(240px,auto)_auto] lg:items-center lg:px-8">
          <select
            value={program}
            onChange={(event) =>
              handleSetParam(
                "program",
                event.target.value
              )
            }
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          >
            <option value="">All programs</option>

            {programs.map((programItem) => (
              <option
                key={programItem.id}
                value={programItem.id}
              >
                {getProgramName(programItem)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              handleSetParam(
                "required",
                required ? "" : "true"
              )
            }
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors",
              required
                ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            <Check className="h-4 w-4" strokeWidth={2} />
            Required only
          </button>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <select
              value={sort}
              onChange={(event) =>
                handleSortChange(event.target.value)
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            >
              <option value="program">Program</option>
              <option value="name">Name</option>
              <option value="weekly_hours">
                Weekly hours
              </option>
              <option value="weight">Weight</option>
            </select>

            <button
              type="button"
              onClick={handleToggleSort}
              disabled={
                subjectsQuery.isFetching || isBusy
              }
              title={sortedHint}
              className="inline-flex h-10 min-w-[90px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
            >
              <ArrowUpDown
                className="h-4 w-4"
                strokeWidth={1.8}
              />

              {dir === "asc" ? "Asc" : "Desc"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
            Clear
          </button>
        </section>
      </div>

      {/* Doar lista are scroll */}
      <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent [scrollbar-gutter:stable]">
        <div className="space-y-3 bg-transparent px-4 pb-8 pt-1 sm:px-6 lg:px-8">
          {subjectsQuery.isFetching && (
            <p className="text-xs text-slate-400">
              Refreshing subjects...
            </p>
          )}

          {subjectsQuery.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">
                Error loading subjects.
              </p>
            </div>
          )}

          {!subjects.length &&
            !subjectsQuery.isLoading && (
              <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    No subjects found
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Add a subject or adjust the active
                    filters.
                  </p>

                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    disabled={
                      !programs.length || isBusy
                    }
                    className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Plus
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                    Create subject
                  </button>
                </div>
              </div>
            )}

          {subjects.map((subject) => {
            const subjectId = String(subject.id);

            return (
              <SubjectCard
                key={subjectId}
                subject={subject}
                isBusy={isBusy}
                isDeleting={
                  isDeleting &&
                  deletingSubjectId === subjectId
                }
                onEdit={() =>
                  handleOpenEdit(subject)
                }
                onDelete={() =>
                  handleDeleteSubject(subject)
                }
              />
            );
          })}
        </div>
      </section>

      <SubjectModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        subject={modalState.subject}
        programs={programs}
        defaultProgramId={program}
        isSaving={isSaving}
        onClose={handleCloseModal}
        onSave={handleSaveSubject}
      />
    </main>
  );
}