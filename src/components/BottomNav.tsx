import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, CalendarCheck, User, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Direct', url: '/direct', icon: Send },
    { title: 'Community', url: '/posts', icon: Users },
    { title: 'Attendance', url: '/attendance', icon: CalendarCheck },
    { title: 'Profile', url: '/profile', icon: User },
]

export function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-sidebar-border bg-white md:hidden safe-area-bottom shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-around h-12 max-w-lg mx-auto px-4">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.url
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.url}
                            to={item.url}
                            className={cn(
                                "flex flex-col items-center justify-center transition-all duration-300 relative min-w-[64px]",
                                isActive ? "text-primary scale-110" : "text-muted-foreground/40 hover:text-muted-foreground/60"
                            )}
                        >
                            <Icon className={cn(
                                "h-6 w-6 transition-all duration-300",
                                isActive ? "stroke-[2.5px]" : "stroke-[2px]"
                            )} />
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
