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
  GraduationCap,
  Clock,
} from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export default function AdminPrograms() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const sort = sp.get("sort") || "created"; // created | name
  const dir = sp.get("dir") || "asc"; // asc | desc

  const ovQ = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const programsQ = useQuery({
    queryKey: ["programs", { sort, dir }],
    queryFn: () => listProgramsApi({ sort, dir }),
    placeholderData: (prev) => prev, // keep previous data
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

  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({ school_id: "", name: "", descr: "" });

  const [editOpen, setEditOpen] = React.useState(false);
  const [edit, setEdit] = React.useState({ id: "", name: "", descr: "" });

  const onSort = (key) => {
    const nextDir = sort === key ? (dir === "asc" ? "desc" : "asc") : "asc";
    const n = new URLSearchParams(sp);
    n.set("sort", key);
    n.set("dir", nextDir);
    setSp(n, { replace: true });
  };

  const sortedHint = `Sorted by ${sort} ${dir.toUpperCase()}`;

  const programs = programsQ.data || [];
  const isBusy = createM.isPending || updateM.isPending || deleteM.isPending;

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
    setEdit({ id: p.id, name: p.name ?? "", descr: p.descr ?? "" });
    setEditOpen(true);
  };

  const onSaveEdit = () => {
    if (!edit.id) return;
    updateM.mutate(
      { id: edit.id, body: { name: edit.name, descr: edit.descr } },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const viewSubjects = (programId) => {
    const url = new URL(location.origin + "/dashboard/admin/subjects");
    url.searchParams.set("program", programId);
    url.searchParams.set("sort", "name");
    url.searchParams.set("dir", "asc");
    nav(url.pathname + url.search);
  };

  // Counts (for cards)
  const totalPrograms = programs.length;

  return (
    <div className="space-y-6">
      {/* Sticky header + cards (same pattern as teachers/students) */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/80 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Programs</h1>
            <p className="text-sm text-muted-foreground">
              Create, edit, sort and manage programs.
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
                  Add program
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
                      onValueChange={(v) => setForm((f) => ({ ...f, school_id: v }))}
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
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Computer Science"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.descr}
                      onChange={(e) => setForm((f) => ({ ...f, descr: e.target.value }))}
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
                    {createM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create
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
                Total programs
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalPrograms}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sort key
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold capitalize">{sort}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Direction
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold uppercase">{dir}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* List table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-medium">Programs list</div>

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

        {programsQ.isLoading && (
          <div className="p-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}
        {programsQ.isError && (
          <div className="p-4 text-sm text-destructive">Error</div>
        )}

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!programs.length && !programsQ.isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No programs
                  </TableCell>
                </TableRow>
              )}

              {programs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.school_name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.descr || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isBusy}>
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenEdit(p)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => viewSubjects(p.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View subjects
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />
        <div className="px-4 py-3 text-xs text-muted-foreground">{sortedHint}</div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit program</DialogTitle>
            <DialogDescription>Update name and description.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={edit.name}
                onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={edit.descr}
                onChange={(e) => setEdit((x) => ({ ...x, descr: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={updateM.isPending}>
              Cancel
            </Button>
            <Button onClick={onSaveEdit} disabled={updateM.isPending} className="gap-2">
              {updateM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}