import React from 'react';
import { 
  Flame, 
  Gauge, 
  Database, 
  Wind, 
  Scan, 
  Grid, 
  Bot, 
  Settings, 
  Mic
} from 'lucide-react';
import { motion } from 'framer-motion';

export type PageId = 
  | 'FLAME_LAB'
  | 'RISK_DECISION'
  | 'EVIDENCE_EXPLORER'
  | 'SMOKE_SIMULATOR'
  | 'SURFACE_SCANNER'
  | 'RESEARCH_GAP'
  | 'AI_ASSISTANT'
  | 'SETTINGS';

interface FloatingTaskbarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  onVoiceTrigger?: () => void;
  riskBadge?: string;
}

export const FloatingTaskbar: React.FC<FloatingTaskbarProps> = ({
  activePage,
  setActivePage,
  onVoiceTrigger,
}) => {
  const navItems: Array<{
    id: PageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }> = [
    { id: 'FLAME_LAB', label: 'Flame Lab', icon: Flame, accentColor: '#F97316' },
    { id: 'RISK_DECISION', label: 'Risk HUD', icon: Gauge, accentColor: '#EF4444' },
    { id: 'EVIDENCE_EXPLORER', label: 'Evidence', icon: Database, accentColor: '#38BDF8' },
    { id: 'SMOKE_SIMULATOR', label: 'Smoke Solver', icon: Wind, accentColor: '#06B6D4' },
    { id: 'SURFACE_SCANNER', label: 'Scanner', icon: Scan, accentColor: '#A855F7' },
    { id: 'RESEARCH_GAP', label: 'Gap Matrix', icon: Grid, accentColor: '#10B981' },
    { id: 'AI_ASSISTANT', label: 'ASTRA AI', icon: Bot, accentColor: '#EAB308' },
    { id: 'SETTINGS', label: 'Settings', icon: Settings, accentColor: '#94A3B8' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[96vw]">
      <motion.div 
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="flex items-center gap-1.5 p-1.5 bg-obsidian-surface/90 backdrop-blur-2xl border border-white/15 rounded-full shadow-2xl shadow-black/90 font-sans"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative px-3.5 py-2 rounded-full flex items-center gap-2 text-xs transition-all select-none group ${
                isActive 
                  ? 'text-white font-bold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {/* Active animated floating pill background */}
              {isActive && (
                <motion.div
                  layoutId="activeTaskbarPill"
                  className="absolute inset-0 bg-gradient-to-r from-accent/25 via-obsidian-elevated to-accent/15 rounded-full border border-accent/60 shadow-lg shadow-accent/25"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-accent-glow' : 'text-slate-400'
                }`} />
                <span className="hidden md:inline-block leading-tight text-[11px] tracking-tight">
                  {item.label}
                </span>
              </span>

              {/* Tooltip on mobile screens */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-obsidian-deep/95 border border-white/10 text-[10px] font-medium text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl md:hidden">
                {item.label}
              </div>
            </motion.button>
          );
        })}

        {/* Quick Voice Trigger Pill on right */}
        {onVoiceTrigger && (
          <div className="pl-1.5 ml-1 border-l border-white/15">
            <motion.button
              onClick={onVoiceTrigger}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="p-2.5 rounded-full bg-accent/20 hover:bg-accent/30 text-accent-glow border border-accent/50 transition-all flex items-center justify-center shadow-lg shadow-accent/20"
              title="Voice Summon ASTRA AI"
            >
              <Mic className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
