"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Palette,
    Layout,
    Check,
    Sparkles,
    Box,
    ShieldCheck,
    Type,
    RefreshCcw,
    ChevronLeft,
    Loader2,
    Save
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { UserCard } from "@/components/UserCard"
import { userRepo } from "../repositories/userRepo"
import { useAuthStore } from "@/hooks/store/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DEFAULT_SETTINGS = {
    theme: "default",
    accentColor: "primary",
    borderRadius: "rounded-2xl",
    showStatus: true,
    backgroundColor: "",
    textColor: "",
    gradient: "",
}

const THEMES = [
    { id: "default", name: "Classic", icon: Box, description: "Clean and professional" },
    { id: "glass", name: "Glassmorphism", icon: Sparkles, description: "Modern translucent look" },
    { id: "gradient", name: "Premium Flow", icon: Palette, description: "Subtle brand gradients" },
    { id: "dark", name: "Elite Dark", icon: ShieldCheck, description: "Bold and elegant" },
]

const ACCENTS = [
    { id: "primary", color: "bg-[#10b981]", name: "Brand Green" },
    { id: "blue", color: "bg-blue-500", name: "Royal Blue" },
    { id: "purple", color: "bg-purple-500", name: "Elegant Purple" },
    { id: "orange", color: "bg-orange-500", name: "Vibrant Orange" },
    { id: "rose", color: "bg-rose-500", name: "Soft Rose" },
]

const RADIUS = [
    { id: "rounded-2xl", name: "Smooth", class: "rounded-2xl" },
    { id: "rounded-[2rem]", name: "Ultra", class: "rounded-[2rem]" },
    { id: "rounded-full", name: "Circular", class: "rounded-full" },
    { id: "rounded-none", name: "Sharp", class: "rounded-none" },
]

const GRADIENTS = [
    { id: "brand", name: "Linear: Brand", color: "bg-gradient-to-br from-primary/20 via-white to-primary/10" },
    { id: "sunset", name: "Linear: Sunset", color: "bg-gradient-to-br from-orange-500/20 via-white to-rose-500/20" },
    { id: "ocean", name: "Linear: Ocean", color: "bg-gradient-to-br from-blue-500/20 via-white to-teal-500/20" },
    { id: "midnight", name: "Linear: Night", color: "bg-gradient-to-br from-indigo-500/20 via-white to-purple-500/20" },
    { id: "aurora", name: "Radial: Aurora", color: "bg-[radial-gradient(circle,at_top_right,theme(colors.emerald.400),transparent),radial-gradient(circle,at_bottom_left,theme(colors.blue.400),transparent)] bg-white" },
    { id: "nebula", name: "Radial: Nebula", color: "bg-[radial-gradient(circle,theme(colors.purple.500),transparent)] bg-white" },
    { id: "flare", name: "Radial: Sun", color: "bg-[radial-gradient(circle,at_top_left,theme(colors.amber.400),transparent)] bg-white" },
    { id: "soft", name: "Radial: Glow", color: "bg-[radial-gradient(circle,at_bottom_right,theme(colors.pink.400),transparent)] bg-white" },
    { id: "cyber", name: "Multi: Cyber", color: "bg-gradient-to-tr from-cyan-500/20 via-purple-500/10 to-pink-500/20 bg-white" },
    { id: "tropical", name: "Multi: Tropic", color: "bg-gradient-to-br from-yellow-400/20 via-orange-500/10 to-emerald-500/20 bg-white" },
    { id: "cosmic", name: "Multi: Cosmic", color: "bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-pink-500/20 bg-white" },
    { id: "hyper", name: "Multi: Hyper", color: "bg-gradient-to-br from-fuchsia-600/20 via-blue-600/10 to-cyan-400/20 bg-white" },
]

const BG_PRESETS = [
    { id: "", name: "Default", color: "bg-background border-border" },
    { id: "#000000", name: "Night", color: "bg-black" },
    { id: "#ffffff", name: "Pure", color: "bg-white border-border" },
    { id: "#f3f4f6", name: "Slate", color: "bg-slate-100 border-border" },
    { id: "#064e3b", name: "Deep Forest", color: "bg-emerald-900" },
    { id: "#1e1b4b", name: "Midnight", color: "bg-indigo-950" },
]

const TEXT_PRESETS = [
    { id: "", name: "Auto", color: "bg-muted border-border" },
    { id: "#ffffff", name: "Ice", color: "bg-white border-border" },
    { id: "#000000", name: "Ink", color: "bg-black" },
    { id: "#10b981", name: "Emerald", color: "bg-emerald-500" },
    { id: "#f59e0b", name: "Gold", color: "bg-amber-500" },
    { id: "#ef4444", name: "Ruby", color: "bg-red-500" },
]

export default function CustomizeCard() {
    const navigate = useNavigate()
    const { user: authUser, setUser: setAuthUser } = useAuthStore()
    const [user, setUser] = useState<any>(null)
    const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await userRepo.profile()
                const userData = res.user || res
                setUser(userData)
                setSettings(userData?.cardSettings || DEFAULT_SETTINGS)
            } catch (err) {
                console.error(err)
                toast.error("Failed to fetch profile settings")
            } finally {
                setLoading(false)
            }
        }
        fetchUserData()
    }, [])

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS)
        toast.info("Settings reset to defaults")
    }

    const handleSave = async () => {
        if (!user?._id) return
        try {
            setSaving(true)
            await userRepo.updateUser(user._id, { cardSettings: settings })

            if (authUser?._id === user._id) {
                setAuthUser({ ...authUser, cardSettings: settings })
            }

            toast.success("Card customized successfully!")
            navigate("/profile")
        } catch (error) {
            toast.error("Failed to save customization")
        } finally {
            setSaving(false)
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
        <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 space-y-8 animate-in fade-in duration-700">
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
                        <h1 className="text-3xl font-black tracking-tight">Personalize Card</h1>
                    </div>
                </div>

                <div className="hidden sm:flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="rounded-xl border-muted/50 font-black text-[10px] uppercase tracking-widest"
                        disabled={saving}
                    >
                        Reset Defaults
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        {saving ? "Saving..." : "Confirm Look"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Preview Section */}
                <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Live Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex flex-col items-center">
                            <div className="relative z-10 w-full scale-[0.8] sm:scale-100 transition-transform duration-500 origin-top">
                                <UserCard user={{ ...user, cardSettings: settings }} authUser={authUser} isPublic />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Controls Section */}
                <div className="lg:col-span-2 space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                    {/* Section 1: Core Design */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Core Design</h3>

                        {/* Themes */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visual Theme</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {THEMES.map((theme) => {
                                    const Icon = theme.icon;
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => setSettings({ ...settings, theme: theme.id })}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all text-left group",
                                                settings.theme === theme.id
                                                    ? "border-primary bg-primary/5 shadow-md"
                                                    : "border-muted hover:border-primary/30 hover:bg-muted/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                settings.theme === theme.id ? "bg-primary text-white scale-110 shadow-lg" : "bg-muted group-hover:bg-primary/10"
                                            )}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <p className="text-[11px] font-black tracking-tight">{theme.name}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Corner Radius */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Edge Style</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {RADIUS.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => setSettings({ ...settings, borderRadius: r.id })}
                                        className={cn(
                                            "px-4 py-3.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                            settings.borderRadius === r.id
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-muted hover:border-primary/20 text-muted-foreground"
                                        )}
                                    >
                                        {r.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Gradient Presets */}
                        {settings.theme === "gradient" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gradient Preset</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {GRADIENTS.map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => setSettings({ ...settings, gradient: g.id })}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all",
                                                settings.gradient === g.id || (!settings.gradient && g.id === 'brand')
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-muted hover:border-primary/20"
                                            )}
                                        >
                                            <div className={cn("w-full h-10 rounded-xl shadow-inner", g.color)} />
                                            <p className="text-[10px] font-black tracking-tight truncate w-full px-1">{g.name.toUpperCase()}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Colors & Typography */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Colors & Typography</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Background Color */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Background Surface</Label>
                                <div className="grid grid-cols-6 gap-2">
                                    {BG_PRESETS.map((bg) => (
                                        <button
                                            key={bg.id}
                                            onClick={() => setSettings({ ...settings, backgroundColor: bg.id })}
                                            className={cn(
                                                "aspect-square rounded-full border-2 transition-all flex items-center justify-center p-1 relative",
                                                settings.backgroundColor === bg.id ? "border-primary" : "border-transparent"
                                            )}
                                        >
                                            <div className={cn("w-full h-full rounded-full shadow-inner", bg.color)}>
                                                {settings.backgroundColor === bg.id && <Check className="w-3 h-3 text-primary absolute inset-0 m-auto" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center bg-muted/30 p-2 rounded-2xl border">
                                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: settings.backgroundColor || '#ffffff' }} />
                                    <Input
                                        placeholder="HEX Code"
                                        value={settings.backgroundColor}
                                        onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                                        className="h-10 rounded-xl text-xs font-black uppercase font-mono border-none focus-visible:ring-0 shadow-none bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* Text Color */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Font Tint</Label>
                                <div className="grid grid-cols-6 gap-2">
                                    {TEXT_PRESETS.map((txt) => (
                                        <button
                                            key={txt.id}
                                            onClick={() => setSettings({ ...settings, textColor: txt.id })}
                                            className={cn(
                                                "aspect-square rounded-full border-2 transition-all flex items-center justify-center p-1",
                                                settings.textColor === txt.id ? "border-primary" : "border-transparent"
                                            )}
                                        >
                                            <div className={cn("w-full h-full rounded-full flex items-center justify-center", txt.color)}>
                                                <Type className={cn("w-3 h-3", txt.id === "#ffffff" ? "text-black" : "text-white")} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center bg-muted/30 p-2 rounded-2xl border">
                                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                                        <Type className="w-5 h-5 font-black" style={{ color: settings.textColor || 'inherit' }} />
                                    </div>
                                    <Input
                                        placeholder="HEX Code"
                                        value={settings.textColor}
                                        onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                                        className="h-10 rounded-xl text-xs font-black uppercase font-mono border-none focus-visible:ring-0 shadow-none bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Accent Colors */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Elements Accent</Label>
                            <div className="flex flex-wrap gap-2">
                                {ACCENTS.map((accent) => (
                                    <button
                                        key={accent.id}
                                        onClick={() => setSettings({ ...settings, accentColor: accent.id })}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                                            settings.accentColor === accent.id ? "border-primary bg-primary/5 text-primary" : "border-muted hover:border-primary/20 text-muted-foreground"
                                        )}
                                    >
                                        <div className={cn("w-3 h-3 rounded-full", accent.color)} />
                                        {accent.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Extra Options */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Extra Options</h3>

                        <div className="flex items-center justify-between p-6 rounded-[2rem] bg-muted/10 border-2 border-dashed border-muted group hover:border-primary/20 transition-all duration-500">
                            <div className="space-y-1">
                                <p className="font-black tracking-tight uppercase text-xs">Presence Badge</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest">Show status bubble</p>
                            </div>
                            <Switch
                                checked={settings.showStatus}
                                onCheckedChange={(val) => setSettings({ ...settings, showStatus: val })}
                                className="scale-110 data-[state=checked]:bg-primary"
                            />
                        </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex flex-col sm:hidden gap-3 pt-6">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                        >
                            {saving ? "Saving..." : "Confirm Look"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/profile")}
                            className="h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] text-muted-foreground"
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
