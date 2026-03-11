import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  listProgramsApi,
  listSubjectsAdminApi,
  listClassroomsAdminApi,
  listPeriodsAdminApi,
  listClassesAdminApi,
  createClassAdminApi,
  deleteClassAdminApi,
  listSchoolYearsAdminApi,
} from "../api/admin";
import { Loader2, Plus, Trash2, GraduationCap, Clock, DoorOpen } from "lucide-react";

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

const ALL = "__all__";
const NONE = "__none__";

export default function AdminClasses() {
  const qc = useQueryClient();

  const ovQ = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const programsQ = useQuery({
    queryKey: ["programs", { sort: "name", dir: "asc" }],
    queryFn: () => listProgramsApi({ sort: "name", dir: "asc" }),
    retry: false,
  });

  const classroomsQ = useQuery({
    queryKey: ["classrooms"],
    queryFn: listClassroomsAdminApi,
    retry: false,
  });

  const yearsQ = useQuery({
    queryKey: ["schoolYears"],
    queryFn: listSchoolYearsAdminApi,
    retry: false,
  });

  const classesQ = useQuery({
    queryKey: ["classes-admin"],
    queryFn: listClassesAdminApi,
    retry: false,
  });

  const createM = useMutation({
    mutationFn: createClassAdminApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes-admin"] }),
  });

  const deleteM = useMutation({
    mutationFn: deleteClassAdminApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes-admin"] }),
  });

  const teachers = React.useMemo(
    () =>
      (ovQ.data?.teachers || []).map((t) => ({
        id: t.user_id,
        email: t.email,
        school_id: t.school_id,
      })),
    [ovQ.data]
  );

  const programs = programsQ.data || [];
  const classrooms = classroomsQ.data || [];
  const years = yearsQ.data || [];
  const classes = classesQ.data || [];

  const [createOpen, setCreateOpen] = React.useState(false);

  const [programId, setProgramId] = React.useState("");
  const [yearId, setYearId] = React.useState("");

  const subjectsQ = useQuery({
    queryKey: ["subjects-admin", { program: programId }],
    queryFn: () =>
      listSubjectsAdminApi({
        program: programId || undefined,
        sort: "name",
        dir: "asc",
      }),
    enabled: !!programId,
    retry: false,
  });

  const periodsQ = useQuery({
    queryKey: ["periods", { school_year_id: yearId }],
    queryFn: () => listPeriodsAdminApi({ school_year_id: yearId || undefined }),
    enabled: !!yearId,
    retry: false,
  });

  const subjects = subjectsQ.data || [];
  const periods = periodsQ.data || [];

  const [f, setF] = React.useState({
    subject_id: "",
    teacher_id: "",
    name: "",
    classroom_id: "",
    start_period_id: "",
    end_period_id: "",
  });

  // reset subject if program changes
  React.useEffect(() => {
    setF((s) => ({ ...s, subject_id: "" }));
  }, [programId]);

  const isBusy = createM.isPending || deleteM.isPending;

  const canCreate = !!f.subject_id && !!f.teacher_id && !!f.name.trim();

  const onCreate = () => {
    if (!canCreate) return;
    createM.mutate(
      {
        subject_id: f.subject_id,
        teacher_id: f.teacher_id,
        name: f.name.trim(),
        classroom_id: f.classroom_id || undefined,
        start_period_id: f.start_period_id || undefined,
        end_period_id: f.end_period_id || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setF({
            subject_id: "",
            teacher_id: "",
            name: "",
            classroom_id: "",
            start_period_id: "",
            end_period_id: "",
          });
          setProgramId("");
          setYearId("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Sticky header + cards */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/80 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Classes</h1>
            <p className="text-sm text-muted-foreground">
              Create classes by assigning subject + teacher and optionally classroom/periods.
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create class
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create class</DialogTitle>
                <DialogDescription>
                  Subject, teacher and name are required.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-2">
                <div className="grid gap-2">
                  <Label>Program</Label>
                  <Select
                    value={programId || ALL}
                    onValueChange={(v) => setProgramId(v === ALL ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Select program</SelectItem>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Select
                    value={f.subject_id || ALL}
                    onValueChange={(v) => setF((s) => ({ ...s, subject_id: v === ALL ? "" : v }))}
                    disabled={!programId || subjectsQ.isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={!programId ? "Select program first" : "Select subject"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Select subject</SelectItem>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subjectsQ.isLoading ? (
                    <div className="text-xs text-muted-foreground">
                      <Loader2 className="mr-2 inline-block h-3 w-3 animate-spin" />
                      Loading subjects…
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label>Teacher</Label>
                  <Select
                    value={f.teacher_id || ALL}
                    onValueChange={(v) => setF((s) => ({ ...s, teacher_id: v === ALL ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Select teacher</SelectItem>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Class name</Label>
                  <Input
                    placeholder="e.g. Math 10A"
                    value={f.name}
                    onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Classroom (optional)</Label>
                    <Select
                      value={f.classroom_id || NONE}
                      onValueChange={(v) =>
                        setF((s) => ({ ...s, classroom_id: v === NONE ? "" : v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No classroom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No classroom</SelectItem>
                        {classrooms.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Year for periods (optional)</Label>
                    <Select
                      value={yearId || NONE}
                      onValueChange={(v) => setYearId(v === NONE ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick year to enable periods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No periods</SelectItem>
                        {years.map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Start period (optional)</Label>
                    <Select
                      value={f.start_period_id || NONE}
                      onValueChange={(v) =>
                        setF((s) => ({ ...s, start_period_id: v === NONE ? "" : v }))
                      }
                      disabled={!yearId || periodsQ.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!yearId ? "Select year first" : "Start period"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No start period</SelectItem>
                        {periods.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.start_time}-{p.end_time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>End period (optional)</Label>
                    <Select
                      value={f.end_period_id || NONE}
                      onValueChange={(v) =>
                        setF((s) => ({ ...s, end_period_id: v === NONE ? "" : v }))
                      }
                      disabled={!yearId || periodsQ.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!yearId ? "Select year first" : "End period"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No end period</SelectItem>
                        {periods.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.start_time}-{p.end_time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {periodsQ.isLoading ? (
                      <div className="text-xs text-muted-foreground">
                        <Loader2 className="mr-2 inline-block h-3 w-3 animate-spin" />
                        Loading periods…
                      </div>
                    ) : null}
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
                <Button onClick={onCreate} disabled={!canCreate || createM.isPending} className="gap-2">
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
                Total classes
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{classes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Teachers available
              </CardTitle>
              <Badge variant="secondary">adminOverview</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{teachers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Periods setup
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {yearId ? "Year selected" : "No year selected"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All classes table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-medium">All classes</div>
          <Badge variant="secondary">{classes.length} total</Badge>
        </div>

        {classesQ.isLoading && (
          <div className="p-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}
        {classesQ.isError && <div className="p-4 text-sm text-destructive">Error</div>}

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Classroom</TableHead>
                <TableHead>Periods</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!classes.length && !classesQ.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No classes
                  </TableCell>
                </TableRow>
              )}

              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>

                  <TableCell>
                    <div className="font-medium">{c.subject_name}</div>
                    <div className="text-xs text-muted-foreground">{c.program_name}</div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">{c.teacher_email}</TableCell>

                  <TableCell>
                    {c.classroom_name ? (
                      <div className="inline-flex items-center gap-2 text-sm">
                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{c.classroom_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <span className={c.start_period_id ? "text-foreground" : "text-muted-foreground"}>
                        {c.start_period_id ? "set" : "—"}
                      </span>
                      <span className="text-muted-foreground"> / </span>
                      <span className={c.end_period_id ? "text-foreground" : "text-muted-foreground"}>
                        {c.end_period_id ? "set" : "—"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={deleteM.isPending}
                      onClick={() => {
                        if (!confirm(`Delete class "${c.name}"?`)) return;
                        deleteM.mutate(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />
        <div className="px-4 py-3 text-xs text-muted-foreground">
          Create uses programs → subjects, plus optional classroom and periods.
        </div>
      </div>
    </div>
  );
}