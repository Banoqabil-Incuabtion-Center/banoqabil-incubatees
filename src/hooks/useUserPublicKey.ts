import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SOCKET_URL as SERVER_URL } from "@/lib/constant";

export function useUserPublicKey(userId: string | undefined) {
    return useQuery({
        queryKey: ['userPublicKey', userId],
        queryFn: async () => {
            if (!userId) return null;
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/public-key/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.publicKey as string;
        },
        enabled: !!userId,
        staleTime: 24 * 60 * 60 * 1000, // Public keys don't change often, keep for 24h
    });
}
