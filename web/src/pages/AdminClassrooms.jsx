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
  const [form, setForm] = React.useState({ school_id: "", name: "" });

  const [addEmail, setAddEmail] = React.useState("");
  const [roomSearch, setRoomSearch] = React.useState("");

  const isBusy =
    createM.isPending || updateM.isPending || deleteM.isPending;

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

  const selectedLabel = sel ? `${sel.name} (${sel.school_name})` : "None";

  const onCreate = () => {
    if (!form.school_id || !form.name) return;
    createM.mutate(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ school_id: "", name: "" });
      },
    });
  };

  const onAddStudent = async () => {
    if (!sel?.id) return;
    const email = addEmail.trim().toLowerCase();
    if (!email) return;

    const st = studentsAll.find((s) => s.email.toLowerCase() === email);
    if (!st) {
      alert("Student not found in school list");
      return;
    }

    await addStudentToClassroomApi(sel.id, { student_id: st.id });
    await qc.invalidateQueries({ queryKey: ["classroom-students", sel.id] });
    setAddEmail("");
  };

  const onRemoveStudent = async (student_id) => {
    if (!sel?.id) return;
    await removeStudentFromClassroomApi(sel.id, { student_id });
    await qc.invalidateQueries({ queryKey: ["classroom-students", sel.id] });
  };

  return (
    <div className="space-y-6">
      {/* Sticky header + summary cards */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/80 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Classrooms</h1>
            <p className="text-sm text-muted-foreground">
              Create classrooms and manage student membership.
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add classroom
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create classroom</DialogTitle>
                <DialogDescription>
                  Select a school and provide a classroom name.
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
                    placeholder="e.g. 10A"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total classrooms
              </CardTitle>
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{rooms.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Selected classroom
              </CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="truncate text-sm text-muted-foreground">
                {selectedLabel}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Members (selected)
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {sel ? membersCount : "—"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Two-panel content */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: classrooms list */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="text-sm font-medium">Classroom list</div>
            <Badge variant="secondary">{filteredRooms.length} shown</Badge>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search classrooms..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setRoomSearch("")}
                disabled={!roomSearch}
              >
                Clear
              </Button>
            </div>
          </div>

          {roomsQ.isLoading && (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}
          {roomsQ.isError && (
            <div className="px-4 pb-4 text-sm text-destructive">Error</div>
          )}

          <div className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classroom</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!filteredRooms.length && !roomsQ.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No classrooms
                    </TableCell>
                  </TableRow>
                )}

                {filteredRooms.map((r) => {
                  const active = sel?.id === r.id;
                  return (
                    <TableRow
                      key={r.id}
                      className={active ? "bg-muted/60" : undefined}
                    >
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.school_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isBusy}>
                              Actions
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSel(r)}>
                              <DoorOpen className="mr-2 h-4 w-4" />
                              Open
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                const name = prompt("New name", r.name);
                                if (name != null && name.trim()) {
                                  updateM.mutate({ id: r.id, body: { name } });
                                }
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (!confirm(`Delete classroom "${r.name}"?`)) return;
                                deleteM.mutate(r.id, {
                                  onSuccess: () => {
                                    if (sel?.id === r.id) setSel(null);
                                  },
                                });
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Separator />
          <div className="px-4 py-3 text-xs text-muted-foreground">
            Select a classroom and open it to manage members.
          </div>
        </div>

        {/* Right: members */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="text-sm font-medium">Members</div>
            <Badge variant="secondary">
              {sel ? `${membersCount} members` : "No classroom selected"}
            </Badge>
          </div>

          {!sel && (
            <div className="p-6 text-sm text-muted-foreground">
              Select a classroom from the list to manage membership.
            </div>
          )}

          {sel && (
            <>
              <div className="p-4 space-y-3">
                <div className="text-sm">
                  <span className="font-medium">{sel.name}</span>{" "}
                  <span className="text-muted-foreground">· {sel.school_name}</span>
                </div>

                {studentsQ.isLoading && (
                  <div className="text-sm text-muted-foreground">
                    <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                    Loading…
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Add student by email</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="student@example.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onAddStudent();
                      }}
                    />
                    <Button
                      onClick={onAddStudent}
                      disabled={!addEmail.trim() || !sel?.id}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Note: this uses students from <code>adminOverview</code>.
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!members.length && !studentsQ.isLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          No members in this classroom
                        </TableCell>
                      </TableRow>
                    )}

                    {members.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.email}</div>
                          {u.name ? (
                            <div className="text-xs text-muted-foreground">
                              {u.name}
                            </div>
                          ) : null}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => onRemoveStudent(u.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />
              <div className="px-4 py-3 text-xs text-muted-foreground">
                Removing a student updates the member list for the selected classroom.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}