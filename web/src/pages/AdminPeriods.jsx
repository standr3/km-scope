import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSchoolYearsAdminApi,
  listPeriodsAdminApi,
  createPeriodApi,
  updatePeriodApi,
  deletePeriodApi,
} from "../api/admin";
import { useSearchParams } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2, Clock, Filter } from "lucide-react";

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

const ALL = "__all__";

export default function AdminPeriods() {
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const school_year_id = sp.get("school_year_id") || "";

  const yearsQ = useQuery({
    queryKey: ["schoolYears"],
    queryFn: listSchoolYearsAdminApi,
    retry: false,
  });

  const periodsQ = useQuery({
    queryKey: ["periods", { school_year_id }],
    queryFn: () =>
      listPeriodsAdminApi({ school_year_id: school_year_id || undefined }),
    placeholderData: (prev) => prev, // keep previous data
    retry: false,
  });

  const createM = useMutation({
    mutationFn: createPeriodApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["periods"] }),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }) => updatePeriodApi(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["periods"] }),
  });

  const deleteM = useMutation({
    mutationFn: deletePeriodApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["periods"] }),
  });

  const years = yearsQ.data || [];
  const periods = periodsQ.data || [];
  const isBusy = createM.isPending || updateM.isPending || deleteM.isPending;

  const [createOpen, setCreateOpen] = React.useState(false);
  const [f, setF] = React.useState({
    school_year_id: "",
    start_time: "12:00",
    end_time: "13:20",
  });

  const [editOpen, setEditOpen] = React.useState(false);
  const [edit, setEdit] = React.useState({
    id: "",
    start_time: "12:00",
    end_time: "13:20",
  });

  const setYearParam = (v) => {
    const n = new URLSearchParams(sp);
    if (!v) n.delete("school_year_id");
    else n.set("school_year_id", v);
    setSp(n, { replace: true });
  };

  const onCreate = () => {
    if (!f.school_year_id) return;
    createM.mutate(f, {
      onSuccess: () => {
        setCreateOpen(false);
        setF((s) => ({ ...s, school_year_id: "" }));
      },
    });
  };

  const onOpenEdit = (p) => {
    setEdit({
      id: p.id,
      start_time: p.start_time ?? "12:00",
      end_time: p.end_time ?? "13:20",
    });
    setEditOpen(true);
  };

  const onSaveEdit = () => {
    if (!edit.id) return;
    updateM.mutate(
      { id: edit.id, body: { start_time: edit.start_time, end_time: edit.end_time } },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const filteredCount = periods.length;

  return (
    <div className="space-y-6">
      {/* Sticky header + cards */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/80 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Periods</h1>
            <p className="text-sm text-muted-foreground">
              Filter, create and manage time periods per school year.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add period
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create period</DialogTitle>
                  <DialogDescription>
                    Select a year and define start/end time.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>School year</Label>
                    <Select
                      value={f.school_year_id}
                      onValueChange={(v) => setF((s) => ({ ...s, school_year_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Start time</Label>
                      <Input
                        type="time"
                        value={f.start_time}
                        onChange={(e) => setF((s) => ({ ...s, start_time: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End time</Label>
                      <Input
                        type="time"
                        value={f.end_time}
                        onChange={(e) => setF((s) => ({ ...s, end_time: e.target.value }))}
                      />
                    </div>
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
                    disabled={!f.school_year_id || createM.isPending}
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
                Periods shown
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{filteredCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Years available
              </CardTitle>
              <Badge variant="secondary">schoolYears</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{years.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active filter
              </CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {school_year_id ? "By school year" : "None"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-medium">Filter</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYearParam("")}
            disabled={!school_year_id}
          >
            Clear
          </Button>
        </div>

        <div className="p-4">
          <div className="grid gap-2 max-w-sm">
            <Label>School year</Label>
            <Select
              value={school_year_id || ALL}
              onValueChange={(v) => setYearParam(v === ALL ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-medium">Periods list</div>
          <Badge variant="secondary">{filteredCount} shown</Badge>
        </div>

        {periodsQ.isLoading && (
          <div className="p-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}
        {periodsQ.isError && <div className="p-4 text-sm text-destructive">Error</div>}

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School year</TableHead>
                <TableHead className="w-[140px]">Start</TableHead>
                <TableHead className="w-[140px]">End</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!periods.length && !periodsQ.isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No periods
                  </TableCell>
                </TableRow>
              )}

              {periods.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground">{p.year_name}</TableCell>
                  <TableCell className="font-medium">{p.start_time}</TableCell>
                  <TableCell className="text-muted-foreground">{p.end_time}</TableCell>

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
        <div className="px-4 py-3 text-xs text-muted-foreground">
          Tip: use the filter to view periods per year.
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit period</DialogTitle>
            <DialogDescription>Update start/end time.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={edit.start_time}
                  onChange={(e) => setEdit((x) => ({ ...x, start_time: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>End time</Label>
                <Input
                  type="time"
                  value={edit.end_time}
                  onChange={(e) => setEdit((x) => ({ ...x, end_time: e.target.value }))}
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