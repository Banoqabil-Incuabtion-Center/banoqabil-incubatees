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
import { Home, Send, FileText, CalendarCheck, Check, LogOut, ChevronUp, Download, User, History, Users } from "lucide-react"
import Logout from "@/auth/Logout"
import { userRepo } from "../repositories/userRepo"
import { useAuthStore } from "@/hooks/store/authStore"
import { usePwaInstall } from "@/hooks/usePwaInstall"



const data = {
  navMain: [
    { title: "Home", url: "/", icon: Home },
    { title: "Direct", url: "/direct", icon: Send },
    { title: "Community", url: "/posts", icon: Users },
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

      <SidebarHeader className="p-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src="/bq-image.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-tight leading-none">{APPNAME}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">


        <NavMain items={data.navMain} />
        <div className="mt-auto p-4">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-primary/5 shadow-soft hover:shadow-premium hover:border-primary/10 hover:translate-y-[-2px] transition-all group"
          >
            <UserAvatar
              src={user?.avatar}
              name={user?.name}
              className="h-10 w-10 border-2 border-primary/10 shadow-soft"
              fallbackColor="bg-primary"
            />

            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-xs font-black truncate w-full text-left tracking-tight">
                {isLoading ? "Loading..." : user?.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate w-full text-left font-bold uppercase tracking-wider">
                {isLoading ? "Loading..." : (user?.status || user?.course)}
              </span>
            </div>
          </Link>
        </div>

        <Logout />

      </SidebarContent>

    </Sidebar>
  )
}