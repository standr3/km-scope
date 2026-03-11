import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const { login, refetchAuth } = useAuth();
  const nav = useNavigate();

  const [f, setF] = React.useState({ email: "", password: "" });
  const [submitting, setSubmitting] = React.useState(false);

  const on = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const disabled = submitting || !f.email.trim() || !f.password;

  async function onSubmit(e) {
    e.preventDefault();
    if (disabled) return;

    try {
      setSubmitting(true);

      await login({ email: f.email.trim(), password: f.password });
      const r = await refetchAuth();

      const roles = r.data?.roles || [];

      // conform structurii tale de rute
      if (roles.includes("admin")) {
        nav("/dashboard/admin/teachers", { replace: true });
      } else if (roles.includes("teacher")) {
        nav("/dashboard/teacher/classes", { replace: true });
      } else {
        nav("/dashboard/notes", { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-5" autoComplete="off">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                
                // type="email"
                placeholder="name@example.com"
                value={f.email}
                onChange={on("email")}
                required
               autoComplete="new-password"

              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={f.password}
                onChange={on("password")}
                required
               autoComplete="new-password"

              />
            </div>

            <Button type="submit" disabled={disabled} className="gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Login
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="text-foreground underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}