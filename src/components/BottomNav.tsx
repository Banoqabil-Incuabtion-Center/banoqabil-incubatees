import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, CalendarCheck, User, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Direct', url: '/direct', icon: Send },
    { title: 'Posts', url: '/posts', icon: FileText },
    { title: 'Attendance', url: '/attendance', icon: CalendarCheck },
]

export function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.url
                    const Icon = item.icon

                    return (
                        <Button
                            key={item.url}
                            variant="ghost"
                            size="sm"
                            asChild
                            className={cn(
                                "flex-col h-14 w-16 gap-1 rounded-xl",
                                isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                            )}
                        >
                            <Link to={item.url}>
                                <Icon className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{item.title}</span>
                            </Link>
                        </Button>
                    )
                })}
            </div>
        </nav>
    )
}
