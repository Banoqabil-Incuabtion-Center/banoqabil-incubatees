import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, GripVertical, ImagePlus, Loader2 } from "lucide-react";
import { AspectRatioSelector, AspectRatio, getAspectRatioStyle } from "./AspectRatioSelector";

interface ImagePreview {
    id: string;
    file?: File; // Optional for existing images
    preview: string;
}

interface MultiImagePickerProps {
    images: ImagePreview[];
    onImagesChange: (images: ImagePreview[]) => void;
    aspectRatio: AspectRatio;
    onAspectRatioChange: (ratio: AspectRatio) => void;
    maxImages?: number;
    disabled?: boolean;
    className?: string;
}

export function MultiImagePicker({
    images,
    onImagesChange,
    aspectRatio,
    onAspectRatioChange,
    maxImages = 9,
    disabled = false,
    className,
}: MultiImagePickerProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remainingSlots = maxImages - images.length;
        const filesToAdd = files.slice(0, remainingSlots);

        const newImages: ImagePreview[] = filesToAdd.map((file) => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: URL.createObjectURL(file),
        }));

        onImagesChange([...images, ...newImages]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [images, maxImages, onImagesChange]);

    const handleRemove = useCallback((id: string) => {
        const imageToRemove = images.find((img) => img.id === id);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.preview);
        }
        onImagesChange(images.filter((img) => img.id !== id));
    }, [images, onImagesChange]);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newImages = [...images];
        const draggedItem = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedItem);

        onImagesChange(newImages);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const canAddMore = images.length < maxImages;

    return (
        <div className={cn("space-y-3", className)}>
            {/* Aspect Ratio Selector */}
            {images.length > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Aspect Ratio</span>
                    <AspectRatioSelector
                        value={aspectRatio}
                        onChange={onAspectRatioChange}
                    />
                </div>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {images.map((img, index) => (
                        <div
                            key={img.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                "relative group rounded-lg overflow-hidden border-2 transition-all cursor-move",
                                draggedIndex === index
                                    ? "border-primary opacity-50"
                                    : "border-transparent hover:border-primary/30"
                            )}
                            style={{ aspectRatio: getAspectRatioStyle(aspectRatio) }}
                        >
                            <img
                                src={img.preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <div className="absolute top-1 left-1">
                                    <GripVertical className="h-4 w-4 text-white/80" />
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => handleRemove(img.id)}
                                    disabled={disabled}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            {/* Image number badge */}
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {index + 1}
                            </div>
                        </div>
                    ))}

                    {/* Add more button */}
                    {canAddMore && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors",
                                "hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            style={{ aspectRatio: getAspectRatioStyle(aspectRatio) }}
                        >
                            <ImagePlus className="h-5 w-5" />
                            <span className="text-[10px] font-medium">Add</span>
                        </button>
                    )}
                </div>
            )}

            {/* Empty State - Add Images Button */}
            {images.length === 0 && (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className={cn(
                        "w-full py-8 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all",
                        "hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <ImagePlus className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium">Add Photos</p>
                        <p className="text-xs text-muted-foreground">Up to {maxImages} images</p>
                    </div>
                </button>
            )}

            {/* Image count indicator */}
            {images.length > 0 && (
                <div className="flex justify-center">
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        images.length >= maxImages
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                    )}>
                        {images.length}/{maxImages} images
                    </span>
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />
        </div>
    );
}

export type { ImagePreview };
