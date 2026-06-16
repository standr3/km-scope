import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  listProgramsApi,
  createProgramApi,
  updateProgramApi,
  deleteProgramApi,
} from "../api/admin";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  BookOpen,
  Network,
} from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminPrograms() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const sort = sp.get("sort") || "created";
  const dir = sp.get("dir") || "asc";

  const ovQ = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const programsQ = useQuery({
    queryKey: ["programs", { sort, dir }],
    queryFn: () => listProgramsApi({ sort, dir }),
    placeholderData: (prev) => prev,
  });

  const createM = useMutation({
    mutationFn: createProgramApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }) => updateProgramApi(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });

  const deleteM = useMutation({
    mutationFn: deleteProgramApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });

  const schools = ovQ.data?.schools || [];
  const programs = programsQ.data || [];
  const totalPrograms = programs.length;

  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    school_id: "",
    name: "",
    descr: "",
  });

  const [editOpen, setEditOpen] = React.useState(false);
  const [edit, setEdit] = React.useState({
    id: "",
    name: "",
    descr: "",
  });

  const isBusy = createM.isPending || updateM.isPending || deleteM.isPending;

  const onSort = (key) => {
    const nextDir = sort === key ? (dir === "asc" ? "desc" : "asc") : "asc";
    const n = new URLSearchParams(sp);
    n.set("sort", key);
    n.set("dir", nextDir);
    setSp(n, { replace: true });
  };

  const sortedHint =
    sort === "created"
      ? dir === "asc"
        ? "Created · Oldest first"
        : "Created · Newest first"
      : dir === "asc"
        ? "Name · A to Z"
        : "Name · Z to A";

  const onCreate = () => {
    if (!form.school_id || !form.name) return;

    createM.mutate(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ school_id: "", name: "", descr: "" });
      },
    });
  };

  const onOpenEdit = (p) => {
    setEdit({
      id: p.id,
      name: p.name ?? "",
      descr: p.descr ?? "",
    });
    setEditOpen(true);
  };

  const onSaveEdit = () => {
    if (!edit.id) return;

    updateM.mutate(
      {
        id: edit.id,
        body: {
          name: edit.name,
          descr: edit.descr,
        },
      },
      {
        onSuccess: () => setEditOpen(false),
      }
    );
  };

  const viewSubjects = (programId) => {
    const url = new URL(location.origin + "/dashboard/admin/subjects");
    url.searchParams.set("program", programId);
    url.searchParams.set("sort", "name");
    url.searchParams.set("dir", "asc");
    nav(url.pathname + url.search);
  };


  const getStableIndex = (value, max) => {
    const str = String(value || "");

    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }

    return hash % max;
  };

  const programAccents = [
    {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
    },
    {
      bg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-700",
    },
    {
      bg: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-700",
    },
    {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
    },
    {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-16vh-3rem)]  gap-4 overflow-hidden">
      {/* Page header / worksheet header */}
      <section className="h-1/3 col-span-9 grid grid-cols-9   overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="col-span-3 border-r border-slate-200 bg-slate-50 p-5">
          <p className="text-2xl font-semibold uppercase tracking-[0.16em] text-slate-500">
            Programs
          </p>

          <h1 className="mt-3 text-6xl font-semibold tracking-tight text-slate-950">
            {totalPrograms}
          </h1>


        </div>

        <div className="col-span-6 flex flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Create and modify teaching programs
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-500">
                These programs define the subjects available for teaching and learning in related classes.
              </p>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-[#3e4c59] hover:bg-[#616e7c] text-white">
                  <Plus className="h-4 w-4" />
                  Create program
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create program</DialogTitle>
                  <DialogDescription>
                    Programs belong to a school. Name is required.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>School</Label>
                    <Select
                      value={form.school_id}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, school_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>

                      <SelectContent>
                        {schools.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="e.g. Computer Science"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.descr}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, descr: e.target.value }))
                      }
                      placeholder="Optional"
                      rows={4}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    disabled={createM.isPending}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={onCreate}
                    disabled={!form.school_id || !form.name || createM.isPending}
                    className="gap-2"
                  >
                    {createM.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Badge className="rounded-full px-3 py-1 bg-[#e4e7eb] text-[#323f4b]">
              {sortedHint}
            </Badge>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSort("name")}
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Name
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onSort("created")}
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Created
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Scrollable cards area */}
      <section className="col-span-9 min-h-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Programs list
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Select a program to manage its subjects and learning structure.
            </p>
          </div>
        </div>

        <div className="max-h-[calc(100vh-16vh-17rem)] overflow-y-auto p-4 pb-18">
          {programsQ.isLoading && (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading programs…
            </div>
          )}

          {programsQ.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
              Error loading programs.
            </div>
          )}

          {!programs.length && !programsQ.isLoading && (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-900">
                No programs yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first learning program to start organizing subjects.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {programs.map((p, index) => {
              const accent = programAccents[
                getStableIndex(p.id || p.name, programAccents.length)
              ];

              return (
                <article
                  key={p.id}
                  className="grid grid-cols-9 overflow-hidden rounded-md border border-slate-200 
                    bg-white transition hover:border-slate-300 hover:bg-slate-50/60"
                >
                  <div
                    className={[
                      "col-span-1 flex items-start justify-center border-r px-3 py-5",
                      accent.bg,
                      accent.border,
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "text-sm font-semibold",
                        accent.text,
                      ].join(" ")}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="col-span-7 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-base font-semibold text-slate-950">
                          {p.name}
                        </h4>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {p.descr || "No description provided."}
                        </p>
                      </div>
                    </div>

                    {/* <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        Subjects
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Network className="h-3.5 w-3.5" />
                        Knowledge graphs
                      </span>

                      <span>{sortedHint}</span>
                    </div> */}
                  </div>

                  <div className="col-span-1 flex items-start justify-end px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" disabled={isBusy}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewSubjects(p.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View subjects
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => onOpenEdit(p)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteM.mutate(p.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit program</DialogTitle>
            <DialogDescription>
              Update name and description.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={edit.name}
                onChange={(e) =>
                  setEdit((x) => ({ ...x, name: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={edit.descr}
                onChange={(e) =>
                  setEdit((x) => ({ ...x, descr: e.target.value }))
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateM.isPending}
            >
              Cancel
            </Button>

            <Button
              onClick={onSaveEdit}
              disabled={updateM.isPending}
              className="gap-2"
            >
              {updateM.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}