import api from "../lib/axios";

export class PostRepo {
  // Get all admin posts with pagination
  async getAllPosts(page: number = 1, limit: number = 10) {
    const response = await api.get("/api/admin/post", {
      params: { page, limit },
    });
    return response.data;
  }

  // Get all user posts with pagination
  async getAllUsersPosts(page: number = 1, limit: number = 10) {
    const response = await api.get("/api/user/getuserpost", {
      params: { page, limit },
    });
    return response.data;
  }

  // ✅ OPTIMIZED: Get user posts with like/comment counts in single query
  async getUserPostsWithStats(page: number = 1, limit: number = 10, userId?: string) {
    const response = await api.get("/api/user/getuserpost/stats", {
      params: { page, limit, userId },
    });
    return response.data;
  }

  // Get single post by ID (Admin)
  async getPostById(id: string) {
    const response = await api.get(`/api/admin/getpost/${id}`);
    return response.data;
  }

  // Get single user post by ID
  async getUserPostById(id: string) {
    const response = await api.get(`/api/user/getuserpost/${id}`);
    return response.data;
  }

  // Create admin post
  async createPost(postData: any) {
    const response = await api.post("/api/admin/post", postData);
    return response.data;
  }

  // Create user post with optional image
  async createUserPost(postData: { title: string; description: string; link?: string; image?: File }) {
    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('description', postData.description);
    if (postData.link) {
      formData.append('link', postData.link);
    }
    if (postData.image) {
      formData.append('image', postData.image);
    }

    const response = await api.post("/api/user/createpost", formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Update admin post
  async updatePost(id: string, postData: any) {
    const response = await api.put(`/api/admin/post/${id}`, postData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  // Update user post with optional image
  async updateUserPost(postId: string, postData: { title?: string; description?: string; link?: string; image?: File }) {
    const formData = new FormData();
    formData.append('id', postId);
    if (postData.title) {
      formData.append('title', postData.title);
    }
    if (postData.description) {
      formData.append('description', postData.description);
    }
    if (postData.link !== undefined) {
      formData.append('link', postData.link);
    }
    if (postData.image) {
      formData.append('image', postData.image);
    }

    const response = await api.put("/api/user/updateuserpost", formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Delete admin post
  async deletePost(id: string) {
    const response = await api.delete(`/api/admin/post/${id}`);
    return response.data;
  }

  // Delete user post
  async deleteUserPost(postId: string) {
    const response = await api.delete("/api/user/deleteuserpost", {
      data: { id: postId },
      withCredentials: true,
    });
    return response.data;
  }
}

export const postRepo = new PostRepo();