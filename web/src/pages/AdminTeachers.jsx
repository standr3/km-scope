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
  const requests_teachers =
    (data.requests_teachers?.length ? data.requests_teachers : requests_teachers_dummy) ?? [];
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
      <div className="p-4 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }
  if (ovQ.isError) return <div className="p-4 text-sm text-destructive">Error</div>;

  return (
    <div className="space-y-6">
      {/* Sticky page header (inside Outlet) */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/80 px-4 py-4 backdrop-blur">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Teacher Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Search, filter, sort, and manage teacher access.
          </p>
        </div>

        {/* Stat cards row */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total applications
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending requests
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Granted
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{grantedCount}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        {/* toolbar */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email…"
              className="max-w-md"
            />

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({totalApplications})</SelectItem>
                <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                <SelectItem value="granted">Granted ({grantedCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Showing {total === 0 ? 0 : start + 1}-{Math.min(start + pageSize, total)} of {total}
            </div>

            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[110px]">
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

        {/* table */}
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">
                  <Button
                    variant="ghost"
                    className="-ml-3 h-8 gap-2 px-3"
                    onClick={() => toggleSort("name")}
                  >
                    Name <ArrowUpDown className="h-4 w-4 opacity-60" />
                  </Button>
                </TableHead>

                <TableHead>
                  <Button
                    variant="ghost"
                    className="-ml-3 h-8 gap-2 px-3"
                    onClick={() => toggleSort("email")}
                  >
                    Email <ArrowUpDown className="h-4 w-4 opacity-60" />
                  </Button>
                </TableHead>

                <TableHead className="w-[170px]">
                  <Button
                    variant="ghost"
                    className="-ml-3 h-8 gap-2 px-3"
                    onClick={() => toggleSort("status")}
                  >
                    Admission <ArrowUpDown className="h-4 w-4 opacity-60" />
                  </Button>
                </TableHead>

                <TableHead className="w-[120px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No results.
                  </TableCell>
                </TableRow>
              )}

              {pageRows.map((row) => {
                const isPending = row.kind === "pending";

                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email}</TableCell>

                    <TableCell>
                      {isPending ? (
                        <Badge variant="secondary" className="gap-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Pending
                        </Badge>
                      ) : (
                        <Badge className="gap-1">
                          <CircleCheck className="h-3.5 w-3.5" />
                          Granted
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isPending ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="gap-2" disabled={acceptM.isPending}>
                              <ShieldCheck className="h-4 w-4" />
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
                              variant="destructive"
                              className="gap-2"
                              disabled={revokeM.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                              Revoke
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
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

        {/* pagination */}
        <div className="flex items-center justify-between gap-2 border-t p-4">
          <div className="text-xs text-muted-foreground">
            Page {safePage} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={safePage === 1}>
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
      </div>
    </div>
  );
}