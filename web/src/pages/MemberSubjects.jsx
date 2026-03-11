import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { catalogProgramsApi, catalogSubjectsApi } from "../api/catalog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

const sortKeys = ["program", "name", "weekly_hours", "weight"];
const ALL = "__all__";

function SortButton({ label, k, activeSort, dir, onToggle }) {
  const active = activeSort === k;
  const arrow = active ? (dir === "asc" ? "↑" : "↓") : "";
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={() => onToggle(k)}
    >
      {label} {arrow}
    </Button>
  );
}

export default function MemberSubjects() {
  const [sp, setSp] = useSearchParams();

  const program = sp.get("program") || ""; // "" = all
  const sort = sortKeys.includes(sp.get("sort")) ? sp.get("sort") : "name";
  const dir = sp.get("dir") === "desc" ? "desc" : "asc";
  const required = sp.get("required") === "true";

  const programsQ = useQuery({
    queryKey: ["catalog-programs", { sort: "name", dir: "asc" }],
    queryFn: () => catalogProgramsApi({ sort: "name", dir: "asc" }),
  });

  const subjectsQ = useQuery({
    queryKey: ["catalog-subjects", { program, required, sort, dir }],
    queryFn: () =>
      catalogSubjectsApi({ program: program || undefined, required, sort, dir }),
    placeholderData: (prev) => prev, // v5; pe v4: keepPreviousData: true
  });

  const setParam = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v === "" || v == null) n.delete(k);
    else n.set(k, v);
    setSp(n, { replace: true });
  };

  const toggleSort = (key) => {
    const nextDir = sort === key ? (dir === "asc" ? "desc" : "asc") : "asc";
    const n = new URLSearchParams(sp);
    n.set("sort", key);
    n.set("dir", nextDir);
    setSp(n, { replace: true });
  };

  const programs = programsQ.data || [];
  const subjects = subjectsQ.data || [];

  // Pentru Select: nu folosim "" ca value; folosim sentinel
  const selectValue = program ? String(program) : ALL;

  return (
    <div className="grid gap-4">
      <h3 className="text-lg font-semibold">Subjects (read-only)</h3>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[220px]">
              <Select
                value={selectValue}
                onValueChange={(v) => setParam("program", v === ALL ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={required}
                onCheckedChange={(v) => setParam("required", v ? "true" : "")}
              />
              <span>Required only</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <SortButton
                label="Program"
                k="program"
                activeSort={sort}
                dir={dir}
                onToggle={toggleSort}
              />
              <SortButton
                label="Name"
                k="name"
                activeSort={sort}
                dir={dir}
                onToggle={toggleSort}
              />
              <SortButton
                label="Weekly hours"
                k="weekly_hours"
                activeSort={sort}
                dir={dir}
                onToggle={toggleSort}
              />
              <SortButton
                label="Weight"
                k="weight"
                activeSort={sort}
                dir={dir}
                onToggle={toggleSort}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {subjectsQ.isLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {subjectsQ.isError && (
            <p className="text-sm text-destructive">Error</p>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Weekly hours</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead>Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.program_name}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.year}</TableCell>
                    <TableCell className="text-right">{s.weekly_hours}</TableCell>
                    <TableCell className="text-right">{s.weight}</TableCell>
                    <TableCell>{s.is_required ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}

                {!subjects.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center italic">
                      No subjects
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}