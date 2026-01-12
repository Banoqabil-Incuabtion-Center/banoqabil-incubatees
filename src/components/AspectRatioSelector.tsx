import React from "react";
import { cn } from "@/lib/utils";
import { Square, RectangleVertical, RectangleHorizontal, Image } from "lucide-react";

export type AspectRatio = "original" | "1:1" | "4:5" | "16:9";

interface AspectRatioSelectorProps {
    value: AspectRatio;
    onChange: (ratio: AspectRatio) => void;
    className?: string;
}

const ratioOptions: { value: AspectRatio; label: string; icon: React.ReactNode }[] = [
    { value: "4:5", label: "4:5", icon: <RectangleVertical className="h-4 w-4" /> },
    { value: "1:1", label: "1:1", icon: <Square className="h-4 w-4" /> },
    { value: "16:9", label: "16:9", icon: <RectangleHorizontal className="h-4 w-4" /> },
];

export function AspectRatioSelector({ value, onChange, className }: AspectRatioSelectorProps) {
    return (
        <div className={cn("flex gap-1 p-1 bg-muted/50 rounded-lg", className)}>
            {ratioOptions.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        value === option.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                >
                    {option.icon}
                    <span className="hidden sm:inline">{option.label}</span>
                </button>
            ))}
        </div>
    );
}

// Helper to get CSS aspect ratio value
export function getAspectRatioStyle(ratio: AspectRatio): string {
    switch (ratio) {
        case "1:1":
            return "1 / 1";
        case "4:5":
            return "4 / 5";
        case "16:9":
            return "16 / 9";
        default:
            return "auto";
    }
}
