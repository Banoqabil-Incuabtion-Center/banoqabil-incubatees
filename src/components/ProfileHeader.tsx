import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Link as LinkIcon, LogOut, Palette, Moon, Sun, MoreHorizontal } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuthStore } from "@/hooks/store/authStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileHeaderProps {
  user: any
  isOwner?: boolean
}

export function ProfileHeader({ user, isOwner = false }: ProfileHeaderProps) {
  const navigate = useNavigate()
  const { setTheme, theme } = useTheme()
  const { setLogoutDialogOpen } = useAuthStore()

  // Format join date if available
  const createdAtObj = user?.createdAt || (user?._id ? new Date(parseInt(user._id.substring(0, 8), 16) * 1000) : null);
  const joinDate = createdAtObj 
    ? new Date(createdAtObj).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "March 2024" // fallback for UI 

  return (
    <div className="flex flex-col bg-background w-full border-b border-border">
      {/* Cover Banner */}
      <div className="h-32 sm:h-48 w-full bg-muted relative overflow-hidden">
        {user?.coverImage ? (
          <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-900" />
        )}
      </div>

      {/* Profile Info Section */}
      <div className="px-4 sm:px-6 relative pb-4 text-foreground">
        {/* Avatar & Buttons Row */}
        <div className="flex justify-between items-start">
          <Avatar className="relative -mt-12 sm:-mt-16 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-muted">
            <AvatarImage src={user?.avatar} alt={user?.name || "User Avatar"} className="object-cover" />
            <AvatarFallback className="text-2xl sm:text-4xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="mt-3 flex items-center gap-2">
            {isOwner ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-border">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem onClick={() => navigate("/profile/customize")} className="gap-2 cursor-pointer">
                      <Palette className="w-4 h-4" />
                      <span>Customize Profile Card</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="gap-2 cursor-pointer">
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  className="rounded-full font-bold px-4 h-9 border-border hover:bg-muted transition-colors"
                  onClick={() => navigate("/profile/edit")}
                >
                  Edit profile
                </Button>
              </>
            ) : (
              <Button className="rounded-full font-bold px-6 h-9">
                Follow
              </Button>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="mt-2 text-left">
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
            {user?.name || "User Name"}
          </h1>
          <p className="text-muted-foreground text-sm">
            @{user?.bq_id || user?._id?.slice(-8) || "username"}
          </p>
        </div>

        {/* Bio */}
        {user?.bio && (
          <div className="mt-3 text-[15px] leading-snug">
            <p className="whitespace-pre-wrap">{user.bio}</p>
          </div>
        )}

        {/* Metadata (Location, Link, Join Date) */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {user?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          )}
          {user?.portfolio && (
            <div className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" />
              <a href={user.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {user.portfolio.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          <div className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4" />
            <span>Joined {joinDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
