import api from "../lib/axios";

export class UserRepo {
  async profile() {
    const response = await api.get("/api/user/profile")
    return response.data
  }

  async updateUser(id: string, data: any) {
    const response = await api.put(`/api/user/update/${id}`, data, {
      withCredentials: true,
    })
    return response.data
  }

  async updateAvatar(imageFile: File) {
    const formData = new FormData();
    formData.append('avatar', imageFile);

    const response = await api.post("/api/user/avatar", formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async logoutUser() {
    const response = await api.post("/api/user/logout")
    return response.data
  }

  async loginUser(data: any) {
    const response = await api.post("/api/user/login", data)
    return response.data
  }

  async signupUser(data: any) {
    const response = await api.post("/api/user/signup", data)
    return response.data
  }

  async addUser(data: any) {
    const response = await api.post("/api/user/signup", data)
    return response.data
  }

  async getEnums() {
    const response = await api.get("/api/user/enums")
    return response.data
  }

  async getActivities(page = 1, limit = 10) {
    const response = await api.get(`/api/user/activities?page=${page}&limit=${limit}`)
    return response.data
  }

  async getUserById(id: string) {
    const response = await api.get(`/api/user/public/${id}`)
    return response.data
  }
}

export const userRepo = new UserRepo();
