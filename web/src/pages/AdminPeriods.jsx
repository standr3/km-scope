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
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Clock,
  MoreHorizontal,
  CalendarDays,
  XCircle,
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
      listPeriodsAdminApi({
        school_year_id: school_year_id || undefined,
      }),
    placeholderData: (prev) => prev,
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
  const filteredCount = periods.length;
  const hasActiveFilter = !!school_year_id;

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

    if (!v) {
      n.delete("school_year_id");
    } else {
      n.set("school_year_id", v);
    }

    setSp(n, { replace: true });
  };

  const resetCreate = () => {
    setF({
      school_year_id: "",
      start_time: "12:00",
      end_time: "13:20",
    });
  };

  const formatTime = (value) => {
    if (!value) return "-";

    const time = String(value);

    if (/^\d{2}:\d{2}/.test(time)) {
      return time.slice(0, 5);
    }

    return time;
  };

  const getPeriodDuration = (start, end) => {
    if (!start || !end) return "-";

    const [startHour, startMinute] = String(start).split(":").map(Number);
    const [endHour, endMinute] = String(end).split(":").map(Number);

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return "-";
    }

    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    const diff = endTotal - startTotal;

    if (diff <= 0) return "-";

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    if (!hours) return `${minutes} min`;
    if (!minutes) return `${hours}h`;

    return `${hours}h ${minutes}min`;
  };

  const onCreate = () => {
    if (!f.school_year_id || !f.start_time || !f.end_time) return;

    createM.mutate(f, {
      onSuccess: () => {
        setCreateOpen(false);
        resetCreate();
      },
    });
  };

  const onOpenEdit = (p) => {
    setEdit({
      id: p.id,
      start_time: formatTime(p.start_time) || "12:00",
      end_time: formatTime(p.end_time) || "13:20",
    });

    setEditOpen(true);
  };

  const onSaveEdit = () => {
    if (!edit.id) return;

    updateM.mutate(
      {
        id: edit.id,
        body: {
          start_time: edit.start_time,
          end_time: edit.end_time,
        },
      },
      {
        onSuccess: () => setEditOpen(false),
      }
    );
  };

  const getStableIndex = (value, max) => {
    const str = String(value || "");
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }

    return hash % max;
  };

  const periodAccents = [
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

  if (yearsQ.isLoading) {
    return (
      <div className="flex min-h-[220px] items-center rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading periods...
      </div>
    );
  }

  if (yearsQ.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Error loading periods.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden xl:h-[calc(100vh-16vh-3rem)] xl:overflow-hidden">
      {/* Page header */}
      <section className="grid overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-[280px] xl:grid-cols-9">
        <div className="border-b border-slate-200 bg-slate-50 p-5 xl:col-span-3 xl:border-b-0 xl:border-r">
          <p className="text-xl font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-2xl">
            Periods
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            {filteredCount}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Periods in current view
          </p>
        </div>

        <div className="flex flex-col gap-5 p-5 xl:col-span-6 xl:justify-between">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">
                Create and manage periods
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Define the time intervals used by schedules and classes. Filter
                periods by school year to manage them in context.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[300px]">
              <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-sky-700">
                  Years
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {years.length}
                </p>
              </div>

              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-emerald-700">
                  Filter
                </p>

                <p className="mt-3 text-sm font-semibold leading-none text-slate-950">
                  {hasActiveFilter ? "Active" : "None"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
              {filteredCount} shown
            </Badge>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c] sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add period
                </Button>
              </DialogTrigger>

              <DialogContent className="overflow-hidden border-slate-200 p-0 shadow-lg sm:max-w-[640px]">
                <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <DialogTitle className="text-lg font-semibold text-slate-950">
                    Create period
                  </DialogTitle>

                  <DialogDescription className="text-sm text-slate-500">
                    Select a school year and define the start and end time for
                    this period.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 px-6 py-5">
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        School year
                      </Label>

                      <Select
                        value={f.school_year_id}
                        onValueChange={(v) =>
                          setF((s) => ({ ...s, school_year_id: v }))
                        }
                      >
                        <SelectTrigger className="h-10">
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
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Time range
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label className="text-sm text-slate-700">
                          Start time
                        </Label>

                        <Input
                          type="time"
                          value={f.start_time}
                          onChange={(e) =>
                            setF((s) => ({
                              ...s,
                              start_time: e.target.value,
                            }))
                          }
                          className="h-10 bg-white"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-sm text-slate-700">
                          End time
                        </Label>

                        <Input
                          type="time"
                          value={f.end_time}
                          onChange={(e) =>
                            setF((s) => ({
                              ...s,
                              end_time: e.target.value,
                            }))
                          }
                          className="h-10 bg-white"
                        />
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
                    disabled={
                      !f.school_year_id ||
                      !f.start_time ||
                      !f.end_time ||
                      createM.isPending
                    }
                    className="gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c]"
                  >
                    {createM.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create period
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Periods list area */}
      <section className="flex min-h-[540px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-0 xl:flex-1">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">
              Periods list
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Review, filter, edit, or delete existing time periods.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_120px] 2xl:w-auto">
            <Select
              value={school_year_id || ALL}
              onValueChange={(v) => setYearParam(v === ALL ? "" : v)}
            >
              <SelectTrigger className="h-9 w-full">
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setYearParam("")}
              disabled={!school_year_id}
              className="h-9 gap-2"
            >
              <XCircle className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
            {filteredCount} shown
          </Badge>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {periodsQ.isLoading && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading periods...
            </div>
          )}

          {periodsQ.isError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
              Error loading periods.
            </div>
          )}

          {!periods.length && !periodsQ.isLoading && (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-900">
                No periods found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add a period or adjust the active filter.
              </p>
            </div>
          )}

          {!!periods.length && (
            <div className="space-y-2">
              {periods.map((p, index) => {
                const accent =
                  periodAccents[
                    getStableIndex(p.id || p.year_name, periodAccents.length)
                  ];

                return (
                  <article
                    key={p.id}
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
                              {formatTime(p.start_time)} -{" "}
                              {formatTime(p.end_time)}
                            </h4>

                            <Badge className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 hover:bg-sky-50">
                              Period
                            </Badge>
                          </div>

                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            {p.year_name || "No school year assigned."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Start:{" "}
                            <span className="font-medium text-slate-700">
                              {formatTime(p.start_time)}
                            </span>
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            End:{" "}
                            <span className="font-medium text-slate-700">
                              {formatTime(p.end_time)}
                            </span>
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Duration:{" "}
                            <span className="font-medium text-slate-700">
                              {getPeriodDuration(p.start_time, p.end_time)}
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
          )}
        </div>
      </section>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="overflow-hidden border-slate-200 p-0 shadow-lg sm:max-w-[640px]">
          <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <DialogTitle className="text-lg font-semibold text-slate-950">
              Edit period
            </DialogTitle>

            <DialogDescription className="text-sm text-slate-500">
              Update the start and end time for this period.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 px-6 py-5">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Time range
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-sm text-slate-700">
                    Start time
                  </Label>

                  <Input
                    type="time"
                    value={edit.start_time}
                    onChange={(e) =>
                      setEdit((x) => ({
                        ...x,
                        start_time: e.target.value,
                      }))
                    }
                    className="h-10 bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm text-slate-700">End time</Label>

                  <Input
                    type="time"
                    value={edit.end_time}
                    onChange={(e) =>
                      setEdit((x) => ({
                        ...x,
                        end_time: e.target.value,
                      }))
                    }
                    className="h-10 bg-white"
                  />
                </div>
              </div>
            </div>
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