"use client";

import React from "react";
import AppShell from "@/components/AppShell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="w-full flex-1 flex flex-col animate-in fade-in">
        {children}
      </div>
    </AppShell>
  );
}
