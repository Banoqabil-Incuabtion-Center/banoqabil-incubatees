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
import { cn } from "@/lib/utils";
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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Users,
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
import { UserCard, UserCardSkeleton } from "@/components/UserCard";
import { userRepo } from "@/repositories/userRepo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const PostSkeleton = () => {
  return (
    <div className="py-6 sm:py-8 border-b border-primary/5">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2 px-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="w-full aspect-[16/9] rounded-2xl sm:rounded-3xl" />
          <div className="flex items-center gap-6 px-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
    </div>
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
      <DialogContent className="sm:max-w-[580px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl break-words">Create New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 min-w-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                formData.title.length >= 50 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}>
                {formData.title.length}/50
              </span>
            </div>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={isCreating}
              maxLength={50}
              placeholder="Enter an engaging title..."
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive font-medium">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium">
                  Use **text** for <b>bold</b>
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  formData.description.length >= 5000 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                  {formData.description.length}/5000
                </span>
              </div>
            </div>
            <Textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              disabled={isCreating}
              maxLength={5000}
              placeholder="Share your thoughts, ideas, or updates..."
              className={`resize-none ${errors.description ? "border-destructive" : ""}`}
            />
            {errors.description && (
              <p className="text-xs text-destructive font-medium">{errors.description}</p>
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
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch suggested/active users
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await userRepo.getActiveUsers();
        // Filter out current user from suggestions
        const filtered = (res.activeUsers || []).filter((u: any) => u.user?._id !== user?._id);
        setSuggestedUsers(filtered.map((item: any) => item.user));
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [user?._id]);

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
        if (hasMoreUser && !loading) {
          fetchPosts(pageUser + 1, 10, 'user');
        }
      }
    }, { rootMargin: '400px', threshold: 0.1 });

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
        <div className="mb-4 sm:mb-8 pb-6 sm:pb-8 border-b border-primary/5">
          <div className="flex gap-4 items-center">
            <div className="shrink-0">
              <UserAvatar
                src={user?.avatar}
                name={user?.name}
                className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/10 shadow-soft"
                fallbackColor="bg-primary"
              />
            </div>

            <div
              onClick={() => setIsModalOpen(true)}
              className="flex-1 bg-muted/20 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all rounded-full px-6 py-3 cursor-pointer text-muted-foreground text-sm sm:text-base font-bold tracking-tight shadow-sm"
            >
              What's on your mind, {user?.name?.split(' ')[0]}?
            </div>

            <div
              className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Community Suggestions */}
        {(loadingSuggestions || suggestedUsers.length > 0) && (
          <div className="space-y-4 mb-12">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Community Suggestions
              </h2>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full relative group"
            >
              <CarouselContent>
                {loadingSuggestions ? (
                  [...Array(4)].map((_, i) => (
                    <CarouselItem key={i} className="basis-[85%] sm:basis-[45%] md:basis-[350px]">
                      <div className="p-1 h-full">
                        <UserCardSkeleton className="h-full border border-primary/10 shadow-premium" />
                      </div>
                    </CarouselItem>
                  ))
                ) : (
                  suggestedUsers.map((suggestedUser) => (
                    <CarouselItem key={suggestedUser._id} className="basis-[85%] sm:basis-[45%] md:basis-[350px]">
                      <div className="p-1 h-full">
                        <UserCard
                          user={suggestedUser}
                          className="h-full border border-primary/10 shadow-premium hover:shadow-hover-card hover:translate-y-[-4px] transition-all duration-500"
                        />
                      </div>
                    </CarouselItem>
                  ))
                )}
              </CarouselContent>
              <div className="hidden sm:block">
                <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Carousel>
          </div>
        )}
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
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                userLiked={post.userLiked}
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
