import React from 'react';
import type { 
  AppTheme,
  AtmosphereState, 
  MaterialId, 
  MaterialProperties, 
  MissionPreset, 
  MissionPresetId, 
  PhysicsOutputs 
} from '../../types/physics';
import { 
  AEROSPACE_MATERIALS, 
  MISSION_PRESETS 
} from '../../data/materials';
import { 
  Gauge, 
  Wind, 
  Layers, 
  Rocket, 
  Compass, 
  Activity, 
  ChevronDown,
  Palette,
  Sparkles
} from 'lucide-react';

interface TopTelemetryBarProps {
  atmosphere: AtmosphereState;
  setAtmosphere: React.Dispatch<React.SetStateAction<AtmosphereState>>;
  selectedMaterial: MaterialProperties;
  setSelectedMaterial: (mat: MaterialProperties) => void;
  activePresetId: MissionPresetId | null;
  setActivePresetId: (id: MissionPresetId | null) => void;
  physics: PhysicsOutputs;
  currentTheme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = ({
  atmosphere,
  setAtmosphere,
  selectedMaterial,
  setSelectedMaterial,
  activePresetId,
  setActivePresetId,
  physics,
  currentTheme = 'obsidian',
  onThemeChange,
}) => {

  const handlePresetSelect = (preset: MissionPreset) => {
    setActivePresetId(preset.id);
    setAtmosphere({
      oxygen: preset.oxygen,
      pressurePsi: preset.pressurePsi,
      gravity: preset.gravity,
      ventilation: preset.ventilation,
      thicknessMm: preset.thicknessMm,
    });
  };

  const handleSliderChange = (field: keyof AtmosphereState, value: number) => {
    setActivePresetId(null); // Custom regime
    setAtmosphere(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const themeOptions: Array<{ id: AppTheme; label: string; color: string }> = [
    { id: 'obsidian', label: 'Obsidian', color: '#06B6D4' },
    { id: 'starship', label: 'Starship', color: '#F97316' },
    { id: 'nebula', label: 'Nebula', color: '#A855F7' },
    { id: 'mars', label: 'Mars', color: '#EF4444' },
  ];

  return (
    <header className="w-full bg-obsidian-surface/90 backdrop-blur-xl border-b border-obsidian-border shadow-2xl relative z-30 transition-colors duration-300">
      
      {/* Upper Band: Branding, Material Selector, Theme Switcher & Mission Presets */}
      <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-obsidian-border bg-obsidian-deep/80">
        
        {/* Brand & Classification Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-thermal-amber via-plasma-red to-cryo-cyan flex items-center justify-center shadow-lg shadow-thermal-amber/20 border border-white/20">
              <Rocket className="w-4 h-4 text-white transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base tracking-tight text-white">SAFIR</span>
                <span className="text-[10px] font-mono text-cryo-glow bg-cryo-cyan/15 px-2 py-0.5 rounded-full border border-cryo-cyan/30">
                  PyroGrav v2.4
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  FLIGHT READY
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans tracking-normal hidden sm:block">
                Spacecraft Atmosphere Fire Intelligence & Risk Platform
              </div>
            </div>
          </div>
        </div>

        {/* Center: Material Selector & Quick Theme Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Material Selector */}
          <div className="flex items-center gap-2 bg-obsidian-elevated/70 px-2.5 py-1 rounded-xl border border-obsidian-border">
            <Layers className="w-3.5 h-3.5 text-cryo-glow" />
            <select
              value={selectedMaterial.id}
              onChange={e => {
                const found = AEROSPACE_MATERIALS.find(m => m.id === e.target.value);
                if (found) setSelectedMaterial(found);
              }}
              className="appearance-none bg-transparent text-xs font-semibold text-slate-100 pr-6 py-0.5 focus:outline-none cursor-pointer"
            >
              {AEROSPACE_MATERIALS.map(mat => (
                <option key={mat.id} value={mat.id} className="bg-slate-900 text-white">
                  {mat.name} ({mat.application.split('&')[0].trim()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 -ml-4 pointer-events-none" />
          </div>

          {/* Quick 1-Click Theme Switcher Pill */}
          {onThemeChange && (
            <div className="flex items-center gap-1 bg-obsidian-elevated/70 p-1 rounded-xl border border-obsidian-border">
              <Palette className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
              {themeOptions.map(th => {
                const isCurrent = currentTheme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => onThemeChange(th.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-white/15 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`Switch to ${th.label} theme`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: th.color, boxShadow: isCurrent ? `0 0 8px ${th.color}` : 'none' }} 
                    />
                    <span className="hidden xl:inline">{th.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mission Atmosphere Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-mono tracking-micro text-slate-400 mr-0.5">
            PRESETS:
          </span>
          {MISSION_PRESETS.map(preset => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all flex items-center gap-1.5 border btn-modern ${
                  isActive
                    ? 'bg-cryo-cyan/20 border-cryo-cyan text-cryo-glow font-bold shadow-md shadow-cryo-cyan/25'
                    : 'bg-obsidian-elevated/50 border-obsidian-border text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
                title={preset.description}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cryo-cyan animate-pulse' : 'bg-slate-600'}`} />
                {preset.name}
              </button>
            );
          })}
        </div>

      </div>

      {/* Middle Band: 5 Precision Modern Sliders */}
      <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 bg-obsidian-surface/95">
        
        {/* Slider 1: Oxygen (XO2) */}
        <div className="bg-obsidian-elevated/50 p-3 rounded-2xl border border-obsidian-border flex flex-col gap-1.5 hover:border-obsidian-border/80 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cryo-cyan shadow-sm shadow-cryo-cyan" />
              Oxygen (X_O2)
            </span>
            <span className="font-mono-numbers font-bold text-cryo-glow bg-cryo-cyan/15 px-2 py-0.5 rounded-lg border border-cryo-cyan/30 text-[11px]">
              {(atmosphere.oxygen * 100).toFixed(1)} %
            </span>
          </div>
          <input
            type="range"
            min={0.15}
            max={0.45}
            step={0.005}
            value={atmosphere.oxygen}
            onChange={e => handleSliderChange('oxygen', parseFloat(e.target.value))}
            className="w-full accent-cryo-cyan cursor-pointer h-1.5 bg-obsidian-deep rounded-full"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>15%</span>
            <span>21% (Earth)</span>
            <span>45% (High O2)</span>
          </div>
        </div>

        {/* Slider 2: Pressure (P_total) */}
        <div className="bg-obsidian-elevated/50 p-3 rounded-2xl border border-obsidian-border flex flex-col gap-1.5 hover:border-obsidian-border/80 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-thermal-amber shadow-sm shadow-thermal-amber" />
              Pressure (P)
            </span>
            <span className="font-mono-numbers font-bold text-thermal-amber bg-thermal-amber/15 px-2 py-0.5 rounded-lg border border-thermal-amber/30 text-[11px]">
              {atmosphere.pressurePsi.toFixed(1)} psi
            </span>
          </div>
          <input
            type="range"
            min={4.0}
            max={16.0}
            step={0.1}
            value={atmosphere.pressurePsi}
            onChange={e => handleSliderChange('pressurePsi', parseFloat(e.target.value))}
            className="w-full accent-thermal-amber cursor-pointer h-1.5 bg-obsidian-deep rounded-full"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>4.0 psi</span>
            <span>8.2 (Artemis)</span>
            <span>14.7 (Sea-level)</span>
          </div>
        </div>

        {/* Slider 3: Gravity (g) */}
        <div className="bg-obsidian-elevated/50 p-3 rounded-2xl border border-obsidian-border flex flex-col gap-1.5 hover:border-obsidian-border/80 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              Gravity Vector (g)
            </span>
            <span className="font-mono-numbers font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30 text-[11px]">
              {atmosphere.gravity.toFixed(2)} m/s²
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={9.81}
            step={0.05}
            value={atmosphere.gravity}
            onChange={e => handleSliderChange('gravity', parseFloat(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-obsidian-deep rounded-full"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0.00 (µg)</span>
            <span>1.62 (Moon)</span>
            <span>9.81 (1g)</span>
          </div>
        </div>

        {/* Slider 4: HVAC Airflow (u_vent) */}
        <div className="bg-obsidian-elevated/50 p-3 rounded-2xl border border-obsidian-border flex flex-col gap-1.5 hover:border-obsidian-border/80 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              HVAC Flow (u_vent)
            </span>
            <span className="font-mono-numbers font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-400/30 text-[11px]">
              {atmosphere.ventilation.toFixed(2)} m/s
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={0.60}
            step={0.01}
            value={atmosphere.ventilation}
            onChange={e => handleSliderChange('ventilation', parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-obsidian-deep rounded-full"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0.00 (Stagnant)</span>
            <span>0.15 (Nominal)</span>
            <span>0.60 (High)</span>
          </div>
        </div>

        {/* Slider 5: Thickness */}
        <div className="bg-obsidian-elevated/50 p-3 rounded-2xl border border-obsidian-border flex flex-col gap-1.5 hover:border-obsidian-border/80 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Thickness (τ)
            </span>
            <span className="font-mono-numbers font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-400/30 text-[11px]">
              {atmosphere.thicknessMm.toFixed(2)} mm
            </span>
          </div>
          <input
            type="range"
            min={0.10}
            max={5.00}
            step={0.05}
            value={atmosphere.thicknessMm}
            onChange={e => handleSliderChange('thicknessMm', parseFloat(e.target.value))}
            className="w-full accent-purple-400 cursor-pointer h-1.5 bg-obsidian-deep rounded-full"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0.10 mm (Film)</span>
            <span>1.00 mm</span>
            <span>5.00 mm (Bulk)</span>
          </div>
        </div>

      </div>

      {/* Lower Band: Live Formula Readout Strip */}
      <div className="px-5 py-2 bg-obsidian-deep/90 border-t border-obsidian-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className="uppercase tracking-micro font-bold text-slate-300">SCALING METRICS:</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-mono-numbers text-[11px]">
          <div>
            <span className="text-slate-400">G* = </span>
            <strong className="text-white">{physics.gStar.toFixed(3)}</strong>
          </div>

          <div>
            <span className="text-slate-400">√G* = </span>
            <strong className="text-cryo-glow">{physics.sqrtGStar.toFixed(3)}</strong>
          </div>

          <div>
            <span className="text-slate-400">OI = </span>
            <strong className="text-thermal-amber">{physics.oxygenIndex.toFixed(2)}</strong>
          </div>

          <div>
            <span className="text-slate-400">pO2 = </span>
            <strong className="text-sky-300">{physics.pO2Psi.toFixed(2)} psi</strong>
            <span className="text-slate-400 ml-1">({physics.pO2Kpa.toFixed(1)} kPa)</span>
          </div>

          <div>
            <span className="text-slate-400">u_eff = </span>
            <strong className="text-emerald-400">{physics.uEff.toFixed(3)} m/s</strong>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-obsidian-border">
            <span className="text-slate-400">Confidence C = </span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              physics.isSafetyLocked 
                ? 'bg-plasma-red/20 text-plasma-red border border-plasma-red/40 animate-pulse'
                : physics.confidenceScore >= 0.70
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
            }`}>
              {(physics.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
