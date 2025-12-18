import { type Icon } from "@tabler/icons-react"
import { cn } from "@/lib/utils"


import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
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

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive = location.pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
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
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
