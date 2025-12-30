import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { likeRepo } from "@/repositories/likeRepo";
import { Like } from "@/types/like";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import PaginatedList from "@/components/PaginatedList";

interface LikesModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const LikesModal = ({ postId, isOpen, onClose }: LikesModalProps) => {
    const [totalLikes, setTotalLikes] = useState(0);

    const fetchLikesData = async (page: number, limit: number) => {
        const response = await likeRepo.getLikesByPost(postId, page, limit);
        const total = response.pagination.totalItems ?? response.pagination.total ?? 0;
        setTotalLikes(total);
        return {
            items: response.data,
            pagination: {
                currentPage: response.pagination.currentPage,
                totalPages: response.pagination.totalPages,
                totalPosts: total,
                hasMore: response.pagination.hasMore ?? response.pagination.hasNextPage ?? false,
                postsPerPage: response.pagination.limit ?? response.pagination.itemsPerPage ?? 10,
            },
        };
    };

    const renderLikeItem = (like: Like) => (
        <Link
            key={like._id}
            to={`/user/${like.user._id}`}
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all group"
        >
            <UserAvatar
                src={like.user.avatar}
                name={like.user.name}
                className="h-10 w-10 border-2 border-primary/5 group-hover:border-primary/20 transition-all"
            />
            <div className="flex-1 min-w-0">
                <p className="font-black text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                    {like.user.name}
                </p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider opacity-60">
                    View Profile
                </p>
            </div>
        </Link>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden rounded-3xl border-primary/10 shadow-2xl">
                <DialogHeader className="p-4 border-b border-primary/5 bg-background/50 backdrop-blur-sm sticky top-0 z-10 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                        Liked By ({totalLikes})
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary/5"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-2">
                        {isOpen && (
                            <PaginatedList
                                fetchData={fetchLikesData}
                                renderItem={renderLikeItem}
                                pageSize={10}
                                loadingComponent={
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    ))
                                }
                            />
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
