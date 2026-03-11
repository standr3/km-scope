import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  listTeacherProjectsApi,
  createTeacherProjectApi,
  updateTeacherProjectApi,
  deleteTeacherProjectApi,
} from "../api/teacher";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  ArrowLeft,
  FolderKanban,
  Pencil,
  Trash2,
  Plus,
  Users,
} from "lucide-react";

const DUMMY_PROJECTS = [
  // {
  //   id: "demo-1",
  //   name: "Argument Mapping Basics",
  //   status: "active",
  //   members_count: 4,
  //   updated_at: "2026-03-09",
  // },
  // {
  //   id: "demo-2",
  //   name: "Ethics Review Project",
  //   status: "review",
  //   members_count: 3,
  //   updated_at: "2026-03-08",
  // },
  // {
  //   id: "demo-3",
  //   name: "Climate Debate Graph",
  //   status: "draft",
  //   members_count: 5,
  //   updated_at: "2026-03-06",
  // },
  // {
  //   id: "demo-4",
  //   name: "Research Notes Cluster",
  //   status: "active",
  //   members_count: 2,
  //   updated_at: "2026-03-05",
  // },
  // {
  //   id: "demo-5",
  //   name: "Logic Trees Workshop",
  //   status: "active",
  //   members_count: 6,
  //   updated_at: "2026-03-04",
  // },
  // {
  //   id: "demo-6",
  //   name: "Peer Review Sandbox",
  //   status: "review",
  //   members_count: 7,
  //   updated_at: "2026-03-03",
  // },
  // {
  //   id: "demo-7",
  //   name: "Critical Thinking Lab",
  //   status: "draft",
  //   members_count: 4,
  //   updated_at: "2026-03-02",
  // },
  // {
  //   id: "demo-8",
  //   name: "Debate Graph Sprint",
  //   status: "active",
  //   members_count: 5,
  //   updated_at: "2026-03-01",
  // },
  // {
  //   id: "demo-9",
  //   name: "Knowledge Map Studio",
  //   status: "archived",
  //   members_count: 3,
  //   updated_at: "2026-02-28",
  // },
  // {
  //   id: "demo-10",
  //   name: "Review Queue Practice",
  //   status: "active",
  //   members_count: 8,
  //   updated_at: "2026-02-27",
  // },
  // {
  //   id: "demo-11",
  //   name: "Argument Analysis Workshop",
  //   status: "review",
  //   members_count: 4,
  //   updated_at: "2026-02-26",

  // }
  // ,
  // {
  //   id: "demo-12",
  //   name: "Logic Puzzle Challenge",
  //   status: "draft",
  //   members_count: 6,
  //   updated_at: "2026-02-25",
  // },
];

function normalizeProjects(data) {
  if (!Array.isArray(data)) return [];

  return data.map((p, index) => ({
    id: p.id ?? `project-${index}`,
    name: p.name ?? "Untitled project",
    status: p.status ?? "active",
    members_count: p.members_count ?? p.members?.length ?? 0,
    updated_at: p.updated_at ?? null,
    raw: p,
    isDummy: false,
  }));
}

function normalizeDummyProjects(data) {
  return data.map((p) => ({
    ...p,
    isDummy: true,
  }));
}

function statusLabel(status) {
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

function statusClassName(status) {
  switch (status) {
    case "draft":
      return "border-neutral-300 text-neutral-700";
    case "review":
      return "border-amber-400 text-amber-700";
    case "archived":
      return "border-neutral-400 text-neutral-500";
    case "active":
    default:
      return "border-green-600/30 text-green-700";
  }
}

function StatCard({ label, value }) {
  return (
    <Card className="w-[124px] rounded-none">
      <CardContent className="px-2.5 py-1.5">
        <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-base font-semibold leading-none">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProjectRow({
  project,
  classId,
  index,
  onRename,
  onDelete,
  renameBusy,
  deleteBusy,
}) {
  return (
    <div
      className="animate-in fade-in slide-in-from-top-2 px-3 py-1.5 duration-300"
      style={{
        animationDelay: `${index * 30}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="truncate text-[13px] font-medium leading-tight">
              {project.name}
            </p>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <Badge
              variant="outline"
              className={`h-4 rounded-none px-1.5 text-[9px] ${statusClassName(project.status)}`}
            >
              {statusLabel(project.status)}
            </Badge>

            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.members_count}
            </span>

            {project.updated_at ? <span>{project.updated_at}</span> : null}

            {project.isDummy ? (
              <Badge
                variant="outline"
                className="h-4 rounded-none px-1.5 text-[9px]"
              >
                demo
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button asChild size="sm" className="h-6 rounded-none px-2 text-[10px]">
            <Link to={`/dashboard/teacher/classes/${classId}/projects/${project.id}`}>
              Open
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-6 rounded-none px-2 text-[10px]"
            disabled={renameBusy || project.isDummy}
            onClick={() => onRename(project)}
          >
            <Pencil className="mr-1 h-3 w-3" />
            Rename
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-6 rounded-none px-2 text-[10px]"
            disabled={deleteBusy || project.isDummy}
            onClick={() => onDelete(project)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherProjects() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const q = useQuery({
    queryKey: ["teacher-projects", classId],
    queryFn: () => listTeacherProjectsApi(classId),
    retry: 0,
  });

  const createM = useMutation({
    mutationFn: (body) => createTeacherProjectApi(classId, body),
    onSuccess: () => {
      setName("");
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["teacher-projects", classId] });
    },
  });

  const updateM = useMutation({
    mutationFn: ({ pid, body }) => updateTeacherProjectApi(pid, body),
    onSuccess: () => {
      setRenameOpen(false);
      setSelectedProject(null);
      setRenameValue("");
      qc.invalidateQueries({ queryKey: ["teacher-projects", classId] });
    },
  });

  const deleteM = useMutation({
    mutationFn: deleteTeacherProjectApi,
    onSuccess: () => {
      setDeleteOpen(false);
      setSelectedProject(null);
      qc.invalidateQueries({ queryKey: ["teacher-projects", classId] });
    },
  });

  const apiProjects = useMemo(() => normalizeProjects(q.data), [q.data]);

  const projects = useMemo(() => {
    const dummy = normalizeDummyProjects(DUMMY_PROJECTS);
    return [...apiProjects, ...dummy];
  }, [apiProjects]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createM.mutate({ name: trimmed });
  };

  const openRenameDialog = (project) => {
    if (project.isDummy) return;
    setSelectedProject(project);
    setRenameValue(project.name);
    setRenameOpen(true);
  };

  const handleRename = () => {
    if (!selectedProject) return;

    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === selectedProject.name) {
      setRenameOpen(false);
      return;
    }

    updateM.mutate({
      pid: selectedProject.id,
      body: { name: trimmed },
    });
  };

  const openDeleteDialog = (project) => {
    if (project.isDummy) return;
    setSelectedProject(project);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!selectedProject) return;
    deleteM.mutate(selectedProject.id);
  };

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalMembers = projects.reduce(
    (acc, p) => acc + (p.members_count || 0),
    0
  );

  return (
    <>
      <div className="flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-7 rounded-none px-2.5 text-[11px]"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back
          </Button>

          <div>
            <h1 className="text-lg font-semibold leading-none">Projects</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Manage projects for class {classId}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          <StatCard label="Projects" value={totalProjects} />
          <StatCard label="Active" value={activeProjects} />
          <StatCard label="Members" value={totalMembers} />
        </div>

        <Card className="flex flex-col overflow-hidden rounded-none">
          <CardHeader className="border-b px-3 py-1">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-[12px] leading-none">
                Project list
              </CardTitle>

              <Button
                className="h-6 rounded-none px-2 text-[10px]"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Create
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {q.isLoading ? (
              <div className="p-3 text-sm text-muted-foreground">
                Loading projects...
              </div>
            ) : !projects.length ? (
              <div className="p-3 text-sm text-muted-foreground">
                No projects found.
              </div>
            ) : (
              <ScrollArea className="max-h-[calc(100vh-260px)]">
                <div>
                  {projects.map((project, index) => (
                    <React.Fragment key={project.id}>
                      <ProjectRow
                        project={project}
                        classId={classId}
                        index={index}
                        onRename={openRenameDialog}
                        onDelete={openDeleteDialog}
                        renameBusy={updateM.isPending}
                        deleteBusy={deleteM.isPending}
                      />
                      {index < projects.length - 1 ? <Separator /> : null}
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader className="gap-1">
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Add a new project for this class.
            </DialogDescription>
          </DialogHeader>

          <div className="py-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="rounded-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-none"
              onClick={handleCreate}
              disabled={createM.isPending}
            >
              {createM.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) {
            setSelectedProject(null);
            setRenameValue("");
          }
        }}
      >
        <DialogContent className="rounded-none">
          <DialogHeader className="gap-1">
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>
              Update the project name.
            </DialogDescription>
          </DialogHeader>

          <div className="py-1">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Project name"
              className="rounded-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-none"
              onClick={handleRename}
              disabled={updateM.isPending}
            >
              {updateM.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader className="gap-1">
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProject
                ? `This will permanently delete "${selectedProject.name}".`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none"
              onClick={handleDelete}
              disabled={deleteM.isPending}
            >
              {deleteM.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}