"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function ThemeColorManager() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        // Find existing meta tag or create a new one
        let meta = document.querySelector('meta[name="theme-color"]')
        if (!meta) {
            meta = document.createElement("meta")
            meta.setAttribute("name", "theme-color")
            document.head.appendChild(meta)
        }

        // Set color based on theme
        // Using common shadcn/M3 dark/light colors
        const color = resolvedTheme === "dark" ? "#09090b" : "#ffffff"
        meta.setAttribute("content", color)
    }, [resolvedTheme])

    return null
}
