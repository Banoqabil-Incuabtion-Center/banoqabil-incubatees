"use client"

import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
    Camera,
    Loader2,
    ChevronLeft,
    Save,
    User2,
    Mail,
    Phone,
    CreditCard,
    IdCard
} from "lucide-react"
import { userRepo } from "../repositories/userRepo"
import { useAuthStore } from "@/hooks/store/authStore"
import { UserAvatar } from "../components/UserAvatar"
import { cn } from "@/lib/utils"

export default function EditProfilePage() {
    const navigate = useNavigate()
    const { user: authUser, setUser: setAuthUser } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formData, setFormData] = useState<any>({
        name: "",
        bio: "",
        status: "",
        bq_id: "",
        email: "",
        phone: "",
        CNIC: "",
        course: "",
        gender: "",
        shift: "",
    })

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const avatarInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await userRepo.profile()
                const userData = res.user || res
                setFormData({
                    name: userData.name || "",
                    bio: userData.bio || "",
                    status: userData.status || "",
                    bq_id: userData.bq_id || "",
                    email: userData.email || "",
                    phone: (userData.phone || "").startsWith("92") ? (userData.phone || "").slice(2) : (userData.phone || ""),
                    CNIC: userData.CNIC || "",
                    course: userData.course || "",
                    gender: userData.gender || "",
                    shift: userData.shift || "",
                })
                setEditingId(userData._id || null)
            } catch (err) {
                console.error(err)
                toast.error("Failed to fetch profile data")
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === "phone") {
            const cleaned = value.replace(/\D/g, "")
            if (cleaned.length <= 10) {
                setFormData({ ...formData, [name]: cleaned })
            }
        } else {
            setFormData({ ...formData, [name]: value })
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

        setAvatarFile(file)
        const previewUrl = URL.createObjectURL(file)
        setAvatarPreview(previewUrl)

        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview)
        }
    }

    const handleSave = async () => {
        if (!editingId) return

        try {
            setIsSaving(true)

            let newAvatarUrl = authUser?.avatar

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
                    return
                }
            }

            let formattedPhone = formData.phone || ""
            formattedPhone = formattedPhone.replace(/\D/g, "")
            if (formattedPhone.startsWith("0")) formattedPhone = formattedPhone.substring(1)
            if (formattedPhone && !formattedPhone.startsWith("92")) formattedPhone = `92${formattedPhone}`

            const dataToSend = {
                ...formData,
                phone: formattedPhone,
            }

            await userRepo.updateUser(editingId, dataToSend)

            const updatedUser = await userRepo.profile()
            setAuthUser(updatedUser.user)

            toast.success("Profile updated successfully")
            navigate("/profile")
        } catch (error: any) {
            console.error(error)
            toast.error("Failed to update profile")
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="container max-w-2xl mx-auto p-4 py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 pb-32">
            <div className="mb-8 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/profile")}
                    className="rounded-full h-10 w-10 border shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
                    <p className="text-muted-foreground text-sm">Update your personal information and profile picture</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Profile Picture Card */}
                <Card className="border shadow-md overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg">Profile Picture</CardTitle>
                        <CardDescription>A professional photo helps people recognize you</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pt-2 pb-8">
                        <div className="relative group">
                            <div
                                className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-background shadow-2xl bg-muted cursor-pointer relative"
                                onClick={handleAvatarClick}
                            >
                                <UserAvatar
                                    src={avatarPreview || authUser?.avatar}
                                    name={authUser?.name}
                                    className="w-full h-full border-0 rounded-none object-cover"
                                    fallbackColor="bg-gradient-to-br from-primary to-primary/60"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <p className="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tap photo to change</p>
                    </CardContent>
                </Card>

                {/* Personal Details Card */}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Basic details about your identity and contact</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User2 className="w-3.5 h-3.5" /> Full Name
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="bio" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    About Me / Bio
                                </Label>
                                <Input
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell something about yourself..."
                                    className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="status" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Current Status
                                </Label>
                                <Input
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    placeholder="What's your status? (e.g. Coding, Studying, On Break)"
                                    className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bq_id" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <IdCard className="w-3.5 h-3.5" /> Bano Qabil ID
                                </Label>
                                <Input
                                    id="bq_id"
                                    name="bq_id"
                                    value={formData.bq_id}
                                    onChange={handleChange}
                                    placeholder="BQ-XXXXXX"
                                    className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="CNIC" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5" /> CNIC Number
                                </Label>
                                <Input
                                    id="CNIC"
                                    name="CNIC"
                                    value={formData.CNIC}
                                    onChange={handleChange}
                                    placeholder="42101-XXXXXXX-X"
                                    className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" /> Email Address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="yourname@example.com"
                                    className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" /> Phone Number
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-sm font-bold text-muted-foreground/60 border-r pr-3 h-5 flex items-center">
                                        +92
                                    </span>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="3001234567"
                                        className="pl-16 h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate("/profile")}
                        className="flex-1 h-12 rounded-xl border-2 font-semibold"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] h-12 rounded-xl shadow-lg shadow-primary/20 font-bold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Save Profile
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
