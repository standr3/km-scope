import React from "react";
import { useAuth } from "../context/AuthContext";
import { listSchoolsApi } from "../api/schools";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, UserPlus, School } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

export default function SignupMember() {
  const { registerMember, refetchAuth } = useAuth();
  const nav = useNavigate();

  const [schools, setSchools] = React.useState([]);
  const [loadingSchools, setLoadingSchools] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [f, setF] = React.useState({
    role: "teacher",
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    school_id: "",
  });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingSchools(true);
        const data = await listSchoolsApi();
        if (!alive) return;
        setSchools(data || []);
      } finally {
        if (alive) setLoadingSchools(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const disabled =
    submitting ||
    loadingSchools ||
    !schools.length ||
    !f.role ||
    !f.name.trim() ||
    !f.email.trim() ||
    !f.password ||
    f.password.length < 4 ||
    f.confirm_password !== f.password ||
    !f.school_id;

  async function onSubmit(e) {
    e.preventDefault();
    if (disabled) return;

    try {
      setSubmitting(true);
      await registerMember({
        role: f.role,
        name: f.name.trim(),
        email: f.email.trim(),
        password: f.password,
        school_id: f.school_id,
      });

      await refetchAuth();

      // conform rutelor tale (MemberGate etc.)
      nav("/dashboard/notes", { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Join an existing school as a teacher or student.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label>Role</Label>
              <RadioGroup
                value={f.role}
                onValueChange={(v) => setF((s) => ({ ...s, role: v }))}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="role_teacher" />
                  <Label htmlFor="role_teacher" className="font-normal">
                    Teacher
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="role_student" />
                  <Label htmlFor="role_student" className="font-normal">
                    Student
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={f.name}
                onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={f.email}
                onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={f.password}
                  onChange={(e) => setF((s) => ({ ...s, password: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">At least 4 characters.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={f.confirm_password}
                  onChange={(e) =>
                    setF((s) => ({ ...s, confirm_password: e.target.value }))
                  }
                  required
                />
                {f.confirm_password && f.confirm_password !== f.password ? (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Please confirm your password.</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label>School</Label>
              <Select
                value={f.school_id || NONE}
                onValueChange={(v) => setF((s) => ({ ...s, school_id: v === NONE ? "" : v }))}
                disabled={loadingSchools || !schools.length}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingSchools ? "Loading schools…" : "Select a school"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Select a school</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!loadingSchools && !schools.length ? (
                <div className="rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <School className="h-4 w-4 text-muted-foreground" />
                    No schools available
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Ask an admin to register a school first.
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={disabled} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Sign up
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-foreground underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}