import React, { useState, useMemo, useEffect } from 'react';
import type { 
  AISettings, 
  AtmosphereState, 
  EvidenceRecord, 
  MaterialProperties, 
  MissionPresetId 
} from './types/physics';
import { AEROSPACE_MATERIALS, MISSION_PRESETS } from './data/materials';
import { INITIAL_EVIDENCE_RECORDS } from './data/evidenceDb';
import { calculatePhysics, rankEvidenceRecords } from './physics/engine';
import { TopTelemetryBar } from './components/telemetry/TopTelemetryBar';
import { FlameLabView } from './components/views/FlameLabView';
import { RiskDecisionView } from './components/views/RiskDecisionView';
import { EvidenceExplorerView } from './components/views/EvidenceExplorerView';
import { SmokeSimulatorView } from './components/views/SmokeSimulatorView';
import { SurfaceScannerView } from './components/views/SurfaceScannerView';
import { ResearchGapView } from './components/views/ResearchGapView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { SettingsView } from './components/views/SettingsView';
import { FloatingTaskbar, PageId } from './components/navigation/FloatingTaskbar';
import { IntroVideoModal } from './components/intro/IntroVideoModal';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const defaultPreset = MISSION_PRESETS[0];
  
  // Introductory cinematic video state (starts active on application launch)
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Atmosphere state
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
  const [activePage, setActivePage] = useState<PageId>('FLAME_LAB');

  // Application & AI Settings state
  const [settings, setSettings] = useState<AISettings>({
    voiceGender: 'male',
    autoSpeak: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    soundEffects: true,
    pressureUnit: 'psi',
    activeTheme: 'obsidian',
  });

  // Apply active theme attribute to document on mount or change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.activeTheme);
  }, [settings.activeTheme]);

  // Physics outputs
  const physics = useMemo(() => {
    return calculatePhysics(atmosphere, selectedMaterial, evidenceRecords);
  }, [atmosphere, selectedMaterial, evidenceRecords]);

  // Ranked evidence records
  const rankedResults = useMemo(() => {
    return rankEvidenceRecords(atmosphere, evidenceRecords, selectedMaterial.id);
  }, [atmosphere, evidenceRecords, selectedMaterial.id]);

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-obsidian text-slate-200 flex flex-col font-sans selection:bg-cryo-cyan/30 selection:text-white pb-20 relative transition-colors duration-300">
      
      {/* Cinematic Introductory Video Layer */}
      <AnimatePresence>
        {showIntro && (
          <IntroVideoModal onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {/* Persistent Top Telemetry Command Bar */}
      <TopTelemetryBar
        atmosphere={atmosphere}
        setAtmosphere={setAtmosphere}
        selectedMaterial={selectedMaterial}
        setSelectedMaterial={setSelectedMaterial}
        activePresetId={activePresetId}
        setActivePresetId={setActivePresetId}
        physics={physics}
        currentTheme={settings.activeTheme}
        onThemeChange={th => setSettings(s => ({ ...s, activeTheme: th }))}
      />

      {/* Main Dedicated Workspace Page Viewport with Smooth Slide Transitions */}
      <main className="flex-1 w-full bg-obsidian relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activePage === 'FLAME_LAB' && (
            <motion.div
              key="FLAME_LAB"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <FlameLabView
                atmosphere={atmosphere}
                material={selectedMaterial}
                physics={physics}
              />
            </motion.div>
          )}

          {activePage === 'RISK_DECISION' && (
            <motion.div
              key="RISK_DECISION"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <RiskDecisionView
                atmosphere={atmosphere}
                material={selectedMaterial}
                physics={physics}
              />
            </motion.div>
          )}

          {activePage === 'EVIDENCE_EXPLORER' && (
            <motion.div
              key="EVIDENCE_EXPLORER"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
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

          {activePage === 'SMOKE_SIMULATOR' && (
            <motion.div
              key="SMOKE_SIMULATOR"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <SmokeSimulatorView
                atmosphere={atmosphere}
                material={selectedMaterial}
                physics={physics}
              />
            </motion.div>
          )}

          {activePage === 'SURFACE_SCANNER' && (
            <motion.div
              key="SURFACE_SCANNER"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <SurfaceScannerView
                onApplyMaterial={mat => setSelectedMaterial(mat)}
              />
            </motion.div>
          )}

          {activePage === 'RESEARCH_GAP' && (
            <motion.div
              key="RESEARCH_GAP"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <ResearchGapView
                evidenceRecords={evidenceRecords}
              />
            </motion.div>
          )}

          {activePage === 'AI_ASSISTANT' && (
            <motion.div
              key="AI_ASSISTANT"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <AIAssistantView
                settings={settings}
                setSettings={setSettings}
                atmosphere={atmosphere}
                setAtmosphere={setAtmosphere}
                selectedMaterial={selectedMaterial}
                setSelectedMaterial={setSelectedMaterial}
                setActivePresetId={setActivePresetId}
                onNavigate={page => setActivePage(page as PageId)}
              />
            </motion.div>
          )}

          {activePage === 'SETTINGS' && (
            <motion.div
              key="SETTINGS"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <SettingsView
                settings={settings}
                setSettings={setSettings}
                onReplayIntro={() => setShowIntro(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Taskbar Navigation Dock */}
      <FloatingTaskbar
        activePage={activePage}
        setActivePage={setActivePage}
        onVoiceTrigger={() => setActivePage('AI_ASSISTANT')}
        riskBadge={physics.riskLevel}
      />
    </div>
  );
};

export default App;
