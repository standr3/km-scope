import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  listTeacherProjectsApi,
  createTeacherProjectApi,
  updateTeacherProjectApi,
  deleteTeacherProjectApi,
} from "../api/teacher";

const DUMMY_PROJECTS = [];

const STATUS_STYLES = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft:
    "border-slate-200 bg-slate-50 text-slate-600",
  review:
    "border-amber-200 bg-amber-50 text-amber-700",
  archived:
    "border-slate-300 bg-slate-100 text-slate-500",
};

function getApiMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
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

function normalizeProjects(data) {
  return extractProjects(data).map(
    (project, index) => ({
      id:
        project.id ??
        `project-${index}`,

      name:
        project.name ??
        "Untitled project",

      status:
        project.status ??
        "active",

      members_count:
        project.members_count ??
        project.members?.length ??
        0,

      updated_at:
        project.updated_at ??
        null,

      raw: project,
      isDummy: false,
    })
  );
}

function normalizeDummyProjects(data) {
  return data.map((project) => ({
    ...project,
    isDummy: true,
  }));
}

function getStatusLabel(status) {
  switch (status) {
    case "draft":
      return "Draft";

    case "review":
      return "Review";

    case "archived":
      return "Archived";

    case "active":
    default:
      return "Active";
  }
}

function getStatusClassName(status) {
  return (
    STATUS_STYLES[status] ||
    STATUS_STYLES.active
  );
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  try {
    return new Intl.DateTimeFormat(
      undefined,
      {
        dateStyle: "medium",
      }
    ).format(date);
  } catch {
    return String(value);
  }
}

function useModalLifecycle({
  open,
  isBusy,
  onClose,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !isBusy
      ) {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, isBusy, onClose]);
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

function ProjectRow({
  project,
  classId,
  isBusy,
  isRenaming,
  isDeleting,
  onRename,
  onDelete,
}) {
  const updatedAt = formatDate(
    project.updated_at
  );

  return (
    <article className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-slate-300 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
          <FolderKanban
            className="h-5 w-5"
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-medium text-slate-950">
              {project.name}
            </h2>

            <span
              className={[
                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                getStatusClassName(
                  project.status
                ),
              ].join(" ")}
            >
              {getStatusLabel(
                project.status
              )}
            </span>

            {project.isDummy && (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                Demo
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Users
                className="h-3.5 w-3.5"
                strokeWidth={1.8}
              />

              {project.members_count}{" "}
              {project.members_count === 1
                ? "member"
                : "members"}
            </span>

            {updatedAt && (
              <span>
                Updated {updatedAt}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          to={`/dashboard/teacher/classes/${classId}/projects/${project.id}`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Open
        </Link>

        {project.isDummy ? (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400">
            <BarChart3
              className="h-4 w-4"
              strokeWidth={1.8}
            />
            Performance
          </span>
        ) : (
          <Link
            to={`/dashboard/teacher/classes/${classId}/projects/${project.id}/performance`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            <BarChart3
              className="h-4 w-4"
              strokeWidth={1.8}
            />
            Performance
          </Link>
        )}

        <button
          type="button"
          onClick={() =>
            onRename(project)
          }
          disabled={
            isBusy ||
            project.isDummy
          }
          aria-label={`Rename ${project.name}`}
          title={`Rename ${project.name}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isRenaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Pencil
              className="h-4 w-4"
              strokeWidth={1.8}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            onDelete(project)
          }
          disabled={
            isBusy ||
            project.isDummy
          }
          aria-label={`Delete ${project.name}`}
          title={`Delete ${project.name}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2
              className="h-4 w-4"
              strokeWidth={1.8}
            />
          )}
        </button>
      </div>
    </article>
  );
}

function ProjectFormModal({
  open,
  mode,
  value,
  error,
  isSaving,
  onValueChange,
  onClose,
  onSubmit,
}) {
  useModalLifecycle({
    open,
    isBusy: isSaving,
    onClose,
  });

  if (!open) {
    return null;
  }

  const isRename =
    mode === "rename";

  const title = isRename
    ? "Rename project"
    : "Create project";

  const description = isRename
    ? "Update the project name."
    : "Add a new project to this class.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={() => {
        if (!isSaving) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              {isRename ? (
                <Pencil
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
              ) : (
                <FolderKanban
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
              )}
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.();
          }}
        >
          <label
            htmlFor={`${mode}-project-name`}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Project name
          </label>

          <input
            id={`${mode}-project-name`}
            value={value}
            onChange={(event) =>
              onValueChange(
                event.target.value
              )
            }
            disabled={isSaving}
            autoFocus
            placeholder="Enter project name"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSaving ||
                !value.trim()
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {isSaving
                ? isRename
                  ? "Saving..."
                  : "Creating..."
                : isRename
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteProjectModal({
  open,
  project,
  error,
  isDeleting,
  onClose,
  onConfirm,
}) {
  useModalLifecycle({
    open,
    isBusy: isDeleting,
    onClose,
  });

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Delete project"
      onMouseDown={() => {
        if (!isDeleting) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2
                className="h-4 w-4"
                strokeWidth={1.8}
              />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              Delete project?
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {project
                ? `This will permanently delete “${project.name}”.`
                : "This action cannot be undone."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={
              isDeleting ||
              !project
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isDeleting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {isDeleting
              ? "Deleting..."
              : "Delete project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherProjects() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const queryClient =
    useQueryClient();

  const [createOpen, setCreateOpen] =
    useState(false);

  const [renameOpen, setRenameOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [name, setName] =
    useState("");

  const [
    renameValue,
    setRenameValue,
  ] = useState("");

  const [
    selectedProject,
    setSelectedProject,
  ] = useState(null);

  const [
    createError,
    setCreateError,
  ] = useState("");

  const [
    renameError,
    setRenameError,
  ] = useState("");

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const projectsQuery = useQuery({
    queryKey: [
      "teacher-projects",
      classId,
    ],

    queryFn: () =>
      listTeacherProjectsApi(classId),

    enabled: Boolean(classId),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (body) =>
      createTeacherProjectApi(
        classId,
        body
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "teacher-projects",
          classId,
        ],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ projectId, body }) =>
      updateTeacherProjectApi(
        projectId,
        body
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "teacher-projects",
          classId,
        ],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn:
      deleteTeacherProjectApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "teacher-projects",
          classId,
        ],
      });
    },
  });

  const apiProjects = useMemo(
    () =>
      normalizeProjects(
        projectsQuery.data
      ),
    [projectsQuery.data]
  );

  const projects = useMemo(() => {
    const dummyProjects =
      normalizeDummyProjects(
        DUMMY_PROJECTS
      );

    return [
      ...apiProjects,
      ...dummyProjects,
    ];
  }, [apiProjects]);

  const totalProjects =
    projects.length;

  const activeProjects =
    projects.filter(
      (project) =>
        project.status === "active"
    ).length;

  const totalMembers =
    projects.reduce(
      (total, project) =>
        total +
        (project.members_count || 0),
      0
    );

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const handleOpenCreate = () => {
    createMutation.reset();
    setCreateError("");
    setName("");
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (createMutation.isPending) {
      return;
    }

    setCreateOpen(false);
    setCreateError("");
    setName("");
  };

  const handleCreate = async () => {
    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setCreateError(
        "Add a project name."
      );
      return;
    }

    try {
      setCreateError("");

      await createMutation.mutateAsync({
        name: trimmedName,
      });

      setName("");
      setCreateOpen(false);
    } catch (error) {
      setCreateError(
        getApiMessage(
          error,
          "Could not create this project."
        )
      );
    }
  };

  const handleOpenRename = (
    project
  ) => {
    if (project.isDummy) {
      return;
    }

    updateMutation.reset();
    setRenameError("");
    setSelectedProject(project);
    setRenameValue(project.name);
    setRenameOpen(true);
  };

  const handleCloseRename = () => {
    if (updateMutation.isPending) {
      return;
    }

    setRenameOpen(false);
    setSelectedProject(null);
    setRenameValue("");
    setRenameError("");
  };

  const handleRename = async () => {
    if (!selectedProject) {
      return;
    }

    const trimmedName =
      renameValue.trim();

    if (!trimmedName) {
      setRenameError(
        "Add a project name."
      );
      return;
    }

    if (
      trimmedName ===
      selectedProject.name
    ) {
      handleCloseRename();
      return;
    }

    try {
      setRenameError("");

      await updateMutation.mutateAsync({
        projectId:
          selectedProject.id,

        body: {
          name: trimmedName,
        },
      });

      setRenameOpen(false);
      setSelectedProject(null);
      setRenameValue("");
    } catch (error) {
      setRenameError(
        getApiMessage(
          error,
          "Could not rename this project."
        )
      );
    }
  };

  const handleOpenDelete = (
    project
  ) => {
    if (project.isDummy) {
      return;
    }

    deleteMutation.reset();
    setDeleteError("");
    setSelectedProject(project);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteOpen(false);
    setSelectedProject(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!selectedProject) {
      return;
    }

    try {
      setDeleteError("");

      await deleteMutation.mutateAsync(
        selectedProject.id
      );

      setDeleteOpen(false);
      setSelectedProject(null);
    } catch (error) {
      setDeleteError(
        getApiMessage(
          error,
          "Could not delete this project."
        )
      );
    }
  };

  if (
    projectsQuery.isLoading &&
    !projects.length
  ) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading projects...
        </div>
      </main>
    );
  }

  if (projectsQuery.isError) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            Error loading projects.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
        <header className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

          <div className="relative flex min-h-[128px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() =>
                  navigate(-1)
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
                Back to classes
              </button>

              <h1 className="mt-3 text-2xl font-semibold leading-none tracking-tight text-white">
                Projects
              </h1>

              <p className="mt-2 truncate text-sm text-slate-400">
                Manage projects for class{" "}
                {classId}.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={isBusy}
              className={[
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition",
                "sm:w-auto sm:min-w-[160px]",
                "hover:bg-slate-100",
                "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
              ].join(" ")}
            >
              <Plus
                className="h-4 w-4"
                strokeWidth={2}
              />
              Create project
            </button>
          </div>
        </header>

        <section className="shrink-0 bg-transparent px-4 py-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
            <StatItem
              label="Projects"
              value={totalProjects}
              icon={FolderKanban}
            />

            <StatItem
              label="Active"
              value={activeProjects}
              icon={BarChart3}
            />

            <StatItem
              label="Members"
              value={totalMembers}
              icon={Users}
            />
          </div>
        </section>

        <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-transparent">
          <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Project list
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Open a project, inspect its performance or manage its settings.
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">
                Total:
              </span>

              <span className="font-semibold text-slate-950">
                {totalProjects}
              </span>

              {projectsQuery.isFetching && (
                <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Refreshing...
                </span>
              )}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-4 [scrollbar-gutter:stable] sm:px-6 lg:px-8">
            {!projects.length && (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                <div>
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                    <FolderKanban
                      className="h-5 w-5"
                      strokeWidth={1.8}
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-900">
                    No projects found
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Create the first project for this class.
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
                    Create project
                  </button>
                </div>
              </div>
            )}

            {!!projects.length && (
              <div className="space-y-3">
                {projects.map(
                  (project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      classId={classId}
                      isBusy={isBusy}
                      isRenaming={
                        updateMutation.isPending &&
                        selectedProject?.id ===
                          project.id
                      }
                      isDeleting={
                        deleteMutation.isPending &&
                        selectedProject?.id ===
                          project.id
                      }
                      onRename={
                        handleOpenRename
                      }
                      onDelete={
                        handleOpenDelete
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <ProjectFormModal
        open={createOpen}
        mode="create"
        value={name}
        error={createError}
        isSaving={
          createMutation.isPending
        }
        onValueChange={(value) => {
          setName(value);
          setCreateError("");
        }}
        onClose={handleCloseCreate}
        onSubmit={handleCreate}
      />

      <ProjectFormModal
        open={renameOpen}
        mode="rename"
        value={renameValue}
        error={renameError}
        isSaving={
          updateMutation.isPending
        }
        onValueChange={(value) => {
          setRenameValue(value);
          setRenameError("");
        }}
        onClose={handleCloseRename}
        onSubmit={handleRename}
      />

      <DeleteProjectModal
        open={deleteOpen}
        project={selectedProject}
        error={deleteError}
        isDeleting={
          deleteMutation.isPending
        }
        onClose={handleCloseDelete}
        onConfirm={handleDelete}
      />
    </>
  );
}