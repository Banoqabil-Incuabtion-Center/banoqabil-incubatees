import { Megaphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface AnnouncementViewProps {
    onBack?: () => void;
}

export function AnnouncementView({ onBack }: AnnouncementViewProps) {
    const adminPosts = MOCK_ANNOUNCEMENTS;
    const loading = false;

    return (
        <div className="flex flex-col flex-1 h-full bg-background/50 relative">
            {/* Header */}
            <div className="h-16 border-b border-primary/5 flex items-center px-6 shadow-soft bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
                <div className="flex items-center gap-4">
                    {/* Back Button for Mobile */}
                    <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-10 w-10 rounded-xl hover:bg-primary/5" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft border border-primary/5">
                        <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-black text-sm tracking-tight leading-none">Official Announcements</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">Updates from administration</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-6 p-4 md:p-8 pb-10">
                    {/* Welcome Header */}
                    <div className="mt-6 mb-10 p-8 md:p-12 rounded-[2.5rem] bg-primary/5 border border-primary/5 flex flex-col items-center text-center shadow-soft">
                        <div className="h-20 w-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mb-6 text-primary shadow-soft border border-primary/10">
                            <Megaphone className="h-10 w-10" />
                        </div>
                        <div className="max-w-md space-y-3">
                            <h1 className="text-3xl font-black tracking-tight">
                                Official <span className="text-primary">Announcements</span>
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                Welcome to the hub of important updates. All official communications, guidelines, and schedules will be posted here.
                            </p>
                        </div>
                    </div>

                    {!loading && adminPosts.length === 0 && (
                        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border border-dashed border-primary/10">
                            <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-10 text-primary" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">No announcements yet</p>
                        </div>
                    )}

                    {adminPosts.map((post) => (
                        <div key={post._id} className="flex gap-4 group">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-soft border border-primary/5">
                                    <Megaphone className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="flex flex-col items-start max-w-[90%] sm:max-w-[80%]">
                                <div className="flex items-baseline gap-3 mb-2 px-1">
                                    <span className="font-black text-[11px] uppercase tracking-widest text-primary">Administrator</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/40 select-none">
                                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="px-6 py-5 rounded-[2rem] rounded-tl-[4px] bg-white dark:bg-muted/50 text-[15px] leading-relaxed shadow-soft border border-primary/5 w-full space-y-4 hover:shadow-md transition-shadow">
                                    <h3 className="font-black text-lg tracking-tight text-foreground">{post.title}</h3>
                                    <p className="whitespace-pre-wrap text-muted-foreground font-medium text-[14.5px] leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                                        {post.description}
                                    </p>

                                    {post.image && (
                                        <div className="mt-4 rounded-2xl overflow-hidden border border-primary/10 bg-muted/30 shadow-soft">
                                            {post.image.match(/\.(mp4|webm|mov|mkv)$/i) ? (
                                                <video src={post.image} controls className="w-full h-auto max-h-[400px] object-cover" />
                                            ) : (
                                                <img src={post.image} alt="Announcement attachment" className="w-full h-auto max-h-[400px] object-cover" />
                                            )}
                                        </div>
                                    )}

                                    {post.link && (
                                        <div className="pt-2">
                                            <a
                                                href={post.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 bg-primary/5 px-4 py-2 rounded-xl transition-all hover:translate-x-1"
                                            >
                                                View Attachment
                                                <ArrowLeft className="w-3 h-3 rotate-180" />
                                            </a>
                                        </div>
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
