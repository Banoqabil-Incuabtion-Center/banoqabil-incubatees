import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { usePostStore } from './store/usePostStore';
import { useAuthStore } from './store/authStore';
import { useQueryClient } from '@tanstack/react-query';

export const usePostSocket = () => {
    const queryClient = useQueryClient();
    const { on, isConnected } = useSocket();
    const { addPost, updatePost, deletePost, updatePostLikeCount } = usePostStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!isConnected) return;

        const unsubCreated = on('post:created', (payload: any) => {
            console.log("Socket: post:created", payload);
            // Determine if it's admin or user post based on payload
            const isAdminPost = payload.post.isAdminPost || payload.isAdmin;
            addPost(payload.post, isAdminPost ? 'admin' : 'user');

            // Update React Query for community posts
            if (!isAdminPost) {
                queryClient.setQueryData(['posts', 'community'], (oldData: any) => {
                    if (!oldData) return oldData;
                    const newPages = [...oldData.pages];
                    if (newPages.length > 0) {
                        newPages[0] = {
                            ...newPages[0],
                            data: [payload.post, ...(newPages[0].data || [])]
                        };
                    }
                    return { ...oldData, pages: newPages };
                });
            }
        });

        const unsubUpdated = on('post:updated', (payload: any) => {
            console.log("Socket: post:updated", payload);
            updatePost(payload.post);

            // Update React Query
            queryClient.setQueryData(['posts', 'community'], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        data: (page.data || page.posts || []).map((post: any) =>
                            post._id === payload.post._id ? { ...post, ...payload.post } : post
                        )
                    }))
                };
            });
        });

        const unsubDeleted = on('post:deleted', (payload: any) => {
            console.log("Socket: post:deleted", payload);
            deletePost(payload.postId);

            // Update React Query
            queryClient.setQueryData(['posts', 'community'], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        data: (page.data || page.posts || []).filter((post: any) => post._id !== payload.postId)
                    }))
                };
            });
        });

        const unsubLikeAdded = on('like:added', (payload: any) => {
            console.log("Socket: like:added", payload);
            updatePostLikeCount(payload.postId, payload.likeCount);

            // Update React Query
            queryClient.setQueryData(['posts', 'community'], (oldData: any) => {
                if (!oldData) return oldData;
                const likerId = payload.like.user._id || payload.like.user;
                const isCurrentUser = likerId === user?._id;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        data: (page.data || page.posts || []).map((post: any) =>
                            post._id === payload.postId ? {
                                ...post,
                                likeCount: payload.likeCount,
                                userLiked: isCurrentUser ? true : post.userLiked
                            } : post
                        )
                    }))
                };
            });
        });

        const unsubLikeRemoved = on('like:removed', (payload: any) => {
            console.log("Socket: like:removed", payload);
            updatePostLikeCount(payload.postId, payload.likeCount);

            // Update React Query
            queryClient.setQueryData(['posts', 'community'], (oldData: any) => {
                if (!oldData) return oldData;
                const isCurrentUser = payload.userId === user?._id;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        data: (page.data || page.posts || []).map((post: any) =>
                            post._id === payload.postId ? {
                                ...post,
                                likeCount: payload.likeCount,
                                userLiked: isCurrentUser ? false : post.userLiked
                            } : post
                        )
                    }))
                };
            });
        });

        return () => {
            unsubCreated?.();
            unsubUpdated?.();
            unsubDeleted?.();
            unsubLikeAdded?.();
            unsubLikeRemoved?.();
        }
    }, [isConnected, on, addPost, updatePost, deletePost, updatePostLikeCount, user?._id, queryClient]);
};