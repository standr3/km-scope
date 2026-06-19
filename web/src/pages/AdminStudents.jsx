import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  adminOverviewApi,
  acceptRequestApi,
  revokeMemberApi,
  listMemberInvitesApi,
  createMemberInviteApi,
  revokeMemberInviteApi,
} from "../api/admin";

const INVITE_STATUS_TABS = [
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "USED",
    label: "Used",
  },
  {
    value: "REVOKED",
    label: "Revoked",
  },
];

function normalize(value) {
  return String(value ?? "").toLowerCase().trim();
}

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function getInitialLetter(name, email) {
  return normalize(name || email).charAt(0).toUpperCase() || "S";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function getSortedHint(sort) {
  if (sort.key === "name") {
    return sort.dir === "asc"
      ? "Name · A to Z"
      : "Name · Z to A";
  }

  if (sort.key === "email") {
    return sort.dir === "asc"
      ? "Email · A to Z"
      : "Email · Z to A";
  }

  return sort.dir === "asc"
    ? "Status · Pending first"
    : "Status · Granted first";
}

function getInviteStatusLabel(status) {
  if (status === "PENDING") {
    return "Pending invite";
  }

  if (status === "USED") {
    return "Used";
  }

  if (status === "REVOKED") {
    return "Revoked";
  }

  if (status === "EXPIRED") {
    return "Expired";
  }

  return status || "Unknown";
}

function getInviteStatusClass(status) {
  if (status === "PENDING") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "USED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "REVOKED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getInviteEmptyMessage(status) {
  if (status === "PENDING") {
    return "No pending student invitations.";
  }

  if (status === "USED") {
    return "No used student invitations.";
  }

  if (status === "REVOKED") {
    return "No revoked student invitations.";
  }

  return "No student invitations found.";
}

function buildStudentRows(requests, students) {
  const pendingRows = requests.map((request) => ({
    kind: "pending",
    id: `request:${request.request_id}`,
    request_id: request.request_id,
    name: request.name ?? "(no name)",
    email: request.email,
    statusLabel: "Pending",
  }));

  const grantedRows = students.map((student) => ({
    kind: "granted",
    id: `membership:${student.membership_id}`,
    membership_id: student.membership_id,
    name: student.name ?? "(no name)",
    email: student.email,
    statusLabel: "Granted",
  }));

  return [...pendingRows, ...grantedRows];
}

function StudentCard({
  row,
  isBusy,
  isGranting,
  isRevoking,
  onGrant,
  onRevoke,
}) {
  const isPending = row.kind === "pending";
  const studentName = row.name || "Unnamed student";

  return (
    <article className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-slate-300 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold",
            isPending
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {getInitialLetter(row.name, row.email)}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-medium text-slate-950">
              {studentName}
            </h2>

            <span
              className={[
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                isPending
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              ].join(" ")}
            >
              {isPending ? "Pending" : "Granted"}
            </span>
          </div>

          <p className="mt-2 truncate text-sm text-slate-400">
            {row.email || "No email"}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        {isPending ? (
          <button
            type="button"
            onClick={onGrant}
            disabled={isBusy}
            className="inline-flex h-10 min-w-[110px] items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Check
              className={[
                "h-4 w-4",
                isGranting ? "animate-pulse" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              strokeWidth={2}
            />

            {isGranting ? "Granting..." : "Grant"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRevoke}
            disabled={isBusy}
            className="inline-flex h-10 min-w-[110px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              className={[
                "h-4 w-4",
                isRevoking ? "animate-pulse" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              strokeWidth={1.8}
            />

            {isRevoking ? "Revoking..." : "Revoke"}
          </button>
        )}
      </div>
    </article>
  );
}

function StudentInviteCard({
  invite,
  isBusy,
  onRevoke,
  onReinvite,
}) {
  const isPending = invite.status === "PENDING";
  const isUsed = invite.status === "USED";
  const isRevoked = invite.status === "REVOKED";

  return (
    <article className="grid gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
          <Mail className="h-4 w-4" strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {invite.email}
            </p>

            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                getInviteStatusClass(invite.status),
              ].join(" ")}
            >
              {getInviteStatusLabel(invite.status)}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Invited {formatDate(invite.created_at)}
          </p>

          {invite.used_at && (
            <p className="mt-0.5 text-xs text-slate-500">
              Used {formatDate(invite.used_at)}
            </p>
          )}

          {invite.revoked_at && (
            <p className="mt-0.5 text-xs text-slate-500">
              Revoked {formatDate(invite.revoked_at)}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {isPending && (
          <button
            type="button"
            onClick={onRevoke}
            disabled={isBusy}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
            Revoke
          </button>
        )}

        {isRevoked && (
          <button
            type="button"
            onClick={onReinvite}
            disabled={isBusy}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Reinvite
          </button>
        )}

        {isUsed && (
          <span className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700">
            Account created
          </span>
        )}
      </div>
    </article>
  );
}

function StudentInvitesPanel({
  invites,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  isError,
  isBusy,
  panelError,
  onRevokeInvite,
  onReinviteInvite,
}) {
  const counts = invites.reduce(
    (accumulator, invite) => {
      accumulator[invite.status] =
        (accumulator[invite.status] || 0) + 1;

      return accumulator;
    },
    {
      PENDING: 0,
      USED: 0,
      REVOKED: 0,
    }
  );

  const visibleInvites = invites.filter(
    (invite) => invite.status === statusFilter
  );

  return (
    <section className="bg-transparent">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Student invitations
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Invite students by email and manage existing invitations.
          </p>
        </div>

        <span className="text-xs font-medium text-slate-400">
          {counts.PENDING || 0} pending
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {INVITE_STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() =>
                onStatusFilterChange(tab.value)
              }
              className={[
                "inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors",
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              {tab.label}

              <span
                className={[
                  "ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  active
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {counts[tab.value] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {panelError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {panelError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          Loading invitations...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          Error loading invitations.
        </div>
      )}

      {!isLoading &&
        !isError &&
        !visibleInvites.length && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 text-sm text-slate-500">
            {getInviteEmptyMessage(statusFilter)}
          </div>
        )}

      {!isLoading &&
        !isError &&
        Boolean(visibleInvites.length) && (
          <div className="max-h-40 space-y-2 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]">
            {visibleInvites.map((invite) => (
              <StudentInviteCard
                key={invite.id}
                invite={invite}
                isBusy={isBusy}
                onRevoke={() =>
                  onRevokeInvite(invite)
                }
                onReinvite={() =>
                  onReinviteInvite(invite)
                }
              />
            ))}
          </div>
        )}
    </section>
  );
}

function InviteStudentModal({
  open,
  email,
  error,
  isSubmitting,
  onEmailChange,
  onClose,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, isSubmitting, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Invite student"
      onMouseDown={() => {
        if (!isSubmitting) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Mail className="h-4 w-4" strokeWidth={1.8} />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              Invite student
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Add the student email. The student can use Member
              Login with this address.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Student email
            </span>

            <input
              type="email"
              value={email}
              onChange={onEmailChange}
              placeholder="student@example.com"
              disabled={isSubmitting}
              required
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />

              {isSubmitting
                ? "Creating..."
                : "Create invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminStudents() {
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const invitesQuery = useQuery({
    queryKey: ["memberInvites"],
    queryFn: listMemberInvitesApi,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptRequestApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminOverview"],
      });

      queryClient.invalidateQueries({
        queryKey: ["memberInvites"],
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeMemberApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminOverview"],
      });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: createMemberInviteApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["memberInvites"],
      });
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: revokeMemberInviteApi,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["memberInvites"],
      });
    },
  });

  const data = overviewQuery.data ?? {};
  const requestsStudents = data.requests_students ?? [];
  const students = data.students ?? [];
  const invites = invitesQuery.data ?? [];

  const studentInvites = useMemo(() => {
    return invites.filter(
      (invite) => invite.user_role === "student"
    );
  }, [invites]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [sort, setSort] = useState({
    key: "name",
    dir: "asc",
  });

  const [inviteModalOpen, setInviteModalOpen] =
    useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  const [inviteStatusFilter, setInviteStatusFilter] =
    useState("PENDING");

  const [inviteListError, setInviteListError] =
    useState("");

  const [activeGrantId, setActiveGrantId] =
    useState(null);

  const [activeRevokeId, setActiveRevokeId] =
    useState(null);

  const pendingCount = requestsStudents.length;
  const grantedCount = students.length;

  const pendingInviteCount = studentInvites.filter(
    (invite) => invite.status === "PENDING"
  ).length;

  const totalApplications =
    pendingCount + grantedCount;

  const isBusy =
    acceptMutation.isPending ||
    revokeMutation.isPending ||
    createInviteMutation.isPending ||
    revokeInviteMutation.isPending;

  const allRows = useMemo(() => {
    return buildStudentRows(
      requestsStudents,
      students
    );
  }, [requestsStudents, students]);

  const filteredSortedRows = useMemo(() => {
    const normalizedQuery = normalize(query);

    let rows = allRows;

    if (status !== "all") {
      rows = rows.filter(
        (row) => row.kind === status
      );
    }

    if (normalizedQuery) {
      rows = rows.filter((row) =>
        `${normalize(row.name)} ${normalize(
          row.email
        )} ${normalize(row.statusLabel)}`.includes(
          normalizedQuery
        )
      );
    }

    const directionMultiplier =
      sort.dir === "asc" ? 1 : -1;

    const getSortValue = (row) => {
      if (sort.key === "status") {
        return row.kind === "pending" ? 0 : 1;
      }

      return normalize(row[sort.key]);
    };

    return [...rows].sort(
      (firstRow, secondRow) => {
        const firstValue = getSortValue(firstRow);
        const secondValue = getSortValue(secondRow);

        if (firstValue < secondValue) {
          return -1 * directionMultiplier;
        }

        if (firstValue > secondValue) {
          return 1 * directionMultiplier;
        }

        return 0;
      }
    );
  }, [allRows, query, status, sort]);

  const total = filteredSortedRows.length;

  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  const pageRows = filteredSortedRows.slice(
    startIndex,
    startIndex + pageSize
  );

  const sortedHint = getSortedHint(sort);

  useEffect(() => {
    setPage(1);
  }, [
    query,
    status,
    pageSize,
    sort.key,
    sort.dir,
  ]);

  const handleToggleSortDirection = () => {
    setSort((currentSort) => ({
      ...currentSort,
      dir:
        currentSort.dir === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleSortKeyChange = (nextSortKey) => {
    setSort({
      key: nextSortKey,
      dir: "asc",
    });
  };

  const handleGrant = async (row) => {
    if (!row.request_id) {
      return;
    }

    setActiveGrantId(row.id);

    try {
      await acceptMutation.mutateAsync(
        row.request_id
      );
    } catch (error) {
      window.alert(
        getApiMessage(
          error,
          "Could not grant student access."
        )
      );
    } finally {
      setActiveGrantId(null);
    }
  };

  const handleRevoke = async (row) => {
    if (!row.membership_id) {
      return;
    }

    const confirmed = window.confirm(
      `Revoke student access for "${row.email}"?`
    );

    if (!confirmed) {
      return;
    }

    setActiveRevokeId(row.id);

    try {
      await revokeMutation.mutateAsync(
        row.membership_id
      );
    } catch (error) {
      window.alert(
        getApiMessage(
          error,
          "Could not revoke student access."
        )
      );
    } finally {
      setActiveRevokeId(null);
    }
  };

  const handleOpenInviteModal = () => {
    setInviteError("");
    setInviteListError("");
    setInviteEmail("");
    setInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    if (createInviteMutation.isPending) {
      return;
    }

    setInviteModalOpen(false);
    setInviteError("");
    setInviteEmail("");
  };

  const handleCreateInvite = async (event) => {
    event.preventDefault();

    if (!inviteEmail.trim()) {
      return;
    }

    try {
      setInviteError("");
      setInviteListError("");

      await createInviteMutation.mutateAsync({
        email: inviteEmail.trim(),
        role: "student",
      });

      setInviteStatusFilter("PENDING");
      setInviteModalOpen(false);
      setInviteEmail("");
    } catch (error) {
      setInviteError(
        getApiMessage(
          error,
          "Could not create student invitation."
        )
      );
    }
  };

  const handleRevokeInvite = (invite) => {
    if (!invite?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Revoke invitation for "${invite.email}"?`
    );

    if (!confirmed) {
      return;
    }

    setInviteListError("");

    revokeInviteMutation.mutate(invite.id, {
      onError: (error) => {
        setInviteListError(
          getApiMessage(
            error,
            "Could not revoke student invitation."
          )
        );
      },
    });
  };

  const handleReinviteInvite = async (
    invite
  ) => {
    if (!invite?.email) {
      return;
    }

    try {
      setInviteListError("");

      await createInviteMutation.mutateAsync({
        email: invite.email,
        role: "student",
      });

      setInviteStatusFilter("PENDING");
    } catch (error) {
      setInviteListError(
        getApiMessage(
          error,
          "Could not reactivate student invitation."
        )
      );
    }
  };

  if (overviewQuery.isLoading) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <p className="text-sm text-slate-500">
          Loading student accounts...
        </p>
      </main>
    );
  }

  if (overviewQuery.isError) {
    return (
      <main className="grid h-full min-h-0 w-full place-items-center bg-transparent">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            Error loading student accounts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
        <header className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

          <div className="relative flex min-h-[112px] flex-col justify-center gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {totalApplications} total ·{" "}
                {pendingInviteCount} invitations
              </p>

              <h1 className="mt-2 text-2xl font-semibold leading-none tracking-tight text-white">
                Students
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                {pendingCount} pending ·{" "}
                {grantedCount} granted
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenInviteModal}
              disabled={isBusy}
              className={[
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition",
                "sm:w-auto sm:min-w-[160px]",
                "hover:bg-slate-100",
                "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
              ].join(" ")}
            >
              <Plus
                className="h-4 w-4"
                strokeWidth={2}
              />

              Invite student
            </button>
          </div>
        </header>

        <div className="shrink-0 bg-transparent px-4 py-5 sm:px-6 lg:px-8">
          <StudentInvitesPanel
            invites={studentInvites}
            statusFilter={inviteStatusFilter}
            onStatusFilterChange={
              setInviteStatusFilter
            }
            isLoading={
              invitesQuery.isLoading ||
              invitesQuery.isFetching
            }
            isError={invitesQuery.isError}
            isBusy={isBusy}
            panelError={inviteListError}
            onRevokeInvite={handleRevokeInvite}
            onReinviteInvite={
              handleReinviteInvite
            }
          />
        </div>

        <section className="grid shrink-0 gap-2 bg-transparent px-4 pb-5 sm:px-6 lg:grid-cols-[minmax(220px,1fr)_160px_120px_minmax(210px,auto)] lg:items-center lg:px-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search name, email..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          >
            <option value="all">
              All ({totalApplications})
            </option>

            <option value="pending">
              Pending ({pendingCount})
            </option>

            <option value="granted">
              Granted ({grantedCount})
            </option>
          </select>

          <select
            value={String(pageSize)}
            onChange={(event) =>
              setPageSize(
                Number(event.target.value)
              )
            }
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <select
              value={sort.key}
              onChange={(event) =>
                handleSortKeyChange(
                  event.target.value
                )
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="status">Status</option>
            </select>

            <button
              type="button"
              onClick={
                handleToggleSortDirection
              }
              title={sortedHint}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowUpDown
                className="h-4 w-4"
                strokeWidth={1.8}
              />

              {sort.dir === "asc"
                ? "Asc"
                : "Desc"}
            </button>
          </div>
        </section>

        <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent [scrollbar-gutter:stable]">
          <div className="space-y-3 bg-transparent px-4 pb-8 pt-1 sm:px-6 lg:px-8">
            {overviewQuery.isFetching && (
              <p className="text-xs text-slate-400">
                Refreshing student accounts...
              </p>
            )}

            {!pageRows.length && (
              <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    No student accounts found
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Adjust the search or filter to see
                    student accounts.
                  </p>
                </div>
              </div>
            )}

            {pageRows.map((row) => (
              <StudentCard
                key={row.id}
                row={row}
                isBusy={isBusy}
                isGranting={
                  acceptMutation.isPending &&
                  activeGrantId === row.id
                }
                isRevoking={
                  revokeMutation.isPending &&
                  activeRevokeId === row.id
                }
                onGrant={() =>
                  handleGrant(row)
                }
                onRevoke={() =>
                  handleRevoke(row)
                }
              />
            ))}
          </div>
        </section>

        <footer className="shrink-0 bg-transparent px-4 pb-4 pt-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Showing{" "}
              {total === 0 ? 0 : startIndex + 1}-
              {Math.min(
                startIndex + pageSize,
                total
              )}{" "}
              of {total} · Page {safePage} of{" "}
              {totalPages}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={safePage === 1}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                First
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(
                      1,
                      currentPage - 1
                    )
                  )
                }
                disabled={safePage === 1}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <ChevronLeft
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />

                Prev
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) =>
                    Math.min(
                      totalPages,
                      currentPage + 1
                    )
                  )
                }
                disabled={
                  safePage === totalPages
                }
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Next

                <ChevronRight
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage(totalPages)
                }
                disabled={
                  safePage === totalPages
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Last
              </button>
            </div>
          </div>
        </footer>
      </main>

      <InviteStudentModal
        open={inviteModalOpen}
        email={inviteEmail}
        error={inviteError}
        isSubmitting={
          createInviteMutation.isPending
        }
        onEmailChange={(event) =>
          setInviteEmail(event.target.value)
        }
        onClose={handleCloseInviteModal}
        onSubmit={handleCreateInvite}
      />
    </>
  );
}

