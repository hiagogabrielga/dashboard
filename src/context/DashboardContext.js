"use client";
import { createContext, useContext } from "react";

export const DashboardCtx = createContext(null);

export function useDashboard() {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboard deve ser usado dentro do DashboardCtx.Provider");
  return ctx;
}
