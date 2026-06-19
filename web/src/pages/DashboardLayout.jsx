import React, { useState } from "react";
import { Outlet, NavLink, useMatches } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  EllipsisVertical,
  UserRound,
  CircleArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const userLabel = user?.name || user?.email || "User";
  // const userEmail = user?.email || "";


  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const schoolName = `${school?.name || "School"}`;


  const dashboardHeaderElm = (
    <div className="flex h-full justify-between items-center px-12  ">

      <div className="flex items-center justify-center gap-[2em]">
        <a className="flex items-center justify-center gap-2">
          <img src="/logo-light.svg" className="h-10 w-10" />
          <span className="text-lg font-semibold leading-none tracking-tight text-[#111]">
            KmScope
          </span>
        </a>

        <nav className="flex min-w-0 items-center justify-center gap-[2em] text-[16px] font-semibold leading-none text-[#3e4c59]">
          {isAdmin ? (
            <>


              <NavLink to="/dashboard/admin/school-years">Years</NavLink>
              <NavLink to="/dashboard/admin/periods">Periods</NavLink>
              <NavLink to="/dashboard/admin/programs">Programs</NavLink>
              <NavLink to="/dashboard/admin/subjects">Subjects</NavLink>
              <NavLink to="/dashboard/admin/classrooms">Classrooms</NavLink>
              <NavLink to="/dashboard/admin/classes">Classes</NavLink>
              <NavLink to="/dashboard/admin/teachers">Teachers</NavLink>
              <NavLink to="/dashboard/admin/students">Students</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard/catalog/programs">Programs</NavLink>
              <NavLink to="/dashboard/catalog/subjects">Subjects</NavLink>
              <NavLink to={`/dashboard/${isTeacher ? "teacher" : "student"}/classes`}>
                Classes
              </NavLink>
            </>
          )}
        </nav>
      </div>



      <div className="col-span-4 flex items-center justify-end sm:col-span-4 xl:col-end-13">
        <div className="relative">
          <button
            className="flex w-fit max-w-[120px] flex-row-reverse items-center justify-center gap-2 rounded-sm border border-[#e2e8f0] px-2 py-2 text-sm font-semibold text-[#3e4c59] hover:border-[#cad5e2] hover:bg-[#fbfcfd] sm:max-w-[220px] sm:gap-[14px] sm:pl-4 sm:pr-2 sm:text-[16px]"
            onClick={() => setIsDropdownOpen((current) => !current)}
          >
            <EllipsisVertical size={18} className="shrink-0" />
            <span className="truncate">{userLabel}</span>
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
    </div>
  )
  const projectHeaderElm = (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] min-w-0 items-center ">

      <a className="col-span-1 flex aspect-square shrink-0 overflow-hidden select-none">

        <img src="/logo-light.svg" alt="Logo" className="m-auto w-8 h-8" />
      </a>

      <div className="col-span-1 flex justify-between px-2 ">

        <div className="flex items-center gap-2">
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

        <div className=" flex items-center justify-end">
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
      </div>




    </div>
  )

  return (


    <div className="grid h-dvh w-full bg-[#f5f7fa] grid-rows-[60px_minmax(0,1fr)]">
      <header className="w-full border-b border-slate-200 bg-white h-15">

        {isProjectMode ? projectHeaderElm : dashboardHeaderElm}

      </header>
      {isProjectMode ? (
        <main className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      ) : (
        <main className="mt-11.5 mx-auto min-h-0 w-full overflow-x-hidden overflow-y-auto md:max-w-184 lg:max-w-240 xl:max-w-290 min-[1440px]:max-w-328 min-[1920px]:max-w-380 ">
          <Outlet />
        </main>
      )}

    </div >


  );
}
