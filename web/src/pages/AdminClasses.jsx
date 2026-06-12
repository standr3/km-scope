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
import {
  Loader2,
  Plus,
  Trash2,
  GraduationCap,
  Clock,
  DoorOpen,
  MoreHorizontal,
  BookOpen,
  UserCheck,
  CalendarDays,
} from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    queryFn: () =>
      listPeriodsAdminApi({
        school_year_id: yearId || undefined,
      }),
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

  React.useEffect(() => {
    setF((s) => ({
      ...s,
      subject_id: "",
    }));
  }, [programId]);

  React.useEffect(() => {
    setF((s) => ({
      ...s,
      start_period_id: "",
      end_period_id: "",
    }));
  }, [yearId]);

  const isBusy = createM.isPending || deleteM.isPending;
  const canCreate = !!f.subject_id && !!f.teacher_id && !!f.name.trim();

  const resetCreate = () => {
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
  };

  const formatTime = (value) => {
    if (!value) return "-";

    const time = String(value);

    if (/^\d{2}:\d{2}/.test(time)) {
      return time.slice(0, 5);
    }

    return time;
  };

  const getPeriodLabel = (periodId) => {
    if (!periodId) return "-";

    const period = periods.find((p) => p.id === periodId);

    if (!period) return "Set";

    return `${formatTime(period.start_time)} - ${formatTime(period.end_time)}`;
  };

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
          resetCreate();
        },
      }
    );
  };

  const onDeleteClass = (classItem) => {
    if (!confirm(`Delete class "${classItem.name}"?`)) return;

    deleteM.mutate(classItem.id);
  };

  const getStableIndex = (value, max) => {
    const str = String(value || "");
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }

    return hash % max;
  };

  const classAccents = [
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

  if (
    ovQ.isLoading ||
    programsQ.isLoading ||
    classroomsQ.isLoading ||
    yearsQ.isLoading ||
    classesQ.isLoading
  ) {
    return (
      <div className="flex min-h-[220px] items-center rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading classes...
      </div>
    );
  }

  if (
    ovQ.isError ||
    programsQ.isError ||
    classroomsQ.isError ||
    yearsQ.isError ||
    classesQ.isError
  ) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Error loading classes.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden xl:h-[calc(100vh-16vh-3rem)] xl:overflow-hidden">
      {/* Page header */}
      <section className="grid overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-[280px] xl:grid-cols-9">
        <div className="border-b border-slate-200 bg-slate-50 p-5 xl:col-span-3 xl:border-b-0 xl:border-r">
          <p className="text-xl font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-2xl">
            Classes
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            {classes.length}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Total configured classes
          </p>
        </div>

        <div className="flex flex-col gap-5 p-5 xl:col-span-6 xl:justify-between">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">
                Create and manage classes
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Assign subjects to teachers and optionally connect classes to a
                classroom and scheduled periods.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[300px]">
              <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-sky-700">
                  Teachers
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {teachers.length}
                </p>
              </div>

              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-emerald-700">
                  Programs
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {programs.length}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
              {classes.length} total
            </Badge>

            <Dialog
              open={createOpen}
              onOpenChange={(open) => {
                setCreateOpen(open);

                if (!open) {
                  resetCreate();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c] sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Create class
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-hidden border-slate-200 p-0 shadow-lg sm:max-w-[760px]">
                <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <DialogTitle className="text-lg font-semibold text-slate-950">
                    Create class
                  </DialogTitle>

                  <DialogDescription className="text-sm text-slate-500">
                    Subject, teacher, and class name are required. Classroom and
                    periods are optional.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[calc(90vh-150px)] overflow-y-auto px-6 py-5">
                  <div className="grid gap-5">
                    <div className="rounded-md border border-slate-200 bg-white p-4">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Required setup
                      </p>

                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label className="text-sm text-slate-700">
                            Program
                          </Label>

                          <Select
                            value={programId || ALL}
                            onValueChange={(v) =>
                              setProgramId(v === ALL ? "" : v)
                            }
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value={ALL}>
                                Select program
                              </SelectItem>

                              {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-sm text-slate-700">
                            Subject
                          </Label>

                          <Select
                            value={f.subject_id || ALL}
                            onValueChange={(v) =>
                              setF((s) => ({
                                ...s,
                                subject_id: v === ALL ? "" : v,
                              }))
                            }
                            disabled={!programId || subjectsQ.isLoading}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue
                                placeholder={
                                  !programId
                                    ? "Select program first"
                                    : "Select subject"
                                }
                              />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value={ALL}>
                                Select subject
                              </SelectItem>

                              {subjects.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {subjectsQ.isLoading && (
                            <div className="text-xs text-slate-500">
                              <Loader2 className="mr-2 inline-block h-3 w-3 animate-spin" />
                              Loading subjects...
                            </div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-sm text-slate-700">
                            Teacher
                          </Label>

                          <Select
                            value={f.teacher_id || ALL}
                            onValueChange={(v) =>
                              setF((s) => ({
                                ...s,
                                teacher_id: v === ALL ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value={ALL}>
                                Select teacher
                              </SelectItem>

                              {teachers.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-sm text-slate-700">
                            Class name
                          </Label>

                          <Input
                            placeholder="e.g. Math 10A"
                            value={f.name}
                            onChange={(e) =>
                              setF((s) => ({
                                ...s,
                                name: e.target.value,
                              }))
                            }
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Optional scheduling
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label className="text-sm text-slate-700">
                            Classroom
                          </Label>

                          <Select
                            value={f.classroom_id || NONE}
                            onValueChange={(v) =>
                              setF((s) => ({
                                ...s,
                                classroom_id: v === NONE ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger className="h-10 bg-white">
                              <SelectValue placeholder="No classroom" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value={NONE}>
                                No classroom
                              </SelectItem>

                              {classrooms.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-sm text-slate-700">
                            Year for periods
                          </Label>

                          <Select
                            value={yearId || NONE}
                            onValueChange={(v) =>
                              setYearId(v === NONE ? "" : v)
                            }
                          >
                            <SelectTrigger className="h-10 bg-white">
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
                          <Label className="text-sm text-slate-700">
                            Start period
                          </Label>

                          <Select
                            value={f.start_period_id || NONE}
                            onValueChange={(v) =>
                              setF((s) => ({
                                ...s,
                                start_period_id: v === NONE ? "" : v,
                              }))
                            }
                            disabled={!yearId || periodsQ.isLoading}
                          >
                            <SelectTrigger className="h-10 bg-white">
                              <SelectValue
                                placeholder={
                                  !yearId
                                    ? "Select year first"
                                    : "Start period"
                                }
                              />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value={NONE}>
                                No start period
                              </SelectItem>

                              {periods.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {formatTime(p.start_time)} -{" "}
                                  {formatTime(p.end_time)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-sm text-slate-700">
                            End period
                          </Label>

                          <Select
                            value={f.end_period_id || NONE}
                            onValueChange={(v) =>
                              setF((s) => ({
                                ...s,
                                end_period_id: v === NONE ? "" : v,
                              }))
                            }
                            disabled={!yearId || periodsQ.isLoading}
                          >
                            <SelectTrigger className="h-10 bg-white">
                              <SelectValue
                                placeholder={
                                  !yearId ? "Select year first" : "End period"
                                }
                              />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value={NONE}>
                                No end period
                              </SelectItem>

                              {periods.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {formatTime(p.start_time)} -{" "}
                                  {formatTime(p.end_time)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {periodsQ.isLoading && (
                            <div className="text-xs text-slate-500">
                              <Loader2 className="mr-2 inline-block h-3 w-3 animate-spin" />
                              Loading periods...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
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
                    disabled={!canCreate || createM.isPending}
                    className="gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c]"
                  >
                    {createM.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create class
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Classes list */}
      <section className="flex min-h-[540px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-0 xl:flex-1">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">
              Classes list
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Review configured classes and remove entries that are no longer
              needed.
            </p>
          </div>

          <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
            {classes.length} total
          </Badge>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!classes.length && (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-900">
                No classes yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create a class by assigning a subject and a teacher.
              </p>
            </div>
          )}

          {!!classes.length && (
            <div className="space-y-2">
              {classes.map((c, index) => {
                const accent =
                  classAccents[
                    getStableIndex(c.id || c.name, classAccents.length)
                  ];

                return (
                  <article
                    key={c.id}
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
                              {c.name}
                            </h4>

                            <Badge className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 hover:bg-sky-50">
                              Class
                            </Badge>
                          </div>

                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                            <BookOpen className="h-3.5 w-3.5 shrink-0" />
                            {c.subject_name || "No subject"}
                            {c.program_name ? ` · ${c.program_name}` : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Teacher:{" "}
                            <span className="font-medium text-slate-700">
                              {c.teacher_email || "-"}
                            </span>
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Classroom:{" "}
                            <span className="font-medium text-slate-700">
                              {c.classroom_name || "-"}
                            </span>
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Periods:{" "}
                            <span className="font-medium text-slate-700">
                              {c.start_period_id ? "set" : "-"} /{" "}
                              {c.end_period_id ? "set" : "-"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end border-t px-4 py-3 md:col-span-2 md:border-t-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={isBusy}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteClass(c)}
                            disabled={deleteM.isPending}
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
    </div>
  );
}