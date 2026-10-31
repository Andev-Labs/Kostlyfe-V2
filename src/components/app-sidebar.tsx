"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileText,
  Hammer,
  Home,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const GROUPS = [
  {
    label: "Ringkasan",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/tagihan", label: "Tagihan", icon: Receipt },
      { href: "/pembayaran", label: "Pembayaran", icon: CreditCard },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/kontrakan", label: "Kontrakan", icon: Home },
      { href: "/penghuni", label: "Penghuni", icon: Users },
      { href: "/sewa", label: "Sewa", icon: FileText },
    ],
  },
  {
    label: "Biaya",
    items: [
      { href: "/renovasi", label: "Renovasi", icon: Hammer },
      { href: "/pengeluaran", label: "Pengeluaran", icon: Wallet },
    ],
  },
  {
    label: "Lainnya",
    items: [{ href: "/pengaturan", label: "Pengaturan", icon: Settings }],
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Kostlyfe</span>
                  <span className="truncate text-xs text-muted-foreground">Manajemen kontrakan</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<NavGroups pathname="" />}>
          <ActiveNavGroups />
        </Suspense>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function ActiveNavGroups() {
  return <NavGroups pathname={usePathname()} />;
}

function NavGroups({ pathname }: { pathname: string }) {
  return GROUPS.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
