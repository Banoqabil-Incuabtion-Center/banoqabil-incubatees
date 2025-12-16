import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
    "/": "Home",
    "/direct": "Direct",
    "/posts": "Community",
    "/attendance": "Attendance",
    "/profile": "Profile",
    "/notifications": "Notifications",
    "/activities": "Activity"
};

export function MobilePageTitle({ className }: { className?: string }) {
    const location = useLocation();
    const pathname = location.pathname;

    // Helper to find best matching title (handles sub-routes if needed, though exact match is fine for now)
    const title = PAGE_TITLES[pathname] || "IMS";

    return (
        <div className={cn("font-bold text-xl md:hidden", className)}>
            {title}
        </div>
    );
}
