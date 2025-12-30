"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // 5 minutes of stale time (cache is considered fresh for 5 mins)
                        staleTime: 5 * 60 * 1000,
                        // 10 minutes of cache time
                        gcTime: 10 * 60 * 1000,
                        // Retry failed queries once
                        retry: 1,
                        // Refetch on window focus for better sync
                        refetchOnWindowFocus: true,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
