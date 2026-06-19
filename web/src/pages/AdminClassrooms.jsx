import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";

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

function getClassroomId(classroom) {
  return String(classroom.id);
}

function getClassroomName(classroom) {
  return classroom.name ?? "Untitled classroom";
}

function getClassroomSchoolName(classroom) {
  return (
    classroom.school_name ??
    classroom.schoolName ??
    "No school assigned."
  );
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
    if (!isOpen) {
      return;
    }

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
    if (!isOpen) {
      return undefined;
    }

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
              {mode === "edit"
                ? "Rename classroom"
                : "Create classroom"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {mode === "edit"
                ? "Update the classroom name."
                : "Add a classroom for the current school."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <div>
          <label
            htmlFor="classroom-name"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Name
          </label>

          <input
            id="classroom-name"
            value={formValue.name}
            disabled={isSaving}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="e.g. 10A"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (mode === "create" && !canCreate)}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving
              ? "Saving..."
              : mode === "edit"
                ? "Save changes"
                : "Create"}
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
  isDeleting,
  onSelect,
  onEdit,
  onDelete,
}) {
  const classroomName = getClassroomName(classroom);

  return (
    <article
      className={[
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-white px-5 py-5 transition-colors",
        isSelected
          ? "border-slate-900 ring-2 ring-slate-100"
          : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-medium text-slate-950">
            {classroomName}
          </h2>

          {isSelected && (
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white">
              Selected
            </span>
          )}
        </div>

        <p className="mt-2 truncate text-sm text-slate-400">
          {getClassroomSchoolName(classroom)}
        </p>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          disabled={isBusy}
          title={`Rename ${classroomName}`}
          aria-label={`Rename ${classroomName}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          title={`Delete ${classroomName}`}
          aria-label={`Delete ${classroomName}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2
            className={[
              "h-5 w-5",
              isDeleting ? "animate-pulse" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            strokeWidth={1.8}
          />
        </button>
      </div>
    </article>
  );
}

function MemberCard({
  student,
  isBusy,
  isRemoving,
  onRemove,
}) {
  const studentName = getStudentName(student);

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-slate-300">
      <div className="min-w-0">
        <h2 className="truncate text-base font-medium text-slate-950">
          {studentName}
        </h2>

        <p className="mt-2 truncate text-sm text-slate-400">
          {getStudentEmail(student) || "No email available"}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={isBusy}
        title={`Remove ${studentName}`}
        aria-label={`Remove ${studentName}`}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <UserMinus
          className={[
            "h-5 w-5",
            isRemoving ? "animate-pulse" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          strokeWidth={1.8}
        />
      </button>
    </article>
  );
}

export default function AdminClassrooms() {
  const queryClient = useQueryClient();

  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [deletingClassroomId, setDeletingClassroomId] =
    useState(null);
  const [removingStudentId, setRemovingStudentId] =
    useState(null);

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
    queryKey: [
      "classroom-students",
      selectedClassroom?.id,
    ],
    queryFn: () =>
      listClassroomStudentsApi(selectedClassroom.id),
    enabled: Boolean(selectedClassroom?.id),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createClassroomApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classrooms"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) =>
      updateClassroomApi(id, body),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classrooms"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassroomApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classrooms"],
      });
    },

    onSettled: () => {
      setDeletingClassroomId(null);
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: ({ classroomId, studentId }) =>
      addStudentToClassroomApi(classroomId, {
        student_id: studentId,
      }),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "classroom-students",
          variables.classroomId,
        ],
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
        queryKey: [
          "classroom-students",
          variables.classroomId,
        ],
      });
    },

    onSettled: () => {
      setRemovingStudentId(null);
    },
  });

  const schools = overviewQuery.data?.schools ?? [];
  const defaultSchoolId = schools[0]?.id ?? "";

  const allStudents = normalizeOverviewStudents(
    overviewQuery.data?.students ?? []
  );

  const classrooms = classroomsQuery.data ?? [];
  const members = studentsQuery.data ?? [];

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending;

  const isDeleting = deleteMutation.isPending;

  const isMembershipBusy =
    addStudentMutation.isPending ||
    removeStudentMutation.isPending;

  const isBusy =
    isSaving ||
    isDeleting ||
    isMembershipBusy;

  const filteredClassrooms = useMemo(() => {
    const query = roomSearch.trim().toLowerCase();

    if (!query) {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      const name = getClassroomName(classroom).toLowerCase();

      const schoolName =
        getClassroomSchoolName(classroom).toLowerCase();

      return (
        name.includes(query) ||
        schoolName.includes(query)
      );
    });
  }, [classrooms, roomSearch]);

  const membersCount = members.length;

  const selectedLabel = selectedClassroom
    ? `${getClassroomName(
        selectedClassroom
      )} · ${getClassroomSchoolName(selectedClassroom)}`
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
    if (isSaving) {
      return;
    }

    setModalState({
      isOpen: false,
      mode: "create",
      classroom: null,
    });
  };

  const handleSaveClassroom = async (
    nextClassroom
  ) => {
    const isExistingClassroom =
      nextClassroom.id !== null &&
      nextClassroom.id !== undefined;

    if (isExistingClassroom) {
      await updateMutation.mutateAsync({
        id: nextClassroom.id,
        body: {
          name: nextClassroom.name,
        },
      });

      setSelectedClassroom((currentClassroom) => {
        if (
          !currentClassroom ||
          getClassroomId(currentClassroom) !==
            String(nextClassroom.id)
        ) {
          return currentClassroom;
        }

        return {
          ...currentClassroom,
          name: nextClassroom.name,
        };
      });

      return;
    }

    await createMutation.mutateAsync({
      school_id: defaultSchoolId,
      name: nextClassroom.name,
    });
  };

  const handleDeleteClassroom = async (
    classroom
  ) => {
    const classroomId = getClassroomId(classroom);

    const confirmed = window.confirm(
      `Delete classroom "${getClassroomName(classroom)}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingClassroomId(classroomId);

    try {
      await deleteMutation.mutateAsync(classroom.id);

      setSelectedClassroom((currentClassroom) => {
        if (
          currentClassroom &&
          getClassroomId(currentClassroom) === classroomId
        ) {
          return null;
        }

        return currentClassroom;
      });
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not delete this classroom."
      );
    }
  };

  const handleAddStudent = async () => {
    if (!selectedClassroom?.id) {
      return;
    }

    const normalizedEmail =
      studentEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    const student = allStudents.find(
      (candidate) =>
        candidate.email?.toLowerCase() ===
        normalizedEmail
    );

    if (!student) {
      window.alert("Student not found in school list.");
      return;
    }

    const isAlreadyMember = members.some(
      (member) =>
        String(getStudentId(member)) ===
        String(student.id)
    );

    if (isAlreadyMember) {
      window.alert(
        "This student is already in the classroom."
      );
      return;
    }

    try {
      await addStudentMutation.mutateAsync({
        classroomId: selectedClassroom.id,
        studentId: student.id,
      });

      setStudentEmail("");
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not add this student."
      );
    }
  };

  const handleRemoveStudent = async (
    studentId
  ) => {
    if (
      !selectedClassroom?.id ||
      !studentId
    ) {
      return;
    }

    setRemovingStudentId(String(studentId));

    try {
      await removeStudentMutation.mutateAsync({
        classroomId: selectedClassroom.id,
        studentId,
      });
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not remove this student."
      );
    }
  };

  if (
    overviewQuery.isLoading ||
    classroomsQuery.isLoading
  ) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <p className="text-sm text-slate-500">
          Loading classrooms...
        </p>
      </main>
    );
  }

  if (
    overviewQuery.isError ||
    classroomsQuery.isError
  ) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            Error loading classrooms.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      {/* Header fix */}
      <header className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

        <div className="relative flex min-h-[112px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {classrooms.length} configured
            </p>

            <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
              Classrooms
            </h1>

            <p className="mt-2 line-clamp-1 text-sm text-slate-400">
              {selectedLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={!defaultSchoolId || isBusy}
            className={[
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition",
              "sm:w-auto sm:min-w-[150px]",
              "hover:bg-slate-100",
              "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
              "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
            ].join(" ")}
          > 
            Create
          </button>
        </div>
      </header>

      {/* Controale fixe */}
      <div className="shrink-0 bg-transparent px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 lg:max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={roomSearch}
                onChange={(event) =>
                  setRoomSearch(event.target.value)
                }
                placeholder="Search classrooms..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={() => setRoomSearch("")}
              disabled={!roomSearch}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
              Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">
              Students:
            </span>

            <span className="font-semibold text-slate-900">
              {allStudents.length}
            </span>

            <span
              aria-hidden="true"
              className="h-4 border-l border-slate-300"
            />

            <span className="text-slate-500">
              Members:
            </span>

            <span className="font-semibold text-slate-900">
              {selectedClassroom ? membersCount : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Listele ocupă spațiul rămas */}
      <section className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-2">
        {/* Lista claselor */}
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-transparent">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 pb-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-900">
                Classroom list
              </h2>

              <p className="mt-1 truncate text-xs text-slate-500">
                Select a classroom to manage its students.
              </p>
            </div>

            <span className="shrink-0 text-xs font-medium text-slate-400">
              {filteredClassrooms.length} shown
            </span>
          </div>

          <div className="min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-4 [scrollbar-gutter:stable] sm:px-6 lg:px-8">
            {!filteredClassrooms.length && (
              <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
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
              <div className="space-y-3">
                {filteredClassrooms.map((classroom) => {
                  const classroomId =
                    getClassroomId(classroom);

                  const selectedId = selectedClassroom
                    ? getClassroomId(selectedClassroom)
                    : null;

                  return (
                    <ClassroomCard
                      key={classroomId}
                      classroom={classroom}
                      isSelected={
                        selectedId === classroomId
                      }
                      isBusy={isBusy}
                      isDeleting={
                        isDeleting &&
                        deletingClassroomId ===
                          classroomId
                      }
                      onSelect={() =>
                        setSelectedClassroom(classroom)
                      }
                      onEdit={() =>
                        handleOpenEdit(classroom)
                      }
                      onDelete={() =>
                        handleDeleteClassroom(classroom)
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Membrii clasei */}
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-transparent">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 pb-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-900">
                Members
              </h2>

              <p className="mt-1 truncate text-xs text-slate-500">
                Add or remove students from the selected classroom.
              </p>
            </div>

            <span className="shrink-0 text-xs font-medium text-slate-400">
              {selectedClassroom
                ? `${membersCount} members`
                : "None"}
            </span>
          </div>

          {!selectedClassroom && (
            <div className="grid min-h-0 place-items-center p-4 sm:p-6 lg:p-8">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  No classroom selected
                </p>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Select a classroom from the list to manage its
                  membership.
                </p>
              </div>
            </div>
          )}

          {selectedClassroom && (
            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
              <div className="shrink-0 px-4 py-4 sm:px-6 lg:px-8">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {getClassroomName(selectedClassroom)}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {getClassroomSchoolName(selectedClassroom)}
                  </p>
                </div>

                <label
                  htmlFor="classroom-student-email"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Add student by email
                </label>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    id="classroom-student-email"
                    value={studentEmail}
                    onChange={(event) =>
                      setStudentEmail(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddStudent();
                      }
                    }}
                    placeholder="student@example.com"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                  />

                  <button
                    type="button"
                    onClick={handleAddStudent}
                    disabled={
                      !studentEmail.trim() ||
                      isMembershipBusy
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <UserPlus
                      className="h-4 w-4"
                      strokeWidth={1.8}
                    />
                    Add
                  </button>
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-1 [scrollbar-gutter:stable] sm:px-6 lg:px-8">
                {studentsQuery.isLoading && (
                  <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-500">
                    Loading members...
                  </div>
                )}

                {studentsQuery.isError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    Error loading members.
                  </div>
                )}

                {!members.length &&
                  !studentsQuery.isLoading && (
                    <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          No members in this classroom
                        </p>

                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                          Add students by email to populate this
                          classroom.
                        </p>
                      </div>
                    </div>
                  )}

                {!!members.length && (
                  <div className="space-y-3">
                    {members.map((member) => {
                      const memberId =
                        getStudentId(member);

                      return (
                        <MemberCard
                          key={memberId}
                          student={member}
                          isBusy={isMembershipBusy}
                          isRemoving={
                            removeStudentMutation.isPending &&
                            removingStudentId ===
                              String(memberId)
                          }
                          onRemove={() =>
                            handleRemoveStudent(memberId)
                          }
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
    </main>
  );
}