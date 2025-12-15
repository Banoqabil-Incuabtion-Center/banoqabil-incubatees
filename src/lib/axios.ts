import axios from "axios"


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://ims-backend-qmis.up.railway.app",
  withCredentials: true,
})

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    // Check both storages
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error;

    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      // If we already tried refreshing and it failed (or it was the refresh endpoint itself), don't loop
      if (originalRequest.url?.includes("/refresh-token")) {
        return Promise.reject(error);
      }

      if (message === "jwt expired" || message === "Invalid token" || message === "No token") {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token
          const res = await api.post("/refresh-token");

          if (res.status === 200 && res.data.accessToken) {
            const newToken = res.data.accessToken;

            // Sync both storages if they were being used
            if (localStorage.getItem("token")) {
              localStorage.setItem("token", newToken);
            }
            // Always update session (default)
            sessionStorage.setItem("token", newToken);

            // Attach new token to retry
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - clean up and redirect
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          localStorage.removeItem("auth-storage");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);


export default api