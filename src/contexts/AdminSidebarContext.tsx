"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AdminSidebarContextValue = {
  isSidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  toggleSidebar: () => void;
};

const AdminSidebarContext = createContext<AdminSidebarContextValue | undefined>(undefined);

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const value = useMemo(
    () => ({ isSidebarOpen, setSidebarOpen, toggleSidebar }),
    [isSidebarOpen]
  );

  return (
    <AdminSidebarContext.Provider value={value}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (!context) {
    throw new Error("useAdminSidebar must be used within an AdminSidebarProvider");
  }
  return context;
}
