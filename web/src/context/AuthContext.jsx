import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rehydrateAccess } from "../api/axios";
import {
  loginApi,
  registerSchoolApi,
  registerMemberApi,
  checkAuthApi,
  logoutApi,
  checkOrganizationAccessApi,
  setupOrganizationAdminApi,
  checkMemberInviteApi,
  acceptMemberInviteApi,
} from "../api/auth";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [booted, setBooted] = useState(false);

  const authQ = useQuery({
    queryKey: ["authUser"],
    queryFn: checkAuthApi,
    enabled: false,
    retry: false,
  });

  useEffect(() => {
    (async () => {
      const had = await rehydrateAccess();

      if (had) {
        await authQ.refetch();
      }

      setBooted(true);
    })();
  }, []); // eslint-disable-line

  const login = useMutation({
    mutationFn: loginApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["authUser"] });
      await authQ.refetch();
    },
  });

  const registerSchool = useMutation({
    mutationFn: registerSchoolApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["authUser"] });
      await authQ.refetch();
    },
  });

  const registerMember = useMutation({
    mutationFn: registerMemberApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["authUser"] });
      await authQ.refetch();
    },
  });

  const checkOrganizationAccess = useMutation({
    mutationFn: checkOrganizationAccessApi,
  });

  const setupOrganizationAdmin = useMutation({
    mutationFn: setupOrganizationAdminApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["authUser"] });
      await authQ.refetch();
    },
  });

  const checkMemberInvite = useMutation({
    mutationFn: checkMemberInviteApi,
  });

  const acceptMemberInvite = useMutation({
    mutationFn: acceptMemberInviteApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["authUser"] });
      await authQ.refetch();
    },
  });

  const logout = useMutation({
    mutationFn: logoutApi,
    onSuccess: async () => {
      await qc.removeQueries({ queryKey: ["authUser"] });
    },
  });

  const value = useMemo(
    () => ({
      booted,
      user: authQ.data?.user || null,
      roles: authQ.data?.roles || [],
      school: authQ.data?.school || null,
      pendingRequests: authQ.data?.pendingRequests || [],
      refetchAuth: authQ.refetch,

      login: login.mutateAsync,
      registerSchool: registerSchool.mutateAsync,
      registerMember: registerMember.mutateAsync,

      checkOrganizationAccess: checkOrganizationAccess.mutateAsync,
      setupOrganizationAdmin: setupOrganizationAdmin.mutateAsync,

      checkMemberInvite: checkMemberInvite.mutateAsync,
      acceptMemberInvite: acceptMemberInvite.mutateAsync,

      logout: logout.mutateAsync,
      loggingOut: logout.isPending,
    }),
    [
      booted,
      authQ,
      login,
      registerSchool,
      registerMember,
      checkOrganizationAccess,
      setupOrganizationAdmin,
      checkMemberInvite,
      acceptMemberInvite,
      logout,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);

  if (!v) {
    throw new Error("useAuth must be inside AuthProvider");
  }

  return v;
}