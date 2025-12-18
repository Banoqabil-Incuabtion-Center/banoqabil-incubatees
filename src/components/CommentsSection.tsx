import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import {
  MessageSquare,
  User,
  Send,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuthStore } from "@/hooks/store/authStore";
import { CommentItem } from "./CommentItem";
import { useComments } from "@/hooks/useComments";

interface CommentsSectionProps {
  postId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ postId }) => {
  const { user } = useAuthStore();
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
  } = useComments(postId);

  const [content, setContent] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFetchDone = useRef(false);

  // Initial fetch - only run once when component mounts
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchComments(1);
    }
  }, []);

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
    <div className="space-y-4 pt-2">
      {/* Connection Status & Comment Count */}
      {/* <div className="flex items-center justify-between">
        {total > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>{total} {total === 1 ? 'comment' : 'comments'}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Offline</span>
            </>
          )}
        </div>
      </div> */}

      {/* Add Comment Input */}
      <div className="flex gap-3 items-start">
        <UserAvatar
          src={user?.avatar}
          name={user?.name}
          className="h-9 w-9 border-2 border-primary/10 shadow-soft shrink-0"
          fallbackColor="bg-primary"
        />

        <div className="flex gap-2 items-center flex-1 bg-muted/30 hover:bg-muted/50 transition-colors border border-primary/5 rounded-2xl px-2 py-1">
          <input
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey && content.trim() && !isSubmitting) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 outline-none font-medium placeholder:text-muted-foreground/60"
            disabled={isSubmitting}
          />
          <Button
            size="icon"
            disabled={!content.trim() || isSubmitting}
            onClick={handleAddComment}
            className="h-8 w-8 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform shrink-0"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="space-y-4 p-4">
          {loading && page === 1 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No comments yet</p>
              <p className="text-xs">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment._id}>
                  <CommentItem
                    comment={comment}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLike={toggleLike}
                  />
                </div>
              ))}

              {/* View More Button */}
              {hasMore && (
                <div className="flex justify-start pt-2 pb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsLoadingMore(true);
                      fetchComments(page + 1, true).finally(() => setIsLoadingMore(false));
                    }}
                    disabled={isLoadingMore}
                    className=" text-xs hover:text-foreground"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "View more comments"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};