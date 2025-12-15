// hooks/useSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '@/lib/socket';

export const useSocket = (postId?: string) => {
    const [isConnected, setIsConnected] = useState(false);
    const hasJoinedRoom = useRef(false);
    const listenersSetup = useRef(false);

    useEffect(() => {
        // Initialize socket connection once
        const socketInstance = socketService.initialize();

        const handleConnect = () => {
            setIsConnected(true);
            // Auto-join post room if postId is provided
            if (postId && !hasJoinedRoom.current) {
                socketService.joinPostRoom(postId);
                hasJoinedRoom.current = true;
            }
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            hasJoinedRoom.current = false;
        };

        // Only setup listeners once
        if (!listenersSetup.current) {
            socketInstance.on('connect', handleConnect);
            socketInstance.on('disconnect', handleDisconnect);
            listenersSetup.current = true;
        }

        // Set initial connection state
        if (socketInstance.connected) {
            setIsConnected(true);
            if (postId && !hasJoinedRoom.current) {
                socketService.joinPostRoom(postId);
                hasJoinedRoom.current = true;
            }
        }

        // Cleanup only on unmount
        return () => {
            if (postId && hasJoinedRoom.current) {
                socketService.leavePostRoom(postId);
                hasJoinedRoom.current = false;
            }
        };
    }, [postId]);

    // Subscribe to socket events - stable callback
    const on = useCallback((event: string, callback: (...args: any[]) => void) => {
        const currentSocket = socketService.getSocket();
        if (currentSocket) {
            currentSocket.on(event, callback);
            return () => {
                currentSocket.off(event, callback);
            };
        }
        return () => { };
    }, []);

    // Emit socket events - stable callback
    const emit = useCallback((event: string, ...args: any[]) => {
        const currentSocket = socketService.getSocket();
        currentSocket?.emit(event, ...args);
    }, []);

    return {
        socket: socketService.getSocket(),
        isConnected,
        on,
        emit,
    };
};
