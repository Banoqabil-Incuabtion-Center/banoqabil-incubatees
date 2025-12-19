import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, FastForward, Rewind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface VideoPlayerProps {
    src: string;
    className?: string;
    poster?: string;
    autoPlay?: boolean;
    playOnView?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    className,
    poster,
    autoPlay = false,
    playOnView = false
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const [lastInteractionTime, setLastInteractionTime] = useState(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100);
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            setIsLoading(false);
            if (autoPlay) {
                video.play().catch(() => setIsPlaying(false));
                setIsPlaying(true);
            }
        };

        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleEnded = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [autoPlay]);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    const skip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width);
        const newTime = percentage * duration;
        videoRef.current.currentTime = newTime;
        setProgress(percentage * 100);
    };

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            const newMutedState = !isMuted;
            videoRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
        }
    };

    const toggleFullscreen = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        setLastInteractionTime(Date.now());
    };

    useEffect(() => {
        if (showControls && isPlaying) {
            const timer = setTimeout(() => {
                if (Date.now() - lastInteractionTime >= 2500) {
                    setShowControls(false);
                }
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [showControls, isPlaying, lastInteractionTime]);

    useEffect(() => {
        if (!playOnView || !containerRef.current || !videoRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoRef.current?.play().catch(() => { });
                    } else {
                        videoRef.current?.pause();
                    }
                });
            },
            { threshold: 0.6 } // Play when 60% visible
        );

        observerRef.current.observe(containerRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [playOnView]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative group bg-black rounded-xl overflow-hidden shadow-2xl transition-all duration-500",
                isFullscreen ? "w-screen h-screen rounded-none" : "w-full h-full",
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => {
                setShowControls(true);
            }}
            onMouseLeave={() => {
                setShowControls(false);
            }}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-contain"
                onClick={togglePlay}
                playsInline
                muted={isMuted}
            />

            {/* Premium Overlay Shell */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 transition-opacity duration-500 flex flex-col justify-end",
                showControls || !isPlaying ? "opacity-100" : "opacity-0"
            )}>

                {/* Center Control (Large Play/Pause) */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <div className={cn(
                        "p-6 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 transition-all duration-500 scale-90",
                        !isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-150 rotate-12"
                    )}>
                        <Play className="w-12 h-12 text-white fill-white ml-1" />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                )}

                {/* Minimalist Controls Bar */}
                <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">

                    {/* Progress Slider */}
                    <div
                        className="relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer group/progress overflow-hidden"
                        onClick={handleSeek}
                    >
                        <div
                            className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                        <div
                            className="absolute h-full w-full bg-white/10 opacity-0 group-hover/progress:opacity-100 transition-opacity"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-6 overflow-hidden">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <button
                                onClick={togglePlay}
                                className="text-white hover:text-primary transition-all active:scale-90"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleMute}
                                    className="text-white hover:text-primary transition-all"
                                >
                                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                                <span className="text-[10px] sm:text-xs font-black tracking-tighter text-white/90 tabular-nums uppercase">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                <button onClick={() => skip(-10)}><Rewind className="w-4 h-4 text-white" /></button>
                                <button onClick={() => skip(10)}><FastForward className="w-4 h-4 text-white" /></button>
                            </div>

                            <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-primary transition-all"
                            >
                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hover Play Label (Optional) */}
            {playOnView && !isPlaying && !showControls && (
                <div className="absolute top-4 left-4">
                    <div className="px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/10 text-[8px] font-black text-white/80 uppercase tracking-widest animate-pulse">
                        Auto-playing in view
                    </div>
                </div>
            )}
        </div>
    );
};
