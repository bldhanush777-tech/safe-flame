import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface IntroVideoModalProps {
  onComplete: () => void;
}

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Autoplay cleanly on mount
    video.play().catch(err => {
      console.warn('Autoplay error:', err);
    });

    // Optional keyboard escape if user wants
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none"
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        playsInline
        muted
        onEnded={onComplete}
        className="w-full h-full object-cover object-center"
      />
    </motion.div>
  );
};
