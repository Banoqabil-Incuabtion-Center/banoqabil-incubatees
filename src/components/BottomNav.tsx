import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, CalendarCheck, User, Send, Users, MoreHorizontal, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/hooks/store/useChatStore'
import { useAuthStore } from '@/hooks/store/authStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

const navItems = [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Direct', url: '/direct', icon: Send },
    { title: 'Community', url: '/posts', icon: Users },
    { title: 'Attendance', url: '/attendance', icon: Check },
    { title: 'Calendar', url: '/calendar', icon: CalendarCheck },
    { title: 'Profile', url: '/profile', icon: User },
]

export function BottomNav() {
    const location = useLocation()
    const { user } = useAuthStore()
    const unreadCount = useChatStore(state => state.unreadCount)
    const [open, setOpen] = useState(false)

    // Show first 3 items, put rest in "More"
    const visibleItems = navItems.slice(0, 3)
    const hiddenItems = navItems.slice(3)

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-primary/5 md:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
                {visibleItems.map((item) => {
                    const isActive = location.pathname === item.url
                    const Icon = item.icon
                    const showBadge = item.url === '/direct' && unreadCount > 0

                    return (
                        <Link
                            key={item.url}
                            to={item.url}
                            className="flex flex-col items-center justify-center flex-1 group gap-1"
                        >
                            <div className="relative flex items-center justify-center h-8 w-16 mb-0.5">
                                <div className={cn(
                                    "absolute inset-0 rounded-full bg-primary/10 transition-all duration-300 ease-in-out",
                                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
                                )} />

                                <div className="relative flex items-center justify-center">
                                    <Icon className={cn(
                                        "h-6 w-6 transition-all duration-300",
                                        isActive ? "text-primary stroke-[2.5px]" : "text-muted-foreground stroke-[2px] group-hover:text-foreground"
                                    )} />
                                    {showBadge && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-3 -right-3 h-4 min-w-4 px-1 text-[10px] font-black border-2 border-background shadow-sm"
                                        >
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <span className={cn(
                                "text-[11px] font-black tracking-tight transition-colors duration-300",
                                "text-muted-foreground",
                                isActive && "text-primary"
                            )}>
                                {item.title}
                            </span>
                        </Link>
                    )
                })}

                {/* More Button */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center justify-center flex-1 group gap-1">
                            <div className="relative flex items-center justify-center h-8 w-16 mb-0.5">
                                <div className={cn(
                                    "absolute inset-0 rounded-full bg-primary/10 transition-all duration-300 ease-in-out",
                                    open ? "opacity-100 scale-100" : "opacity-0 scale-75"
                                )} />
                                <MoreHorizontal className={cn(
                                    "h-6 w-6 transition-all duration-300",
                                    open ? "text-primary stroke-[2.5px]" : "text-muted-foreground stroke-[2px] group-hover:text-foreground"
                                )} />
                            </div>
                            <span className={cn(
                                "text-[11px] font-black tracking-tight transition-colors duration-300",
                                open ? "text-primary" : "text-muted-foreground"
                            )}>
                                More
                            </span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-[28px] px-4 pb-6 pt-3">
                        {/* M3 Drag Handle */}
                        <div className="mx-auto h-1 w-8 rounded-full bg-muted-foreground/20 mb-6" />

                        <SheetHeader className="mb-6 text-left sr-only">
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-4 gap-4">
                            {hiddenItems.map((item) => {
                                const isActive = location.pathname === item.url
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.url}
                                        to={item.url}
                                        onClick={() => setOpen(false)}
                                        className="flex flex-col items-center justify-center gap-2 p-2 group"
                                    >
                                        <div className={cn(
                                            "relative flex items-center justify-center h-8 w-16 rounded-full transition-all duration-300",
                                            isActive ? "bg-primary/10" : "group-hover:bg-secondary"
                                        )}>
                                            <Icon className={cn(
                                                "w-6 h-6 transition-all duration-300",
                                                isActive ? "text-primary stroke-[2.5px]" : "text-muted-foreground stroke-[2px]"
                                            )} />
                                        </div>
                                        <span className={cn(
                                            "text-[11px] font-medium text-center truncate w-full transition-colors",
                                            isActive ? "text-primary font-bold" : "text-muted-foreground"
                                        )}>
                                            {item.title}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    )
}
