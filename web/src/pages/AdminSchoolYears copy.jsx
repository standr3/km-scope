import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  listSchoolYearsAdminApi,
  createSchoolYearApi,
  updateSchoolYearApi,
  deleteSchoolYearApi,
} from "../api/admin";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  School,
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

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const toDateInputValue = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 10);
  };

  const resetCreate = () =>
    setF({
      school_id: "",
      name: "",
      start_date: "",
      end_date: "",
    });

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
      start_date: toDateInputValue(y.start_date),
      end_date: toDateInputValue(y.end_date),
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

  const yearAccents = [
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

  if (ovQ.isLoading || yearsQ.isLoading) {
    return (
      <div className="flex min-h-[220px] items-center rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading school years...
      </div>
    );
  }

  if (ovQ.isError || yearsQ.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Error loading school years.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden xl:h-[calc(100vh-16vh-3rem)] xl:overflow-hidden">
      {/* Page header */}
      <section className="grid overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-[280px] xl:grid-cols-9">
        <div className="border-b border-slate-200 bg-slate-50 p-5 xl:col-span-3 xl:border-b-0 xl:border-r">
          <p className="text-xl font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-2xl">
            School Years
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            {totalYears}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Total school year ranges
          </p>
        </div>

        <div className="flex flex-col gap-5 p-5 xl:col-span-6 xl:justify-between">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">
                Create and manage school years
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Define school year ranges used for programs, classes, and
                academic planning inside the school workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c] sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add school year
                </Button>
              </DialogTrigger>

              <DialogContent className="overflow-hidden border-slate-200 p-0 shadow-lg sm:max-w-[640px]">
                <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <DialogTitle className="text-lg font-semibold text-slate-950">
                    Create school year
                  </DialogTitle>

                  <DialogDescription className="text-sm text-slate-500">
                    Create a school year range and assign it to one of the
                    available schools.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 px-6 py-5">
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          School
                        </Label>

                        <Select
                          value={f.school_id}
                          onValueChange={(v) =>
                            setF((s) => ({ ...s, school_id: v }))
                          }
                        >
                          <SelectTrigger className="h-10">
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
                        <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Name
                        </Label>

                        <Input
                          placeholder="e.g. 2024-2025"
                          value={f.name}
                          onChange={(e) =>
                            setF((s) => ({ ...s, name: e.target.value }))
                          }
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Date range
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label className="text-sm text-slate-700">
                          Start date
                        </Label>

                        <Input
                          type="date"
                          value={f.start_date}
                          onChange={(e) =>
                            setF((s) => ({
                              ...s,
                              start_date: e.target.value,
                            }))
                          }
                          className="h-10 bg-white"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-sm text-slate-700">
                          End date
                        </Label>

                        <Input
                          type="date"
                          value={f.end_date}
                          onChange={(e) =>
                            setF((s) => ({
                              ...s,
                              end_date: e.target.value,
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
                      !f.school_id ||
                      !f.name ||
                      !f.start_date ||
                      !f.end_date ||
                      createM.isPending
                    }
                    className="gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c]"
                  >
                    {createM.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create school year
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* School years list area */}
      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-0 xl:flex-1">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">
              School years list
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Review, edit, or delete existing academic year ranges.
            </p>
          </div>

          <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
            {totalYears} total
          </Badge>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!years.length && (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-900">
                No school years yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add a school year to start organizing academic periods.
              </p>
            </div>
          )}

          {!!years.length && (
            <div className="space-y-2">
              {years.map((y, index) => {
                const accent =
                  yearAccents[
                    getStableIndex(y.id || y.name, yearAccents.length)
                  ];

                return (
                  <article
                    key={y.id}
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
                              {y.name}
                            </h4>

                            <Badge className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 hover:bg-sky-50">
                              School year
                            </Badge>
                          </div>

                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                            <School className="h-3.5 w-3.5 shrink-0" />
                            {y.school_name || "No school assigned."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Start:{" "}
                            <span className="font-medium text-slate-700">
                              {formatDate(y.start_date)}
                            </span>
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            End:{" "}
                            <span className="font-medium text-slate-700">
                              {formatDate(y.end_date)}
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
              Edit school year
            </DialogTitle>

            <DialogDescription className="text-sm text-slate-500">
              Update the school year name and date range.
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
                Date range
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-sm text-slate-700">
                    Start date
                  </Label>

                  <Input
                    type="date"
                    value={edit.start_date}
                    onChange={(e) =>
                      setEdit((x) => ({
                        ...x,
                        start_date: e.target.value,
                      }))
                    }
                    className="h-10 bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm text-slate-700">End date</Label>

                  <Input
                    type="date"
                    value={edit.end_date}
                    onChange={(e) =>
                      setEdit((x) => ({
                        ...x,
                        end_date: e.target.value,
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