import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Pencil, Trash2, X } from "lucide-react";

import {
  adminOverviewApi,
  listProgramsApi,
  createProgramApi,
  updateProgramApi,
  deleteProgramApi,
} from "../api/admin";

function getProgramId(program) {
  return String(program.id);
}

function getProgramName(program) {
  return program.name ?? program.title ?? "Untitled program";
}

function getProgramDescription(program) {
  return program.descr ?? program.description ?? "";
}

function ProgramCard({
  program,
  isBusy,
  isDeleting,
  onEdit,
  onDelete,
  onViewSubjects,
}) {
  const programName = getProgramName(program);
  const programDescription = getProgramDescription(program);

  return (
    <article className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-7 transition-colors hover:border-slate-300 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-8">
      <div className="min-w-0">
        <h2 className="truncate text-xl font-medium text-slate-950">
          {programName}
        </h2>

        <p className="mt-2 line-clamp-2 text-sm text-slate-400">
          {programDescription || "No description provided."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:gap-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={isBusy}
          title={`Edit ${programName}`}
          aria-label={`Edit ${programName}`}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          title={`Delete ${programName}`}
          aria-label={`Delete ${programName}`}
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

        <button
          type="button"
          onClick={onViewSubjects}
          disabled={isBusy}
          className="inline-flex h-10 min-w-[150px] items-center justify-center rounded-lg border border-slate-400 bg-white px-5 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          View Subjects
        </button>
      </div>
    </article>
  );
}

function ProgramModal({
  isOpen,
  mode,
  program,
  isSaving = false,
  canCreate = true,
  onClose,
  onSave,
}) {
  const [formValue, setFormValue] = useState({
    name: "",
    descr: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (program) {
      setFormValue({
        name: getProgramName(program),
        descr: getProgramDescription(program),
      });
    } else {
      setFormValue({
        name: "",
        descr: "",
      });
    }

    setError("");
  }, [isOpen, program]);

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
    const nextProgram = {
      id: program?.id ?? null,
      name: formValue.name.trim(),
      descr: formValue.descr.trim(),
    };

    if (!nextProgram.name) {
      setError("Add a program name.");
      return;
    }

    if (mode === "create" && !canCreate) {
      setError("This program cannot be created right now.");
      return;
    }

    try {
      await onSave?.(nextProgram);
      onClose?.();
    } catch {
      setError("Could not save this program.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Program form"
      onMouseDown={() => {
        if (!isSaving) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Edit program" : "Create program"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {mode === "edit"
                ? "Update the program name and description."
                : "Add a program name and optional description."}
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
          <div>
            <label
              htmlFor="program-name"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Name
            </label>

            <input
              id="program-name"
              value={formValue.name}
              disabled={isSaving}
              onChange={(event) =>
                handleChange("name", event.target.value)
              }
              placeholder="Program name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="program-description"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Description
            </label>

            <textarea
              id="program-description"
              value={formValue.descr}
              disabled={isSaving}
              onChange={(event) =>
                handleChange("descr", event.target.value)
              }
              placeholder="Program description"
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

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
            disabled={isSaving || (mode === "create" && !canCreate)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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

export default function AdminPrograms() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const sort = searchParams.get("sort") || "name";
  const dir = searchParams.get("dir") || "asc";

  const [deletingProgramId, setDeletingProgramId] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    program: null,
  });

  const overviewQuery = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const programsQuery = useQuery({
    queryKey: ["programs", { sort, dir }],
    queryFn: () => listProgramsApi({ sort, dir }),
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createProgramApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["programs"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateProgramApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["programs"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProgramApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["programs"],
      });
    },
    onSettled: () => {
      setDeletingProgramId(null);
    },
  });

  const schools = overviewQuery.data?.schools ?? [];
  const defaultSchoolId = schools[0]?.id ?? "";
  const programs = programsQuery.data ?? [];

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  const isDeleting = deleteMutation.isPending;
  const isBusy = isSaving || isDeleting;

  const totalPrograms = programs.length;

  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      mode: "create",
      program: null,
    });
  };

  const handleOpenEdit = (program) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      program,
    });
  };

  const handleCloseModal = () => {
    if (isSaving) {
      return;
    }

    setModalState({
      isOpen: false,
      mode: "create",
      program: null,
    });
  };

  const handleSaveProgram = async (nextProgram) => {
    const isExistingProgram =
      nextProgram.id !== null && nextProgram.id !== undefined;

    if (isExistingProgram) {
      await updateMutation.mutateAsync({
        id: nextProgram.id,
        body: {
          name: nextProgram.name,
          descr: nextProgram.descr,
        },
      });

      return;
    }

    await createMutation.mutateAsync({
      school_id: defaultSchoolId,
      name: nextProgram.name,
      descr: nextProgram.descr,
    });
  };

  const handleDeleteProgram = async (program) => {
    const programId = getProgramId(program);
    const programName = getProgramName(program);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${programName}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingProgramId(programId);

    try {
      await deleteMutation.mutateAsync(programId);
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
        error?.message ||
        "Could not delete this program."
      );
    }
  };

  const handleViewSubjects = (programId) => {
    const nextSearchParams = new URLSearchParams();

    nextSearchParams.set("program", programId);
    nextSearchParams.set("sort", "name");
    nextSearchParams.set("dir", "asc");

    navigate(
      `/dashboard/admin/subjects?${nextSearchParams.toString()}`
    );
  };

  const handleToggleSort = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    const nextDir = dir === "asc" ? "desc" : "asc";

    nextSearchParams.set("sort", "name");
    nextSearchParams.set("dir", nextDir);

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const sortedHint = dir === "asc" ? "A to Z" : "Z to A";

  if (overviewQuery.isLoading || programsQuery.isLoading) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <p className="text-sm text-slate-500">
          Loading programs...
        </p>
      </main>
    );
  }

  if (overviewQuery.isError || programsQuery.isError) {
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
      {/* Zona fixă: header + sortare */}
      <div className="shrink-0 bg-transparent">
        <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

          <div className="relative flex min-h-[112px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {totalPrograms}{" "}
                {totalPrograms === 1 ? "item" : "items"}
              </p>

              <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
                Programs
              </h1>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={!defaultSchoolId || isBusy}
              className={[
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 shadow-sm transition",
                "sm:w-auto sm:min-w-[120px]",
                "hover:bg-slate-100",
                "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
              ].join(" ")}
            >
              Create
            </button>
          </div>
        </header>

        <div className="flex items-center gap-3 bg-transparent px-4 py-5 text-sm sm:px-6 lg:px-8">
          <span className="text-slate-500">Sort:</span>

          <span
            aria-hidden="true"
            className="h-4 border-l border-slate-300"
          />

          <button
            type="button"
            onClick={handleToggleSort}
            disabled={programsQuery.isFetching || isBusy}
            className="inline-flex items-center gap-1 text-blue-500 transition-colors hover:text-blue-700 disabled:cursor-wait disabled:opacity-50"
          >
            {sortedHint}

            <ChevronDown
              className={[
                "h-3 w-3 transition-transform",
                dir === "desc" ? "rotate-180" : "",
              ].join(" ")}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* Doar această zonă are scroll */}
      <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent [scrollbar-gutter:stable]">
        <div className="space-y-3 bg-transparent px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          {programsQuery.isFetching && (
            <p className="text-xs text-slate-400">
              Refreshing programs...
            </p>
          )}

          {!programs.length && (
            <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No programs yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add a program to start organizing academic content.
                </p>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  disabled={!defaultSchoolId || isBusy}
                  className="mt-4 rounded-lg border border-slate-400 bg-white px-5 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Create program
                </button>
              </div>
            </div>
          )}

          {programs.map((program) => {
            const programId = getProgramId(program);

            return (
              <ProgramCard
                key={programId}
                program={program}
                isBusy={isBusy}
                isDeleting={
                  isDeleting && deletingProgramId === programId
                }
                onEdit={() => handleOpenEdit(program)}
                onDelete={() => handleDeleteProgram(program)}
                onViewSubjects={() =>
                  handleViewSubjects(programId)
                }
              />
            );
          })}
        </div>
      </section>

      <ProgramModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        program={modalState.program}
        isSaving={isSaving}
        canCreate={Boolean(defaultSchoolId)}
        onClose={handleCloseModal}
        onSave={handleSaveProgram}
      />
    </main>
  );
}