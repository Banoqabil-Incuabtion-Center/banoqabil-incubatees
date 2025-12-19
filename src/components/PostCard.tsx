import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserAvatar } from "./UserAvatar";

import { Clock, Edit, ExternalLink, Heart, ImagePlus, Maximize2, MessageSquare, MoreVertical, Trash2, X } from "lucide-react";
import { CommentsSection } from "./CommentsSection";
import { useAuthStore } from "@/hooks/store/authStore";
import { likeRepo } from "@/repositories/likeRepo";
import { commentRepo } from "@/repositories/commentRepo";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { VideoPlayer } from "./VideoPlayer";

interface PostCardProps {
  postId: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
  createdAt: string;
  authorName?: string;
  authorId?: string;
  authorAvatar?: string;
  isAdmin?: boolean;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string, data: any) => void;
  likeCount?: number;
  commentCount?: number;
  userLiked?: boolean;
}

export const PostCard = ({
  postId,
  title,
  description,
  link,
  image,
  createdAt,
  authorName,
  authorId = "",
  authorAvatar,
  isAdmin = false,
  onDelete,
  onEdit,
  likeCount: initialLikeCount = 0,
  commentCount: initialCommentCount = 0,
  userLiked: initialUserLiked = false,
}: PostCardProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const { isConnected, on } = useSocket(postId);
  const navigate = useNavigate();


  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(initialUserLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  useEffect(() => {
    setCommentCount(initialCommentCount);
  }, [initialCommentCount]);

  const [editForm, setEditForm] = useState({
    title,
    description,
    link: link || "",
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(image || null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = isAuthenticated && user?._id && user?._id === authorId;
  const displayName = isAdmin ? "Admin" : authorName || "User";
  const avatarText = displayName.charAt(0).toUpperCase();

  const isVideo = (url: string): boolean => {
    return !!url?.match(/\.(mp4|webm|mov|mkv)$/i);
  };

  const getOptimizedImageUrl = (url: string) => {
    if (!url) return "";
    // Check if it's a Cloudinary URL
    if (url.includes("cloudinary.com")) {
      // If it's a video, don't optimize as image
      if (isVideo(url)) return url;

      // Inject optimization params if not already present
      // w_800: resize width to 800px
      // f_auto: auto format (webp/avif)
      // q_auto: auto quality
      if (!url.includes("f_auto,q_auto")) {
        return url.replace("/upload/", "/upload/w_800,f_auto,q_auto/");
      }
    }
    return url;
  };

  // Fetch initial like status and comment count
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await likeRepo.getLikesByPost(postId, 1, 1);
        setLikeCount(res.pagination.totalItems);
        setLiked(res.userLiked);
      } catch (error) {
        console.error("Failed to fetch likes:", error);
      }
    };

    const fetchCommentCount = async () => {
      try {
        const res = await commentRepo.getCommentsByPost(postId, 1, 1);
        setCommentCount(res.pagination?.totalItems || 0);
      } catch (error) {
        console.error("Failed to fetch comment count:", error);
      }
    };

    if (postId) {
      fetchLikes();
      fetchCommentCount();
    }
  }, [postId]);

  const renderDescription = (text: string) => {
    if (!text) return null;

    // Split by ** to find bold sections
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (typeof part === 'string' && part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-black text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleDelete = () => {
    if (postId && onDelete) onDelete(postId);
    setIsDeleteDialogOpen(false);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Please select an image or video file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const handleEditSubmit = () => {
    if (postId && onEdit) {
      onEdit(postId, {
        ...editForm,
        image: editImageFile || undefined,
      });
      setIsEditModalOpen(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;

    // Optimistic update immediately
    const previousLiked = liked;
    const previousCount = likeCount;

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await likeRepo.toggleLike(postId);
    } catch (error) {
      // Revert if failed
      setLiked(previousLiked);
      setLikeCount(previousCount);
      console.error("Failed to toggle like:", error);
    }
  };

  const isMobile = useIsMobile();

  const renderEditForm = () => (
    <div className="space-y-4 py-4 min-w-0 overflow-hidden">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="edit-title">Title</Label>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            editForm.title.length >= 50 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {editForm.title.length}/50
          </span>
        </div>
        <Input
          id="edit-title"
          value={editForm.title}
          maxLength={50}
          onChange={(e) =>
            setEditForm({ ...editForm, title: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="edit-description">Description</Label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium">
              Use **text** for <b>bold</b>
            </span>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              editForm.description.length >= 5000 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            )}>
              {editForm.description.length}/5000
            </span>
          </div>
        </div>
        <Textarea
          id="edit-description"
          rows={4}
          value={editForm.description}
          onChange={(e) =>
            setEditForm({ ...editForm, description: e.target.value })
          }
          maxLength={5000}
          className="resize-none"
        />
      </div>

      {/* Edit Media Section */}
      <div className="space-y-2">
        <Label>Media</Label>
        {editImagePreview ? (
          <div className="relative rounded-lg overflow-hidden border aspect-[16/9]">
            {editImageFile?.type.startsWith('video/') || (typeof editImagePreview === 'string' && isVideo(editImagePreview)) ? (
              <video
                src={editImagePreview}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={editImagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={removeEditImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => editFileInputRef.current?.click()}
          >
            <ImagePlus className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">
              Click to upload media
            </p>
          </div>
        )}
        <input
          ref={editFileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleEditImageChange}
          className="hidden"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-link">Link (Optional)</Label>
        <Input
          id="edit-link"
          value={editForm.link}
          onChange={(e) =>
            setEditForm({ ...editForm, link: e.target.value })
          }
          placeholder="https://..."
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="group py-6 sm:py-6 border-b border-primary/5 transition-all duration-300">
        <div className="space-y-4">
          <div className="flex items-start justify-between px-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to={`/user/${authorId}`} className="hover:opacity-80 transition-opacity">
                <UserAvatar
                  src={authorAvatar}
                  name={displayName}
                  className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/10 shadow-soft"
                  fallbackColor="bg-primary"
                />
              </Link>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <p className="font-semibold text-sm leading-none">{displayName}</p>
                  ) : (
                    <Link to={`/user/${authorId}`} className="hover:text-primary transition-colors min-w-0">
                      <p className="font-black text-sm sm:text-base leading-none tracking-tight truncate">{displayName}</p>
                    </Link>
                  )}
                </div>
                <div className="flex items-center text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider overflow-hidden">
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">{title}</span>
                  <span className="mx-2 opacity-50 flex-shrink-0">•</span>
                  <span className="flex-shrink-0">{formatTimeAgo(createdAt)}</span>
                </div>
              </div>
            </div>

            {isOwner && postId && (
              isMobile ? (
                <Drawer shouldScaleBackground={false}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-left">
                      <DrawerTitle>Post Options</DrawerTitle>
                      <DrawerDescription>
                        Choose an action for this post
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-2">
                      <DrawerClose asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Post
                        </Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Button
                          variant="destructive"
                          className="w-full justify-start "
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Post
                        </Button>
                      </DrawerClose>
                    </div>
                    <DrawerFooter className="pt-2">
                      <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 hover:bg-primary/5 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>

          <div className="space-y-4">
            {/* Navigates to dedicated page */}
            <div
              onClick={() => navigate(`/posts/${postId}`)}
              className="cursor-pointer group/content transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Post Content */}
                <div className="px-1 overflow-hidden">
                  <div className="text-sm sm:text-base text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap break-words">
                    {renderDescription(
                      description.length > 500 && !isExpanded
                        ? description.slice(0, 500) + "..."
                        : description
                    )}
                    {description.length > 500 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
                        className="ml-1 text-primary hover:underline font-bold text-xs sm:text-sm flex-shrink-0"
                      >
                        {isExpanded ? "Show Less" : "Read More"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Media (Image or Video) */}
                {image && (
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-black/5 aspect-[16/9] border border-primary/5 shadow-premium-soft relative group/media">
                    {isVideo(image) ? (
                      <VideoPlayer
                        src={image}
                        className="w-full h-full object-cover"
                        playOnView
                      />
                    ) : (
                      <img
                        src={getOptimizedImageUrl(image)}
                        alt={title}
                        className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover/media:opacity-100 pointer-events-none">
                      <div className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-2xl scale-90 group-hover/media:scale-100 transition-all duration-500">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Link */}
            {link && (
              <div className="px-1">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline font-bold transition-colors group/link"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover/link:bg-primary/10 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <span className="truncate max-w-[200px] sm:max-w-md">{link}</span>
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex pt-2 px-1">
              <div className="flex items-center gap-6">
                <button
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold transition-all hover:scale-105 active:scale-95",
                    liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                  )}
                  onClick={handleLike}
                >
                  <Heart
                    className={cn("w-5 h-5 transition-transform duration-300", liked && "fill-current")}
                  />
                  <span>{likeCount > 0 ? likeCount : "Like"}</span>
                </button>

                <button
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold transition-all hover:scale-105 active:scale-95",
                    showComments ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{commentCount > 0 ? commentCount : "Comment"}</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments && postId && (
              <div className="mt-6 pt-6 border-t border-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <CommentsSection postId={postId} compact />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          {renderEditForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Update Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};