import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PricingSetup } from "@/components/pricing-setup";

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PricingSetup />
      </SidebarInset>
    </SidebarProvider>
  );
}
