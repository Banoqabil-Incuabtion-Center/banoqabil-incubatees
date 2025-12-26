import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { postRepo } from "@/repositories/postRepo";
import { UserAvatar } from "@/components/UserAvatar";
import { CommentsSection } from "@/components/CommentsSection";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Heart,
    MessageSquare,
    Share2,
    Clock,
    ArrowLeft,
    Maximize2,
    AlertCircle,
    ExternalLink
} from "lucide-react";
import { likeRepo } from "@/repositories/likeRepo";
import { useAuthStore } from "@/hooks/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { PostActions } from "@/components/PostActions";

export const PostDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        const fetchPostDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await postRepo.getUserPostById(id);
                console.log("DEBUG: PostDetail fetched post:", res.post);
                console.log("DEBUG: PostDetail userLiked check:", {
                    userLiked: res.post.userLiked,
                    liked: res.post.liked,
                    isLiked: res.post.isLiked,
                    likesCount: res.post.likesCount,
                    likeCount: res.post.likeCount
                });
                setPost(res.post);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch post:", err);
                setError("Post not found or has been deleted.");
            } finally {
                setLoading(false);
            }
        };

        fetchPostDetail();
    }, [id]);

    const isVideo = (url: string): boolean => {
        return !!url?.match(/\.(mp4|webm|mov|mkv)$/i);
    };

    const renderDescription = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (typeof part === 'string' && part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-black text-foreground">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Removed handleLike as it's now in PostActions

    const formatTimeAgo = (dateString: string) => {
        const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex flex-col md:flex-row h-screen md:h-[calc(100vh-64px)] bg-background">
                <div className="flex-1 bg-black/5 flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                </div>
                <div className="w-full md:w-[400px] lg:w-[450px] p-6 space-y-6">
                    <div className="flex gap-4 items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                <AlertCircle className="w-16 h-16 text-destructive mb-4 opacity-50" />
                <h2 className="text-2xl font-black tracking-tight mb-2">Oops! Post Hidden</h2>
                <p className="text-muted-foreground mb-6 max-w-md">{error || "Something went wrong while loading this post."}</p>
                <Button onClick={() => navigate("/posts")} variant="default" className="rounded-full px-8">
                    Back to Feed
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:h-[calc(100vh-64px)] bg-background overflow-y-auto md:overflow-hidden relative animate-in fade-in duration-700">
            {/* Back Button (Floating on Mobile) */}
            <button
                onClick={() => navigate(-1)}
                className="fixed top-4 left-4 z-50 p-2.5 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-all shadow-2xl md:hidden animate-in slide-in-from-top-4 duration-1000"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row flex-1 min-h-0">
                {/* Media Side */}
                <div className="w-full md:flex-1 bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-0 overflow-hidden">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 z-10 p-2.5 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 transition-all border border-white/10 hidden md:flex animate-in slide-in-from-left-4 duration-1000"
                    >
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        <span className="text-sm font-bold pr-1">Back</span>
                    </button>

                    {post.image ? (
                        isVideo(post.image) ? (
                            <VideoPlayer
                                src={post.image}
                                className="w-full h-full max-h-full max-w-full object-contain"
                                autoPlay
                            />
                        ) : (
                            <img
                                src={post.image}
                                alt={post.title}
                                className={cn(
                                    "max-h-full max-w-full object-contain transition-all duration-700",
                                    imgLoaded ? "opacity-100" : "opacity-0"
                                )}
                                onLoad={() => setImgLoaded(true)}
                            />
                        )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 animate-in fade-in zoom-in-95 duration-1000">
                            {/* Subtle Atmospheric Effects */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-[120px]" />
                                <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-900 rounded-full blur-[120px]" />
                            </div>

                            <div className="relative z-10 max-w-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-1000 px-4">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tighter leading-tight drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] break-all uppercase">
                                    {post.description}
                                </h2>
                                <div className="mt-8 w-16 h-1.5 bg-white/40 mx-auto rounded-full shadow-inner" />

                                {post.link && (
                                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
                                        <a
                                            href={post.link.startsWith('http') ? post.link : `https://${post.link}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all font-bold text-sm"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Visit Link
                                        </a>
                                    </div>
                                )}
                            </div>


                        </div>
                    )}
                </div>

                {/* Sidebar Side */}
                <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-background border-l border-primary/5 shadow-2xl h-auto md:h-full overflow-visible md:overflow-hidden animate-in slide-in-from-right-4 duration-700 delay-150">
                    {/* Fixed Header on Desktop, Normal on Mobile */}
                    <div className="p-4 border-b border-primary/5 flex items-center gap-3 bg-background/50 backdrop-blur-sm sticky top-0 md:relative z-20">
                        <Link to={`/user/${post.user?._id || post.user}`}>
                            <UserAvatar
                                src={post.user?.avatar}
                                name={post.user?.name || "User"}
                                className="h-9 w-9 border-2 border-primary/10 shadow-sm"
                            />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link to={`/user/${post.user?._id || post.user}`} className="hover:text-primary transition-colors inline-block text-sm font-black tracking-tight leading-none mb-0.5">
                                {post.user?.name || "User"}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{formatTimeAgo(post.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 overflow-visible md:overflow-hidden h-auto md:h-full">
                        <div className="p-4 sm:p-6 space-y-6">
                            {/* Post Typography */}
                            <div className="space-y-4 min-w-0 max-w-full">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.1] break-all text-foreground uppercase">
                                    {post.title}
                                </h1>
                                <div className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap break-all">
                                    {renderDescription(post.description)}
                                </div>

                                {post.link && (
                                    <div className="pt-2">
                                        <a
                                            href={post.link.startsWith('http') ? post.link : `https://${post.link}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-bold transition-colors group/link"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center group-hover/link:bg-primary/10 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </div>
                                            <span className="truncate max-w-[250px] sm:max-w-md">{post.link}</span>
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Interaction Stats */}
                            <div className="flex items-center justify-between py-3 border-y border-primary/5">
                                <div className="flex items-center gap-6">
                                    <PostActions
                                        postId={post._id}
                                        initialLikeCount={post.likesCount ?? post.likeCount ?? 0}
                                        initialCommentCount={post.commentsCount || 0}
                                        initialUserLiked={post.userLiked ?? post.liked ?? post.isLiked ?? false}
                                        showCommentCount={true}
                                    />
                                </div>
                                {/* <button className="text-muted-foreground hover:text-primary transition-all active:rotate-12">
                                    <Share2 className="w-5 h-5" />
                                </button> */}
                            </div>

                            {/* Comments Feed Area */}
                            <div>
                                <CommentsSection postId={post._id} />
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};
