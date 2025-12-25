import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh?: () => Promise<void>;
    threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
    children,
    onRefresh,
    threshold = 120 // Increased default threshold
}) => {
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        const handleTouchStart = (e: TouchEvent) => {
            // Only capture start if we are at the very top
            if (element.scrollTop <= 0) {
                setStartY(e.touches[0].clientY);
                setIsPulling(true);
            } else {
                setIsPulling(false);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPulling || startY === 0) return;

            const touchY = e.touches[0].clientY;
            const diff = touchY - startY;

            // Only act if we are at the top and pulling DOWN
            if (element.scrollTop <= 0 && diff > 0) {
                // Add stronger resistance/damping
                // diff * 0.4 instead of 0.5 for better feel
                const dampenedDiff = Math.min(diff * 0.4, threshold * 1.8);
                setCurrentY(dampenedDiff);

                // Prevent default scrolling (native refresh) only if we've pulled significantly
                if (dampenedDiff > 15) {
                    if (e.cancelable) e.preventDefault();
                }
            } else if (diff < 0) {
                // If they start pulling UP, stop the pull tracking
                setStartY(0);
                setCurrentY(0);
                setIsPulling(false);
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling) return;

            // Only refresh if the pull exceeded the threshold significantly
            if (currentY >= threshold) {
                setRefreshing(true);
                setCurrentY(threshold);

                try {
                    if (onRefresh) {
                        await onRefresh();
                    } else {
                        // Small delay before reload for visual feedback
                        await new Promise(resolve => setTimeout(resolve, 500));
                        window.location.reload();
                    }
                } catch (error) {
                    console.error("Refresh failed:", error);
                } finally {
                    setRefreshing(false);
                    setCurrentY(0);
                }
            } else {
                // Reset smoothly
                setCurrentY(0);
            }

            setStartY(0);
            setIsPulling(false);
        };

        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [startY, currentY, threshold, onRefresh, isPulling]);

    return (
        <div ref={contentRef} className="h-full overflow-y-auto overflow-x-hidden relative overscroll-y-contain">
            {/* Pull Indicator */}
            <div
                className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none transition-transform duration-200"
                style={{
                    height: `${threshold}px`,
                    transform: `translateY(${Math.min(currentY, threshold) - threshold}px)`,
                    opacity: currentY > 0 ? 1 : 0
                }}
            >
                <div className="bg-background rounded-full p-2 shadow-md border">
                    {refreshing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                        <div
                            className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                            style={{ transform: `rotate(${currentY * 3}deg)` }}
                        />
                    )}
                </div>
            </div>

            {/* Content wrapper with transform */}
            <div
                style={{
                    transform: `translateY(${currentY}px)`,
                    transition: refreshing ? 'transform 0.2s ease-out' : 'none'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
