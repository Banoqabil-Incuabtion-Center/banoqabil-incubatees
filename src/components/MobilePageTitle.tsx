import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageMeta {
    title: string;
    description?: string;
}

const PAGE_META: Record<string, PageMeta> = {
    "/": { title: "Home" },
    "/direct": { title: "Direct" },
    "/posts": { title: "Community" },
    "/attendance": { title: "Attendance" },
    "/profile": { title: "Profile"  },
    "/notifications": { title: "Notifications" },
    "/activities": { title: "Activity" },
    "/calendar": { title: "Calendar" }
};

export function MobilePageTitle({ className }: { className?: string }) {
    const location = useLocation();
    const pathname = location.pathname;

    // Helper to find best matching title (handles sub-routes if needed, though exact match is fine for now)
    const meta = PAGE_META[pathname] || { title: "IMS" };

    return (
        <div className={cn(
            "md:hidden animate-in fade-in slide-in-from-left-4 duration-500",
            className
        )}>
            <span className="font-black text-xl tracking-tight text-foreground">
                {meta.title}
            </span>
            {meta.description && (
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {meta.description}
                </p>
            )}
        </div>
    );
}
