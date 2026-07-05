import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Car,
  Settings,
  ChevronRight,
  Hash
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar as UiSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

import { prisma } from "@/lib/prisma";

export async function Sidebar() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  let isAdmin = false;
  if (session?.user?.id) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId: session.user.id },
      include: { role: true }
    });
    isAdmin = userRoles.some(ur => ur.role.name === "ADMIN" || ur.role.name === "SUPERADMIN");
  }

  return (
    <UiSidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b">
        <h1 className="font-bold text-xl tracking-tight text-primary">MTOP System</h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={
                  <Link href="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                } />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton render={
                  <Link href="/drivers">
                    <Users />
                    <span>Drivers & Operators</span>
                  </Link>
                } />
              </SidebarMenuItem>

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger render={
                    <SidebarMenuButton>
                      <FileText />
                      <span>Franchises</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[panel-open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  } />
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton render={<Link href="/franchises"><span>List of Franchises</span></Link>} />
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton render={<Link href="/franchises/new"><span>New Application</span></Link>} />
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton render={<Link href="/franchises/renewal"><span>Renewal</span></Link>} />
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton render={<Link href="/franchises/expired"><span>Expired Franchises</span></Link>} />
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton render={<Link href="/franchises/dropping"><span>Dropping</span></Link>} />
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton render={<Link href="/franchises/reports"><span>Reports</span></Link>} />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton render={
                  <Link href="/tricycles">
                    <Car />
                    <span>Tricycles & Permits</span>
                  </Link>
                } />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton render={
                  <Link href="/body-numbers">
                    <Hash />
                    <span>Body Numbers</span>
                  </Link>
                } />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton render={
                  <Link href="/violations">
                    <AlertTriangle />
                    <span>Violations</span>
                  </Link>
                } />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger render={
                      <SidebarMenuButton>
                        <Users />
                        <span>Users Management</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[panel-open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    } />
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton render={<Link href="/users"><span>List of Users</span></Link>} />
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
                <SidebarMenuItem>
                  <SidebarMenuButton render={
                    <Link href="/audit-logs">
                      <FileText />
                      <span>Audit Logs</span>
                    </Link>
                  } />
                </SidebarMenuItem>
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger render={
                      <SidebarMenuButton>
                        <Settings />
                        <span>Financial Settings</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[panel-open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    } />
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton render={<Link href="/financial"><span>Item Accounts</span></Link>} />
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton render={<Link href="/settings/fees"><span>Fee Rules</span></Link>} />
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </UiSidebar>
  );
}
