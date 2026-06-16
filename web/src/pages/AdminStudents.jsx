import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminOverviewApi,
  acceptRequestApi,
  revokeMemberApi,
  listMemberInvitesApi,
  createMemberInviteApi,
  revokeMemberInviteApi,
} from "../api/admin";

function CheckIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m5 12 4 4L19 6"
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

function MailIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m4.5 7 7.5 6 7.5-6"
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

function SortIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M8 7h11M8 12h8M8 17h5M4 6v12M4 18l2-2M4 18l-2-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const INVITE_STATUS_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "USED", label: "Used" },
  { value: "REVOKED", label: "Revoked" },
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
  if (!value) return "—";

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
    return sort.dir === "asc" ? "Name · A to Z" : "Name · Z to A";
  }

  if (sort.key === "email") {
    return sort.dir === "asc" ? "Email · A to Z" : "Email · Z to A";
  }

  return sort.dir === "asc"
    ? "Status · Pending first"
    : "Status · Granted first";
}

function getInviteStatusLabel(status) {
  if (status === "PENDING") return "Pending invite";
  if (status === "USED") return "Used";
  if (status === "REVOKED") return "Revoked";
  if (status === "EXPIRED") return "Expired";

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
  if (status === "PENDING") return "No pending student invitations.";
  if (status === "USED") return "No used student invitations.";
  if (status === "REVOKED") return "No revoked student invitations.";

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

function StudentCard({ row, isBusy, onGrant, onRevoke }) {
  const isPending = row.kind === "pending";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50/70">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold",
              isPending
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {getInitialLetter(row.name, row.email)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-slate-900">
                {row.name || "Unnamed student"}
              </h2>

              <span
                className={[
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  isPending
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700",
                ].join(" ")}
              >
                {isPending ? "Pending" : "Granted"}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-slate-500">
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CheckIcon className="h-4 w-4" />
              Grant
            </button>
          ) : (
            <button
              type="button"
              onClick={onRevoke}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XIcon className="h-4 w-4" />
              Revoke
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function StudentInviteCard({ invite, isBusy, onRevoke, onReinvite }) {
  const isPending = invite.status === "PENDING";
  const isUsed = invite.status === "USED";
  const isRevoked = invite.status === "REVOKED";

  return (
    <article className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
          <MailIcon className="h-4 w-4" />
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

          {invite.used_at ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Used {formatDate(invite.used_at)}
            </p>
          ) : null}

          {invite.revoked_at ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Revoked {formatDate(invite.revoked_at)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {isPending ? (
          <button
            type="button"
            onClick={onRevoke}
            disabled={isBusy}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XIcon className="h-4 w-4" />
            Revoke
          </button>
        ) : null}

        {isRevoked ? (
          <button
            type="button"
            onClick={onReinvite}
            disabled={isBusy}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <PlusIcon className="h-4 w-4" />
            Reinvite
          </button>
        ) : null}

        {isUsed ? (
          <span className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700">
            Account created
          </span>
        ) : null}
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
  onOpenInvite,
  onRevokeInvite,
  onReinviteInvite,
}) {
  const counts = invites.reduce(
    (acc, invite) => {
      acc[invite.status] = (acc[invite.status] || 0) + 1;
      return acc;
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
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Student invitations
            </h2>

            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              {counts.PENDING || 0} pending
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Invite students by email. They can set up their account from Member Login.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenInvite}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" />
          Invite student
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {INVITE_STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusFilterChange(tab.value)}
              className={[
                "inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
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

      {panelError ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {panelError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
          Loading invitations...
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Error loading invitations.
        </div>
      ) : null}

      {!isLoading && !isError && !visibleInvites.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          {getInviteEmptyMessage(statusFilter)}
        </div>
      ) : null}

      {!isLoading && !isError && !!visibleInvites.length ? (
        <div className="max-h-44 space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {visibleInvites.map((invite) => (
            <StudentInviteCard
              key={invite.id}
              invite={invite}
              isBusy={isBusy}
              onRevoke={() => onRevokeInvite(invite)}
              onReinvite={() => onReinviteInvite(invite)}
            />
          ))}
        </div>
      ) : null}
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <MailIcon className="h-4 w-4" />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              Invite student
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Add the student email. No email is sent yet; the student can use
              Member Login with this address.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

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
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <PlusIcon className="h-4 w-4" />
              Create invite
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
      queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
      queryClient.invalidateQueries({ queryKey: ["memberInvites"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeMemberApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: createMemberInviteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberInvites"] });
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: revokeMemberInviteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberInvites"] });
    },
  });

  const data = overviewQuery.data ?? {};
  const requestsStudents = data.requests_students ?? [];
  const students = data.students ?? [];

  const invites = invitesQuery.data ?? [];
  const studentInvites = useMemo(() => {
    return invites.filter((invite) => invite.user_role === "student");
  }, [invites]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({
    key: "name",
    dir: "asc",
  });

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteStatusFilter, setInviteStatusFilter] = useState("PENDING");
  const [inviteListError, setInviteListError] = useState("");

  const pendingCount = requestsStudents.length;
  const grantedCount = students.length;
  const pendingInviteCount = studentInvites.filter(
    (invite) => invite.status === "PENDING"
  ).length;
  const totalApplications = pendingCount + grantedCount;
  const isBusy =
    acceptMutation.isPending ||
    revokeMutation.isPending ||
    createInviteMutation.isPending ||
    revokeInviteMutation.isPending;

  const allRows = useMemo(() => {
    return buildStudentRows(requestsStudents, students);
  }, [requestsStudents, students]);

  const filteredSortedRows = useMemo(() => {
    const normalizedQuery = normalize(query);

    let rows = allRows;

    if (status !== "all") {
      rows = rows.filter((row) => row.kind === status);
    }

    if (normalizedQuery) {
      rows = rows.filter((row) =>
        `${normalize(row.name)} ${normalize(row.email)} ${normalize(
          row.statusLabel
        )}`.includes(normalizedQuery)
      );
    }

    const directionMultiplier = sort.dir === "asc" ? 1 : -1;

    const getSortValue = (row) => {
      if (sort.key === "status") return row.kind;

      return normalize(row[sort.key]);
    };

    return [...rows].sort((firstRow, secondRow) => {
      const firstValue = getSortValue(firstRow);
      const secondValue = getSortValue(secondRow);

      if (firstValue < secondValue) return -1 * directionMultiplier;
      if (firstValue > secondValue) return 1 * directionMultiplier;

      return 0;
    });
  }, [allRows, query, status, sort]);

  const total = filteredSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = filteredSortedRows.slice(startIndex, startIndex + pageSize);
  const sortedHint = getSortedHint(sort);

  useEffect(() => {
    setPage(1);
  }, [query, status, pageSize, sort.key, sort.dir]);

  const handleToggleSortDirection = () => {
    setSort((currentSort) => ({
      ...currentSort,
      dir: currentSort.dir === "asc" ? "desc" : "asc",
    }));
  };

  const handleSortKeyChange = (nextSortKey) => {
    setSort({
      key: nextSortKey,
      dir: "asc",
    });
  };

  const handleGrant = (row) => {
    if (!row.request_id) return;

    acceptMutation.mutate(row.request_id);
  };

  const handleRevoke = (row) => {
    if (!row.membership_id) return;

    if (!window.confirm(`Revoke student access for "${row.email}"?`)) {
      return;
    }

    revokeMutation.mutate(row.membership_id);
  };

  const handleOpenInviteModal = () => {
    setInviteError("");
    setInviteListError("");
    setInviteEmail("");
    setInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    if (createInviteMutation.isPending) return;

    setInviteModalOpen(false);
    setInviteError("");
    setInviteEmail("");
  };

  const handleCreateInvite = async (event) => {
    event.preventDefault();

    if (!inviteEmail.trim()) return;

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
        getApiMessage(error, "Could not create student invitation.")
      );
    }
  };

  const handleRevokeInvite = (invite) => {
    if (!invite?.id) return;

    if (!window.confirm(`Revoke invitation for "${invite.email}"?`)) {
      return;
    }

    setInviteListError("");

    revokeInviteMutation.mutate(invite.id, {
      onError: (error) => {
        setInviteListError(
          getApiMessage(error, "Could not revoke student invitation.")
        );
      },
    });
  };

  const handleReinviteInvite = async (invite) => {
    if (!invite?.email) return;

    try {
      setInviteListError("");

      await createInviteMutation.mutateAsync({
        email: invite.email,
        role: "student",
      });

      setInviteStatusFilter("PENDING");
    } catch (error) {
      setInviteListError(
        getApiMessage(error, "Could not reactivate student invitation.")
      );
    }
  };

  if (overviewQuery.isLoading) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <p className="text-sm text-slate-500">Loading student accounts...</p>
        </section>
      </main>
    );
  }

  if (overviewQuery.isError) {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 place-items-center rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm sm:p-4">
          <p className="text-sm text-red-600">
            Error loading student accounts.
          </p>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="h-full min-h-0 overflow-hidden bg-slate-50">
        <section className="grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <header className="min-h-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3 sm:justify-start">
                  <h1 className="truncate text-base font-semibold text-slate-900">
                    Students
                  </h1>

                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {totalApplications} total
                  </span>

                  <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {pendingInviteCount} invites
                  </span>
                </div>

                <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">
                  Review pending student requests, manage existing student access and create invitations.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-sky-700">
                    Invited
                  </div>

                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    {pendingInviteCount}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-amber-700">
                    Pending
                  </div>

                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    {pendingCount}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-emerald-700">
                    Granted
                  </div>

                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    {grantedCount}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <StudentInvitesPanel
            invites={studentInvites}
            statusFilter={inviteStatusFilter}
            onStatusFilterChange={setInviteStatusFilter}
            isLoading={invitesQuery.isLoading}
            isError={invitesQuery.isError}
            isBusy={isBusy}
            panelError={inviteListError}
            onOpenInvite={handleOpenInviteModal}
            onRevokeInvite={handleRevokeInvite}
            onReinviteInvite={handleReinviteInvite}
          />

          <section className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 lg:grid-cols-[minmax(220px,1fr)_160px_120px_minmax(210px,auto)] lg:items-center">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            >
              <option value="all">All ({totalApplications})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="granted">Granted ({grantedCount})</option>
            </select>

            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            >
              <option value="5">5 / page</option>
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <select
                value={sort.key}
                onChange={(event) => handleSortKeyChange(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="status">Status</option>
              </select>

              <button
                type="button"
                onClick={handleToggleSortDirection}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                title={sortedHint}
              >
                <SortIcon className="h-4 w-4" />
                {sort.dir === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </section>

          <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm [scrollbar-gutter:stable]">
            {!pageRows.length && (
              <div className="grid h-full min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    No student accounts found
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Adjust the search or filter to see student accounts.
                  </p>
                </div>
              </div>
            )}

            {!!pageRows.length && (
              <div className="space-y-2">
                {pageRows.map((row) => (
                  <StudentCard
                    key={row.id}
                    row={row}
                    isBusy={isBusy}
                    onGrant={() => handleGrant(row)}
                    onRevoke={() => handleRevoke(row)}
                  />
                ))}
              </div>
            )}
          </div>

          <footer className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Showing {total === 0 ? 0 : startIndex + 1}-
                {Math.min(startIndex + pageSize, total)} of {total} · Page{" "}
                {safePage} of {totalPages}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  First
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((currentPage) => Math.max(1, currentPage - 1))
                  }
                  disabled={safePage === 1}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Prev
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(totalPages, currentPage + 1)
                    )
                  }
                  disabled={safePage === totalPages}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Last
                </button>
              </div>
            </div>
          </footer>
        </section>
      </main>

      <InviteStudentModal
        open={inviteModalOpen}
        email={inviteEmail}
        error={inviteError}
        isSubmitting={createInviteMutation.isPending}
        onEmailChange={(event) => setInviteEmail(event.target.value)}
        onClose={handleCloseInviteModal}
        onSubmit={handleCreateInvite}
      />
    </>
  );
}