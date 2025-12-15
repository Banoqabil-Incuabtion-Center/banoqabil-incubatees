import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushSubscription() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setLoading(false);
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setLoading(false);
    };

    const subscribeToPush = async () => {
        setLoading(true);
        try {
            if (!('serviceWorker' in navigator)) return;

            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            await axios.post(`${import.meta.env.VITE_API_URL}/api/push/subscribe`, subscription, {
                withCredentials: true
            });

            setIsSubscribed(true);
            toast.success("Notifications enabled!");
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error("Failed to enable notifications. Please check permission settings.");
        } finally {
            setLoading(false);
        }
    };

    return { isSubscribed, loading, subscribeToPush };
}
