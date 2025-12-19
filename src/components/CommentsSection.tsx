import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import {
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/hooks/store/authStore";
import { CommentItem } from "./CommentItem";
import { useComments } from "@/hooks/useComments";
import { cn } from "@/lib/utils";

interface CommentsSectionProps {
  postId: string;
  compact?: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ postId, compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const commentLimit = compact ? 3 : 10;
  const {
    comments,
    loading,
    hasMore,
    total,
    page,
    fetchComments,
    createComment,
    replyComment,
    updateCommentApi,
    deleteCommentApi,
    toggleLike,
    isConnected
  } = useComments(postId, commentLimit);

  const [content, setContent] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFetchDone = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initial fetch - only run once when component mounts
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchComments(1);
    }
  }, []);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (compact || !hasMore || loading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setIsLoadingMore(true);
          fetchComments(page + 1, true).finally(() => setIsLoadingMore(false));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, page, fetchComments, compact, loading, isLoadingMore]);

  // Debounced submit handler
  const handleAddComment = async () => {
    if (!content.trim() || isSubmitting) return;

    const text = content;
    setContent("");
    setIsSubmitting(true);

    try {
      await createComment(text);
    } catch (error) {
      console.error("Failed to add comment:", error);
      setContent(text); // Restore on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, replyContent: string) => {
    try {
      await replyComment(parentId, replyContent);
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  };

  const handleEdit = async (id: string, newContent: string) => {
    try {
      await updateCommentApi(id, newContent);
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCommentApi(id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div className="flex flex-col h-auto bg-background/50 rounded-2xl overflow-visible border border-primary/5">
      {/* Comments List */}
      <div className="px-2 sm:px-4 py-4 space-y-6">
        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm font-medium">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-black tracking-tight">No discussions yet</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Be the first to speak</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(compact ? comments.slice(0, 3) : comments).map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLike={toggleLike}
              />
            ))}

            {/* View More Button or Compact Page Link */}
            {compact && (hasMore || total > 3) ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/posts/${postId}`)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 rounded-full px-6"
                >
                  Open page to load more comments
                </Button>
              </div>
            ) : !compact && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-primary animate-in fade-in zoom-in-95">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading older discussions...</span>
                  </div>
                )}
                {!hasMore && comments.length > 0 && (
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">End of discussions</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Comment Input - Sticky at Bottom */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-primary/5 sticky bottom-0 z-30">
        <div className="flex gap-3 items-end">
          <UserAvatar
            src={user?.avatar}
            name={user?.name}
            className="h-8 w-8 border-2 border-primary/10 shadow-soft shrink-0 mb-1"
            fallbackColor="bg-primary"
          />    

          <div className="flex-1 space-y-1">
            <div className="flex gap-2 items-end bg-muted/40 hover:bg-muted/60 transition-all border border-primary/10 rounded-2xl p-1.5 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/5">
              <textarea
                placeholder="Write a comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && content.trim() && !isSubmitting) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 px-2 outline-none font-medium placeholder:text-muted-foreground/50 resize-none max-h-32 min-h-[38px]"
                disabled={isSubmitting}
                maxLength={1000}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'inherit';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <Button
                size="icon"
                disabled={!content.trim() || isSubmitting}
                onClick={handleAddComment}
                className="h-8 w-8 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-110 active:scale-90 transition-all shrink-0"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {content.length > 800 && (
              <div className="flex justify-end px-2">
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-tight",
                  content.length >= 1000 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {content.length}/1000
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};