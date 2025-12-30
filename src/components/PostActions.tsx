import React, { useState, useEffect } from "react";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/hooks/store/authStore";
import { likeRepo } from "@/repositories/likeRepo";
import { usePostStore } from "@/hooks/store/usePostStore";
import { toast } from "sonner";

interface PostActionsProps {
    postId: string;
    initialLikeCount: number;
    initialCommentCount: number;
    initialUserLiked: boolean;
    onCommentClick?: () => void;
    onLikeCountClick?: () => void;
    showCommentCount?: boolean;
    className?: string;
    compact?: boolean; // For tighter layouts like PostCard
}

export const PostActions = ({
    postId,
    initialLikeCount,
    initialCommentCount,
    initialUserLiked,
    onCommentClick,
    onLikeCountClick,
    showCommentCount = true,
    className,
    compact = false
}: PostActionsProps) => {
    const { isAuthenticated } = useAuthStore();
    const { setLike } = usePostStore();

    const [liked, setLiked] = useState(initialUserLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLiking, setIsLiking] = useState(false);

    // Sync local state when props change (specifically for initial load or external updates)
    useEffect(() => {
        setLiked(initialUserLiked);
        setLikeCount(initialLikeCount);
    }, [initialUserLiked, initialLikeCount]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) return;
        if (isLiking) return;

        // Optimistic update
        const previousLiked = liked;
        const previousCount = likeCount;
        const newLiked = !liked;
        const newCount = newLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

        setLiked(newLiked);
        setLikeCount(newCount);

        // Update global store immediately so other components reflect change
        setLike(postId, newLiked, newCount);

        setIsLiking(true);
        try {
            await likeRepo.toggleLike(postId);
        } catch (error) {
            // Revert if failed
            setLiked(previousLiked);
            setLikeCount(previousCount);
            setLike(postId, previousLiked, previousCount);
            console.error("Failed to toggle like:", error);
            toast.error("Failed to update like status");
        } finally {
            setIsLiking(false);
        }
    };

    const handleLikeCountClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onLikeCountClick?.();
    };

    return (
        <div className={cn("flex items-center", compact ? "gap-6" : "gap-6", className)}>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={handleLike}
                    className={cn(
                        "flex items-center transition-all hover:scale-110 active:scale-95 group",
                        liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                    )}
                    aria-label={liked ? "Unlike" : "Like"}
                >
                    <Heart
                        className={cn(
                            "w-5 h-5 transition-transform duration-300",
                            liked && "fill-current"
                        )}
                    />
                </button>
                <button
                    onClick={handleLikeCountClick}
                    className={cn(
                        "text-sm font-bold pt-0.5 hover:text-primary transition-colors",
                        compact ? "" : "uppercase tracking-tighter text-[10px] sm:text-xs"
                    )}
                >
                    {likeCount} {(!compact && "Likes")}
                </button>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onCommentClick?.();
                }}
                className={cn(
                    "flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95 group",
                    "text-muted-foreground hover:text-primary"
                )}
            >
                <MessageSquare className="w-5 h-5" />
                {showCommentCount && (
                    <span className={cn(
                        "text-sm font-bold pt-0.5",
                        compact ? "" : "uppercase tracking-tighter text-[10px] sm:text-xs"
                    )}>
                        {initialCommentCount} {(!compact && "Comments")}
                    </span>
                )}
            </button>

            {/* Share button can be added here later */}
        </div>
    );
};
