import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  listProgramsApi,
  listSubjectsAdminApi,
  createSubjectApi,
  updateSubjectApi,
  deleteSubjectApi,
} from "../api/admin";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sortKeys = ["program", "name", "weekly_hours", "weight"];
const ALL = "__all__";

export default function AdminSubjects() {
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();

  const program = sp.get("program") || "";
  const sort = sortKeys.includes(sp.get("sort")) ? sp.get("sort") : "name";
  const dir = sp.get("dir") === "desc" ? "desc" : "asc";
  const required = sp.get("required") === "true";

  const ovQ = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const programsQ = useQuery({
    queryKey: ["programs", { sort: "name", dir: "asc" }],
    queryFn: () => listProgramsApi({ sort: "name", dir: "asc" }),
  });

  const subjectsQ = useQuery({
    queryKey: ["subjects", { program, required, sort, dir }],
    queryFn: () =>
      listSubjectsAdminApi({
        program: program || undefined,
        required,
        sort,
        dir,
      }),
    placeholderData: (prev) => prev,
  });

  const createM = useMutation({
    mutationFn: createSubjectApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }) => updateSubjectApi(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const deleteM = useMutation({
    mutationFn: deleteSubjectApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const programs = programsQ.data || [];
  const subjects = subjectsQ.data || [];

  const setParam = (k, v) => {
    const n = new URLSearchParams(sp);

    if (v === "" || v == null) {
      n.delete(k);
    } else {
      n.set(k, v);
    }

    setSp(n, { replace: true });
  };

  const toggleSort = (key) => {
    const nextDir = sort === key ? (dir === "asc" ? "desc" : "asc") : "asc";

    const n = new URLSearchParams(sp);
    n.set("sort", key);
    n.set("dir", nextDir);
    setSp(n, { replace: true });
  };

  const sortLabel =
    sort === "weekly_hours"
      ? "Weekly hours"
      : sort.charAt(0).toUpperCase() + sort.slice(1);

  const sortedHint = `${sortLabel} · ${dir === "asc" ? "Ascending" : "Descending"}`;

  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    program_id: "",
    name: "",
    year: "",
    weekly_hours: "",
    weight: "",
    is_required: true,
  });

  const [editOpen, setEditOpen] = React.useState(false);
  const [edit, setEdit] = React.useState({
    id: "",
    name: "",
    year: "",
    weekly_hours: "",
    weight: "",
    is_required: true,
  });

  const isBusy = createM.isPending || updateM.isPending || deleteM.isPending;
  const totalSubjects = subjects.length;
  const requiredCount = subjects.filter((s) => s.is_required).length;
  const optionalCount = totalSubjects - requiredCount;
  const hasActiveFilters = !!program || required;

  const onCreate = () => {
    if (!form.program_id || !form.name) return;

    createM.mutate(
      {
        program_id: form.program_id,
        name: form.name,
        year: form.year ? Number(form.year) : undefined,
        weekly_hours: form.weekly_hours
          ? Number(form.weekly_hours)
          : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        is_required: form.is_required,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setForm({
            program_id: "",
            name: "",
            year: "",
            weekly_hours: "",
            weight: "",
            is_required: true,
          });
        },
      }
    );
  };

  const onOpenEdit = (s) => {
    setEdit({
      id: s.id,
      name: s.name ?? "",
      year: s.year != null ? String(s.year) : "",
      weekly_hours: s.weekly_hours != null ? String(s.weekly_hours) : "",
      weight: s.weight != null ? String(s.weight) : "",
      is_required: !!s.is_required,
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
          year: edit.year ? Number(edit.year) : undefined,
          weekly_hours: edit.weekly_hours
            ? Number(edit.weekly_hours)
            : undefined,
          weight: edit.weight ? Number(edit.weight) : undefined,
          is_required: edit.is_required,
        },
      },
      {
        onSuccess: () => setEditOpen(false),
      }
    );
  };

  const onClearFilters = () => {
    const n = new URLSearchParams(sp);
    n.delete("program");
    n.delete("required");
    setSp(n, { replace: true });
  };

  const getStableIndex = (value, max) => {
    const str = String(value || "");
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }

    return hash % max;
  };

  const subjectAccents = [
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

  if (ovQ.isLoading) {
    return (
      <div className="flex min-h-[220px] items-center rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading subjects...
      </div>
    );
  }

  if (ovQ.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Error loading subjects.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden xl:h-[calc(100vh-16vh-3rem)] xl:overflow-hidden">
      {/* Page header */}
      <section className="grid overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-[280px] xl:grid-cols-9">
        <div className="border-b border-slate-200 bg-slate-50 p-5 xl:col-span-3 xl:border-b-0 xl:border-r">
          <p className="text-xl font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-2xl">
            Subjects
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            {totalSubjects}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Total subjects in current view
          </p>
        </div>

        <div className="flex flex-col gap-5 p-5 xl:col-span-6 xl:justify-between">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">
                Create and manage subjects
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Filter subjects by program, manage required status, and update
                workload metadata such as year, weekly hours, and weight.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[300px]">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-emerald-700">
                  Required
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {requiredCount}
                </p>
              </div>

              <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-sky-700">
                  Optional
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {optionalCount}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
              {sortedHint}
            </Badge>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c] sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add subject
                </Button>
              </DialogTrigger>

              <DialogContent className="overflow-hidden border-slate-200 p-0 shadow-lg sm:max-w-[640px]">
                <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <DialogTitle className="text-lg font-semibold text-slate-950">
                    Add subject
                  </DialogTitle>

                  <DialogDescription className="text-sm text-slate-500">
                    Create a subject and assign it to one of the available teaching
                    programs.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 px-6 py-5">
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Program
                        </Label>

                        <Select
                          value={form.program_id}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, program_id: v }))
                          }
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>

                          <SelectContent>
                            {programs.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Name
                        </Label>

                        <Input
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                          }
                          placeholder="e.g. Mathematics"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Workload metadata
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <Label className="text-sm text-slate-700">Year</Label>

                        <Input
                          type="number"
                          value={form.year}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, year: e.target.value }))
                          }
                          placeholder="1"
                          className="h-10 bg-white"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-sm text-slate-700">Weekly hours</Label>

                        <Input
                          type="number"
                          value={form.weekly_hours}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              weekly_hours: e.target.value,
                            }))
                          }
                          placeholder="2"
                          className="h-10 bg-white"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-sm text-slate-700">Weight</Label>

                        <Input
                          type="number"
                          value={form.weight}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, weight: e.target.value }))
                          }
                          placeholder="1"
                          className="h-10 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <label
                    htmlFor="is_required_create"
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-950">
                        Required subject
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Mark this subject as mandatory in the selected program.
                      </p>
                    </div>

                    <Checkbox
                      checked={form.is_required}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, is_required: !!v }))
                      }
                      id="is_required_create"
                    />
                  </label>
                </div>

                <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    disabled={createM.isPending}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={onCreate}
                    disabled={!form.program_id || !form.name || createM.isPending}
                    className="gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c]"
                  >
                    {createM.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Add subject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Subjects list area */}
      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-0 xl:flex-1">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">
              Subjects list
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Use filters to narrow the list. Use sort actions to reorder subjects.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_160px_120px] 2xl:w-auto">
            <Select
              value={program || ALL}
              onValueChange={(v) => setParam("program", v === ALL ? "" : v)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All programs" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={ALL}>All programs</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={required ? "default" : "outline"}
              size="sm"
              onClick={() => setParam("required", required ? "" : "true")}
              className={[
                "h-9 justify-start gap-2",
                required ? "bg-[#3e4c59] text-white hover:bg-[#616e7c]" : "",
              ].join(" ")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Required only
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="h-9 gap-2"
            >
              <XCircle className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <Badge className="rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
            {sortedHint}
          </Badge>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSort("program")}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Program
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSort("name")}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Name
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSort("weekly_hours")}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Hours
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSort("weight")}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Weight
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {subjectsQ.isLoading && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading subjects...
            </div>
          )}

          {subjectsQ.isError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
              Error loading subjects.
            </div>
          )}

          {!subjects.length && !subjectsQ.isLoading && (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-900">
                No subjects found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add a subject or adjust the active filters.
              </p>
            </div>
          )}

          {!!subjects.length && (
            <div className="space-y-2">
              {subjects.map((s, index) => {
                const accent =
                  subjectAccents[
                  getStableIndex(s.id || s.name, subjectAccents.length)
                  ];

                return (
                  <article
                    key={s.id}
                    className="grid overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-slate-300 hover:bg-slate-50/60 md:grid-cols-12"
                  >
                    <div
                      className={[
                        "flex items-center justify-center border-b px-3 py-3 md:col-span-1 md:border-b-0 md:border-r",
                        accent.bg,
                        accent.border,
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-xs font-semibold",
                          accent.text,
                        ].join(" ")}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="min-w-0 px-4 py-3 md:col-span-9">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-sm font-semibold text-slate-950">
                              {s.name}
                            </h4>

                            {s.is_required ? (
                              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-50">
                                Required
                              </Badge>
                            ) : (
                              <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50">
                                Optional
                              </Badge>
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {s.program_name || "No program assigned."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Year:{" "}
                            <span className="font-medium text-slate-700">
                              {s.year ?? "-"}
                            </span>
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Hours:{" "}
                            <span className="font-medium text-slate-700">
                              {s.weekly_hours ?? "-"}
                            </span>
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Weight:{" "}
                            <span className="font-medium text-slate-700">
                              {s.weight ?? "-"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end border-t px-4 py-3 md:col-span-2 md:border-t-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" disabled={isBusy}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onOpenEdit(s)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteM.mutate(s.id)}
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
          )}
        </div>
      </section>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="overflow-hidden border-slate-200 p-0 shadow-lg sm:max-w-[640px]">
          <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <DialogTitle className="text-lg font-semibold text-slate-950">
              Edit subject
            </DialogTitle>

            <DialogDescription className="text-sm text-slate-500">
              Update the subject name, workload metadata, and required status.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 px-6 py-5">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Name
                </Label>

                <Input
                  value={edit.name}
                  onChange={(e) =>
                    setEdit((x) => ({ ...x, name: e.target.value }))
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Workload metadata
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label className="text-sm text-slate-700">Year</Label>

                  <Input
                    type="number"
                    value={edit.year}
                    onChange={(e) =>
                      setEdit((x) => ({ ...x, year: e.target.value }))
                    }
                    className="h-10 bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm text-slate-700">
                    Weekly hours
                  </Label>

                  <Input
                    type="number"
                    value={edit.weekly_hours}
                    onChange={(e) =>
                      setEdit((x) => ({
                        ...x,
                        weekly_hours: e.target.value,
                      }))
                    }
                    className="h-10 bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm text-slate-700">Weight</Label>

                  <Input
                    type="number"
                    value={edit.weight}
                    onChange={(e) =>
                      setEdit((x) => ({ ...x, weight: e.target.value }))
                    }
                    className="h-10 bg-white"
                  />
                </div>
              </div>
            </div>

            <label
              htmlFor="is_required_edit"
              className={[
                "flex cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-3",
                edit.is_required
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50",
              ].join(" ")}
            >
              <div>
                <p className="text-sm font-medium text-slate-950">
                  Required subject
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Control whether this subject is mandatory.
                </p>
              </div>

              <Checkbox
                checked={edit.is_required}
                onCheckedChange={(v) =>
                  setEdit((x) => ({ ...x, is_required: !!v }))
                }
                id="is_required_edit"
              />
            </label>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
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
              className="gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c]"
            >
              {updateM.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}