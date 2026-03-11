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
import SignupMember from "./pages/SignupMember";

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
import MemberNotes from "./pages/MemberNotes";
import PendingNotice from "./pages/PendingNotice";

import NotePage from "./pages/NotePage";

import TeacherClasses from "./pages/TeacherClasses";
import TeacherProjects from "./pages/TeacherProjects";
import StudentClasses from "./pages/StudentClasses";
import ProjectPage from "./pages/ProjectPage";

function Protected() {
  const { booted, user } = useAuth();
  if (!booted) return <p style={{ padding: 24 }}>Initializing…</p>;
  return user ? <Outlet /> : <Navigate to="/" replace />;
}

function PublicOnly() {
  const { booted, user } = useAuth();
  if (!booted) return <p style={{ padding: 24 }}>Initializing…</p>;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function DashboardIndex() {
  const { roles } = useAuth();
  return (
    <Navigate
      to={roles.includes("admin") ? "/dashboard/admin/teachers" : "/dashboard/notes"}
      replace
    />
  );
}

function MemberGate() {
  const { roles } = useAuth();
  return roles.includes("teacher") || roles.includes("student") ? (
    <MemberNotes />
  ) : (
    <PendingNotice />
  );
}

const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      { path: "/", element: <Welcome /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <SignupChoice /> },
      { path: "/signup/school", element: <SignupSchool /> },
      { path: "/signup/member", element: <SignupMember /> },
    ],
  },

  {
    element: <Protected />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardIndex /> },

          /* admin */
          {
            path: "admin/teachers",
            element: <AdminTeachers />,
            handle: { header: "Teachers Management" },
          },
          {
            path: "admin/students",
            element: <AdminStudents />,
            handle: { header: "Students Management" },
          },
          {
            path: "admin/programs",
            element: <AdminPrograms />,
            handle: { header: "Programs" },
          },
          {
            path: "admin/subjects",
            element: <AdminSubjects />,
            handle: { header: "Subjects" },
          },
          {
            path: "admin/school-years",
            element: <AdminSchoolYears />,
            handle: { header: "School Years" },
          },
          {
            path: "admin/periods",
            element: <AdminPeriods />,
            handle: { header: "Periods" },
          },
          {
            path: "admin/classrooms",
            element: <AdminClassrooms />,
            handle: { header: "Classrooms" },
          },
          {
            path: "admin/classes",
            element: <AdminClasses />,
            handle: { header: "Classes" },
          },

          /* member */
          {
            path: "notes",
            element: <MemberGate />,
            handle: { header: "Notes" },
          },
          {
            path: "catalog/programs",
            element: <MemberPrograms />,
            handle: { header: "Programs Catalog" },
          },
          {
            path: "catalog/subjects",
            element: <MemberSubjects />,
            handle: { header: "Subjects Catalog" },
          },

          /* teacher / student */
          {
            path: "teacher/classes",
            element: <TeacherClasses />,
            handle: { header: "Teacher Classes" },
          },
          {
            path: "teacher/classes/:classId/projects",
            element: <TeacherProjects />,
            handle: { header: "Projects" },
          },
          {
            path: "teacher/classes/:classId/projects/:projectId",
            element: <ProjectPage />,
            handle: { header: "Project" },
          },
          {
            path: "student/classes",
            element: <StudentClasses />,
            handle: { header: "Student Classes" },
          },
          {
            path: "student/classes/:classId/projects/:projectId",
            element: <ProjectPage />,
            handle: { header: "Project" },
          },
        ],
      },


    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}