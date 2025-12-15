import { useState, useEffect, useCallback, useRef } from 'react';
import { useCommentStore } from './store/useCommentStore';
import { useAuthStore } from './store/authStore';
import { commentRepo } from '@/repositories/commentRepo';
import { likeRepo } from '@/repositories/likeRepo';
import { useSocket } from './useSocket';
import { CommentTree, CommentCreatedPayload, CommentUpdatedPayload, CommentDeletedPayload } from '@/types/comment';
import { CommentLikeAddedPayload, CommentLikeRemovedPayload } from '@/types/like';

import { usePostStore } from './store/usePostStore';

export const useComments = (postId: string) => {
    const { comments: allComments, setComments, addComment, addReply, updateComment, deleteComment, setCommentLike, replaceComment } = useCommentStore();
    const { incrementComment, decrementComment } = usePostStore();
    const { user } = useAuthStore(); // Need user for optimistic updates
    const comments = allComments[postId] || [];
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { isConnected, on } = useSocket(postId);

    // Track if initial fetch has happened
    const hasFetchedRef = useRef(false);
    const currentPostIdRef = useRef(postId);
    const loadingRef = useRef(false);

    // Reset state when postId changes
    useEffect(() => {
        if (currentPostIdRef.current !== postId) {
            currentPostIdRef.current = postId;
            hasFetchedRef.current = false;
            loadingRef.current = false;
            setPage(1);
            setHasMore(true);
            setTotal(0);
            setComments(postId, []);
        }
    }, [postId, setComments]);

    // Use ref for loading state in callback to avoid dependency issues
    const fetchComments = useCallback(async (pageNum = 1, append = false) => {
        // Prevent duplicate fetches using ref
        if (loadingRef.current) return;

        try {
            loadingRef.current = true;
            if (!append) setLoading(true);
            const res = await commentRepo.getCommentsByPost(postId, pageNum, 5);

            if (append) {
                // Get current comments from store at fetch time
                const currentComments = useCommentStore.getState().comments[postId] || [];
                const existingIds = new Set(currentComments.map(c => c._id));
                const newComments = (res?.data ?? []).filter(c => !existingIds.has(c._id));
                setComments(postId, [...currentComments, ...newComments]);
            } else {
                setComments(postId, res?.data ?? []);
            }

            setHasMore(res?.pagination?.hasNextPage ?? false);
            setTotal(res?.pagination?.totalItems ?? 0);
            setPage(pageNum);
            hasFetchedRef.current = true;
        } catch (error) {
            console.error('Failed to fetch comments:', error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [postId, setComments]);

    // Socket listeners - attach when connected (removed hasFetchedRef condition)
    useEffect(() => {
        if (!isConnected) return;

        console.log('Setting up socket listeners for post:', postId);

        const unsubCreated = on('comment:created', (payload: CommentCreatedPayload) => {
            console.log('Socket: comment:created', payload);

            // Ignore events initiated by the current user to prevent duplication
            // (we handle these optmistically + via API response)
            if (user?._id && payload.comment.user._id === user._id) {
                return;
            }

            // Check if this comment already exists (for other cases)
            const currentComments = useCommentStore.getState().comments[postId] || [];
            const exists = currentComments.some(c => c._id === payload.comment._id);
            if (!exists) {
                if (payload.parentCommentId) {
                    addReply(postId, payload.parentCommentId, payload.comment as CommentTree);
                } else {
                    addComment(postId, payload.comment as CommentTree);
                }
                setTotal(prev => prev + 1);
            }
        });

        const unsubUpdated = on('comment:updated', (payload: CommentUpdatedPayload) => {
            console.log('Socket: comment:updated', payload);
            updateComment(postId, payload.comment._id, payload.comment as any);
        });

        const unsubDeleted = on('comment:deleted', (payload: CommentDeletedPayload) => {
            console.log('Socket: comment:deleted', payload);
            deleteComment(postId, payload.commentId);
            setTotal(prev => Math.max(0, prev - 1));
        });

        const unsubLikeAdded = on('comment:like:added', (payload: CommentLikeAddedPayload) => {
            console.log('Socket: comment:like:added', payload);
            setCommentLike(postId, payload.commentId, true, payload.likeCount);
        });

        const unsubLikeRemoved = on('comment:like:removed', (payload: CommentLikeRemovedPayload) => {
            console.log('Socket: comment:like:removed', payload);
            setCommentLike(postId, payload.commentId, false, payload.likeCount);
        });

        return () => {
            console.log('Cleaning up socket listeners for post:', postId);
            unsubCreated?.();
            unsubUpdated?.();
            unsubDeleted?.();
            unsubLikeAdded?.();
            unsubLikeRemoved?.();
        };
    }, [isConnected, on, postId, addComment, addReply, updateComment, deleteComment, setCommentLike]);

    const toggleLike = useCallback(async (commentId: string) => {
        // Find comment to get current state
        const findComment = (items: CommentTree[]): CommentTree | undefined => {
            for (const item of items) {
                if (item._id === commentId) return item;
                if (item.replies) {
                    const found = findComment(item.replies);
                    if (found) return found;
                }
            }
        };
        const comment = findComment(comments);
        if (!comment) return;

        const originalLiked = comment.userLiked;
        const originalCount = comment.likeCount;
        const newLiked = !originalLiked;
        const newCount = newLiked ? originalCount + 1 : Math.max(0, originalCount - 1);

        // Optimistic update
        setCommentLike(postId, commentId, newLiked, newCount);

        try {
            const res = await likeRepo.toggleCommentLike(commentId);
            // Verify server state matches optimistic
            if (res.liked !== newLiked || res.likeCount !== newCount) {
                setCommentLike(postId, commentId, res.liked, res.likeCount);
            }
        } catch (error) {
            console.error('Failed to toggle comment like:', error);
            // Revert
            setCommentLike(postId, commentId, originalLiked, originalCount);
        }
    }, [postId, comments, setCommentLike]);

    const createCommentHandler = useCallback(async (content: string) => {
        if (!user) return;

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const tempComment: CommentTree = {
            _id: tempId,
            content,
            user: user,
            post: postId,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            deletedAt: null,
            likeCount: 0,
            userLiked: false,
            replies: [],
            depth: 0,
            parentComment: null
        };

        addComment(postId, tempComment);
        setTotal(prev => prev + 1);
        incrementComment(postId);

        try {
            const res = await commentRepo.createComment(postId, content);
            if (res?.comment) {
                // Replace temp comment with real one
                replaceComment(postId, tempId, { ...res.comment, replies: [] });
            }
            return res;
        } catch (error) {
            console.error("Failed to create comment", error);
            // Revert
            deleteComment(postId, tempId);
            setTotal(prev => Math.max(0, prev - 1));
            decrementComment(postId);
            throw error;
        }
    }, [postId, addComment, replaceComment, deleteComment, user, incrementComment, decrementComment]);

    const replyCommentHandler = useCallback(async (parentId: string, content: string) => {
        if (!user) return;

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const tempReply: CommentTree = {
            _id: tempId,
            content,
            user: user,
            post: postId,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            deletedAt: null,
            likeCount: 0,
            userLiked: false,
            replies: [],
            depth: 0, // Should be calculated but 0 is fine for display until real data
            parentComment: parentId
        };

        addReply(postId, parentId, tempReply);
        setTotal(prev => prev + 1);
        incrementComment(postId);

        try {
            const res = await commentRepo.createComment(postId, content, parentId);
            if (res?.comment) {
                replaceComment(postId, tempId, { ...res.comment, replies: [] });
            }
            return res;
        } catch (error) {
            console.error("Failed to reply", error);
            // Revert
            deleteComment(postId, tempId);
            setTotal(prev => Math.max(0, prev - 1));
            decrementComment(postId);
            throw error;
        }
    }, [postId, addReply, replaceComment, deleteComment, user, incrementComment, decrementComment]);

    const updateCommentHandler = useCallback(async (id: string, content: string) => {
        const res = await commentRepo.updateComment(id, content);
        // Update in store immediately
        if (res?.comment) {
            updateComment(postId, id, res.comment);
        }
        return res;
    }, [postId, updateComment]);

    const deleteCommentHandler = useCallback(async (id: string) => {
        const res = await commentRepo.deleteComment(id);
        // Remove from store immediately
        deleteComment(postId, id);
        setTotal(prev => Math.max(0, prev - 1));
        decrementComment(postId);
        return res;
    }, [postId, deleteComment, decrementComment]);

    return {
        comments,
        loading,
        hasMore,
        total,
        page,
        fetchComments,
        createComment: createCommentHandler,
        replyComment: replyCommentHandler,
        updateCommentApi: updateCommentHandler,
        deleteCommentApi: deleteCommentHandler,
        toggleLike,
        isConnected
    };
};