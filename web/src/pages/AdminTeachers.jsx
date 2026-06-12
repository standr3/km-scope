import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminOverviewApi, acceptRequestApi, revokeMemberApi } from "../api/admin";
import {
  Loader2,
  CircleCheck,
  ShieldCheck,
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  UserCheck,
} from "lucide-react";

/* shadcn */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function normalize(s) {
  return String(s ?? "").toLowerCase().trim();
}

export default function AdminTeachers() {
  const qc = useQueryClient();

  const ovQ = useQuery({
    queryKey: ["adminOverview"],
    queryFn: adminOverviewApi,
    retry: false,
  });

  const acceptM = useMutation({
    mutationFn: acceptRequestApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminOverview"] }),
  });

  const revokeM = useMutation({
    mutationFn: revokeMemberApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminOverview"] }),
  });

  // -----------------------------
  // Dummy data (teachers requests)
  // -----------------------------
  const requests_teachers_dummy = [
    {
      accepted: false,
      email: "alex.popescu@example.com",
      name: "Alex Popescu",
      request_id: "11111111-1111-4111-8111-111111111111",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0001-4000-8000-000000000001",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "maria.ionescu@example.com",
      name: "Maria Ionescu",
      request_id: "22222222-2222-4222-8222-222222222222",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0002-4000-8000-000000000002",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "dan.vasilescu@example.com",
      name: "Dan Vasilescu",
      request_id: "33333333-3333-4333-8333-333333333333",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0003-4000-8000-000000000003",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "elena.marin@example.com",
      name: "Elena Marin",
      request_id: "44444444-4444-4444-8444-444444444444",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0004-4000-8000-000000000004",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "andrei.dumitru@example.com",
      name: "Andrei Dumitru",
      request_id: "55555555-5555-4555-8555-555555555555",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0005-4000-8000-000000000005",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "ioana.georgescu@example.com",
      name: "Ioana Georgescu",
      request_id: "66666666-6666-4666-8666-666666666666",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0006-4000-8000-000000000006",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "mihai.stan@example.com",
      name: "Mihai Stan",
      request_id: "77777777-7777-4777-8777-777777777777",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0007-4000-8000-000000000007",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "ana.popa@example.com",
      name: "Ana Popa",
      request_id: "88888888-8888-4888-8888-888888888888",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0008-4000-8000-000000000008",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "cristian.enache@example.com",
      name: "Cristian Enache",
      request_id: "99999999-9999-4999-8999-999999999999",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0009-4000-8000-000000000009",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "laura.moldovan@example.com",
      name: "Laura Moldovan",
      request_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0010-4000-8000-000000000010",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "bogdan.rusu@example.com",
      name: "Bogdan Rusu",
      request_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0011-4000-8000-000000000011",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "simona.ilie@example.com",
      name: "Simona Ilie",
      request_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0012-4000-8000-000000000012",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "raul.neagu@example.com",
      name: "Raul Neagu",
      request_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0013-4000-8000-000000000013",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "diana.badea@example.com",
      name: "Diana Badea",
      request_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0014-4000-8000-000000000014",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "tudor.lazar@example.com",
      name: "Tudor Lazar",
      request_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0015-4000-8000-000000000015",
      user_role: "teacher",
    },
  ];

  // -----------------------------
  // Use real data OR dummy fallback
  // -----------------------------
  const data = ovQ.data ?? { teachers: [], requests_teachers: [] };

  // If you want to FORCE dummy while developing:
  // const requests_teachers = requests_teachers_dummy;
  // const teachers = [];
  // Otherwise: real data with fallback dummy when empty:
  // const requests_teachers = requests_teachers_dummy;
  // const requests_teachers =
  //   (data.requests_teachers?.length ? data.requests_teachers : requests_teachers_dummy) ?? [];
  const requests_teachers = data.requests_teachers;
  const teachers = data.teachers ?? [];

  // UI state
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all"); // all | pending | granted
  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState({ key: "name", dir: "asc" }); // name|email|status

  const toggleSort = React.useCallback((key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }, []);

  const pendingCount = requests_teachers.length;
  const grantedCount = teachers.length;
  const totalApplications = pendingCount + grantedCount;

  const allRows = React.useMemo(() => {
    const pending = requests_teachers.map((r) => ({
      kind: "pending",
      id: `req:${r.request_id}`,
      request_id: r.request_id,
      name: r.name,
      email: r.email,
      statusLabel: "Pending",
    }));

    const granted = teachers.map((t) => ({
      kind: "granted",
      id: `mem:${t.membership_id}`,
      membership_id: t.membership_id,
      name: t.name,
      email: t.email,
      statusLabel: "Granted",
    }));

    return [...pending, ...granted];
  }, [requests_teachers, teachers]);

  const filteredSorted = React.useMemo(() => {
    const nq = normalize(q);

    let rows = allRows;

    if (status !== "all") rows = rows.filter((r) => r.kind === status);

    if (nq) {
      rows = rows.filter((r) =>
        `${normalize(r.name)} ${normalize(r.email)} ${normalize(r.statusLabel)}`.includes(nq)
      );
    }

    const dirMul = sort.dir === "asc" ? 1 : -1;

    const getVal = (r) => {
      if (sort.key === "status") return r.kind;
      return normalize(r[sort.key]);
    };

    return [...rows].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av < bv) return -1 * dirMul;
      if (av > bv) return 1 * dirMul;
      return 0;
    });
  }, [allRows, q, status, sort]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filteredSorted.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [q, status, pageSize, sort.key, sort.dir]);

  if (ovQ.isLoading) {
    return (
      <div className="flex h-[calc(100vh-16vh-3rem)] items-center rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading teacher accounts…
      </div>
    );
  }

  if (ovQ.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Error loading teacher accounts.
      </div>
    );
  }

  const sortedHint =
    sort.key === "name"
      ? sort.dir === "asc"
        ? "Name · A to Z"
        : "Name · Z to A"
      : sort.key === "email"
        ? sort.dir === "asc"
          ? "Email · A to Z"
          : "Email · Z to A"
        : sort.dir === "asc"
          ? "Status · Pending first"
          : "Status · Granted first";

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden xl:h-[calc(100vh-16vh-3rem)] xl:overflow-hidden">
      {/* Page header */}
      <section className="grid overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:h-1/3 xl:grid-cols-9">
        <div className="border-b border-slate-200 bg-slate-50 p-5 xl:col-span-3 xl:border-b-0 xl:border-r">
          <p className="text-xl font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-2xl">
            Teachers
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            {totalApplications}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Total applications
          </p>
        </div>

        <div className="flex flex-col gap-5 p-5 xl:col-span-6 xl:justify-between">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">
                Manage teacher access
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Review pending teacher requests, grant access, or revoke existing
                memberships from the school workspace.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[300px]">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-amber-700">
                  Pending
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase leading-none text-emerald-700">
                  Granted
                </p>

                <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">
                  {grantedCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teachers table area */}
      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm xl:min-h-0 xl:flex-1">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">
              Teacher accounts
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Search, filter, sort, and manage teacher admission status.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_170px_110px] 2xl:w-auto">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email..."
              className="h-9 w-full"
            />

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All ({totalApplications})</SelectItem>
                <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                <SelectItem value="granted">Granted ({grantedCount})</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="h-9 w-full sm:col-span-2 lg:col-span-1">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="w-full overflow-x-auto rounded-md border border-slate-200">
            <Table className="min-w-[680px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="w-[28%] text-slate-600">
                    <Button
                      variant="ghost"
                      className="-ml-3 h-8 gap-2 px-3 text-slate-600 hover:bg-slate-100"
                      onClick={() => toggleSort("name")}
                    >
                      Name
                      <ArrowUpDown className="h-4 w-4 opacity-60" />
                    </Button>
                  </TableHead>

                  <TableHead className="text-slate-600">
                    <Button
                      variant="ghost"
                      className="-ml-3 h-8 gap-2 px-3 text-slate-600 hover:bg-slate-100"
                      onClick={() => toggleSort("email")}
                    >
                      Email
                      <ArrowUpDown className="h-4 w-4 opacity-60" />
                    </Button>
                  </TableHead>

                  <TableHead className="w-[150px] text-slate-600">
                    <Button
                      variant="ghost"
                      className="-ml-3 h-8 gap-2 px-3 text-slate-600 hover:bg-slate-100"
                      onClick={() => toggleSort("status")}
                    >
                      Admission
                      <ArrowUpDown className="h-4 w-4 opacity-60" />
                    </Button>
                  </TableHead>

                  <TableHead className="w-[120px] text-right text-slate-600">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No teacher accounts found.
                    </TableCell>
                  </TableRow>
                )}

                {pageRows.map((row) => {
                  const isPending = row.kind === "pending";

                  return (
                    <TableRow
                      key={row.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm font-semibold",
                              isPending
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700",
                            ].join(" ")}
                          >
                            {normalize(row.name).charAt(0).toUpperCase() || "T"}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-950">
                              {row.name}
                            </div>

                            <div className="text-xs text-slate-500">
                              Teacher account
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-slate-500">
                        <span className="block max-w-[240px] truncate">
                          {row.email}
                        </span>
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Badge className="gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-50">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge className="gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
                            <CircleCheck className="h-3.5 w-3.5 shrink-0" />
                            Granted
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {isPending ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                disabled={acceptM.isPending}
                                className="gap-2 bg-[#3e4c59] text-white hover:bg-[#616e7c]"
                              >
                                <ShieldCheck className="h-4 w-4 shrink-0" />
                                Grant
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => acceptM.mutate(row.request_id)}
                                disabled={acceptM.isPending}
                              >
                                Confirm grant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={revokeM.isPending}
                                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 shrink-0" />
                                Revoke
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => revokeM.mutate(row.membership_id)}
                                disabled={revokeM.isPending}
                              >
                                Confirm revoke
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            Showing {total === 0 ? 0 : start + 1}-
            {Math.min(start + pageSize, total)} of {total} · Page {safePage} of{" "}
            {totalPages}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
            >
              First
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}