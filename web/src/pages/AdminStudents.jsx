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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function normalize(s) {
  return String(s ?? "").toLowerCase().trim();
}

export default function AdminStudents() {
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

  // UI state (hooks always run)
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

  const data = ovQ.data ?? { students: [], requests_students: [] };
  const students = data.students ?? [];
  const requests_students = data.requests_students ?? [];

  const pendingCount = requests_students.length;
  const grantedCount = students.length;
  const totalApplications = pendingCount + grantedCount;

  const allRows = React.useMemo(() => {
    const pending = requests_students.map((r) => ({
      kind: "pending",
      id: `req:${r.request_id}`,
      request_id: r.request_id,
      name: r.name ?? "(no name)",
      email: r.email,
      statusLabel: "Pending",
    }));

    const granted = students.map((s) => ({
      kind: "granted",
      id: `mem:${s.membership_id}`,
      membership_id: s.membership_id,
      name: s.name ?? "(no name)",
      email: s.email,
      statusLabel: "Granted",
    }));

    return [...pending, ...granted];
  }, [requests_students, students]);

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

  React.useEffect(() => setPage(1), [q, status, pageSize, sort.key, sort.dir]);

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
          <h1 className="text-xl font-semibold tracking-tight">Student Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Search, filter, sort, and manage student access.
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