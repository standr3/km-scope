import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  listSchoolYearsAdminApi,
  createSchoolYearApi,
  updateSchoolYearApi,
  deleteSchoolYearApi,
} from "../api/admin";
import { Loader2, Plus, Pencil, Trash2, CalendarDays } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminSchoolYears() {
  const qc = useQueryClient();

  const ovQ = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const yearsQ = useQuery({
    queryKey: ["schoolYears"],
    queryFn: listSchoolYearsAdminApi,
    retry: false,
  });

  const createM = useMutation({
    mutationFn: createSchoolYearApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schoolYears"] }),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }) => updateSchoolYearApi(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schoolYears"] }),
  });

  const deleteM = useMutation({
    mutationFn: deleteSchoolYearApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schoolYears"] }),
  });

  const schools = ovQ.data?.schools || [];
  const years = yearsQ.data || [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [f, setF] = React.useState({
    school_id: "",
    name: "",
    start_date: "",
    end_date: "",
  });

  const [editOpen, setEditOpen] = React.useState(false);
  const [edit, setEdit] = React.useState({
    id: "",
    name: "",
    start_date: "",
    end_date: "",
  });

  const totalYears = years.length;
  const isBusy = createM.isPending || updateM.isPending || deleteM.isPending;

  const resetCreate = () =>
    setF({ school_id: "", name: "", start_date: "", end_date: "" });

  const onCreate = () => {
    if (!f.school_id || !f.name || !f.start_date || !f.end_date) return;
    createM.mutate(f, {
      onSuccess: () => {
        setCreateOpen(false);
        resetCreate();
      },
    });
  };

  const onOpenEdit = (y) => {
    setEdit({
      id: y.id,
      name: y.name ?? "",
      start_date: y.start_date ?? "",
      end_date: y.end_date ?? "",
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
          start_date: edit.start_date,
          end_date: edit.end_date,
        },
      },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  return (
    <div className="space-y-6">
      {/* Sticky header + cards */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/80 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">School Years</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage school year ranges.
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add school year
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create school year</DialogTitle>
                <DialogDescription>
                  School, name, start date and end date are required.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label>School</Label>
                  <Select
                    value={f.school_id}
                    onValueChange={(v) => setF((s) => ({ ...s, school_id: v }))}
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
                    placeholder="e.g. 2024-2025"
                    value={f.name}
                    onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Start date</Label>
                    <Input
                      type="date"
                      value={f.start_date}
                      onChange={(e) =>
                        setF((s) => ({ ...s, start_date: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>End date</Label>
                    <Input
                      type="date"
                      value={f.end_date}
                      onChange={(e) =>
                        setF((s) => ({ ...s, end_date: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateOpen(false);
                    resetCreate();
                  }}
                  disabled={createM.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={onCreate}
                  disabled={!f.school_id || !f.name || !f.start_date || !f.end_date || createM.isPending}
                  className="gap-2"
                >
                  {createM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total school years
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalYears}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Schools available
              </CardTitle>
              <Badge variant="secondary">adminOverview</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{schools.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
              <Badge variant="secondary">Data</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {yearsQ.isLoading ? "Loading…" : yearsQ.isError ? "Error" : "Ready"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-medium">School years list</div>
          <Badge variant="secondary">{totalYears} total</Badge>
        </div>

        {yearsQ.isLoading && (
          <div className="p-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}
        {yearsQ.isError && <div className="p-4 text-sm text-destructive">Error</div>}

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[140px]">Start</TableHead>
                <TableHead className="w-[140px]">End</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!years.length && !yearsQ.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No school years
                  </TableCell>
                </TableRow>
              )}

              {years.map((y) => (
                <TableRow key={y.id}>
                  <TableCell className="text-muted-foreground">{y.school_name}</TableCell>
                  <TableCell className="font-medium">{y.name}</TableCell>
                  <TableCell className="text-muted-foreground">{y.start_date}</TableCell>
                  <TableCell className="text-muted-foreground">{y.end_date}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isBusy}>
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenEdit(y)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteM.mutate(y.id)}
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
          Tip: use the Actions menu to edit/delete.
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit school year</DialogTitle>
            <DialogDescription>Update name and dates.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={edit.name}
                onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={edit.start_date}
                  onChange={(e) => setEdit((x) => ({ ...x, start_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={edit.end_date}
                  onChange={(e) => setEdit((x) => ({ ...x, end_date: e.target.value }))}
                />
              </div>
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