"use client";

import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext } from "react";

import type { AuthUser } from "@/lib/api/client";

type AuthUserContextValue = {
  user: AuthUser;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
};

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

export function AuthUserProvider({ children, user, setUser }: AuthUserContextValue & { children: ReactNode }) {
  return <AuthUserContext.Provider value={{ user, setUser }}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  const value = useContext(AuthUserContext);
  if (!value) throw new Error("useAuthUser must be used inside AuthUserProvider.");
  return value;
}
