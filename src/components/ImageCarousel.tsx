import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio, getAspectRatioStyle } from "./AspectRatioSelector";

interface ImageCarouselProps {
    images: string[];
    aspectRatio?: AspectRatio;
    className?: string;
    showControls?: boolean;
    onImageClick?: (index: number) => void;
}

export function ImageCarousel({
    images,
    aspectRatio = "4:5",
    className,
    showControls = true,
    onImageClick,
}: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const hasMultiple = images.length > 1;

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const goToIndex = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && hasMultiple) {
            goToNext();
        }
        if (isRightSwipe && hasMultiple) {
            goToPrev();
        }
    };

    // Helper to check if URL is video
    const isVideo = (url: string) => {
        return /\.(mp4|webm|ogg|mov)($|\?)/i.test(url) || url.includes('/video/');
    };

    if (images.length === 0) {
        return null;
    }

    const aspectRatioStyle = aspectRatio !== "original"
        ? { aspectRatio: getAspectRatioStyle(aspectRatio) }
        : {};

    return (
        <div className={cn("relative group overflow-hidden", className)}>
            {/* Image Container */}
            <div
                className="relative w-full overflow-hidden bg-black/5"
                style={aspectRatioStyle}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Images */}
                <div
                    className="flex transition-transform duration-300 ease-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {images.map((src, index) => (
                        <div
                            key={src}
                            className="flex-shrink-0 w-full h-full"
                            onClick={() => onImageClick?.(index)}
                        >
                            {isVideo(src) ? (
                                <video
                                    src={src}
                                    className={cn(
                                        "w-full h-full object-cover",
                                        onImageClick && "cursor-pointer"
                                    )}
                                    controls={false}
                                    muted
                                    loop
                                    playsInline
                                    autoPlay={index === currentIndex}
                                />
                            ) : (
                                <img
                                    src={src}
                                    alt={`Image ${index + 1}`}
                                    className={cn(
                                        "w-full h-full object-cover",
                                        onImageClick && "cursor-pointer"
                                    )}
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows - Desktop */}
            {hasMultiple && showControls && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full",
                            "bg-background/80 backdrop-blur-sm shadow-lg",
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            "hover:bg-background"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrev();
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full",
                            "bg-background/80 backdrop-blur-sm shadow-lg",
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            "hover:bg-background"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </>
            )}

            {/* Image Counter Badge */}
            {hasMultiple && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                    {currentIndex + 1}/{images.length}
                </div>
            )}

            {/* Dot Indicators */}
            {hasMultiple && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToIndex(index);
                            }}
                            className={cn(
                                "h-1.5 rounded-full transition-all",
                                index === currentIndex
                                    ? "w-4 bg-white"
                                    : "w-1.5 bg-white/50 hover:bg-white/70"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
