import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

function PlusIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m4 20 4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20ZM13.5 6.5l3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserPlusIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserMinusIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 11h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getClassroomId(classroom) {
  return String(classroom.id);
}

function getClassroomName(classroom) {
  return classroom.name ?? "Untitled classroom";
}

function getClassroomSchoolName(classroom) {
  return classroom.school_name ?? classroom.schoolName ?? "No school assigned.";
}

function getStudentId(student) {
  return student.id ?? student.user_id ?? student.student_id;
}

function getStudentName(student) {
  return student.name ?? student.email ?? "Unnamed student";
}

function getStudentEmail(student) {
  return student.email ?? "";
}

function normalizeOverviewStudents(students) {
  return students.map((student) => ({
    id: student.user_id ?? student.id,
    email: student.email,
    name: student.name,
  }));
}

function ClassroomModal({
  isOpen,
  mode,
  classroom,
  isSaving = false,
  canCreate = true,
  onClose,
  onSave,
}) {
  const [formValue, setFormValue] = useState({
    name: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (classroom) {
      setFormValue({
        name: getClassroomName(classroom),
      });
    } else {
      setFormValue({
        name: "",
      });
    }

    setError("");
  }, [isOpen, classroom]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSaving) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (value) => {
    setFormValue({
      name: value,
    });

    setError("");
  };

  const handleSave = async () => {
    const nextClassroom = {
      id: classroom?.id ?? null,
      name: formValue.name.trim(),
    };

    if (!nextClassroom.name) {
      setError("Add a classroom name.");
      return;
    }

    if (mode === "create" && !canCreate) {
      setError("This classroom cannot be created right now.");
      return;
    }

    try {
      await onSave?.(nextClassroom);
      onClose?.();
    } catch {
      setError("Could not save this classroom.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Classroom form"
      onMouseDown={() => {
        if (!isSaving) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Rename classroom" : "Create classroom"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {mode === "edit"
                ? "Update the classroom name."
                : "Add a classroom name for the current school."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Name
            </label>

            <input
              value={formValue.name}
              disabled={isSaving}
              onChange={(event) => handleChange(event.target.value)}
              placeholder="e.g. 10A"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (mode === "create" && !canCreate)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassroomCard({
  classroom,
  isSelected,
  isBusy,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <article
      className={[
        "rounded-2xl border bg-white p-3 shadow-sm transition",
        isSelected
          ? "border-slate-400 bg-slate-50"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full min-w-0 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-slate-900">
            {getClassroomName(classroom)}
          </h2>

          {isSelected && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Selected
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-xs text-slate-500">
          {getClassroomSchoolName(classroom)}
        </p>
      </button>

      <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <EditIcon className="h-4 w-4" />
          Rename
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}

function MemberCard({ student, isBusy, onRemove }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50/70">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900">
            {getStudentName(student)}
          </h2>

          <p className="mt-1 truncate text-xs text-slate-500">
            {getStudentEmail(student)}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserMinusIcon className="h-4 w-4" />
          Remove
        </button>
      </div>
    </article>
  );
}

export default function AdminClassrooms() {
  const queryClient = useQueryClient();

  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    classroom: null,
  });

  const overviewQuery = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const classroomsQuery = useQuery({
    queryKey: ["classrooms"],
    queryFn: listClassroomsAdminApi,
    retry: false,
  });

  const studentsQuery = useQuery({
    queryKey: ["classroom-students", selectedClassroom?.id],
    queryFn: () => listClassroomStudentsApi(selectedClassroom.id),
    enabled: Boolean(selectedClassroom?.id),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createClassroomApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateClassroomApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassroomApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: ({ classroomId, studentId }) =>
      addStudentToClassroomApi(classroomId, {
        student_id: studentId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classroom-students", variables.classroomId],
      });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: ({ classroomId, studentId }) =>
      removeStudentFromClassroomApi(classroomId, {
        student_id: studentId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classroom-students", variables.classroomId],
      });
    },
  });

  const schools = overviewQuery.data?.schools ?? [];
  const defaultSchoolId = schools[0]?.id ?? "";
  const allStudents = normalizeOverviewStudents(overviewQuery.data?.students ?? []);
  const classrooms = classroomsQuery.data ?? [];
  const members = studentsQuery.data ?? [];

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isMembershipBusy =
    addStudentMutation.isPending || removeStudentMutation.isPending;
  const isBusy = isSaving || isDeleting || isMembershipBusy;

  const filteredClassrooms = useMemo(() => {
    const query = roomSearch.trim().toLowerCase();

    if (!query) return classrooms;

    return classrooms.filter((classroom) => {
      const name = getClassroomName(classroom).toLowerCase();
      const schoolName = getClassroomSchoolName(classroom).toLowerCase();

      return name.includes(query) || schoolName.includes(query);
    });
  }, [classrooms, roomSearch]);

  const membersCount = members.length;
  const selectedLabel = selectedClassroom
    ? `${getClassroomName(selectedClassroom)} · ${getClassroomSchoolName(
        selectedClassroom
      )}`
    : "No classroom selected";

  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      mode: "create",
      classroom: null,
    });
  };

  const handleOpenEdit = (classroom) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      classroom,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: "create",
      classroom: null,
    });
  };

  const handleSaveClassroom = async (nextClassroom) => {
    if (nextClassroom.id) {
      await updateMutation.mutateAsync({
        id: nextClassroom.id,
        body: {
          name: nextClassroom.name,
        },
      });

      setSelectedClassroom((currentClassroom) =>
        currentClassroom?.id === nextClassroom.id
          ? {
              ...currentClassroom,
              name: nextClassroom.name,
            }
          : currentClassroom
      );

      return;
    }

    await createMutation.mutateAsync({
      school_id: defaultSchoolId,
      name: nextClassroom.name,
    });
  };

  const handleDeleteClassroom = async (classroom) => {
    if (!window.confirm(`Delete classroom "${getClassroomName(classroom)}"?`)) {
      return;
    }

    await deleteMutation.mutateAsync(classroom.id);

    setSelectedClassroom((currentClassroom) =>
      currentClassroom?.id === classroom.id ? null : currentClassroom
    );
  };

  const handleAddStudent = async () => {
    if (!selectedClassroom?.id) return;

    const normalizedEmail = studentEmail.trim().toLowerCase();

    if (!normalizedEmail) return;

    const student = allStudents.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail
    );

    if (!student) {
      window.alert("Student not found in school list.");
      return;
    }

    await addStudentMutation.mutateAsync({
      classroomId: selectedClassroom.id,
      studentId: student.id,
    });

    setStudentEmail("");
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedClassroom?.id || !studentId) return;

    await removeStudentMutation.mutateAsync({
      classroomId: selectedClassroom.id,
      studentId,
    });
  };

  if (overviewQuery.isLoading || classroomsQuery.isLoading) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <p className="text-sm text-slate-500">Loading classrooms...</p>
        </section>
      </main>
    );
  }

  if (overviewQuery.isError || classroomsQuery.isError) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm sm:p-4">
          <p className="text-sm text-red-600">Error loading classrooms.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-slate-50">
      <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        <header className="min-h-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <h1 className="truncate text-base font-semibold text-slate-900">
                  Classrooms
                </h1>

                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {classrooms.length} configured
                </span>
              </div>

              <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">
                {selectedLabel}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_auto]">
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                <div className="text-[11px] font-semibold text-sky-700">
                  Students
                </div>

                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {allStudents.length}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-[11px] font-semibold text-emerald-700">
                  Members
                </div>

                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {selectedClassroom ? membersCount : "—"}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                disabled={!defaultSchoolId || isBusy}
                className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add classroom
              </button>
            </div>
          </div>
        </header>

        <section className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    Classroom list
                  </h2>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    Select a classroom to manage students.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {filteredClassrooms.length} shown
                </span>
              </div>
            </div>

            <div className="border-b border-slate-100 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={roomSearch}
                    onChange={(event) => setRoomSearch(event.target.value)}
                    placeholder="Search classrooms..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setRoomSearch("")}
                  disabled={!roomSearch}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <XIcon className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto p-3 [scrollbar-gutter:stable]">
              {!filteredClassrooms.length && (
                <div className="grid h-full min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      No classrooms found
                    </p>

                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                      Add a classroom or adjust the search query.
                    </p>
                  </div>
                </div>
              )}

              {!!filteredClassrooms.length && (
                <div className="space-y-2">
                  {filteredClassrooms.map((classroom) => {
                    const classroomId = getClassroomId(classroom);

                    return (
                      <ClassroomCard
                        key={classroomId}
                        classroom={classroom}
                        isSelected={selectedClassroom?.id === classroom.id}
                        isBusy={isBusy}
                        onSelect={() => setSelectedClassroom(classroom)}
                        onEdit={() => handleOpenEdit(classroom)}
                        onDelete={() => handleDeleteClassroom(classroom)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    Members
                  </h2>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    Add or remove students from the selected classroom.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {selectedClassroom ? `${membersCount} members` : "None"}
                </span>
              </div>
            </div>

            {!selectedClassroom && (
              <div className="grid min-h-0 place-items-center p-3">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-900">
                    No classroom selected
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Select a classroom from the list to manage its membership.
                  </p>
                </div>
              </div>
            )}

            {selectedClassroom && (
              <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">
                <div className="border-b border-slate-100 p-3">
                  <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {getClassroomName(selectedClassroom)}
                      </p>

                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                        Classroom
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {getClassroomSchoolName(selectedClassroom)}
                    </p>
                  </div>

                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Add student by email
                  </label>

                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      value={studentEmail}
                      onChange={(event) => setStudentEmail(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleAddStudent();
                        }
                      }}
                      placeholder="student@example.com"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                    />

                    <button
                      type="button"
                      onClick={handleAddStudent}
                      disabled={!studentEmail.trim() || isMembershipBusy}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    This searches students from the admin overview list.
                  </p>
                </div>

                <div className="min-h-0 overflow-y-auto p-3 [scrollbar-gutter:stable]">
                  {studentsQuery.isLoading && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      Loading members...
                    </div>
                  )}

                  {!members.length && !studentsQuery.isLoading && (
                    <div className="grid h-full min-h-[220px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          No members in this classroom
                        </p>

                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                          Add students by email to populate this classroom.
                        </p>
                      </div>
                    </div>
                  )}

                  {!!members.length && (
                    <div className="space-y-2">
                      {members.map((member) => {
                        const memberId = getStudentId(member);

                        return (
                          <MemberCard
                            key={memberId}
                            student={member}
                            isBusy={isMembershipBusy}
                            onRemove={() => handleRemoveStudent(memberId)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <ClassroomModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          classroom={modalState.classroom}
          isSaving={isSaving}
          canCreate={Boolean(defaultSchoolId)}
          onClose={handleCloseModal}
          onSave={handleSaveClassroom}
        />
      </section>
    </main>
  );
}