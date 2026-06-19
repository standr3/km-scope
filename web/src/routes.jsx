import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import SignupChoice from "./pages/SignupChoice";
import SignupSchool from "./pages/SignupSchool";

import DashboardLayout from "./pages/DashboardLayout";

import AdminTeachers from "./pages/AdminTeachers";
import AdminStudents from "./pages/AdminStudents";
import AdminPrograms from "./pages/AdminPrograms";
import AdminSubjects from "./pages/AdminSubjects";
import AdminSchoolYears from "./pages/AdminSchoolYears";
import AdminPeriods from "./pages/AdminPeriods";
import AdminClassrooms from "./pages/AdminClassrooms";
import AdminClasses from "./pages/AdminClasses";

import MemberPrograms from "./pages/MemberPrograms";
import MemberSubjects from "./pages/MemberSubjects";
import PendingNotice from "./pages/PendingNotice";

import TeacherClasses from "./pages/TeacherClasses";
import TeacherProjects from "./pages/TeacherProjects";
import StudentClasses from "./pages/StudentClasses";
import ProjectPage from "./pages/ProjectPage";
import ProjectPerformancePage from "./pages/ProjectPerformancePage";

/**
 * Permite accesul doar utilizatorilor autentificați.
 */
function Protected() {
  const { booted, user } = useAuth();

  if (!booted) {
    return <p style={{ padding: 24 }}>Initializing…</p>;
  }

  return user ? <Outlet /> : <Navigate to="/" replace />;
}

/**
 * Permite accesul doar utilizatorilor neautentificați.
 */
function PublicOnly() {
  const { booted, user } = useAuth();

  if (!booted) {
    return <p style={{ padding: 24 }}>Initializing…</p>;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

/**
 * Protejează rutele în funcție de rol.
 */
function RoleGate({ allowedRoles }) {
  const { roles = [] } = useAuth();

  const hasAccess = allowedRoles.some((role) => roles.includes(role));

  return hasAccess ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

/**
 * Decide pagina inițială din dashboard.
 *
 * Utilizatorii fără rol aprobat rămân pe /dashboard
 * și văd PendingNotice.
 */
function DashboardIndex() {
  const { roles = [] } = useAuth();

  if (roles.includes("admin")) {
    return <Navigate to="/dashboard/admin/teachers" replace />;
  }

  if (roles.includes("teacher")) {
    return <Navigate to="/dashboard/teacher/classes" replace />;
  }

  if (roles.includes("student")) {
    return <Navigate to="/dashboard/student/classes" replace />;
  }

  return <PendingNotice />;
}

const router = createBrowserRouter([
  /**
   * Rute publice.
   */
  {
    element: <PublicOnly />,
    children: [
      {
        path: "/",
        element: <Welcome />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <SignupChoice />,
      },
      {
        path: "/signup/school",
        element: <SignupSchool />,
      },
      {
        path: "/signup/member",
        element: <Navigate to="/login" replace />,
      },
    ],
  },

  /**
   * Rute pentru utilizatorii autentificați.
   */
  {
    element: <Protected />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          /**
           * Pagina inițială.
           *
           * Admin -> Teachers Management
           * Teacher -> Teacher Classes
           * Student -> Student Classes
           * Fără rol -> PendingNotice
           */
          {
            index: true,
            element: <DashboardIndex />,
            handle: {
              header: "Pending Approval",
            },
          },

          /**
           * Cataloage disponibile utilizatorilor autentificați.
           */
          {
            path: "catalog/programs",
            element: <MemberPrograms />,
            handle: {
              header: "Programs Catalog",
            },
          },
          {
            path: "catalog/subjects",
            element: <MemberSubjects />,
            handle: {
              header: "Subjects Catalog",
            },
          },

          /**
           * Rute admin.
           */
          {
            element: <RoleGate allowedRoles={["admin"]} />,
            children: [
              {
                path: "admin/teachers",
                element: <AdminTeachers />,
                handle: {
                  header: "Teachers Management",
                },
              },
              {
                path: "admin/students",
                element: <AdminStudents />,
                handle: {
                  header: "Students Management",
                },
              },
              {
                path: "admin/programs",
                element: <AdminPrograms />,
                handle: {
                  header: "Programs",
                },
              },
              {
                path: "admin/subjects",
                element: <AdminSubjects />,
                handle: {
                  header: "Subjects",
                },
              },
              {
                path: "admin/school-years",
                element: <AdminSchoolYears />,
                handle: {
                  header: "School Years",
                },
              },
              {
                path: "admin/periods",
                element: <AdminPeriods />,
                handle: {
                  header: "Periods",
                },
              },
              {
                path: "admin/classrooms",
                element: <AdminClassrooms />,
                handle: {
                  header: "Classrooms",
                },
              },
              {
                path: "admin/classes",
                element: <AdminClasses />,
                handle: {
                  header: "Classes",
                },
              },
            ],
          },

          /**
           * Rute profesor.
           */
          {
            element: <RoleGate allowedRoles={["teacher"]} />,
            children: [
              {
                path: "teacher/classes",
                element: <TeacherClasses />,
                handle: {
                  header: "Teacher Classes",
                },
              },
              {
                path: "teacher/classes/:classId/projects",
                element: <TeacherProjects />,
                handle: {
                  header: "Projects",
                },
              },
              {
                path: "teacher/classes/:classId/projects/:projectId",
                element: <ProjectPage />,
                handle: {
                  header: "Project",
                  layoutMode: "project",
                },
              },
              {
                path: "teacher/classes/:classId/projects/:projectId/performance",
                element: <ProjectPerformancePage />,
                handle: {
                  header: "Performance Analysis",
                },
              },
            ],
          },

          /**
           * Rute student.
           */
          {
            element: <RoleGate allowedRoles={["student"]} />,
            children: [
              {
                path: "student/classes",
                element: <StudentClasses />,
                handle: {
                  header: "Student Classes",
                },
              },
              {
                path: "student/classes/:classId/projects/:projectId",
                element: <ProjectPage />,
                handle: {
                  header: "Project",
                  layoutMode: "project",
                },
              },
            ],
          },
        ],
      },
    ],
  },

  /**
   * Orice rută necunoscută revine la pagina principală.
   */
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}