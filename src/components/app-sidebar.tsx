import * as React from "react"
import { Link } from 'react-router-dom'
import { APPNAME } from "@/lib/constant"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/UserAvatar"
import { Home, Send, FileText, CalendarCheck, Check, LogOut, ChevronUp, Download, User, History } from "lucide-react"
import Logout from "@/auth/Logout"
import { userRepo } from "../repositories/userRepo"
import { useAuthStore } from "@/hooks/store/authStore"
import { usePwaInstall } from "@/hooks/usePwaInstall"



const data = {
  navMain: [
    { title: "Home", url: "/", icon: Home },
    { title: "Direct", url: "/direct", icon: Send },
    { title: "Posts", url: "/posts", icon: FileText },
    { title: "Attendance", url: "/attendance", icon: CalendarCheck },
  ],
}

export function AppSidebar(props) {

  const { user, setUser, isLoading, setLoading } = useAuthStore()
  const { isInstallable, installPwa } = usePwaInstall()

  const triggerLogout = () => {
    document.getElementById("logoutBtn")?.click()
  }


  return (
    <Sidebar collapsible="offcanvas" {...props}>

      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/">
                <Home className="!size-5" />
                <span className="text-base font-semibold">{APPNAME}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">


        <NavMain items={data.navMain} />
        <div className="mt-auto border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full rounded-lg hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-center gap-3 px-2 py-2">
                <UserAvatar
                  src={user?.avatar}
                  name={user?.name}
                  className="h-9 w-9"
                  fallbackColor="bg-gray-200"
                />

                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate w-full text-left">
                    {isLoading ? "Loading..." : user?.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left">
                    {isLoading ? "Loading..." : user?.email}
                  </span>
                </div>

                <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="end"
              className="w-56 mb-2"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {isInstallable && (
                <>
                  <DropdownMenuItem onClick={installPwa} className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Install App</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/activities" className="cursor-pointer">
                  <History className="mr-2 h-4 w-4" />
                  <span>Activities</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={triggerLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Logout />

      </SidebarContent>

    </Sidebar>
  )
}