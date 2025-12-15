"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Edit3,
  Camera,
  Copy,
  Loader2,
  LogOut,
  Mail,
  Phone,
  CreditCard,
  GraduationCap,
  User2,
  Sun,
  Moon,
  IdCard
} from "lucide-react"
import { userRepo } from "../repositories/userRepo"
import { useAuthStore } from "@/hooks/store/authStore"
import { UserAvatar } from "../components/UserAvatar"
import Logout from "@/auth/Logout"

export default function ProfilePage() {
  const { user: authUser, setUser: setAuthUser } = useAuthStore()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState<any>({
    name: "",
    bq_id: "",
    email: "",
    phone: "",
    CNIC: "",
    course: "",
    gender: "",
    shift: "",
  })

  // New states for avatar handling
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Reset preview when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [isModalOpen])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await userRepo.profile()
        setUser(res.user || res)
        setFormData({
          ...formData,
          ...{
            name: res.user?.name || res.name,
            bq_id: res.user?.bq_id || res.bq_id,
            email: res.user?.email || res.email,
            phone: (res.user?.phone || "").startsWith("92") ? (res.user?.phone || "").slice(2) : (res.user?.phone || ""),
            CNIC: res.user?.CNIC || "",
            course: res.user?.course || "",
            gender: res.user?.gender || "",
            shift: res.user?.shift || "",
          },
        })
        setEditingId(res.user?._id || res._id)
      } catch (err) {
        console.error(err)
        toast.error("Failed to fetch profile")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 10) {
        setFormData({ ...formData, [name]: cleaned });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Upload avatar first if selected
      let newAvatarUrl = user?.avatar;

      if (avatarFile) {
        try {
          const res = await userRepo.updateAvatar(avatarFile)
          newAvatarUrl = res.user.avatar

          if (authUser) {
            setAuthUser({ ...authUser, avatar: newAvatarUrl } as any)
          }
        } catch (error: any) {
          console.error("Avatar upload failed:", error)
          toast.error("Failed to upload profile picture")
          return // Stop if avatar upload fails
        }
      }

      if (editingId) {
        // Format phone logic
        let formattedPhone = formData.phone || "";
        formattedPhone = formattedPhone.replace(/\D/g, "");
        if (formattedPhone.startsWith("0")) formattedPhone = formattedPhone.substring(1);
        if (formattedPhone && !formattedPhone.startsWith("92")) formattedPhone = `92${formattedPhone}`;

        const dataToSend = {
          ...formData,
          phone: formattedPhone,
        };

        await userRepo.updateUser(editingId, dataToSend)

        // Refresh user data from server to ensure sync
        const updatedUser = await userRepo.profile()
        setAuthUser(updatedUser.user)
        setUser(updatedUser.user)

        toast.success("Profile updated successfully")
      }
      setIsModalOpen(false)
    } catch (error: any) {
      console.error(error)
      toast.error("Action failed")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    // Set file and preview
    setAvatarFile(file)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)

    // Clean up old preview URL to avoid memory leaks
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
  }

  const triggerLogout = () => {
    document.getElementById("logoutBtn")?.click()
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        {/* Profile Card Skeleton */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-6 w-48 mb-2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card Skeleton */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-8 w-20" />
          </CardHeader>
          <CardContent className="space-y-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                {i > 1 && <Separator className="my-3" />}
                <div className="flex items-center gap-4 py-2">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout Button Skeleton */}
        <Skeleton className="h-11 w-full" />
      </div>
    )
  }

  const profileFields = [
    { label: "BanoQabil ID", value: user?.bq_id, icon: IdCard },
    { label: "Email", value: user?.email, icon: Mail },
    { label: "Phone", value: user?.phone ? `+${user?.phone}` : null, icon: Phone },
    { label: "CNIC", value: user?.CNIC, icon: CreditCard },
    { label: "Course", value: user?.course, icon: GraduationCap },
    { label: "Gender", value: user?.gender, icon: User2 },
    // { label: "Shift", value: user?.shift, icon: user?.shift === "Morning" ? Sun : Moon },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6 pb-6">
          {/* Avatar and User Info - Always inline */}
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-border shadow-lg bg-muted"
              >
                <UserAvatar
                  src={user?.avatar}
                  name={user?.name}
                  className="w-full h-full border-0 rounded-none"
                  fallbackColor="bg-gradient-to-br from-primary to-primary/60"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {user?.name || "Student Name"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="gap-1 text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => {
                    const id = user?.incubation_id;
                    if (id) {
                      navigator.clipboard.writeText(id);
                      toast.success("Incubation ID copied to clipboard");
                    }
                  }}
                  title="Click to copy ID"
                >
                  <IdCard className="w-3 h-3" />
                  {user?.incubation_id || "N/A"}
                  <Copy className="w-3 h-3 ml-1 opacity-50" />
                </Badge>

                {user?.shift && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    {user?.shift === "Morning" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    {user?.shift}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">Personal Information
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-1.5 h-8"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {profileFields.map((field, idx) => {
            const Icon = field.icon
            return (
              <div key={idx}>
                {idx > 0 && <Separator className="my-3" />}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="font-medium text-foreground truncate">
                      {field.value || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Hidden Logout component */}
      <Logout />

      {/* Logout Button at Bottom */}
      <Button
        variant="destructive"
        size="lg"
        onClick={triggerLogout}
        className="w-full gap-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>

      {/* Dialog for updating profile */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-3 pb-4 border-b">
              <div className="relative group">
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border cursor-pointer bg-muted"
                  onClick={handleAvatarClick}
                >
                  <UserAvatar
                    src={avatarPreview || user?.avatar}
                    name={user?.name}
                    className="w-full h-full border-0 rounded-none"
                    fallbackColor="bg-gradient-to-br from-primary to-primary/60"
                  />
                </div>
                {/* Camera overlay */}
                <div
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  <Camera className="w-4 h-4 text-white" />
                </div>

                {/* Hidden file input - moved here inside modal */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                {avatarFile ? "Change Selected" : "Change Photo"}
              </Button>
            </div>

            {["name", "bq_id", "email", "CNIC"].map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="text-sm font-medium">
                  {field === "bq_id" ? "BQ ID" : field === "CNIC" ? "CNIC" : field.charAt(0).toUpperCase() + field.slice(1)}
                </Label>
                <Input
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">
                  +92
                </span>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-12"
                  placeholder="3001234567"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}