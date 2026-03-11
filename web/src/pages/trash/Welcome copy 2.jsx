import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Welcome() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4">
      sal
      <div className="w-full">
        <Card className="mx-auto max-w-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to continue or create a new account.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="gap-2">
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </Button>

              <Button asChild variant="outline" className="gap-2">
                <Link to="/signup">
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </Link>
              </Button>
            </div>

            <div className="flex justify-center">
              <Button asChild variant="ghost" className="gap-2">
                <Link to="/login">
                  Continue <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}