import React from "react";
import { Outlet, NavLink, useMatches } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  HatGlasses,
  SquareUser,
  LogOut,
  BookOpen,
  Database,
  FileText,
  Wand2,
  Users,
} from "lucide-react";

import "./dashboard-layout.css";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout() {
  const matches = useMatches();
  const header =
    matches
      .map((m) => m.handle?.header)
      .filter(Boolean)
      .pop() || "Dashboard";

  const { user, roles, logout, loggingOut } = useAuth();

  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");

  const userLabel = user?.name || user?.email || "User";
  const userEmail = user?.email || "";

  return (
    <SidebarProvider>
      <div className="dashboard-container">
        <Sidebar collapsible="icon">
          <SidebarHeader className="gap-2 -mx-2">
            <div className="flex items-center gap-2 px-0 ">
              <div className="mx-2 grid h-[39px] w-10 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
                KMS
              </div>
              <div className="leading-tight">
                <div className="font-semibold">KMScope</div>
                <div className="text-xs text-muted-foreground">
                  {isAdmin ? "Admin Dashboard" : "Member Dashboard"}
                </div>
              </div>
            </div>
            <Separator />
          </SidebarHeader>

          <SidebarContent>
            {isAdmin ? (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel>Accounts</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/admin/teachers">
                            <HatGlasses className="h-4 w-4" />
                            <span>Teachers</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/admin/students">
                            <GraduationCap className="h-4 w-4" />
                            <span>Students</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                  <SidebarGroupLabel>School setup</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/admin/programs">
                            <Database className="h-4 w-4" />
                            <span>Programs</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/admin/subjects">
                            <BookOpen className="h-4 w-4" />
                            <span>Subjects</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/admin/school-years">
                            <FileText className="h-4 w-4" />
                            <span>School Years</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/admin/periods">
                            <Wand2 className="h-4 w-4" />
                            <span>Periods</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/admin/classrooms">
                            <Users className="h-4 w-4" />
                            <span>Classrooms</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/admin/classes">
                            <Users className="h-4 w-4" />
                            <span>Classes</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            ) : (
              <SidebarGroup>
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {/* <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/dashboard/notes">
                          <FileText className="h-4 w-4" />
                          <span>Notes</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem> */}

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/dashboard/catalog/programs">
                          <Database className="h-4 w-4" />
                          <span>Programs</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/dashboard/catalog/subjects">
                          <BookOpen className="h-4 w-4" />
                          <span>Subjects</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {isTeacher ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/teacher/classes">
                            <HatGlasses className="h-4 w-4" />
                            <span>Classes</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : isStudent ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink to="/dashboard/student/classes">
                            <GraduationCap className="h-4 w-4" />
                            <span>My Classes</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : null}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter>
            <Separator className="mb-2" />

            {/* replaced commented popover with shadcn DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatar.png" alt="" />
                    <AvatarFallback>
                      {(userLabel?.[0] || "U").toUpperCase()}
                      {(userLabel?.[1] || "").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{userLabel}</div>
                    <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
                  </div>

                  <SquareUser className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // placeholder; replace with your route
                    // navigate("/dashboard/account");
                  }}
                >
                  <SquareUser className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={loggingOut}
                  onClick={() => {
                    // keep same behavior you had in commented code
                    logout().then(() => location.assign("/"));
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {loggingOut ? "Signing out…" : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* right side */}
        <SidebarInset className="flex min-h-screen flex-1 min-w-0 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b  px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">{header}</div>
          </header>

          <main className="min-h-0 flex-1 overflow-hidden bg-[#EBEBE9] p-4">
            <div className="flex h-full min-h-0 flex-col">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}