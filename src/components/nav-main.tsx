import { type Icon } from "@tabler/icons-react"
import { cn } from "@/lib/utils"


import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { useChatStore, getUnreadConversationsCount } from "@/hooks/store/useChatStore"
import { useAuthStore } from "@/hooks/store/authStore"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {

  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const unreadCount = useChatStore(state => getUnreadConversationsCount(state, user?._id))

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive = location.pathname === item.url
            const showBadge = item.url === '/direct' && unreadCount > 0
            return (
              <SidebarMenuItem key={item.title} className="relative">
                <SidebarMenuButton
                  isActive={isActive}
                  className={cn(
                    "h-12 px-4 rounded-2xl transition-all duration-300 font-medium",
                    isActive
                      ? "bg-primary/10 text-primary shadow-soft"
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                  tooltip={item.title}
                  onClick={() => navigate(item.url)}
                >
                  {item.icon && <item.icon className={cn("size-5", isActive && "text-primary")} />}
                  <span className="text-sm font-bold tracking-tight">{item.title}</span>
                  {showBadge && (
                    <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
