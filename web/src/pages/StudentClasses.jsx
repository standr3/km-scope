import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listStudentClassesApi, listStudentProjectsApi } from "../api/student";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function StudentClasses() {
  const classesQ = useQuery({
    queryKey: ["student-classes"],
    queryFn: listStudentClassesApi,
  });

  const classes = classesQ.data || [];

  return (
    <div className="grid gap-4">
      <h3 className="text-lg font-semibold">My classes</h3>

      {classesQ.isLoading && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {!classesQ.isLoading && !classes.length && (
        <p className="text-sm text-muted-foreground">No classes</p>
      )}

      <div className="grid gap-3">
        {classes.map((c) => (
          <ClassItem key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

function ClassItem({ c }) {
  const projQ = useQuery({
    queryKey: ["student-projects", c.id],
    queryFn: () => listStudentProjectsApi(c.id),
  });

  const projects = projQ.data || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{c.name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {c.subject_name} ({c.program_name})
        </div>
      </CardHeader>

      <CardContent className="grid gap-2">
        <div className="text-sm">
          Classroom: <span className="text-muted-foreground">{c.classroom_name || "-"}</span>
        </div>

        <Separator />

        <div className="grid gap-2">
          <div className="text-sm font-medium">Projects</div>

          {projQ.isLoading && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}

          {!projQ.isLoading && !projects.length && (
            <p className="text-xs text-muted-foreground">No projects</p>
          )}

          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <Button key={p.id} asChild size="sm" variant="outline">
                <Link to={`/dashboard/student/classes/${c.id}/projects/${p.id}`}>
                  {p.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}