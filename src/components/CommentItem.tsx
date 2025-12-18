// components/CommentItem.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "./UserAvatar";
import { Link } from "react-router-dom";
import {
    MoreVertical,
    Edit,
    Trash2,
    Clock,
    Reply,
    Send,
    X,
    Heart,
} from "lucide-react";
import { CommentTree } from "@/types/comment";
import { useAuthStore } from "@/hooks/store/authStore";
import { cn } from "@/lib/utils";

interface CommentItemProps {
    comment: CommentTree;
    onReply: (parentId: string, content: string) => void;
    onEdit: (id: string, content: string) => void;
    onDelete: (id: string) => void;
    onLike: (id: string) => void;
    depth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    onReply,
    onEdit,
    onDelete,
    onLike,
    depth = 0,
}) => {
    const { user } = useAuthStore();
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [editContent, setEditContent] = useState(comment.content);

    const maxDepth = 5;
    const canReply = depth < maxDepth;

    const formatTimeAgo = (dateString: string) => {
        const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const handleReply = () => {
        if (replyContent.trim()) {
            onReply(comment._id, replyContent);
            setReplyContent("");
            setIsReplying(false);
        }
    };

    const handleEdit = () => {
        if (editContent.trim()) {
            onEdit(comment._id, editContent);
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditContent(comment.content);
        setIsEditing(false);
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-3">
                <Link to={`/user/${comment.user?._id}`} className="hover:opacity-80 transition-opacity flex-shrink-0">
                    <UserAvatar
                        src={comment.user?.avatar}
                        name={comment.user?.name}
                        className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/10 shadow-soft"
                        fallbackColor="bg-primary"
                        size="sm"
                    />
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 max-w-full">
                        <div className="bg-primary/5 hover:bg-primary/[0.08] transition-colors rounded-2xl rounded-tl-none px-4 py-3 shadow-soft group relative min-w-[120px]">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <Link to={`/user/${comment.user?._id}`} className="hover:text-primary transition-colors">
                                    <p className="text-xs font-black tracking-tight leading-none">{comment.user?.name}</p>
                                </Link>

                                {user?._id === comment.user?._id && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                            <DropdownMenuItem onClick={() => setIsEditing(true)} className="rounded-lg">
                                                <Edit className="mr-2 h-3.5 w-3.5" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDelete(comment._id)}
                                                className="text-destructive focus:text-destructive rounded-lg"
                                            >
                                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-2 mt-2">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[60px] resize-none bg-background border-primary/10 rounded-xl text-xs"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleEdit} className="h-7 text-[10px] rounded-lg">
                                            <Send className="w-3 h-3 mr-1" />
                                            Save
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7 text-[10px] rounded-lg">
                                            <X className="w-3 h-3 mr-1" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm leading-relaxed text-foreground/90 break-words font-medium">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 px-2 mt-1.5">
                        <button
                            onClick={() => onLike(comment._id)}
                            className={cn(
                                "text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105",
                                comment.userLiked ? "text-red-500" : "text-muted-foreground/60 hover:text-red-500"
                            )}
                        >
                            {comment.userLiked ? (
                                <Heart className="w-3 h-3 fill-current shadow-sm" />
                            ) : (
                                <Heart className="w-3 h-3" />
                            )}
                            <span>{comment.likeCount || "Like"}</span>
                        </button>

                        {canReply && !isReplying && (
                            <button
                                onClick={() => setIsReplying(true)}
                                className="text-[11px] font-bold text-muted-foreground/60 hover:text-primary flex items-center gap-1.5 transition-all hover:scale-105"
                            >
                                <Reply className="w-3 h-3" />
                                Reply
                            </button>
                        )}

                        <span className="text-[10px] font-bold text-muted-foreground/40 font-mono tracking-tighter">
                            {formatTimeAgo(comment.createdAt)}
                        </span>
                    </div>

                    {isReplying && (
                        <div className="space-y-2 pt-3 pl-2">
                            <div className="flex gap-3 items-start">
                                <UserAvatar
                                    src={user?.avatar}
                                    name={user?.name}
                                    className="h-6 w-6 border border-primary/10 shadow-soft shrink-0"
                                    fallbackColor="bg-primary"
                                    size="sm"
                                />
                                <div className="flex-1 space-y-2">
                                    <div className="bg-muted/30 border border-primary/5 rounded-2xl p-1 flex gap-2 items-center">
                                        <input
                                            placeholder={`Reply to ${comment.user?.name}...`}
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey && replyContent.trim()) {
                                                    e.preventDefault();
                                                    handleReply();
                                                }
                                            }}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-1.5 px-3 outline-none font-medium"
                                        />
                                        <Button
                                            size="icon"
                                            disabled={!replyContent.trim()}
                                            onClick={handleReply}
                                            className="h-7 w-7 rounded-lg bg-primary shadow-md shadow-primary/10 shrink-0"
                                        >
                                            <Send className="w-3 h-3 text-white" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                setIsReplying(false);
                                                setReplyContent("");
                                            }}
                                            className="h-7 w-7 rounded-lg shrink-0"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 sm:ml-9 space-y-4 border-l-2 border-primary/5 pl-4 sm:pl-6 mt-2">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply._id}
                            comment={reply}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onLike={onLike}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
