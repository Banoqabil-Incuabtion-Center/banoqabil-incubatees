"use client"

import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    Camera,
    Loader2,
    ChevronLeft,
    Save
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

    // Phone masking/cleaning helper
    useEffect(() => {
        if (formData.phone) {
            let cleaned = formData.phone.replace(/\D/g, "");
            // Remove leading 0 if present (e.g. 0300 -> 300)
            if (cleaned.startsWith("0")) {
                cleaned = cleaned.substring(1);
            }
            cleaned = cleaned.slice(0, 10);

            if (cleaned !== formData.phone) {
                setFormData(prev => ({ ...prev, phone: cleaned }));
            }
        }
    }, [formData.phone]);

    // CNIC formatting helper
    const formatCNIC = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length <= 5) return cleaned;
        if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    };

    useEffect(() => {
        if (formData.CNIC) {
            const formatted = formatCNIC(formData.CNIC);
            if (formatted !== formData.CNIC && formatted.length <= 15) {
                setFormData(prev => ({ ...prev, CNIC: formatted }));
            }
        }
    }, [formData.CNIC]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === "CNIC") {
            const cleaned = value.replace(/\D/g, "").slice(0, 13);
            setFormData(prev => ({ ...prev, [name]: formatCNIC(cleaned) }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
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
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto p-4 sm:p-8 lg:p-12 pb-32 min-h-screen">
            <div className="mb-10 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/profile")}
                        className="rounded-full h-10 w-10 border border-muted hover:bg-primary/5 hover:text-primary transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Edit Profile</h1>
                    </div>
                </div>

                <div className="hidden sm:flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/profile")}
                        className="rounded-xl border-muted/50 font-black text-[10px] uppercase tracking-widest"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Picture Section */}
                <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Identity Photo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex flex-col items-center">
                            <div className="relative group">
                                <div
                                    className="w-48 h-48 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-muted cursor-pointer relative ring-1 ring-muted"
                                    onClick={handleAvatarClick}
                                >
                                    <UserAvatar
                                        src={avatarPreview || authUser?.avatar}
                                        name={authUser?.name}
                                        className="w-full h-full border-0 rounded-none object-cover transition-transform duration-700 group-hover:scale-110"
                                        fallbackColor="bg-gradient-to-br from-primary to-primary/60"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-10 h-10 text-white" />
                                    </div>
                                </div>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                                <Button
                                    size="icon"
                                    className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl shadow-xl animate-in zoom-in duration-500"
                                    onClick={handleAvatarClick}
                                >
                                    <Camera className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Personal Details Section */}
                <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your full name"
                                className="h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20 font-medium"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="bio" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">About / Bio</Label>
                            <Input
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell something about yourself..."
                                className="h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20 font-medium"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
                            <Input
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                placeholder="e.g. Focus Mode, Coding, Available"
                                className="h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bq_id" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bano Qabil ID</Label>
                            <Input
                                id="bq_id"
                                name="bq_id"
                                value={formData.bq_id}
                                onChange={handleChange}
                                placeholder="BQ-XXXXXX"
                                className="h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="CNIC" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CNIC Number</Label>
                            <Input
                                id="CNIC"
                                name="CNIC"
                                value={formData.CNIC}
                                onChange={handleChange}
                                placeholder="12345-1234567-1"
                                maxLength={15}
                                className="h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20 font-medium"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="yourname@example.com"
                                className="h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20 font-medium"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-muted-foreground/60">+92</span>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="3001234567"
                                    maxLength={10}
                                    className="pl-12 h-12 rounded-xl border-muted/50 bg-muted/5 focus-visible:ring-primary/20 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex flex-col sm:hidden gap-3 pt-6">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                        >
                            {isSaving ? "Saving..." : "Save Profile"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/profile")}
                            className="h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] text-muted-foreground"
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
