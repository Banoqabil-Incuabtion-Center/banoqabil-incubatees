
import { Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import MarkAttendance from "./MarkAttendance"
import { useAuthStore } from "@/hooks/store/authStore"
import { UserAvatar } from "./UserAvatar"
import { useNotificationStore } from "@/hooks/useNotificationStore"

import { Button } from "@/components/ui/button"
import { Download, Bell } from "lucide-react"
import { usePwaInstall } from "@/hooks/usePwaInstall"

export function SiteHeader() {
  const { user } = useAuthStore()
  const { isInstallable, installPwa } = usePwaInstall()
  const unreadCount = useNotificationStore(state => state.unreadCount)

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-1 sm:gap-2 border-b bg-white transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {/* Hide sidebar trigger on mobile - we have bottom nav instead */}
          <SidebarTrigger className="-ml-1 hidden md:flex" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4 hidden md:block"
          />
        </div>

        <div className="flex items-center gap-2">
          <MarkAttendance userId={user?._id} />

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
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

          {/* Profile Link - Mobile Only */}
          <Link to="/profile" className="md:hidden">
            <UserAvatar
              src={user?.avatar}
              name={user?.name}
              className="w-8 h-8 rounded-lg border border-border"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
