import React from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogProgramsApi } from "../api/catalog";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, Loader2 } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function MemberPrograms() {
  const [sp, setSp] = useSearchParams();
  const sort = sp.get("sort") || "created"; // created | name
  const dir = sp.get("dir") || "asc"; // asc | desc

  const programsQ = useQuery({
    queryKey: ["catalog-programs", { sort, dir }],
    queryFn: () => catalogProgramsApi({ sort, dir }),
    keepPreviousData: true,
    retry: false,
  });

  const onSort = (key) => {
    const nextDir = sort === key ? (dir === "asc" ? "desc" : "asc") : "asc";
    const n = new URLSearchParams(sp);
    n.set("sort", key);
    n.set("dir", nextDir);
    setSp(n, { replace: true });
  };

  return (
    <div className="space-y-">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-4  px-4 py-4 ">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Programs</h1>
            <p className="text-sm text-muted-foreground">Read-only catalog view.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={sort === "name" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => onSort("name")}
            >
              <ArrowUpDown className="h-4 w-4" />
              Name
              {sort === "name" ? (
                <Badge variant="secondary" className="ml-1">
                  {dir.toUpperCase()}
                </Badge>
              ) : null}
            </Button>

            <Button
              variant={sort === "created" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => onSort("created")}
            >
              <ArrowUpDown className="h-4 w-4" />
              Created
              {sort === "created" ? (
                <Badge variant="secondary" className="ml-1">
                  {dir.toUpperCase()}
                </Badge>
              ) : null}
            </Button>
          </div>
        </div>
      </div>

      {programsQ.isLoading && (
        <div className="text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}
      {programsQ.isError && <div className="text-sm text-destructive">Error</div>}

      <div className="grid gap-3">
        {(programsQ.data || []).map((p) => (
          <Card key={p.id}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <CardDescription>{p.school_name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Separator />
              <div className="text-sm text-muted-foreground">{p.descr || "—"}</div>
            </CardContent>
          </Card>
        ))}

        {!programsQ.isLoading && !(programsQ.data || []).length ? (
          <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            No programs
          </div>
        ) : null}
      </div>
    </div>
  );
}