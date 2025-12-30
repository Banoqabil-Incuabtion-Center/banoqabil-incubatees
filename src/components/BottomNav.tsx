import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, CalendarCheck, User, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useChatStore, getUnreadConversationsCount } from '@/hooks/store/useChatStore'
import { useAuthStore } from '@/hooks/store/authStore'

const navItems = [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Direct', url: '/direct', icon: Send },
    { title: 'Community', url: '/posts', icon: Users },
    { title: 'Attendance', url: '/attendance', icon: CalendarCheck },
    { title: 'Profile', url: '/profile', icon: User },
]

export function BottomNav() {
    const location = useLocation()
    const { user } = useAuthStore()
    const unreadCount = useChatStore(state => state.unreadCount)

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-primary/5 md:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
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
                                {/* M3 Pill Indicator - Just for the icon */}
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
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {item.title}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
