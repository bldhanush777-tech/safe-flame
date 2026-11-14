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
  Mic, 
  Sparkles 
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
  riskBadge,
}) => {
  const navItems: Array<{
    id: PageId;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }> = [
    { id: 'FLAME_LAB', label: 'Flame Lab', sub: '60FPS Visualizer', icon: Flame, accent: '#F97316' },
    { id: 'RISK_DECISION', label: 'Risk HUD', sub: 'Bayesian Decisions', icon: Gauge, accent: '#EF4444' },
    { id: 'EVIDENCE_EXPLORER', label: 'Evidence', sub: '16 NASA Tests', icon: Database, accent: '#38BDF8' },
    { id: 'SMOKE_SIMULATOR', label: 'Smoke Solver', sub: '2D Transport Grid', icon: Wind, accent: '#06B6D4' },
    { id: 'SURFACE_SCANNER', label: 'Scanner', sub: 'Camera & Char', icon: Scan, accent: '#A855F7' },
    { id: 'RESEARCH_GAP', label: 'Gap Matrix', sub: '6×5 Test Specs', icon: Grid, accent: '#10B981' },
    { id: 'AI_ASSISTANT', label: 'ASTRA AI', sub: 'Voice & Mission Control', icon: Bot, accent: '#EAB308' },
    { id: 'SETTINGS', label: 'Settings', sub: 'Themes & Personas', icon: Settings, accent: '#94A3B8' },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[96vw]">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex items-center gap-1.5 p-1.5 bg-obsidian-surface/85 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl shadow-black/80 font-mono"
      >
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`relative px-3 py-1.5 rounded-full flex items-center gap-2 text-xs transition-all select-none group ${
                isActive 
                  ? 'text-white font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {/* Active animated floating pill background */}
              {isActive && (
                <motion.div
                  layoutId="activeTaskbarPill"
                  className="absolute inset-0 bg-obsidian-elevated/95 rounded-full border border-cryo-cyan/50 shadow-lg shadow-cryo-cyan/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-cryo-glow' : 'text-slate-400'
                }`} />
                <span className="hidden md:inline-block leading-tight text-[11px]">
                  {item.label}
                </span>
              </span>

              {/* Tooltip on mobile / compact screens */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-obsidian-deep/95 border border-obsidian-border text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl md:hidden">
                {item.label}
              </div>
            </button>
          );
        })}

        {/* Quick Voice Trigger Pill on right */}
        {onVoiceTrigger && (
          <div className="pl-1.5 ml-1 border-l border-white/10">
            <button
              onClick={onVoiceTrigger}
              className="p-2 rounded-full bg-cryo-cyan/20 hover:bg-cryo-cyan/30 text-cryo-glow border border-cryo-cyan/40 transition-all flex items-center justify-center group shadow-md shadow-cryo-cyan/10"
              title="Voice Summon ASTRA AI"
            >
              <Mic className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
