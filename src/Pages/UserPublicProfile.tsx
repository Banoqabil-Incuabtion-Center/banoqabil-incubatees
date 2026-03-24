"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
    Mail,
    GraduationCap,
    User2,
    IdCard,
    MapPin,
    ArrowLeft,
    Info,
    Loader2,
    Sparkles
} from "lucide-react"
import { userRepo } from "../repositories/userRepo"
import { postRepo } from "../repositories/postRepo"
import { PostCard } from "../components/PostCard"
import { ProfileHeader } from "../components/ProfileHeader"
import { UserCard } from "../components/UserCard"

export default function UserPublicProfile() {
    const { id } = useParams<{ id: string }>()
    const [user, setUser] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [postsLoading, setPostsLoading] = useState(true)

    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return
            try {
                setLoading(true)
                const res = await userRepo.getUserById(id)
                setUser(res.user)
            } catch (err) {
                console.error(err)
                toast.error("User not found or error fetching profile")
            } finally {
                setLoading(false)
            }
        }

        const fetchUserPosts = async () => {
            if (!id) return
            try {
                setPostsLoading(true)
                const res = await postRepo.getUserPostsWithStats(1, 20, id)
                setPosts(res.data || [])
            } catch (err) {
                console.error("Failed to fetch user posts", err)
            } finally {
                setPostsLoading(false)
            }
        }

        fetchUserData()
        fetchUserPosts()
    }, [id])

    if (loading) {
        return (
            <div className="container max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container max-w-2xl mx-auto p-4 py-20 text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">User Not Found</h2>
                <p className="text-muted-foreground">The profile you are looking for does not exist or has been removed.</p>
                <Button asChild variant="outline" className="rounded-full font-bold mt-4">
                    <Link to="/posts">Return to Community</Link>
                </Button>
            </div>
        )
    }

    const profileFields = [
        { label: "Bio", value: user.bio, icon: Info },
        { label: "Status", value: user.status, icon: Sparkles },
        { label: "Bano Qabil ID", value: user.bq_id, icon: IdCard },
        { label: "Email Address", value: user.email, icon: Mail },
        { label: "Course", value: user.course, icon: GraduationCap },
        { label: "Location", value: user.location, icon: MapPin },
        { label: "Gender", value: user.gender, icon: User2 },
    ]

    return (
        <div className="container mx-auto p-0 sm:px-4 sm:py-6 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-background sm:border-x sm:border-y border-border sm:rounded-2xl overflow-hidden min-h-screen">
                
                {/* Header Back Button like X */}
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-2 flex items-center gap-6">
                    <Button variant="ghost" size="icon" asChild className="rounded-full w-9 h-9 hover:bg-muted">
                        <Link to="/posts">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div className="flex flex-col">
                        <h2 className="font-bold text-foreground text-xl leading-5">{user.name}</h2>
                        <span className="text-muted-foreground text-xs leading-4">{posts.length} posts</span>
                    </div>
                </div>

                <ProfileHeader user={user} isOwner={false} />

                <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="w-full h-14 bg-background border-b border-border rounded-none p-0 flex justify-around">
                        <TabsTrigger 
                            value="posts" 
                            className="flex-1 rounded-none data-[state=active]:border-b-4 border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent h-full font-bold text-muted-foreground data-[state=active]:text-foreground transition-all duration-200"
                        >
                            Posts
                        </TabsTrigger>
                        <TabsTrigger 
                            value="info" 
                            className="flex-1 rounded-none data-[state=active]:border-b-4 border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent h-full font-bold text-muted-foreground data-[state=active]:text-foreground transition-all duration-200"
                        >
                            About
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-0 animate-in fade-in slide-in-from-bottom-2">
                        {postsLoading ? (
                            <div className="space-y-0">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 sm:p-6 border-b border-border">
                                        <div className="flex gap-4">
                                            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
                                            <div className="flex-1 space-y-3">
                                                <Skeleton className="h-4 w-1/4" />
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-32 w-full rounded-2xl" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2 border-b border-border">
                                <h3 className="font-bold text-lg text-foreground mt-2">No posts yet</h3>
                                <p className="text-sm">This user hasn't posted anything in the community yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-0 divide-y divide-border border-b border-border">
                                {posts.map(post => (
                                    <PostCard
                                        key={post._id}
                                        postId={post._id}
                                        title={post.title}
                                        description={post.description}
                                        image={post.image}
                                        link={post.link}
                                        createdAt={post.createdAt}
                                        authorName={post.user?.name}
                                        authorAvatar={post.user?.avatar}
                                        authorId={post.user?._id}
                                        likeCount={post.likeCount}
                                        commentCount={post.commentCount}
                                        userLiked={post.userLiked}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="info" className="mt-0 animate-in fade-in slide-in-from-bottom-2">
                        <Card className="border-0 shadow-none rounded-none">
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {profileFields.map((field, idx) => {
                                        const Icon = field.icon
                                        if (!field.value) return null
                                        return (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-4 sm:p-5 hover:bg-muted/5 transition-colors group">
                                                <div className="flex items-center gap-3 sm:w-48 shrink-0">
                                                    <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                                                        {field.label}
                                                    </span>
                                                </div>
                                                <div className="flex-1 pl-11 sm:pl-0">
                                                    <p className="font-medium text-foreground">
                                                        {field.value}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Side Profile Card Option */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
                <div className="sticky top-6">
                    <div className="bg-background border border-border rounded-2xl p-6 flex flex-col items-center gap-6 shadow-sm">
                        <div className="w-full flex items-center justify-between">
                            <h3 className="font-bold text-lg text-foreground">Member Card</h3>
                        </div>
                        
                        <div className="w-full relative">
                            <div className="w-full flex justify-center transform transition-transform hover:scale-[1.02] duration-300">
                                <UserCard user={user} isPublic className="transform scale-90 sm:scale-100 sm:max-w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
