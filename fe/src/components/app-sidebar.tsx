"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Blocks,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Package,
  Settings as SettingsIcon,
  Truck,
  Users,
} from "lucide-react";
import Image from "next/image";
import { Separator } from "./ui/separator";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "#" },
  { label: "Orders", icon: ClipboardList, href: "#" },
  { label: "Customers", icon: Users, href: "#" },
  { label: "Products", icon: Package, href: "#" },
  { label: "Pricing", icon: DollarSign, href: "#", active: true },
  { label: "Freight", icon: Truck, href: "#", badge: "NEW" },
  { label: "Integrations", icon: Blocks, href: "#" },
];

export function AppSidebar() {
  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="pt-16">
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.active}
                    className="h-10"
                  >
                    <a href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge className="text-xs font-semibold text-emerald-600">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
              <Separator />
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10">
                  <a href="#">
                    <SettingsIcon className="size-4" />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 pb-4 flex items-center">
          <Image
            width={100}
            height={100}
            className="object-contain"
            src="/FOBOH_Logo_final 1.png"
            alt=""
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
