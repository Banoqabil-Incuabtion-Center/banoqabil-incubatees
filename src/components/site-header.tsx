
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DynamicBreadcrumb } from "./DynamicBreadcrumb"

import { useAuthStore } from "@/hooks/store/authStore"
import { UserAvatar } from "./UserAvatar"
import { useNotificationStore } from "@/hooks/useNotificationStore"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Bell } from "lucide-react"
import { usePwaInstall } from "@/hooks/usePwaInstall"

import { MobilePageTitle } from "./MobilePageTitle"

export function SiteHeader() {
  const { user } = useAuthStore()
  const { isInstallable, installPwa } = usePwaInstall()
  const unreadCount = useNotificationStore(state => state.unreadCount)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center border-b border-sidebar-border bg-background/95 backdrop-blur-sm transition-all ease-in-out group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 sm:px-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          {/* Sidebar Trigger - Refined for desktop */}
          <SidebarTrigger className="-ml-2 hidden md:flex h-9 w-9 rounded-xl hover:bg-primary/5 transition-colors" />

          {/* Breadcrumbs - Hidden on mobile */}
          <div className="hidden md:block transition-all duration-300">
            <DynamicBreadcrumb />
          </div>

          {/* Mobile Page Title - Custom typography */}
          <MobilePageTitle />
        </div>

        <div className="flex items-center gap-3">
          {/* Install App Button - Mobile Only - Premium styling */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={installPwa}
              className="md:hidden gap-2 h-9 px-4 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 font-black text-[10px] tracking-widest shadow-sm shadow-primary/5 transition-all active:scale-95 uppercase"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </Button>
          )}

          {/* Notifications Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="group relative h-9 w-9 rounded-xl hover:bg-primary/5 transition-colors"
            asChild
          >
            <Link to="/notifications">
              <Bell className={cn(
                "h-5 w-5 transition-all duration-300",
                location.pathname === "/notifications"
                  ? "text-primary scale-110 stroke-[2.5px]"
                  : "text-muted-foreground/60 group-hover:text-primary"
              )} />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-bold border-2 border-background animate-in zoom-in-0 duration-300">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Profile Link Removed - moved to BottomNav */}
        </div>
      </div>
    </header>
  )
}
