import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  adminOverviewApi,
  listProgramsApi,
  createProgramApi,
  updateProgramApi,
  deleteProgramApi,
} from "../api/admin";

function ChevronDownIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
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

function ExternalIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14 5h5v5M19 5l-8 8M19 14v5H5V5h5"
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
  return program.name ?? program.title ?? "Untitled program";
}

function getProgramDescription(program) {
  return program.descr ?? program.description ?? "";
}

function ProgramAccordion({
  program,
  isExpanded,
  isBusy,
  onToggle,
  onEdit,
  onDelete,
  onViewSubjects,
}) {
  const programName = getProgramName(program);
  const programDescription = getProgramDescription(program);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900">
            {programName}
          </h2>
        </div>

        <ChevronDownIcon
          className={[
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            isExpanded ? "rotate-180" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {programDescription || "No description provided."}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onViewSubjects}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ExternalIcon className="h-4 w-4" />
              View subjects
            </button>

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
        </div>
      )}
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
    if (!isOpen) return;

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
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Name
            </label>

            <input
              value={formValue.name}
              disabled={isSaving}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="Program name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Description
            </label>

            <textarea
              value={formValue.descr}
              disabled={isSaving}
              onChange={(event) => handleChange("descr", event.target.value)}
              placeholder="Program description"
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
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
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (mode === "create" && !canCreate)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
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

  const sort = searchParams.get("sort") || "created";
  const dir = searchParams.get("dir") || "asc";

  const [expandedProgramId, setExpandedProgramId] = useState(null);
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
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateProgramApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProgramApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const schools = overviewQuery.data?.schools ?? [];
  const defaultSchoolId = schools[0]?.id ?? "";
  const programs = programsQuery.data ?? [];

  const isSaving = createMutation.isPending || updateMutation.isPending;
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
    setModalState({
      isOpen: false,
      mode: "create",
      program: null,
    });
  };

  const handleSaveProgram = async (nextProgram) => {
    if (nextProgram.id) {
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

  const handleDeleteProgram = async (programId) => {
    if (!programId) return;

    await deleteMutation.mutateAsync(programId);

    setExpandedProgramId((currentExpandedProgramId) =>
      currentExpandedProgramId === programId ? null : currentExpandedProgramId
    );
  };

  const handleToggleProgram = (programId) => {
    setExpandedProgramId((currentProgramId) =>
      currentProgramId === programId ? null : programId
    );
  };

  const handleViewSubjects = (programId) => {
    const nextSearchParams = new URLSearchParams();

    nextSearchParams.set("program", programId);
    nextSearchParams.set("sort", "name");
    nextSearchParams.set("dir", "asc");

    navigate(`/dashboard/admin/subjects?${nextSearchParams.toString()}`);
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

  const sortedHint =
    sort === "name"
      ? dir === "asc"
        ? "Name · A to Z"
        : "Name · Z to A"
      : dir === "asc"
        ? "Created · Oldest first"
        : "Created · Newest first";

  if (overviewQuery.isLoading || programsQuery.isLoading) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <p className="text-sm text-slate-500">Loading programs...</p>
        </section>
      </main>
    );
  }

  if (overviewQuery.isError || programsQuery.isError) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm sm:p-4">
          <p className="text-sm text-red-600">Error loading programs.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-slate-50">
      <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        <header className="min-h-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <h1 className="truncate text-base font-semibold text-slate-900">
                  Programs
                </h1>

                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {totalPrograms} configured
                </span>
              </div>

              <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">
                Manage academic programs and their descriptions.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[auto_auto]">
              <button
                type="button"
                onClick={handleToggleSort}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {sortedHint}
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                disabled={!defaultSchoolId || isBusy}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <PlusIcon className="h-4 w-4" />
                Add program
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm [scrollbar-gutter:stable]">
          {programsQuery.isFetching && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Refreshing programs...
            </div>
          )}

          {!programs.length && (
            <div className="grid h-full min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  No programs yet
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Add a program to start organizing academic content.
                </p>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  disabled={!defaultSchoolId || isBusy}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Add first program
                </button>
              </div>
            </div>
          )}

          {!!programs.length && (
            <div className="space-y-2">
              {programs.map((program) => {
                const programId = getProgramId(program);

                return (
                  <ProgramAccordion
                    key={programId}
                    program={program}
                    isExpanded={expandedProgramId === programId}
                    isBusy={isBusy}
                    onToggle={() => handleToggleProgram(programId)}
                    onEdit={() => handleOpenEdit(program)}
                    onDelete={() => handleDeleteProgram(programId)}
                    onViewSubjects={() => handleViewSubjects(programId)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <ProgramModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          program={modalState.program}
          isSaving={isSaving}
          canCreate={Boolean(defaultSchoolId)}
          onClose={handleCloseModal}
          onSave={handleSaveProgram}
        />
      </section>
    </main>
  );
}