"use client";

import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings as SettingsIcon,
  DollarSign,
  Truck,
  Blocks,
  Package,
} from "lucide-react";
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

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "#" },
  { label: "Orders", icon: ClipboardList, href: "#" },
  { label: "Customers", icon: Users, href: "#" },
  { label: "Products", icon: Package, href: "#" },
  { label: "Pricing", icon: DollarSign, href: "#", active: true },
  { label: "Freight", icon: Truck, href: "#", badge: "NEW" },
  { label: "Integrations", icon: Blocks, href: "#" },
  { label: "Settings", icon: SettingsIcon, href: "#" },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 pb-4">
          <span className="text-lg font-bold tracking-tight text-foreground">
            FOBOH
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
