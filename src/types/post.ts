export interface User {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
    cardSettings?: {
        theme?: string;
        accentColor?: string;
        borderRadius?: string;
        showStatus?: boolean;
        backgroundColor?: string;
        textColor?: string;
        gradient?: string;
    };
}

export interface Post {
    _id: string;
    title: string;
    description: string;
    link?: string;
    image?: string;
    user: User;
    createdAt: string;
    updatedAt?: string;
    likeCount?: number;
    commentCount?: number;
    userLiked?: boolean;
}

export interface PostCreatedPayload {
    post: Post;
}

export interface PostUpdatedPayload {
    post: Post;
}

export interface PostDeletedPayload {
    postId: string;
}
