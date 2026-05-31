import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset className="bg-muted/20">
        <Header />
        <div className="flex-1 p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
