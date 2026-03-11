import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Building2, Shield, ArrowRight, Loader2 } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SignupSchool() {
  const { registerSchool, refetchAuth } = useAuth();
  const nav = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  const [school, setSchool] = useState({
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
  });
  const [admin, setAdmin] = useState({ email: "", password: "" });

  const onS = (k) => (e) => setSchool((s) => ({ ...s, [k]: e.target.value }));
  const onA = (k) => (e) => setAdmin((s) => ({ ...s, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      await registerSchool({ school, admin });

      const r = await refetchAuth();
      const roles = r.data?.roles || [];

      // NOTE: ai rute de forma /dashboard/admin/teachers etc.
      nav(roles.includes("admin") ? "/dashboard/admin/teachers" : "/dashboard/teacher/classes");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Register your school</CardTitle>
          <CardDescription>
            Create a school profile and an administrator account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-6">
            {/* School */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">School info</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="school_name">Name</Label>
                  <Input
                    id="school_name"
                    placeholder="School name"
                    value={school.name}
                    onChange={onS("name")}
                    required
                  />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="school_address">Address</Label>
                  <Input
                    id="school_address"
                    placeholder="Street, city"
                    value={school.address}
                    onChange={onS("address")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="school_contact_email">Contact email</Label>
                  <Input
                    id="school_contact_email"
                    placeholder="office@school.edu"
                    value={school.contact_email}
                    onChange={onS("contact_email")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="school_contact_phone">Contact phone</Label>
                  <Input
                    id="school_contact_phone"
                    placeholder="+40..."
                    value={school.contact_phone}
                    onChange={onS("contact_phone")}
                  />
                </div>
              </div>
            </div>

            {/* Admin */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Administrator</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="admin_email">Email</Label>
                  <Input
                    id="admin_email"
                    placeholder="admin@school.edu"
                    value={admin.email}
                    onChange={onA("email")}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="admin_password">Password</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    placeholder="••••••••"
                    value={admin.password}
                    onChange={onA("password")}
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Create school + admin
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}