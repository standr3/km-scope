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
  Filter,
} from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    placeholderData: (prev) => prev, // keep previous data
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

  const setParam = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v === "" || v == null) n.delete(k);
    else n.set(k, v);
    setSp(n, { replace: true });
  };

  const toggleSort = (key) => {
    const nextDir = sort === key ? (dir === "asc" ? "desc" : "asc") : "asc";
    setParam("sort", key);
    setParam("dir", nextDir);
  };

  const sortedHint = `Sorted by ${sort} ${dir.toUpperCase()}`;

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

  const subjects = subjectsQ.data || [];
  const isBusy = createM.isPending || updateM.isPending || deleteM.isPending;

  const totalSubjects = subjects.length;
  const requiredCount = subjects.filter((s) => s.is_required).length;

  const onCreate = () => {
    if (!form.program_id || !form.name) return;

    createM.mutate(
      {
        program_id: form.program_id,
        name: form.name,
        year: form.year ? Number(form.year) : undefined,
        weekly_hours: form.weekly_hours ? Number(form.weekly_hours) : undefined,
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
          weekly_hours: edit.weekly_hours ? Number(edit.weekly_hours) : undefined,
          weight: edit.weight ? Number(edit.weight) : undefined,
          is_required: edit.is_required,
        },
      },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const onClearFilters = () => {
    const n = new URLSearchParams(sp);
    n.delete("program");
    n.delete("required");
    setSp(n, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Sticky header + cards */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/80 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Subjects</h1>
            <p className="text-sm text-muted-foreground">
              Filter, sort, create and manage subjects.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {sortedHint}
            </Badge>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add subject
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add subject</DialogTitle>
                  <DialogDescription>
                    Program and name are required.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Program</Label>
                    <Select
                      value={form.program_id}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, program_id: v }))
                      }
                    >
                      <SelectTrigger>
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
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="e.g. Mathematics"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={form.year}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, year: e.target.value }))
                        }
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Weekly hours</Label>
                      <Input
                        type="number"
                        value={form.weekly_hours}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            weekly_hours: e.target.value,
                          }))
                        }
                        placeholder="e.g. 2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Weight</Label>
                      <Input
                        type="number"
                        value={form.weight}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, weight: e.target.value }))
                        }
                        placeholder="e.g. 1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={form.is_required}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, is_required: !!v }))
                      }
                      id="is_required_create"
                    />
                    <Label htmlFor="is_required_create">Required</Label>
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
                    disabled={!form.program_id || !form.name || createM.isPending}
                    className="gap-2"
                  >
                    {createM.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total subjects
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalSubjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Required
              </CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{requiredCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sort
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                <span className="capitalize">{sort}</span>{" "}
                <span className="text-muted-foreground">
                  ({dir.toUpperCase()})
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-medium">Filters</div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            disabled={!program && !required}
          >
            Clear
          </Button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Program</Label>
            <Select
              value={program || ALL}
              onValueChange={(v) => setParam("program", v === ALL ? "" : v)}
            >
              <SelectTrigger>
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
          </div>

          <div className="flex items-end">
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                checked={required}
                onCheckedChange={(v) =>
                  setParam("required", v ? "true" : "")
                }
                id="required_only"
              />
              <Label htmlFor="required_only">Required only</Label>
            </div>
          </div>

          <div className="flex items-end justify-start gap-2 sm:justify-end">
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
              Weekly hours
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
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-medium">Subjects list</div>
          <Badge variant="secondary">{sortedHint}</Badge>
        </div>

        {subjectsQ.isLoading && (
          <div className="p-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}
        {subjectsQ.isError && (
          <div className="p-4 text-sm text-destructive">Error</div>
        )}

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[90px]">Year</TableHead>
                <TableHead className="w-[140px]">Weekly hours</TableHead>
                <TableHead className="w-[110px]">Weight</TableHead>
                <TableHead className="w-[110px]">Required</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!subjects.length && !subjectsQ.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No subjects
                  </TableCell>
                </TableRow>
              )}

              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">
                    {s.program_name}
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.year ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.weekly_hours ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.weight ?? "-"}
                  </TableCell>
                  <TableCell>
                    {s.is_required ? (
                      <Badge>Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isBusy}>
                          Actions
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />
        <div className="px-4 py-3 text-xs text-muted-foreground">
          {sortedHint}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit subject</DialogTitle>
            <DialogDescription>Update subject fields.</DialogDescription>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={edit.year}
                  onChange={(e) =>
                    setEdit((x) => ({ ...x, year: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Weekly hours</Label>
                <Input
                  type="number"
                  value={edit.weekly_hours}
                  onChange={(e) =>
                    setEdit((x) => ({ ...x, weekly_hours: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Weight</Label>
                <Input
                  type="number"
                  value={edit.weight}
                  onChange={(e) =>
                    setEdit((x) => ({ ...x, weight: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={edit.is_required}
                onCheckedChange={(v) =>
                  setEdit((x) => ({ ...x, is_required: !!v }))
                }
                id="is_required_edit"
              />
              <Label htmlFor="is_required_edit">Required</Label>
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