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
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-sidebar-border bg-background/95 backdrop-blur-sm md:hidden safe-area-bottom shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-around h-12 max-w-lg mx-auto px-4">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.url
                    const Icon = item.icon
                    const showBadge = item.url === '/direct' && unreadCount > 0

                    return (
                        <Link
                            key={item.url}
                            to={item.url}
                            className={cn(
                                "flex flex-col items-center justify-center transition-all duration-300 min-w-[64px]",
                                isActive ? "text-primary scale-110" : "text-muted-foreground/40 hover:text-muted-foreground/60"
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn(
                                    "h-6 w-6 transition-all duration-300",
                                    isActive ? "stroke-[2.5px]" : "stroke-[2px]"
                                )} />
                                {showBadge && (
                                    <Badge variant="destructive" className="absolute -top-2 -right-3 h-4 min-w-4 px-1 text-[10px] font-bold border-2 border-background animate-in zoom-in-0 duration-300">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
