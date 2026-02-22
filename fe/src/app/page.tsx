import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PricingSetup } from "@/components/pricing-setup";

export default function Home() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <PricingSetup />
      </SidebarInset>
    </SidebarProvider>
  );
}
