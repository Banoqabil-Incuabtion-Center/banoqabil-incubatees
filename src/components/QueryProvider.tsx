"use client"

import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState } from "react"

const persister = createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'ims-query-cache',
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // 5 minutes of stale time
                        staleTime: 5 * 60 * 1000,
                        // 24 hours of gcTime (garbage collection) for persistent data
                        gcTime: 24 * 60 * 60 * 1000,
                        // Retry failed queries once
                        retry: 1,
                        // Refetch on window focus for better sync
                        refetchOnWindowFocus: true,
                    },
                },
            })
    )

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            {children}
        </PersistQueryClientProvider>
    )
}
