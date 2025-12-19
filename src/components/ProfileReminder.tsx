"use client"

import { useEffect, useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/hooks/store/authStore"
import { userRepo } from "@/repositories/userRepo"
import { toast } from "sonner"
import { useLocation } from "react-router-dom"
import {
    Loader2,
    Sparkles,
    User,
    Camera,
    FileText,
    ArrowRight,
    Upload,
    ChevronLeft,
    CheckCircle2
} from "lucide-react"
import { UserAvatar } from "./UserAvatar"

export function ProfileReminder() {
    const { user, setUser } = useAuthStore()
    const location = useLocation()
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState<"summary" | "status" | "bio" | "avatar">("summary")
    const [status, setStatus] = useState("")
    const [bio, setBio] = useState("")
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const statusRecs: Record<string, string[]> = {
        "Web Development": ["Building modern web apps 💻", "Fixing bugs... 🐛", "Learning React ⚛️"],
        "Graphic Design": ["Designing magic ✨", "Playing with colors 🎨", "Creating brand vibes 🖌️"],
        "Python": ["Writing clean scripts 🐍", "Automating life 🤖", "Data is everything 📊"],
        "General": ["Studying hard 📚", "Bano Qabil mission 🌟", "On a break ☕"]
    }

    const bioRecs: Record<string, string[]> = {
        "Web Development": ["Passionate web developer exploring the latest frontend technologies.", "Tech enthusiast learning to build scalable web applications."],
        "Graphic Design": ["Creative mind focused on visual storytelling and modern design.", "Aspirant designer bringing ideas to life through colors and shapes."],
        "Python": ["Data nerd and Python programmer building automation scripts.", "Exploring the world of AI and Web development with Python."],
        "General": ["Eager learner at Bano Qabil, dedicated to mastering new skills.", "Striving for excellence in my chosen tech field at Bano Qabil."]
    }

    const currentStatusRecs = user?.course ? (statusRecs[user.course] || statusRecs["General"]) : statusRecs["General"]
    const currentBioRecs = user?.course ? (bioRecs[user.course] || bioRecs["General"]) : bioRecs["General"]

    const missingFields = []
    if (user) {
        if (!user.status || user.status.trim() === "") missingFields.push({ id: "status", label: "Current Status", icon: Sparkles, color: "text-primary", bg: "bg-primary/10" })
        if (!user.bio || user.bio.trim() === "") missingFields.push({ id: "bio", label: "About Me / Bio", icon: FileText, color: "text-primary", bg: "bg-primary/10" })
        if (!user.avatar) missingFields.push({ id: "avatar", label: "Profile Picture", icon: Camera, color: "text-primary", bg: "bg-primary/10" })
    }

    useEffect(() => {
        // High priority: Don't show if profile is already complete or we are on edit page
        if (!user || missingFields.length === 0 || location.pathname === "/profile/edit") {
            setIsOpen(false)
            return
        }

        const dismissalTime = localStorage.getItem("profileReminderDismissedAt")

        // If dismissed recently, don't show
        if (dismissalTime) {
            const lastDismissed = parseInt(dismissalTime)
            const now = Date.now()
            // Snooze for 24 hours
            if (now - lastDismissed < 24 * 60 * 60 * 1000) return
        }

        const timer = setTimeout(() => {
            setIsOpen(true)
            if (missingFields.length === 1) {
                setView(missingFields[0].id as any)
            } else {
                setView("summary")
            }
        }, 3000)

        return () => clearTimeout(timer)
    }, [user, missingFields.length])

    const handleDismiss = () => {
        setIsOpen(false)
        localStorage.setItem("profileReminderDismissedAt", Date.now().toString())
    }

    const handleSaveStatus = async () => {
        const trimmedStatus = status.trim()
        if (!trimmedStatus) return toast.error("Please enter a status")
        if (trimmedStatus.length > 40) return toast.error("Status too long!")

        try {
            setLoading(true)
            await userRepo.updateUser(user?._id as string, { status: trimmedStatus })
            const updatedUser = await userRepo.profile()
            setUser(updatedUser.user || updatedUser)
            toast.success("Status updated!")
            missingFields.length > 1 ? setView("summary") : setIsOpen(false)
        } catch (error) { toast.error("Update failed") } finally { setLoading(false) }
    }

    const handleSaveBio = async () => {
        const trimmedBio = bio.trim()
        if (!trimmedBio) return toast.error("Please enter a bio")
        if (trimmedBio.length > 200) return toast.error("Bio too long!")

        try {
            setLoading(true)
            await userRepo.updateUser(user?._id as string, { bio: trimmedBio })
            const updatedUser = await userRepo.profile()
            setUser(updatedUser.user || updatedUser)
            toast.success("Bio updated!")
            missingFields.length > 1 ? setView("summary") : setIsOpen(false)
        } catch (error) { toast.error("Update failed") } finally { setLoading(false) }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleSaveAvatar = async () => {
        if (!avatarFile) return toast.error("Please select an image")

        try {
            setLoading(true)
            await userRepo.updateAvatar(avatarFile)
            const updatedUser = await userRepo.profile()
            setUser(updatedUser.user || updatedUser)
            toast.success("Profile picture updated!")
            missingFields.length > 1 ? setView("summary") : setIsOpen(false)
        } catch (error) { toast.error("Upload failed") } finally { setLoading(false) }
    }

    if (!user || missingFields.length === 0) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleDismiss()
            setIsOpen(open)
        }}>
            <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-premium p-0 overflow-hidden">
                <div className="bg-background p-6">

                    {/* SUMMARY VIEW */}
                    {view === "summary" && (
                        <>
                            <DialogHeader>
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <User className="w-8 h-8" />
                                </div>
                                <DialogTitle className="text-center text-2xl font-black tracking-tight">Complete Profile</DialogTitle>
                                <DialogDescription className="text-center text-sm font-medium opacity-70">
                                    Let's finish setting up your identity.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 py-8">
                                {missingFields.map((field) => (
                                    <div
                                        key={field.id}
                                        onClick={() => setView(field.id as any)}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-white hover:border-primary/20 hover:shadow-soft transition-all cursor-pointer group"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl ${field.bg} ${field.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                            <field.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-foreground">{field.label}</p>
                                            <p className="text-[10px] text-muted-foreground font-semibold">Tap to add</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>

                            <DialogFooter className="flex flex-col-reverse items-baseline sm:flex-row sm:justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={handleDismiss}
                                    className="w-full sm:w-auto h-10 rounded-xl text-muted-foreground font-semibold hover:bg-transparent hover:text-foreground"
                                >
                                    Remind Me Later
                                </Button>
                                <Button
                                    onClick={() => setView(missingFields[0].id as any)}
                                    className="w-full sm:w-auto h-14 sm:h-12 rounded-2xl font-black shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Finish Setup
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {/* STATUS VIEW */}
                    {view === "status" && (
                        <>
                            <DialogHeader>
                                {missingFields.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => setView("summary")} className="rounded-full absolute left-4 top-4">
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <DialogTitle className="text-center text-xl font-bold">What's your vibe?</DialogTitle>
                                <DialogDescription className="text-center text-sm">Short and sweet status (max 40 chars)</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-6">
                                <div className="relative">
                                    <Input
                                        placeholder="Coding, Studying..."
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value.slice(0, 40))}
                                        className="h-14 rounded-2xl bg-white shadow-soft border-none text-center font-bold text-lg"
                                        autoFocus
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">{status.length}/40</span>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {currentStatusRecs.map((rec, i) => (
                                        <button key={i} onClick={() => setStatus(rec)} className="px-3 py-2 rounded-full bg-white text-[11px] font-bold shadow-soft hover:bg-primary hover:text-white transition-all">
                                            {rec}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleSaveStatus} disabled={loading} className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 bg-primary">
                                {loading ? <Loader2 className="animate-spin" /> : "Save Status"}
                            </Button>
                        </>
                    )}

                    {/* BIO VIEW */}
                    {view === "bio" && (
                        <>
                            <DialogHeader>
                                {missingFields.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => setView("summary")} className="rounded-full absolute left-4 top-4">
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                                    <FileText className="w-6 h-6 text-primary" />
                                </div>
                                <DialogTitle className="text-center text-xl font-bold">About You</DialogTitle>
                                <DialogDescription className="text-center text-sm">A little intro goes a long way.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-6">
                                <Textarea
                                    placeholder="Tell the community about yourself..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                                    className="min-h-[120px] rounded-2xl bg-white shadow-soft border-none p-4 font-medium"
                                />
                                <div className="flex flex-col gap-2">
                                    {currentBioRecs.map((rec, i) => (
                                        <button key={i} onClick={() => setBio(rec)} className="text-left p-3 rounded-2xl bg-white/50 text-[11px] font-medium hover:bg-white transition-all border border-transparent hover:border-primary/20">
                                            {rec}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleSaveBio} disabled={loading} className="w-full h-14 rounded-2xl font-bold shadow-xl bg-primary">
                                {loading ? <Loader2 className="animate-spin" /> : "Save Bio"}
                            </Button>
                        </>
                    )}

                    {/* AVATAR VIEW */}
                    {view === "avatar" && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between mb-2">
                                    {missingFields.length > 1 && (
                                        <Button variant="ghost" size="icon" onClick={() => setView("summary")} className="rounded-full">
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                    )}
                                    <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-primary" />
                                    </div>
                                    {missingFields.length > 1 && <div className="w-10" />}
                                </div>
                                <DialogTitle className="text-center text-xl font-bold">Profile Picture</DialogTitle>
                                <DialogDescription className="text-center text-sm">Show your face to the community!</DialogDescription>
                            </DialogHeader>
                            <div className="py-10 flex flex-col items-center">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-32 h-32 rounded-[2rem] bg-muted relative cursor-pointer group overflow-hidden border-4 border-white shadow-2xl"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                            <Upload className="w-8 h-8 opacity-20" />
                                            <span className="text-[10px] font-bold opacity-50">CHOOSE PHOTO</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white w-8 h-8" />
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                            <Button onClick={handleSaveAvatar} disabled={loading || !avatarFile} className="w-full h-14 rounded-2xl font-bold shadow-xl bg-primary">
                                {loading ? <Loader2 className="animate-spin" /> : "Upload Photo"}
                            </Button>
                        </>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    )
}
