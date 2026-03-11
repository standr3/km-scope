import React from "react";
import { useQuery } from "@tanstack/react-query";
import { listTeacherClassesApi } from "../api/teacher";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, GraduationCap, FolderKanban } from "lucide-react";

export default function TeacherClasses() {
  const q = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: listTeacherClassesApi,
  });

  const classes = q.data || [];

  const totalClasses = classes.length;
  const totalSubjects = new Set(classes.map((c) => c.subject_name)).size;
  const totalPrograms = new Set(classes.map((c) => c.program_name)).size;

  return (
    <div className="space-y-6 ">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">My Classes</h1>
        <p className="text-sm text-muted-foreground">
          Manage your teaching groups and access their projects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-none ">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center border">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total classes
              </p>
              <p className="text-2xl font-semibold">{totalClasses}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none ">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center border">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Subjects
              </p>
              <p className="text-2xl font-semibold">{totalSubjects}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none ">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center border">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Programs
              </p>
              <p className="text-2xl font-semibold">{totalPrograms}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none ">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg">Class list</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading classes...</div>
          ) : !classes.length ? (
            <div className="p-6 text-sm text-muted-foreground">
              No classes available.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.subject_name}</TableCell>
                    <TableCell>{c.program_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-none">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" className="rounded-none">
                        <Link to={`/dashboard/teacher/classes/${c.id}/projects`}>
                          View projects
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}