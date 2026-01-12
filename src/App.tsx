// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import SignUp from "./auth/SignUp"
import Login from "./auth/Login"
import ForgotPassword from "./auth/ForgotPassword"
import ResetPassword from "./auth/ResetPassword"
import PrivateRoute from "./auth/PrivateRoute"
import Dashboard from "./Pages/Dashboard"
import UserLayout from "./components/layout/userLayout"
import Attendance from "./Pages/Attendance"
import Posts from "./Pages/Posts"
import Profile from "./Pages/Profile"
import EditProfile from "./Pages/EditProfile"
import UserPublicProfile from "./Pages/UserPublicProfile"
import Direct from "./Pages/Direct"
import Calendar from "./Pages/Calendar"
import Activities from "./Pages/Activities"
import Notifications from "./Pages/Notifications"
import { PostDetail } from "./Pages/PostDetail"
import CustomizeCard from "./Pages/CustomizeCard"
import { ThemeColorManager } from "./components/ThemeColorManager"

import { Toaster } from "@/components/ui/sonner"

const App = () => {
  return (
    <Router>
      <ThemeColorManager />
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected routes with layout */}
        <Route path="/" element={<PrivateRoute> <UserLayout /> </PrivateRoute>}>
          <Route index element={<Dashboard />} />

          {/* No need to pass userId prop anymore */}
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/direct" element={<Direct />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/customize" element={<CustomizeCard />} />
          <Route path="/user/:id" element={<UserPublicProfile />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/posts/:id" element={<PostDetail />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App