'use client';

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Film, Sparkles } from 'lucide-react';

interface ScrollVideoScrubberProps {
  videoSrc?: string;
  frameCount?: number;
  heightMultiplier?: number;
}

export const ScrollVideoScrubber: React.FC<ScrollVideoScrubberProps> = ({
  videoSrc = 'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-design-41484-large.mp4',
  heightMultiplier = 3,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !videoRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      const currentY = -rect.top;
      const progress = Math.max(0, Math.min(1, currentY / totalScrollable));
      setScrollProgress(progress);

      // GSAP smooth interpolated scrubbing
      const video = videoRef.current;
      if (video.duration) {
        const targetTime = progress * video.duration;
        gsap.to(video, {
          currentTime: targetTime,
          duration: 0.35,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP text animation on phase change
  useEffect(() => {
    if (textRef.current) {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 25, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [Math.floor(scrollProgress * 3)]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${heightMultiplier * 100}vh` }}
      className="relative w-full"
    >
      {/* Sticky Fullscreen Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoSrc}
          preload="auto"
          muted
          playsInline
          className="w-full h-full object-cover opacity-80"
        />

        {/* Ambient Dark Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70 pointer-events-none" />

        {/* Scroll Progress Indicator */}
        <div className="absolute top-8 left-8 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg shadow-blue-950/30">
          <Film className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-slate-300 font-mono font-medium">
            GSAP Virtual Scrub: {Math.round(scrollProgress * 100)}%
          </span>
        </div>

        {/* Dynamic Storytelling Text Overlays based on Scroll Progress */}
        <div
          ref={textRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none px-6 text-center"
        >
          {scrollProgress < 0.35 && (
            <div className="max-w-xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                Phase 01 • Architectural Grandeur
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Designed to Inspire
              </h2>
              <p className="text-sm md:text-base text-slate-300 drop-shadow">
                Scroll down to immerse yourself in contemporary luxury with floor-to-ceiling panoramic glass.
              </p>
            </div>
          )}

          {scrollProgress >= 0.35 && scrollProgress < 0.7 && (
            <div className="max-w-xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Phase 02 • Seamless Open Living
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Effortless Harmony
              </h2>
              <p className="text-sm md:text-base text-slate-300 drop-shadow">
                Spacious open-concept living paired with minimalist smart automation and bespoke imported finishes.
              </p>
            </div>
          )}

          {scrollProgress >= 0.7 && (
            <div className="max-w-xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                Phase 03 • Private Sanctuary
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Bespoke Living Redefined
              </h2>
              <p className="text-sm md:text-base text-slate-300 drop-shadow">
                Step onto your private sunset terrace overlooking unobstructed skyline and lush landscaped gardens.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="absolute bottom-8 flex flex-col items-center space-y-2 pointer-events-none">
          <span className="text-[11px] uppercase tracking-widest text-slate-400">Scroll to Explore</span>
          <div className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center pt-1">
            <div className="w-1.5 h-2 bg-blue-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};
