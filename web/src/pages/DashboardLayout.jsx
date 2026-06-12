import React, { useState } from "react";
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
  EllipsisVertical,
  UserRound,
  CircleArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// import "./dashboard-layout.css";

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


const HEADER_HEIGHT = 'h-14';
const SIDEBAR_WIDTH = 'w-64';
const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: 'Settings', to: '/settings' },
  { admin: true, label: 'School Years', to: '/dashboard/admin/school-years' },
  { admin: true, label: 'Periods', to: '/dashboard/admin/periods' },
  { admin: true, label: 'Programs', to: '/dashboard/admin/programs' },
  { admin: true, label: 'Subjects', to: '/dashboard/admin/subjects' },
  { admin: true, label: 'Classrooms', to: '/dashboard/admin/classrooms' },
  { admin: true, label: 'Classes', to: '/dashboard/admin/classes' },
  { admin: true, label: 'Teacher Accounts', to: '/dashboard/admin/teachers' },
  { admin: true, label: 'Student Accounts', to: '/dashboard/admin/students' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const matches = useMatches();

  const currentHandle = [...matches]
    .reverse()
    .map((match) => match.handle)
    .find((handle) => handle?.header || handle?.layoutMode);

  const header = currentHandle?.header ?? "Dashboard";
  const layoutMode = currentHandle?.layoutMode ?? "default";

  const isProjectMode = layoutMode === "project";

  const { user, roles, logout, loggingOut, school } = useAuth();

  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");

  const userLabel = user?.name || user?.email || "User";
  const userEmail = user?.email || "";


  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const schoolName = `${school?.name || "School"}`;

  // const [expanded, setExpanded] = useState(false);

  // const navItems1 = ["Dashboard", "Projects", "Notes", "Settings", "Members", "Security"];
  // const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  console.log(isProjectMode)
  return (


    <div
      className={[
        "grid h-dvh w-full bg-[#f5f7fa]",
        isProjectMode
          ? "grid-rows-[48px_minmax(0,1fr)]"
          : "grid-rows-[72px_minmax(0,1fr)]",
      ].join(" ")}
    >
      <header
        className={[
          "w-full border-b border-slate-200 bg-white",
          isProjectMode ? "h-12" : "h-18",
        ].join(" ")}
      >
        <div
          className={[
            "grid h-full grid-cols-12 items-center px-4 sm:px-6",
            isProjectMode ? "" : "xl:mx-[17vw] xl:px-0",
          ].join(" ")}
        >
          {isProjectMode ? (
            <>
              <div className="col-span-10 flex min-w-0 items-center gap-3">
                <a className="aspect-square w-8 shrink-0 overflow-hidden    select-none">
                  {/* <svg
                    viewBox="0 0 200 200"
                    className="h-full w-full"
                    role="img"
                    aria-label="KMScope logo"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="#f5f7fa"
                      stroke="#d8dee6"
                      strokeWidth="3"
                    />

                    <circle cx="77" cy="159" r="2" fill="#b8c3cd" />
                    <circle cx="62" cy="148" r="5" fill="#b8c3cd" />
                    <circle cx="50" cy="127" r="7" fill="#b8c3cd" />
                    <circle cx="51" cy="100" r="9" fill="#b8c3cd" />

                    <line x1="62" y1="72" x2="102" y2="54" stroke="#9aa8b5" strokeWidth="5" strokeLinecap="round" />
                    <line x1="102" y1="54" x2="142" y2="82" stroke="#9aa8b5" strokeWidth="5" strokeLinecap="round" />
                    <line x1="62" y1="72" x2="82" y2="128" stroke="#9aa8b5" strokeWidth="5" strokeLinecap="round" />
                    <line x1="82" y1="128" x2="138" y2="126" stroke="#9aa8b5" strokeWidth="5" strokeLinecap="round" />
                    <line x1="142" y1="82" x2="138" y2="126" stroke="#9aa8b5" strokeWidth="5" strokeLinecap="round" />
                    <line x1="102" y1="54" x2="82" y2="128" stroke="#c7d0d9" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 9" />

                    <circle cx="62" cy="72" r="12" fill="#d9e1e8" stroke="#7f8d9a" strokeWidth="4" />
                    <circle cx="102" cy="54" r="10" fill="#ffffff" stroke="#aeb9c4" strokeWidth="4" />
                    <circle cx="142" cy="82" r="12" fill="#ffffff" stroke="#aeb9c4" strokeWidth="4" />
                    <circle cx="82" cy="128" r="13" fill="#ffffff" stroke="#aeb9c4" strokeWidth="4" />
                    <circle cx="138" cy="126" r="10" fill="#d9e1e8" stroke="#7f8d9a" strokeWidth="4" />
                  </svg> */}
                  <img src="/logo2.svg" alt="Logo" />
                </a>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  title="Back"
                >
                  <CircleArrowLeft size={18} />
                </button>

                <span
                  id="dashboard-project-title"
                  className="block min-w-0 truncate text-sm font-semibold text-[#3e4c59]"
                />
              </div>

              <div className="col-span-2 flex items-center justify-end">
                <div className="relative">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e2e8f0] text-[#3e4c59] hover:border-[#cad5e2] hover:bg-[#fbfcfd]"
                    onClick={() => setIsDropdownOpen((current) => !current)}
                    title="Account"
                  >
                    <UserRound size={17} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-10 z-50 w-48 rounded-xs border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Profile
                      </button>

                      <button
                        type="button"
                        className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Settings
                      </button>

                      <div className="my-1 h-px bg-slate-200" />

                      <button
                        type="button"
                        disabled={loggingOut}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout().then(() => location.assign("/"));
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="col-span-3 flex items-center sm:col-span-2 xl:col-span-1">
                <a className="h-8 w-8 shrink-0 overflow-hidden rounded-full border sm:h-10 sm:w-10">
                  <svg
                    viewBox="0 0 200 200"
                    className="h-full w-full"
                    role="img"
                    aria-label="KMScope logo"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="#f5f7fa"
                      stroke="#d8dee6"
                      strokeWidth="3"
                    />

                    <circle cx="77" cy="159" r="2" fill="#b8c3cd" />
                    <circle cx="62" cy="148" r="5" fill="#b8c3cd" />
                    <circle cx="50" cy="127" r="7" fill="#b8c3cd" />
                    <circle cx="51" cy="100" r="9" fill="#b8c3cd" />

                    <line
                      x1="62"
                      y1="72"
                      x2="102"
                      y2="54"
                      stroke="#9aa8b5"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="102"
                      y1="54"
                      x2="142"
                      y2="82"
                      stroke="#9aa8b5"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="62"
                      y1="72"
                      x2="82"
                      y2="128"
                      stroke="#9aa8b5"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="82"
                      y1="128"
                      x2="138"
                      y2="126"
                      stroke="#9aa8b5"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="142"
                      y1="82"
                      x2="138"
                      y2="126"
                      stroke="#9aa8b5"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="102"
                      y1="54"
                      x2="82"
                      y2="128"
                      stroke="#c7d0d9"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="7 9"
                    />

                    <circle
                      cx="62"
                      cy="72"
                      r="12"
                      fill="#d9e1e8"
                      stroke="#7f8d9a"
                      strokeWidth="4"
                    />
                    <circle
                      cx="102"
                      cy="54"
                      r="10"
                      fill="#ffffff"
                      stroke="#aeb9c4"
                      strokeWidth="4"
                    />
                    <circle
                      cx="142"
                      cy="82"
                      r="12"
                      fill="#ffffff"
                      stroke="#aeb9c4"
                      strokeWidth="4"
                    />
                    <circle
                      cx="82"
                      cy="128"
                      r="13"
                      fill="#ffffff"
                      stroke="#aeb9c4"
                      strokeWidth="4"
                    />
                    <circle
                      cx="138"
                      cy="126"
                      r="10"
                      fill="#d9e1e8"
                      stroke="#7f8d9a"
                      strokeWidth="4"
                    />


                  </svg>
                </a>
              </div>

              <nav className="col-span-5 flex min-w-0 items-center text-sm font-semibold text-[#3e4c59] sm:col-span-6 sm:text-[16px] xl:col-span-4">
                {isAdmin ? (
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{schoolName}</span>
                    <span className="truncate font-normal">Admin workspace</span>
                  </div>
                ) : (
                  <>
                    <NavLink
                      to="/dashboard/catalog/programs"
                      className="w-1/2"
                    >
                      Catalog
                    </NavLink>
                    <span className="w-1/2">Classes</span>
                  </>
                )}
              </nav>

              <div className="col-span-4 flex items-center justify-end sm:col-span-4 xl:col-end-13">
                <div className="relative">
                  <button
                    className="flex w-fit max-w-[120px] flex-row-reverse items-center justify-center gap-2 rounded-sm border border-[#e2e8f0] px-2 py-2 text-sm font-semibold text-[#3e4c59] hover:border-[#cad5e2] hover:bg-[#fbfcfd] sm:max-w-[220px] sm:gap-[14px] sm:pl-4 sm:pr-2 sm:text-[16px]"
                    onClick={() => setIsDropdownOpen((current) => !current)}
                  >
                    <EllipsisVertical size={18} className="shrink-0" />
                    <span className="truncate">{isAdmin ? "Account" : userLabel}</span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-11 z-50 w-48 rounded-xs border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Profile
                      </button>

                      <button
                        type="button"
                        className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Settings
                      </button>

                      <div className="my-1 h-px bg-slate-200" />

                      <button
                        type="button"
                        disabled={loggingOut}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout().then(() => location.assign("/"));
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>
      {
        !isProjectMode
          ? (
            <div className="min-h-0 overflow-y-auto overflow-x-hidden">
              <div className="flex min-h-0 flex-col px-4 sm:px-6 xl:mx-[17vw] xl:grid xl:grid-cols-12 xl:px-0">
                <aside className="border-b border-slate-200 bg-slate-50 py-3 xl:sticky xl:top-[72px] xl:col-span-3 xl:h-[calc(100vh-72px)] xl:border-b-0 xl:px-3 xl:py-6">
                  <nav className="flex gap-2 overflow-x-auto text-[14px] xl:flex-col xl:overflow-visible">

                    {isAdmin
                      ? (
                        navItems
                          .filter((item) => item.admin === true)
                          .map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                [
                                  "block shrink-0 rounded-[4px] px-[18px] py-[11px] leading-none transition",
                                  isActive
                                    ? "bg-[#e7ebf0] text-[#102a43]"
                                    : "text-[#102a43] hover:bg-[#eef2f6]",
                                ].join(" ")
                              }
                            >
                              {item.label}
                            </NavLink>
                          ))
                      ) : (

                        navItems
                          .filter((item) => item?.admin !== true)
                          .map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                [
                                  "block shrink-0 rounded-[4px] px-[18px] py-[11px] leading-none transition",
                                  isActive
                                    ? "bg-[#e7ebf0] text-[#102a43]"
                                    : "text-[#102a43] hover:bg-[#eef2f6]",
                                ].join(" ")
                              }
                            >
                              {item.label}
                            </NavLink>
                          ))
                      )}
                  </nav>
                </aside>

                <main className="min-h-0 min-w-0 py-4 xl:col-span-9 xl:pl-8">
                  <section className="min-h-0 w-full overflow-visible xl:h-[calc(100vh-72px-3rem)] xl:overflow-y-auto xl:overflow-x-hidden">
                    <Outlet />
                  </section>
                </main>
              </div>
            </div>
          )
          : (
            <main className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
              <Outlet />
            </main>
          )
      }

    </div >


  );
}

// <SidebarProvider>
//   <div className="px-[17%] w-full">
//     <Sidebar collapsible="icon">
//       {/* <SidebarHeader className="gap-2 -mx-2">
//         <div className="flex items-center gap-2 px-0 ">
//           <div className="mx-2 grid h-[39px] w-10 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
//             KMS
//           </div>
//           <div className="leading-tight">
//             <div className="font-semibold">KMScope</div>
//             <div className="text-xs text-muted-foreground">
//               {isAdmin ? "Admin Dashboard" : "Member Dashboard"}
//             </div>
//           </div>
//         </div>
//         <Separator />
//       </SidebarHeader> */}

//       <SidebarContent>
//         {isAdmin ? (
//           <>
//             <SidebarGroup>
//               <SidebarGroupLabel>Accounts</SidebarGroupLabel>
//               <SidebarGroupContent>
//                 <SidebarMenu>
//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/admin/teachers">
//                         <HatGlasses className="h-4 w-4" />
//                         <span>Teachers</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>

//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/admin/students">
//                         <GraduationCap className="h-4 w-4" />
//                         <span>Students</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>
//                 </SidebarMenu>
//               </SidebarGroupContent>
//             </SidebarGroup>

//             <SidebarGroup>
//               <SidebarGroupLabel>School setup</SidebarGroupLabel>
//               <SidebarGroupContent>
//                 <SidebarMenu>
//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/admin/programs">
//                         <Database className="h-4 w-4" />
//                         <span>Programs</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>

//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/admin/subjects">
//                         <BookOpen className="h-4 w-4" />
//                         <span>Subjects</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>

//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/admin/school-years">
//                         <FileText className="h-4 w-4" />
//                         <span>School Years</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>

//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/admin/periods">
//                         <Wand2 className="h-4 w-4" />
//                         <span>Periods</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>

//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/admin/classrooms">
//                         <Users className="h-4 w-4" />
//                         <span>Classrooms</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>

//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/admin/classes">
//                         <Users className="h-4 w-4" />
//                         <span>Classes</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>
//                 </SidebarMenu>
//               </SidebarGroupContent>
//             </SidebarGroup>
//           </>
//         ) : (
//           <SidebarGroup>
//             <SidebarGroupLabel>Workspace</SidebarGroupLabel>
//             <SidebarGroupContent>
//               <SidebarMenu>
//                 {/* <SidebarMenuItem>
//                   <SidebarMenuButton asChild>
//                     <NavLink to="/dashboard/notes">
//                       <FileText className="h-4 w-4" />
//                       <span>Notes</span>
//                     </NavLink>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem> */}

//                 <SidebarMenuItem>
//                   <SidebarMenuButton asChild>
//                     <NavLink to="/dashboard/catalog/programs">
//                       <Database className="h-4 w-4" />
//                       <span>Programs</span>
//                     </NavLink>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem>

//                 <SidebarMenuItem>
//                   <SidebarMenuButton asChild>
//                     <NavLink to="/dashboard/catalog/subjects">
//                       <BookOpen className="h-4 w-4" />
//                       <span>Subjects</span>
//                     </NavLink>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem>

//                 {isTeacher ? (
//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/teacher/classes">
//                         <HatGlasses className="h-4 w-4" />
//                         <span>Classes</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>
//                 ) : isStudent ? (
//                   <SidebarMenuItem>
//                     <SidebarMenuButton asChild>
//                       <NavLink to="/dashboard/student/classes">
//                         <GraduationCap className="h-4 w-4" />
//                         <span>My Classes</span>
//                       </NavLink>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>
//                 ) : null}
//               </SidebarMenu>
//             </SidebarGroupContent>
//           </SidebarGroup>
//         )}
//       </SidebarContent>

//       <SidebarFooter>
//         <Separator className="mb-2" />

//         {/* replaced commented popover with shadcn DropdownMenu */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <button
//               type="button"
//               className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent"
//             >
//               <Avatar className="h-8 w-8">
//                 <AvatarImage src="/avatar.png" alt="" />
//                 <AvatarFallback>
//                   {(userLabel?.[0] || "U").toUpperCase()}
//                   {(userLabel?.[1] || "").toUpperCase()}
//                 </AvatarFallback>
//               </Avatar>

//               <div className="min-w-0 flex-1">
//                 <div className="truncate text-sm font-medium">{userLabel}</div>
//                 <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
//               </div>

//               <SquareUser className="h-4 w-4 text-muted-foreground" />
//             </button>
//           </DropdownMenuTrigger>

//           <DropdownMenuContent align="end" className="w-56">
//             <DropdownMenuLabel>Account</DropdownMenuLabel>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem
//               onClick={() => {
//                 // placeholder; replace with your route
//                 // navigate("/dashboard/account");
//               }}
//             >
//               <SquareUser className="mr-2 h-4 w-4" />
//               Profile
//             </DropdownMenuItem>

//             <DropdownMenuSeparator />

//             <DropdownMenuItem
//               disabled={loggingOut}
//               onClick={() => {
//                 // keep same behavior you had in commented code
//                 logout().then(() => location.assign("/"));
//               }}
//               className="text-destructive focus:text-destructive"
//             >
//               <LogOut className="mr-2 h-4 w-4" />
//               {loggingOut ? "Signing out…" : "Log out"}
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </SidebarFooter>
//     </Sidebar>

//     {/* right side */}
//     <SidebarInset className="flex min-h-screen flex-1 min-w-0 flex-col overflow-hidden">
//       <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b  px-4 backdrop-blur">
//         {/* <SidebarTrigger /> */}
//         <div className="text-sm text-muted-foreground">{header}</div>
//       </header>

//       <main className="min-h-0 flex-1 overflow-hidden bg-red p-4">
//         <div className="flex h-full min-h-0 flex-col relative">
//           <Outlet />
//         </div>
//       </main>
//     </SidebarInset>
//   </div>
// </SidebarProvider>