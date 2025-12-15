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
    threshold = 100
}) => {
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // Only enable pull to refresh if we are at the top of the page
            if (window.scrollY === 0) {
                setStartY(e.touches[0].clientY);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            const touchY = e.touches[0].clientY;
            const diff = touchY - startY;

            // Only scroll if we started at the top and are pulling down
            if (window.scrollY === 0 && diff > 0 && startY > 0) {
                // Add resistance/damping to the pull
                const dampenedDiff = Math.min(diff * 0.5, threshold * 1.5);
                setCurrentY(dampenedDiff);

                // Prevent default scrolling only if we are actively pulling down
                if (dampenedDiff > 10) {
                    e.preventDefault();
                }
            }
        };

        const handleTouchEnd = async () => {
            if (currentY > threshold) {
                setRefreshing(true);
                setCurrentY(threshold); // Snap to threshold position

                if (onRefresh) {
                    await onRefresh();
                } else {
                    window.location.reload();
                }

                setRefreshing(false);
            }

            // Reset position
            setCurrentY(0);
            setStartY(0);
        };

        const element = contentRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart); // Passive false is default for touchstart in React but good to be explicit if using native
        // We need passive: false to be able to preventDefault in touchmove
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [startY, currentY, threshold, onRefresh]);

    return (
        <div ref={contentRef} className="min-h-screen relative">
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
