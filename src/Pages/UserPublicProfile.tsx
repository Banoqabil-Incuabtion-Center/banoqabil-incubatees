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
    Phone,
    CreditCard,
    GraduationCap,
    User2,
    IdCard,
    Globe,
    Monitor,
    Smartphone,
    Tablet,
    MapPin,
    ChevronLeft,
    LayoutGrid,
    Info,
    Loader2,
    Sparkles
} from "lucide-react"
import { userRepo } from "../repositories/userRepo"
import { postRepo } from "../repositories/postRepo"
import { UserCard } from "../components/UserCard"
import { PostCard } from "../components/PostCard"

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
            <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container max-w-7xl mx-auto p-4 py-20 text-center space-y-4">
                <h2 className="text-2xl font-bold">User Not Found</h2>
                <p className="text-muted-foreground">The profile you are looking for does not exist or has been removed.</p>
                <Button asChild variant="outline" className="rounded-xl">
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
        { label: "Gender", value: user.gender, icon: User2 },
    ]

    return (
        <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            {/* Back Button */}
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="rounded-xl gap-2 hover:bg-muted font-medium">
                    <Link to="/posts">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Community
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                {/* Left Column: Profile Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <UserCard user={user} isPublic={true} />
                </div>

                {/* Right Column: Details & Posts */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="posts" className="w-full">
                        <TabsList className="w-full h-12 p-1 bg-muted/50 rounded-xl gap-1">
                            <TabsTrigger value="posts" className="flex-1 rounded-lg h-10 font-medium gap-2">
                                <LayoutGrid className="w-4 h-4" /> Community Posts
                            </TabsTrigger>
                            <TabsTrigger value="info" className="flex-1 rounded-lg h-10 font-medium gap-2">
                                <Info className="w-4 h-4" /> About User
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="posts" className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                            {postsLoading ? (
                                <div className="space-y-0">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="py-6 sm:py-8 border-b border-primary/5">
                                            <div className="flex gap-4">
                                                <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                                                <div className="flex-1 space-y-3">
                                                    <Skeleton className="h-4 w-1/4" />
                                                    <Skeleton className="h-4 w-full" />
                                                    <Skeleton className="h-32 w-full rounded-2xl sm:rounded-3xl" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : posts.length === 0 ? (
                                <Card className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                                    <div className="p-4 rounded-full bg-muted">
                                        <LayoutGrid className="w-8 h-8 opacity-40 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-foreground">No posts yet</p>
                                        <p className="text-sm">This user hasn't posted anything in the community.</p>
                                    </div>
                                </Card>
                            ) : (
                                <div className="space-y-0">
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
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="info" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <Card className="border shadow-sm">
                                <CardContent className="p-0">
                                    <div className="divide-y">
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
            </div>
        </div>
    )
}
