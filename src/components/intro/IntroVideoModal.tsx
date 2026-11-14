import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  ChevronRight, 
  Rocket, 
  Activity, 
  Layers 
} from 'lucide-react';

interface IntroVideoModalProps {
  onComplete: () => void;
}

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  // Attempt autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.warn('Autoplay prevented by browser, waiting for user gesture:', err);
          setIsPlaying(false);
        });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onComplete();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
      setDuration(video.duration);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden font-mono select-none"
    >
      {/* High-Resolution Video Player */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        className={`w-full h-full transition-all duration-300 ${
          fitMode === 'cover' ? 'object-cover' : 'object-contain'
        }`}
      />

      {/* Aerospace Tactical Scanlines & Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-black/70" />
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Corner Bracket Reticles */}
      <div className="absolute inset-6 pointer-events-none">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cryo-cyan" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cryo-cyan" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cryo-cyan" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cryo-cyan" />
      </div>

      {/* Top Header Telemetry Strip */}
      <div className="absolute top-6 left-8 right-8 flex items-center justify-between text-xs text-slate-300 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-thermal-amber to-plasma-red flex items-center justify-center shadow-lg shadow-thermal-amber/30 border border-thermal-amber/50">
            <Rocket className="w-4 h-4 text-black transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider text-white">SAFIR</span>
              <span className="text-[10px] text-cryo-glow bg-cryo-cyan/15 px-2 py-0.5 rounded border border-cryo-cyan/30">
                PyroGrav v2.4
              </span>
            </div>
            <div className="text-[9px] text-slate-400">
              SPACE ACCELERATION & ATMOSPHERE FIRE INITIALIZATION
            </div>
          </div>
        </div>

        {/* Enter Platform / Skip Intro Button */}
        <button
          onClick={onComplete}
          className="group px-4 py-2 rounded-full bg-cryo-cyan/20 hover:bg-cryo-cyan text-cryo-glow hover:text-black border border-cryo-cyan/60 font-bold text-xs uppercase tracking-micro transition-all flex items-center gap-2 shadow-lg shadow-cryo-cyan/20 backdrop-blur-md"
        >
          <span>Enter Mission Platform</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span className="text-[9px] opacity-60 ml-1 hidden sm:inline">[ESC]</span>
        </button>
      </div>

      {/* Floating Tactical Center Badge (Appears when paused) */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 backdrop-blur-xs"
        >
          <div className="w-16 h-16 rounded-full bg-cryo-cyan/30 border border-cryo-cyan text-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-cryo-cyan/50">
            <Play className="w-8 h-8 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-6 left-8 right-8 flex flex-col gap-2.5 pointer-events-auto">
        
        {/* Playback Progress Line */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-cryo-cyan via-thermal-amber to-plasma-red transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Bottom Controls Strip */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          
          <div className="flex items-center gap-3">
            {/* Play / Pause Toggle */}
            <button
              onClick={togglePlay}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Sound Mute / Unmute Toggle */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded transition-colors border flex items-center gap-1.5 ${
                !isMuted 
                  ? 'bg-thermal-amber/30 text-thermal-amber border-thermal-amber' 
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/15'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="text-[10px] hidden sm:inline">
                {isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}
              </span>
            </button>

            {/* Aspect Ratio Screen Fit Toggle */}
            <button
              onClick={() => setFitMode(fitMode === 'cover' ? 'contain' : 'cover')}
              className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 border border-white/15 text-[10px] hidden md:flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-cryo-glow" />
              <span>Ratio: <strong className="text-white uppercase">{fitMode}</strong></span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress Readout */}
            <div className="text-[10px] text-slate-400 font-mono-numbers">
              INITIALIZING ENGINE: <span className="text-cryo-glow font-bold">{progress.toFixed(0)}%</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

        </div>

      </div>
    </motion.div>
  );
};
