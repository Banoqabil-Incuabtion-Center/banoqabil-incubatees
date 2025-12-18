import { useLocation, Link } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

const routeNameMap: Record<string, string> = {
    posts: "Community",
    direct: "Messages",
    attendance: "Attendance",
    profile: "Profile",
    notifications: "Notifications",
};

export function DynamicBreadcrumb() {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    // Don't show breadcrumbs on home page if you just want it clean, 
    // or show just "Home" (which might be redundant).
    // Let's return null if on home page for now, or just Home.
    // The user wants it for "Desktop View", likely internal pages.

    return (
        <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link to="/">Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                    const isLast = index === pathnames.length - 1;
                    const name = routeNameMap[value.toLowerCase()] || value.charAt(0).toUpperCase() + value.slice(1);

                    return (
                        <React.Fragment key={to}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{name}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link to={to}>{name}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
