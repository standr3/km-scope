import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  listClassroomsAdminApi,
  createClassroomApi,
  updateClassroomApi,
  deleteClassroomApi,
  listClassroomStudentsApi,
  addStudentToClassroomApi,
  removeStudentFromClassroomApi,
} from "../api/admin";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Users,
  School,
  DoorOpen,
  UserPlus,
  UserMinus,
  Search,
  MoreHorizontal,
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

export default function AdminClassrooms() {
  const qc = useQueryClient();

  const ovQ = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const roomsQ = useQuery({
    queryKey: ["classrooms"],
    queryFn: listClassroomsAdminApi,
    retry: false,
  });

  const createM = useMutation({
    mutationFn: createClassroomApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classrooms"] }),
  });

  const updateM = useMutation({
    mutationFn: ({ id, body }) => updateClassroomApi(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classrooms"] }),
  });

  const deleteM = useMutation({
    mutationFn: deleteClassroomApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classrooms"] }),
  });

  const schools = ovQ.data?.schools || [];
  const studentsAll = (ovQ.data?.students || []).map((m) => ({
    id: m.user_id,
    email: m.email,
    name: m.name,
  }));

  const rooms = roomsQ.data || [];

  const [sel, setSel] = React.useState(null);

  const studentsQ = useQuery({
    queryKey: ["classroom-students", sel?.id],
    queryFn: () => listClassroomStudentsApi(sel.id),
    enabled: !!sel?.id,
    retry: false,
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    school_id: "",
    name: "",
  });

  const [editOpen, setEditOpen] = React.useState(false);
  const [edit, setEdit] = React.useState({
    id: "",
    name: "",
  });

  const [addEmail, setAddEmail] = React.useState("");
  const [roomSearch, setRoomSearch] = React.useState("");

  const isBusy = createM.isPending || updateM.isPending || deleteM.isPending;

  const filteredRooms = React.useMemo(() => {
    const q = roomSearch.trim().toLowerCase();

    if (!q) return rooms;

    return rooms.filter((r) => {
      const n = (r.name || "").toLowerCase();
      const s = (r.school_name || "").toLowerCase();

      return n.includes(q) || s.includes(q);
    });
  }, [rooms, roomSearch]);

  const members = studentsQ.data || [];
  const membersCount = members.length;
  const selectedLabel = sel ? `${sel.name} · ${sel.school_name}` : "None";

  const resetCreate = () => {
    setForm({
      school_id: "",
      name: "",
    });
  };

  const onCreate = () => {
    if (!form.school_id || !form.name) return;

    createM.mutate(form, {
      onSuccess: () => {
        setCreateOpen(false);
        resetCreate();
      },
    });
  };

  const onOpenEdit = (room) => {
    setEdit({
      id: room.id,
      name: room.name ?? "",
    });

    setEditOpen(true);
  };

  const onSaveEdit = () => {
    if (!edit.id || !edit.name.trim()) return;

    updateM.mutate(
      {
        id: edit.id,
        body: {
          name: edit.name.trim(),
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false);

          if (sel?.id === edit.id) {
            setSel((current) =>
              current
                ? {
                    ...current,
                    name: edit.name.trim(),
                  }
                : current
            );
          }
        },
      }
    );
  };

  const onDeleteRoom = (room) => {
    if (!confirm(`Delete classroom "${room.name}"?`)) return;

    deleteM.mutate(room.id, {
      onSuccess: () => {
        if (sel?.id === room.id) {
          setSel(null);
        }
      },
    });
  };

  const onAddStudent = async () => {
    if (!sel?.id) return;

    const email = addEmail.trim().toLowerCase();

    if (!email) return;

    const st = studentsAll.find((s) => s.email?.toLowerCase() === email);

    if (!st) {
      alert("Student not found in school list");
      return;
    }

    await addStudentToClassroomApi(sel.id, {
      student_id: st.id,
    });

    await qc.invalidateQueries({
      queryKey: ["classroom-students", sel.id],
    });

    setAddEmail("");
  };

  const onRemoveStudent = async (student_id) => {
    if (!sel?.id) return;

    await removeStudentFromClassroomApi(sel.id, {
      student_id,
    });

    await qc.invalidateQueries({
      queryKey: ["classroom-students", sel.id],
    });
  };

  const getStableIndex = (value, max) => {
    const str = String(value || "");
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }

    return hash % max;
  };

  const classroomAccents = [
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

  if (ovQ.isLoading || roomsQ.isLoading) {
    return (
      <div className="flex min-h-[220px] items-center rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading classrooms...
      </div>
    );
  }

  if (ovQ.isError || roomsQ.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Error loading classrooms.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden xl:h-[calc(100vh-16vh-3rem)] xl:overflow-hidden">
      {/* Page header */}
      <section className="grid overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-[280px] xl:grid-cols-9">
        <div className="border-b border-slate-200 bg-slate-50 p-5 xl:col-span-3 xl:border-b-0 xl:border-r">
          <p className="text-xl font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-2xl">
            Classrooms
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            {rooms.length}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Total classrooms
          </p>
        </div>

        <div className="flex flex-col gap-5 p-5 xl:col-span-6 xl:justify-between">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">
                Create and manage classrooms
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Organize students into classrooms, review membership, and add or
                remove students from the selected classroom.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[300px]">
              <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-sky-700">
                  Students
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {studentsAll.length}
                </p>
              </div>

              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-emerald-700">
                  Members
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {sel ? membersCount : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
              Selected: {selectedLabel}
            </Badge>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c] sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add classroom
                </Button>
              </DialogTrigger>

              <DialogContent className="overflow-hidden border-slate-200 p-0 shadow-lg sm:max-w-[640px]">
                <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <DialogTitle className="text-lg font-semibold text-slate-950">
                    Create classroom
                  </DialogTitle>

                  <DialogDescription className="text-sm text-slate-500">
                    Select a school and provide a classroom name.
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
                          value={form.school_id}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, school_id: v }))
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
                          placeholder="e.g. 10A"
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              name: e.target.value,
                            }))
                          }
                          className="h-10"
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
                    disabled={!form.school_id || !form.name || createM.isPending}
                    className="gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c]"
                  >
                    {createM.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create classroom
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="grid min-h-[620px] gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-2 xl:overflow-hidden">
        {/* Classrooms list */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-0">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950">
                Classroom list
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Select a classroom to manage its student membership.
              </p>
            </div>

            <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
              {filteredRooms.length} shown
            </Badge>
          </div>

          <div className="border-b border-slate-200 px-5 py-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  className="h-9 pl-9"
                  placeholder="Search classrooms..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoomSearch("")}
                disabled={!roomSearch}
                className="h-9 gap-2"
              >
                <XCircle className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!filteredRooms.length && (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No classrooms found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add a classroom or adjust the search query.
                </p>
              </div>
            )}

            {!!filteredRooms.length && (
              <div className="space-y-2">
                {filteredRooms.map((r, index) => {
                  const active = sel?.id === r.id;
                  const accent =
                    classroomAccents[
                      getStableIndex(r.id || r.name, classroomAccents.length)
                    ];

                  return (
                    <article
                      key={r.id}
                      className={[
                        "grid overflow-hidden rounded-md border bg-white transition md:grid-cols-12",
                        active
                          ? "border-slate-400 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60",
                      ].join(" ")}
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

                      <button
                        type="button"
                        onClick={() => setSel(r)}
                        className="min-w-0 px-4 py-3 text-left md:col-span-9"
                      >
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-sm font-semibold text-slate-950">
                                {r.name}
                              </h4>

                              {active && (
                                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-50">
                                  Selected
                                </Badge>
                              )}
                            </div>

                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                              <School className="h-3.5 w-3.5 shrink-0" />
                              {r.school_name || "No school assigned."}
                            </p>
                          </div>
                        </div>
                      </button>

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
                            <DropdownMenuItem onClick={() => setSel(r)}>
                              <DoorOpen className="mr-2 h-4 w-4" />
                              Open
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => onOpenEdit(r)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDeleteRoom(r)}
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
        </div>

        {/* Members */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-0">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-950">
                Members
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Add or remove students from the selected classroom.
              </p>
            </div>

            <Badge className="w-fit rounded-full bg-[#e4e7eb] px-3 py-1 text-[#323f4b] hover:bg-[#e4e7eb]">
              {sel ? `${membersCount} members` : "No classroom selected"}
            </Badge>
          </div>

          {!sel && (
            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No classroom selected
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Select a classroom from the list to manage its student
                  membership.
                </p>
              </div>
            </div>
          )}

          {sel && (
            <>
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {sel.name}
                    </p>

                    <Badge className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 hover:bg-sky-50">
                      Classroom
                    </Badge>
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <School className="h-3.5 w-3.5 shrink-0" />
                    {sel.school_name}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Add student by email
                  </Label>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="student@example.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onAddStudent();
                        }
                      }}
                      className="h-9"
                    />

                    <Button
                      onClick={onAddStudent}
                      disabled={!addEmail.trim() || !sel?.id}
                      className="h-9 gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c]"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  <p className="text-xs text-slate-500">
                    This searches students from the admin overview list.
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {studentsQ.isLoading && (
                  <div className="mb-4 flex items-center gap-2 rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading members...
                  </div>
                )}

                {!members.length && !studentsQ.isLoading && (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      No members in this classroom
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Add students by email to populate this classroom.
                    </p>
                  </div>
                )}

                {!!members.length && (
                  <div className="space-y-2">
                    {members.map((u, index) => {
                      const accent =
                        classroomAccents[
                          getStableIndex(u.id || u.email, classroomAccents.length)
                        ];

                      return (
                        <article
                          key={u.id}
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
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-semibold text-slate-950">
                                {u.name || "Unnamed student"}
                              </h4>

                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {u.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end border-t px-4 py-3 md:col-span-2 md:border-t-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => onRemoveStudent(u.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Rename dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="overflow-hidden border-slate-200 p-0 shadow-lg sm:max-w-[560px]">
          <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <DialogTitle className="text-lg font-semibold text-slate-950">
              Rename classroom
            </DialogTitle>

            <DialogDescription className="text-sm text-slate-500">
              Update the classroom name. The school assignment stays unchanged.
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
                    setEdit((x) => ({
                      ...x,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. 10A"
                  className="h-10"
                />
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
              disabled={!edit.name.trim() || updateM.isPending}
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