
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DynamicBreadcrumb } from "./DynamicBreadcrumb"

import { useAuthStore } from "@/hooks/store/authStore"
import { UserAvatar } from "./UserAvatar"
import { useNotificationStore } from "@/hooks/useNotificationStore"

import { Button } from "@/components/ui/button"
import { Download, Bell } from "lucide-react"
import { usePwaInstall } from "@/hooks/usePwaInstall"

import { MobilePageTitle } from "./MobilePageTitle"

export function SiteHeader() {
  const { user } = useAuthStore()
  const { isInstallable, installPwa } = usePwaInstall()
  const unreadCount = useNotificationStore(state => state.unreadCount)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-primary/5 bg-white/80 backdrop-blur-md shadow-premium transition-all ease-in-out group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/* Hide sidebar trigger on mobile - we have bottom nav instead */}
          <SidebarTrigger className="-ml-1 hidden md:flex" />
          {/* Breadcrumbs - Hidden on mobile */}
          <div className="hidden md:block">
            <DynamicBreadcrumb />
          </div>
          {/* Mobile Page Title */}
          <MobilePageTitle />
        </div>

        <div className="flex items-center gap-2">


          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 border-2 border-white text-[10px] font-black text-white shadow-soft animate-in zoom-in-50 duration-300">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Install App Button - Mobile Only */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={installPwa}
              className="md:hidden gap-1 h-8 rounded-full border-primary/20 text-primary hover:bg-primary/5"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs">Install</span>
            </Button>
          )}

          {/* Profile Link Removed - moved to BottomNav */}
        </div>
      </div>
    </header>
  )
}
