
import React, { useState, useRef, useCallback, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  User,
  Send,
  Loader2,
  ImagePlus,
  X,
  Video,
  Image as ImageIcon,
  Smile,
} from "lucide-react";
import { useAuthStore } from "@/hooks/store/authStore";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";
import { postRepo } from "../repositories/postRepo";
// import UrlBreadcrumb from "@/components/UrlBreadcrumb";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePostStore } from "@/hooks/store/usePostStore";
import { usePostSocket } from "@/hooks/usePostSocket";

const PostSkeleton = () => {
  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="space-y-0 p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-9 w-9 sm:h-11 sm:w-11 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="-mx-4 sm:-mx-6 -mt-1">
          <Skeleton className="w-full h-48 sm:h-64" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2 w-full">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoized PostCard to prevent re-renders when parent state changes
const MemoizedPostCard = memo(PostCard);

// Separate Create Post Dialog component to isolate form state
const CreatePostDialog = memo(({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ title: "", description: "", link: "" });
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (image or video)
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Please select an image or video file');
        return;
      }
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      await postRepo.createUserPost({
        ...formData,
        image: imageFile || undefined,
      });
      // Success handled by socket/store or we can just close
      toast.success("Post created successfully");
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(error.response?.data?.message || "Failed to create post");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={isCreating}
              placeholder="Enter an engaging title..."
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              disabled={isCreating}
              placeholder="Share your thoughts, ideas, or updates..."
              className={`resize-none ${errors.description ? "border-destructive" : ""}`}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Image/Video Upload Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Media <span className="text-muted-foreground">(Optional)</span>
            </Label>

            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border aspect-[4/3]">
                {imageFile?.type.startsWith('video/') ? (
                  <video
                    src={imagePreview}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeImage}
                  disabled={isCreating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload media
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images or Videos up to 50MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link" className="text-sm font-medium">
              Link <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              disabled={isCreating}
              placeholder="https://example.com"
              className={errors.link ? "border-destructive" : ""}
            />
            {errors.link && (
              <p className="text-xs text-destructive">{errors.link}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              resetForm();
            }}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CreatePostDialog.displayName = 'CreatePostDialog';

const Posts = () => {
  // const [activeTab, setActiveTab] = useState("admin"); // Removed activeTab
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthStore();

  // Connect to socket events
  usePostSocket();

  const {
    adminPosts,
    userPosts,
    loading,
    hasMoreAdmin,
    hasMoreUser,
    pageAdmin,
    pageUser,
    fetchPosts,
    deletePost,
    updatePost
  } = usePostStore();

  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (hasMoreUser) {
          fetchPosts(pageUser + 1, 10, 'user');
        }
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, hasMoreUser, pageUser, fetchPosts]);

  // Initial fetch
  useEffect(() => {
    if (userPosts.length === 0) {
      fetchPosts(1, 10, 'user');
    }
  }, [fetchPosts, userPosts.length]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handlePostCreated = useCallback(() => {
    // No manual refresh needed as socket or optimistic update handles it
    // But if we want to be safe, we could invalidate queries or re-fetch first page
    // The previous implementation refreshed the list.
    // Given we have sockets, we might not need to do anything if the socket sends the new post back.
    // If we want to rely on the Repo call adding it we can.
    // However, existing code suggests createPost doesn't return the full post object with user population always populated for the list? 
    // Let's rely on the socket for the definitive update OR the store's addPost.
    // The store doesn't seem to have a manual 'refresh' method exposed easily without clearing.
    // Let's assume socket 'post:created' handles it or the user manually refreshes if needed. 
    // Actually, createPostDialog's handleCreate does NOT update store locally in current code. 
    // Existing socket hook `usePostSocket` listens to `post:created` and calls `addPost`. 
    // So we should be good if the backend emits the event.
  }, []);

  const handleDelete = useCallback(async (postId: string) => {
    try {
      await postRepo.deleteUserPost(postId);
      toast.success("Post deleted successfully");
      deletePost(postId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  }, [deletePost]);

  const handleEdit = useCallback(async (postId: string, updatedData: any) => {
    try {
      const res = await postRepo.updateUserPost(postId, updatedData);
      toast.success("Post updated successfully");
      updatePost(res.post || res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update post");
    }
  }, [updatePost]);

  const postsToRender = userPosts;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Posts List */}
        {/* Create Post Input */}
        <Card className="p-4 shadow-sm">
          <div className="flex gap-4 items-center">
            {/* We can grab user from auth store, but since we are inside Posts component and didn't import hook yet, let's keep it simple or assume we can add the hook. 
               Actually, I need to add the import first. But I can't add import *and* replace body in one go easily with replace_file_content unless I do multi.
               I'll do the body replacement first using a generic Avatar fallback or just a placeholder if user var isn't ready.
               Wait, I should really use the user's avatar.
               Let's assume I'll add the hook in a separate step or just use a generic User icon for now if I can't easily get the user name. 
               Actually, userPosts might not be the current user.
               Let's just use a generic UserAvatar with no name (fallback) or simpler: just the input field.
               User explicitly said "fb ki trha". FB has avatar.
               I will attempt to use a placeholder avatar for now to avoid breaking if I miss the import.
            */}
            <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              <UserAvatar src={user?.avatar} name={user?.name} className="h-10 w-10" />
            </div>

            <div
              onClick={() => setIsModalOpen(true)}
              className="flex-1 bg-secondary/50 hover:bg-secondary/70 transition-colors rounded-full px-4 py-2.5 cursor-pointer text-muted-foreground text-sm font-medium"
            >
              What's on your mind?
            </div>
          </div>
        </Card>
        {/* Loading when empty */}
        {loading && postsToRender.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        )}

        {/* List */}
        {postsToRender.map((post, index) => {
          const isLast = index === postsToRender.length - 1;
          return (
            <div key={post._id} ref={isLast ? lastPostRef : null}>
              <MemoizedPostCard
                postId={post._id}
                title={post.title}
                description={post.description}
                link={post.link}
                image={post.image}
                createdAt={post.createdAt}
                authorName={post.user?.name}
                authorId={post.user?._id}
                authorAvatar={post.user?.avatar}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </div>
          );
        })}

        {/* Loading more */}
        {loading && postsToRender.length > 0 && (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!loading && postsToRender.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No posts found.
          </div>
        )}

        {/* Create Post Modal - Separate component to isolate form state */}
        <CreatePostDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handlePostCreated}
        />
      </div>
    </div>
  );
};

export default Posts;
