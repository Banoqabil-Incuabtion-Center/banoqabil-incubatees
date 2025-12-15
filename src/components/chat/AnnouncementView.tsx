import { Megaphone } from "lucide-react";

const MOCK_ANNOUNCEMENTS = [
    {
        _id: "1",
        title: "Updated Community Guidelines & Policy",
        description: "We have updated our community guidelines to ensure a safer and more inclusive environment for all members.\n\nPlease review the changes in the attached document. Key updates include:\n- Stricter anti-harassment policies\n- New guidelines for project collaboration\n- Updated code of conduct for public channels\n\nThank you for helping us keep this community great!",
        createdAt: new Date().toISOString(),
        image: null,
        link: "https://example.com/policy-update"
    },
    {
        _id: "2",
        title: "Maintenance Scheduled",
        description: "The platform will undergo scheduled maintenance on Saturday at 2:00 AM UTC. Expected downtime is approximately 2 hours.",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        image: null,
        link: null
    }
];

export function AnnouncementView() {
    const adminPosts = MOCK_ANNOUNCEMENTS;
    const loading = false;

    return (
        <div className="flex flex-col flex-1 h-full bg-background relative">
            {/* Header */}
            <div className="h-14 border-b flex items-center px-4 shadow-sm bg-background/95 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                        <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="font-bold text-base leading-none">Official Announcements</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Important updates from the administration</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-4 p-4 pb-4">
                    {/* Welcome Header */}
                    <div className="mt-8 mb-8 px-4">
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                            <Megaphone className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-bold mb-1">
                            Welcome to <span className="text-primary">Official Announcements</span>
                        </h1>
                        <p className="text-muted-foreground">
                            This is the beginning of the Official Announcements channel. Stay tuned for important updates!
                        </p>
                    </div>

                    {!loading && adminPosts.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No announcements yet.</p>
                        </div>
                    )}

                    {adminPosts.map((post) => (
                        <div key={post._id} className="flex gap-3 group">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <Megaphone className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="flex flex-col items-start max-w-[85%]">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-semibold text-sm">Official Announcement</span>
                                    <span className="text-[10px] text-muted-foreground select-none">
                                        {new Date(post.createdAt).toLocaleDateString()} {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-secondary/50 text-[15px] leading-relaxed shadow-sm w-full space-y-2">
                                    <h3 className="font-bold text-base">{post.title}</h3>
                                    <p className="whitespace-pre-wrap">{post.description}</p>

                                    {post.image && (
                                        <div className="mt-2 rounded-lg overflow-hidden border bg-background/50 max-w-md">
                                            {post.image.match(/\.(mp4|webm|mov|mkv)$/i) ? (
                                                <video src={post.image} controls className="w-full h-auto max-h-[300px] object-cover" />
                                            ) : (
                                                <img src={post.image} alt="Announcement attachment" className="w-full h-auto max-h-[300px] object-cover" />
                                            )}
                                        </div>
                                    )}

                                    {post.link && (
                                        <a href={post.link} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-500 hover:underline mt-1 break-all">
                                            {post.link}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
