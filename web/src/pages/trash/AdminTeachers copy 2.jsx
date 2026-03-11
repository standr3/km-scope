import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminOverviewApi, acceptRequestApi, revokeMemberApi } from "../api/admin";
import { Loader2, CircleCheck, ShieldCheck, XCircle } from "lucide-react";

/* shadcn */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  if (ovQ.isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (ovQ.isError) {
    return <div className="p-4 text-sm text-destructive">Error</div>;
  }

  const { teachers = [], requests_teachers = [] } = ovQ.data ?? {};
  const rows = [
    ...requests_teachers.map((r) => ({ kind: "pending", ...r })),
    ...teachers.map((t) => ({ kind: "granted", ...t })),
  ];

  return (
    <div className="space-y-6">
      {/* page header - render inside Outlet */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Teacher Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Manage pending requests and active teacher memberships.
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="text-sm font-medium">Teachers</div>
          <div className="text-xs text-muted-foreground">
            Pending: {requests_teachers.length} • Granted: {teachers.length}
          </div>
        </div>

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[160px]">Admission</TableHead>
                <TableHead className="w-[140px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No teachers found.
                  </TableCell>
                </TableRow>
              )}

              {rows.map((row) => {
                const isPending = row.kind === "pending";

                return (
                  <TableRow key={isPending ? row.request_id : row.membership_id}>
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
                        <Button
                          size="sm"
                          onClick={() => acceptM.mutate(row.request_id)}
                          disabled={acceptM.isPending}
                          className="gap-2"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Grant
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => revokeM.mutate(row.membership_id)}
                          disabled={revokeM.isPending}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}