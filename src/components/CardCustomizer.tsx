import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Layout, Check, Sparkles, Box, ShieldCheck, Maximize, Minimize, Type, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserCard } from "./UserCard";
import { userRepo } from "../repositories/userRepo";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/store/authStore";
import { Input } from "./ui/input";

const DEFAULT_SETTINGS = {
    theme: "default",
    accentColor: "primary",
    borderRadius: "rounded-2xl",
    showStatus: true,
    backgroundColor: "",
    textColor: "",
    gradient: "",
};

const THEMES = [
    // ... (rest of constants stay same)
    { id: "default", name: "Classic", icon: Box, description: "Clean and professional" },
    { id: "glass", name: "Glassmorphism", icon: Sparkles, description: "Modern translucent look" },
    { id: "gradient", name: "Premium Flow", icon: Palette, description: "Subtle brand gradients" },
    { id: "dark", name: "Elite Dark", icon: ShieldCheck, description: "Bold and elegant" },
];

const ACCENTS = [
    { id: "primary", color: "bg-[#10b981]", name: "Brand Green" },
    { id: "blue", color: "bg-blue-500", name: "Royal Blue" },
    { id: "purple", color: "bg-purple-500", name: "Elegant Purple" },
    { id: "orange", color: "bg-orange-500", name: "Vibrant Orange" },
    { id: "rose", color: "bg-rose-500", name: "Soft Rose" },
];

const RADIUS = [
    { id: "rounded-2xl", name: "Smooth", class: "rounded-2xl" },
    { id: "rounded-[2rem]", name: "Ultra", class: "rounded-[2rem]" },
    { id: "rounded-full", name: "Circular", class: "rounded-full" },
    { id: "rounded-none", name: "Sharp", class: "rounded-none" },
];

const GRADIENTS = [
    { id: "brand", name: "Linear: Brand", color: "bg-gradient-to-br from-primary to-primary/60" },
    { id: "sunset", name: "Linear: Sunset", color: "bg-gradient-to-br from-orange-500 to-rose-500" },
    { id: "ocean", name: "Linear: Ocean", color: "bg-gradient-to-br from-blue-500 to-teal-500" },
    { id: "midnight", name: "Linear: Night", color: "bg-gradient-to-br from-indigo-500 to-purple-500" },

    { id: "aurora", name: "Radial: Aurora", color: "bg-[radial-gradient(circle,at_top_right,theme(colors.emerald.400),transparent),radial-gradient(circle,at_bottom_left,theme(colors.blue.400),transparent)]" },
    { id: "nebula", name: "Radial: Nebula", color: "bg-[radial-gradient(circle,theme(colors.purple.500),transparent)]" },
    { id: "flare", name: "Radial: Sun", color: "bg-[radial-gradient(circle,at_top_left,theme(colors.amber.400),transparent)]" },
    { id: "soft", name: "Radial: Glow", color: "bg-[radial-gradient(circle,at_bottom_right,theme(colors.pink.400),transparent)]" },

    { id: "cyber", name: "Multi: Cyber", color: "bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-400" },
    { id: "tropical", name: "Multi: Tropic", color: "bg-gradient-to-br from-yellow-400 via-orange-500 to-emerald-500" },
    { id: "cosmic", name: "Multi: Cosmic", color: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400" },
    { id: "hyper", name: "Multi: Hyper", color: "bg-gradient-to-br from-fuchsia-600 via-blue-600 to-cyan-400" },
];

const BG_PRESETS = [
    { id: "", name: "Default", color: "bg-background border-border" },
    { id: "#000000", name: "Night", color: "bg-black" },
    { id: "#ffffff", name: "Pure", color: "bg-white border-border" },
    { id: "#f3f4f6", name: "Slate", color: "bg-slate-100 border-border" },
    { id: "#064e3b", name: "Deep Forest", color: "bg-emerald-900" },
    { id: "#1e1b4b", name: "Midnight", color: "bg-indigo-950" },
];

const TEXT_PRESETS = [
    { id: "", name: "Auto", color: "bg-muted border-border" },
    { id: "#ffffff", name: "Ice", color: "bg-white border-border" },
    { id: "#000000", name: "Ink", color: "bg-black" },
    { id: "#10b981", name: "Emerald", color: "bg-emerald-500" },
    { id: "#f59e0b", name: "Gold", color: "bg-amber-500" },
    { id: "#ef4444", name: "Ruby", color: "bg-red-500" },
];

export function CardCustomizer({ user, onUpdate }: { user: any; onUpdate: (data: any) => void }) {
    const { user: authUser, setUser: setAuthUser } = useAuthStore();
    const [settings, setSettings] = useState(user?.cardSettings || {
        theme: "default",
        accentColor: "primary",
        borderRadius: "rounded-2xl",
        showStatus: true,
        backgroundColor: "",
        textColor: "",
        gradient: "",
    });
    const [loading, setLoading] = useState(false);

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        toast.success("Settings reset to defaults (Save to apply)");
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedUser = { ...user, cardSettings: settings };
            await userRepo.updateUser(user._id, { cardSettings: settings });

            // Update local store to reflect changes globally
            if (authUser?._id === user._id) {
                setAuthUser({ ...authUser, cardSettings: settings });
            }

            onUpdate(updatedUser);
            toast.success("Card customized successfully!");
        } catch (error) {
            toast.error("Failed to save customization");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full gap-2 rounded-2xl h-11 border-dashed hover:border-primary transition-all">
                    <Palette className="w-4 h-4" />
                    Customize Profile Card
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6 pb-20">
                <SheetHeader className="mb-8">
                    <SheetTitle>Personalize Your Card</SheetTitle>
                    <SheetDescription>
                        Professionally customize how your profile appears to others.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col h-full">
                    {/* Sticky Preview Section */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-6 pt-1 border-b mb-10 -mx-6 px-6">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block">Real-time Preview</Label>
                        <div className="flex justify-center">
                            <div className="scale-90 origin-top w-full">
                                <UserCard user={{ ...user, cardSettings: settings }} authUser={authUser} isPublic />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10 pb-10">
                        {/* Section 1: Core Design */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Layout className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-sm tracking-tight">Core Design</h3>
                            </div>

                            {/* Themes */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visual Theme</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {THEMES.map((theme) => {
                                        const Icon = theme.icon;
                                        return (
                                            <button
                                                key={theme.id}
                                                onClick={() => setSettings({ ...settings, theme: theme.id })}
                                                className={cn(
                                                    "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left group",
                                                    settings.theme === theme.id
                                                        ? "border-primary bg-primary/5 shadow-md"
                                                        : "border-muted hover:border-primary/30 hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                    settings.theme === theme.id ? "bg-primary text-white scale-110 shadow-lg" : "bg-muted group-hover:bg-primary/10"
                                                )}>
                                                    <Icon className="w-5 h-5" />
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
                                <div className="grid grid-cols-4 gap-2">
                                    {RADIUS.map((r) => (
                                        <button
                                            key={r.id}
                                            onClick={() => setSettings({ ...settings, borderRadius: r.id })}
                                            className={cn(
                                                "px-3 py-2.5 rounded-xl border-2 text-[10px] font-black transition-all",
                                                settings.borderRadius === r.id
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-muted hover:border-primary/20 text-muted-foreground"
                                            )}
                                        >
                                            {r.name.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gradient Presets (Only when Premium Flow theme is selected) */}
                            {settings.theme === "gradient" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gradient Preset</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {GRADIENTS.map((g) => (
                                            <button
                                                key={g.id}
                                                onClick={() => setSettings({ ...settings, gradient: g.id })}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all",
                                                    settings.gradient === g.id || (!settings.gradient && g.id === 'brand')
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-muted hover:border-primary/20"
                                                )}
                                            >
                                                <div className={cn("w-full h-8 rounded-lg shadow-inner", g.color)} />
                                                <p className="text-[9px] font-black tracking-tight">{g.name.toUpperCase()}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Colors & Typography */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Palette className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-sm tracking-tight">Colors & Typography</h3>
                            </div>

                            {/* Background Color */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Background Surface</Label>
                                <div className="grid grid-cols-6 gap-2">
                                    {BG_PRESETS.map((bg) => (
                                        <button
                                            key={bg.id}
                                            onClick={() => setSettings({ ...settings, backgroundColor: bg.id })}
                                            className={cn(
                                                "aspect-square rounded-full border-2 transition-all flex items-center justify-center p-0.5 relative group",
                                                settings.backgroundColor === bg.id ? "border-primary" : "border-transparent"
                                            )}
                                        >
                                            <div className={cn("w-full h-full rounded-full shadow-inner", bg.color)}>
                                                {settings.backgroundColor === bg.id && <Check className="w-3 h-3 text-primary absolute inset-0 m-auto filter drop-shadow-sm font-bold" />}
                                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                                    {bg.name}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center bg-muted/30 p-2 rounded-2xl border">
                                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: settings.backgroundColor || '#ffffff' }} />
                                    <Input
                                        placeholder="Enter HEX (e.g. #FF5500)"
                                        value={settings.backgroundColor}
                                        onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                                        className="h-10 rounded-xl text-xs font-black uppercase font-mono border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none bg-transparent"
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
                                                "aspect-square rounded-full border-2 transition-all flex items-center justify-center p-0.5",
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
                                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                                        <Type className="w-5 h-5 font-black" style={{ color: settings.textColor || 'inherit' }} />
                                    </div>
                                    <Input
                                        placeholder="Text HEX (e.g. #000000)"
                                        value={settings.textColor}
                                        onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                                        className="h-10 rounded-xl text-xs font-black uppercase font-mono border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* Accent Colors */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Elements Accent</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {ACCENTS.map((accent) => (
                                        <button
                                            key={accent.id}
                                            onClick={() => setSettings({ ...settings, accentColor: accent.id })}
                                            className={cn(
                                                "aspect-square rounded-full border-2 transition-all flex items-center justify-center p-1",
                                                settings.accentColor === accent.id ? "border-primary" : "border-transparent"
                                            )}
                                        >
                                            <div className={cn("w-full h-full rounded-full shadow-md", accent.color)} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Extra Options */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-sm tracking-tight">Extra Options</h3>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border-2 border-dashed border-muted">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black tracking-tight uppercase">Presence Badge</p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Show status indicator</p>
                                </div>
                                <Switch
                                    checked={settings.showStatus}
                                    onCheckedChange={(val) => setSettings({ ...settings, showStatus: val })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4 border-t">
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 transition-all active:scale-[0.98] bg-primary hover:bg-primary/90"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        SAVING DESIGN...
                                    </div>
                                ) : (
                                    "CONFIRM NEW LOOK"
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="w-full h-12 rounded-2xl font-bold text-xs gap-2 border-2 hover:bg-muted transition-all"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                RESET TO DEFAULTS
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
