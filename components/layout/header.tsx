"use client";

import * as React from "react";
import { User, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Header() {
  const router = useRouter();
  const [sessionData, setSessionData] = React.useState<any>(null);
  const [isPending, setIsPending] = React.useState(true);

  React.useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await authClient.getSession();
        
        // Strict Tab-Close Logout Enforcement
        if (data) {
          const isSessionActive = sessionStorage.getItem("mtop_session_active");
          if (!isSessionActive) {
            // This is a new tab without inherited session storage, meaning 
            // the previous tab was closed. Force a logout.
            await authClient.signOut();
            setSessionData(null);
            router.push("/login");
            return;
          }
        }
        
        setSessionData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsPending(false);
      }
    };
    fetchSession();
  }, [router]);
  
  const user = sessionData?.user;

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      sessionStorage.removeItem("mtop_session_active");
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col text-left">
              {isPending ? (
                <>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">{user?.name || "Guest"}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {/* @ts-ignore: role might not be explicitly typed in base client */}
                    {user?.role?.toLowerCase() || "User"}
                  </span>
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
