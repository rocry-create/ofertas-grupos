"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getToken } from "@/lib/api";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <main className={collapsed ? "md:ml-16 min-h-screen pt-14 md:pt-0" : "md:ml-64 min-h-screen pt-14 md:pt-0"}>
        <Topbar />
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8">{children}</div>
      </main>
    </>
  );
}
