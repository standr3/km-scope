import React from "react";
import { Link } from "react-router-dom";
import { School, GraduationCap, ArrowRight } from "lucide-react";

/* shadcn */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignupChoice() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4">
      <div className="grid w-full gap-6 sm:grid-cols-2">
        <Link to="/signup/school" className="group">
          <Card className="h-full transition hover:shadow-md">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Register your school</CardTitle>
              </div>
              <CardDescription>
                Create a school and administrator account.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button className="w-full gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/signup/member" className="group">
          <Card className="h-full transition hover:shadow-md">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Register as teacher or student</CardTitle>
              </div>
              <CardDescription>
                Join an existing school as a teacher or student.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button variant="outline" className="w-full gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}