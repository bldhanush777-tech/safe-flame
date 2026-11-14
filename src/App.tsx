import React, { useState, useMemo } from 'react';
import { 
  AtmosphereState, 
  EvidenceRecord, 
  MaterialProperties, 
  MissionPresetId 
} from './types/physics';
import { AEROSPACE_MATERIALS, MISSION_PRESETS } from './data/materials';
import { INITIAL_EVIDENCE_RECORDS } from './data/evidenceDb';
import { calculatePhysics, rankEvidenceRecords } from './physics/engine';
import { TopTelemetryBar } from './components/telemetry/TopTelemetryBar';
import { RiskDecisionView } from './components/views/RiskDecisionView';
import { EvidenceExplorerView } from './components/views/EvidenceExplorerView';
import { SmokeSimulatorView } from './components/views/SmokeSimulatorView';
import { ResearchGapView } from './components/views/ResearchGapView';
import { 
  Flame, 
  Database, 
  Wind, 
  Grid, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Compass,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ActiveModule = 'RISK_DECISION' | 'EVIDENCE_EXPLORER' | 'SMOKE_SIMULATOR' | 'RESEARCH_GAP';

export const App: React.FC = () => {
  // Current active atmosphere state (initialized to Artemis Lunar Cabin)
  const defaultPreset = MISSION_PRESETS[0];
  const [atmosphere, setAtmosphere] = useState<AtmosphereState>({
    oxygen: defaultPreset.oxygen,
    pressurePsi: defaultPreset.pressurePsi,
    gravity: defaultPreset.gravity,
    ventilation: defaultPreset.ventilation,
    thicknessMm: defaultPreset.thicknessMm,
  });

  const [activePresetId, setActivePresetId] = useState<MissionPresetId | null>(defaultPreset.id);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialProperties>(AEROSPACE_MATERIALS[0]);
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>(INITIAL_EVIDENCE_RECORDS);
  const [activeModule, setActiveModule] = useState<ActiveModule>('RISK_DECISION');

  // Live recalculate physics scaling output whenever atmosphere, material, or records change
  const physics = useMemo(() => {
    return calculatePhysics(atmosphere, selectedMaterial, evidenceRecords);
  }, [atmosphere, selectedMaterial, evidenceRecords]);

  // Ranked evidence records
  const rankedResults = useMemo(() => {
    return rankEvidenceRecords(atmosphere, evidenceRecords, selectedMaterial.id);
  }, [atmosphere, evidenceRecords, selectedMaterial.id]);

  const navModules = [
    {
      id: 'RISK_DECISION' as const,
      label: 'Risk & Flame Engine',
      subLabel: '60FPS Morphology & Decision HUD',
      icon: Flame,
      badge: physics.isSafetyLocked ? 'SAFETY LOCK' : physics.riskLevel,
      badgeColor: physics.isSafetyLocked 
        ? 'text-plasma-red border-plasma-red/40 bg-plasma-red/10' 
        : 'text-thermal-amber border-thermal-amber/40 bg-thermal-amber/10',
    },
    {
      id: 'EVIDENCE_EXPLORER' as const,
      label: 'Evidence Explorer',
      subLabel: `${evidenceRecords.length} NASA Flight Tests & Ingestor`,
      icon: Database,
      badge: `Top Match: ${(rankedResults[0]?.applicability * 100 || 0).toFixed(0)}%`,
      badgeColor: 'text-cryo-glow border-cryo-cyan/40 bg-cryo-cyan/10',
    },
    {
      id: 'SMOKE_SIMULATOR' as const,
      label: 'Cabin Smoke & Suppression',
      subLabel: '2D Finite-Difference Transport Grid',
      icon: Wind,
      badge: `${atmosphere.gravity === 0 ? '0g Diffusion' : 'Buoyant Lift'}`,
      badgeColor: 'text-sky-300 border-sky-400/40 bg-sky-950/40',
    },
    {
      id: 'RESEARCH_GAP' as const,
      label: 'Research-Gap Matrix',
      subLabel: '6×5 Heatmap & Flight Test Specs',
      icon: Grid,
      badge: `C = ${(physics.confidenceScore * 100).toFixed(0)}%`,
      badgeColor: physics.confidenceScore >= 0.70 
        ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' 
        : 'text-amber-300 border-amber-500/40 bg-amber-950/40',
    },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-slate-200 flex flex-col font-sans selection:bg-cryo-cyan/30 selection:text-white">
      
      {/* Top Telemetry Command Bar (Persistent) */}
      <TopTelemetryBar
        atmosphere={atmosphere}
        setAtmosphere={setAtmosphere}
        selectedMaterial={selectedMaterial}
        setSelectedMaterial={setSelectedMaterial}
        activePresetId={activePresetId}
        setActivePresetId={setActivePresetId}
        physics={physics}
      />

      {/* Module Navigation Tabs with Shared LayoutId Indicator */}
      <nav className="w-full bg-obsidian-deep/95 border-b border-obsidian-border px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto z-20 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          {navModules.map(mod => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;

            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`relative px-3 py-1.5 rounded transition-all flex items-center gap-2.5 text-xs font-mono text-left ${
                  isActive 
                    ? 'text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-elevated/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeModuleTab"
                    className="absolute inset-0 bg-obsidian-elevated rounded border border-cryo-cyan/50 shadow-sm shadow-cryo-cyan/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cryo-glow' : 'text-slate-500'}`} />
                  <div>
                    <div className="leading-tight">{mod.label}</div>
                    <div className="text-[9px] text-slate-500 font-normal leading-tight hidden xl:block">
                      {mod.subLabel}
                    </div>
                  </div>
                </span>

                <span className={`relative z-10 text-[9px] px-1.5 py-0.2 rounded border hidden md:inline-block ${mod.badgeColor}`}>
                  {mod.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Telemetry System Health Badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pl-2">
          <div className="flex items-center gap-1 bg-obsidian-elevated px-2 py-1 rounded border border-obsidian-border">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">CIR / FLARE STREAM</span>
          </div>
          <div className="flex items-center gap-1 bg-obsidian-elevated px-2 py-1 rounded border border-obsidian-border hidden sm:flex">
            <Activity className="w-3 h-3 text-cryo-cyan" />
            <span>SOLVER: 60 FPS</span>
          </div>
        </div>
      </nav>

      {/* Main Workspace Content with Smooth Framer-Motion Transitions */}
      <main className="flex-1 w-full bg-obsidian relative">
        <AnimatePresence mode="wait">
          {activeModule === 'RISK_DECISION' && (
            <motion.div
              key="RISK_DECISION"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RiskDecisionView
                atmosphere={atmosphere}
                material={selectedMaterial}
                physics={physics}
              />
            </motion.div>
          )}

          {activeModule === 'EVIDENCE_EXPLORER' && (
            <motion.div
              key="EVIDENCE_EXPLORER"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <EvidenceExplorerView
                atmosphere={atmosphere}
                evidenceRecords={evidenceRecords}
                setEvidenceRecords={setEvidenceRecords}
                rankedResults={rankedResults}
                activeMaterialId={selectedMaterial.id}
              />
            </motion.div>
          )}

          {activeModule === 'SMOKE_SIMULATOR' && (
            <motion.div
              key="SMOKE_SIMULATOR"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SmokeSimulatorView
                atmosphere={atmosphere}
                material={selectedMaterial}
                physics={physics}
              />
            </motion.div>
          )}

          {activeModule === 'RESEARCH_GAP' && (
            <motion.div
              key="RESEARCH_GAP"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ResearchGapView
                evidenceRecords={evidenceRecords}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer System Status Bar */}
      <footer className="w-full bg-obsidian-deep border-t border-obsidian-border px-4 py-1.5 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 z-10">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold">SAFIR PyroGrav Platform</span>
          <span>•</span>
          <span>NASA-STD-6001B Flammability Scaling Engine</span>
          <span>•</span>
          <span>NASA Glenn Combustion Science Branch & JAXA FLARE Reference Model</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Active Material: <strong className="text-slate-300">{selectedMaterial.name}</strong></span>
          <span>•</span>
          <span>Confidence: <strong className="text-cryo-glow">{(physics.confidenceScore * 100).toFixed(1)}%</strong></span>
          <span>•</span>
          <span className={physics.isSafetyLocked ? 'text-plasma-red font-bold' : 'text-emerald-400 font-semibold'}>
            Status: {physics.riskLevel}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
