import React from 'react';
import { 
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
  RotateCcw,
  Sliders,
  ShieldAlert
} from 'lucide-react';

interface TopTelemetryBarProps {
  atmosphere: AtmosphereState;
  setAtmosphere: React.Dispatch<React.SetStateAction<AtmosphereState>>;
  selectedMaterial: MaterialProperties;
  setSelectedMaterial: (mat: MaterialProperties) => void;
  activePresetId: MissionPresetId | null;
  setActivePresetId: (id: MissionPresetId | null) => void;
  physics: PhysicsOutputs;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = ({
  atmosphere,
  setAtmosphere,
  selectedMaterial,
  setSelectedMaterial,
  activePresetId,
  setActivePresetId,
  physics,
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

  return (
    <header className="w-full bg-obsidian-surface border-b border-obsidian-border shadow-2xl relative z-30">
      {/* Upper Band: Branding, Material Selector, & Mission Atmosphere Presets */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-obsidian-border bg-obsidian-deep/90">
        
        {/* Brand & Classification Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-thermal-amber to-plasma-red flex items-center justify-center shadow-lg shadow-thermal-amber/20 border border-thermal-amber/40">
              <Rocket className="w-4 h-4 text-obsidian-deep transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">SAFIR</span>
                <span className="text-[10px] font-mono text-cryo-glow bg-cryo-dark/80 px-1.5 py-0.5 rounded border border-cryo-cyan/30">
                  PyroGrav v2.4
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  AEROSPACE GRADE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Spacecraft Atmosphere Fire Intelligence & Risk Platform
              </div>
            </div>
          </div>
        </div>

        {/* Material Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-micro text-slate-400 font-mono flex items-center gap-1">
            <Layers className="w-3 h-3 text-cryo-cyan" />
            Material Fuel:
          </span>
          <div className="relative">
            <select
              value={selectedMaterial.id}
              onChange={e => {
                const found = AEROSPACE_MATERIALS.find(m => m.id === e.target.value);
                if (found) setSelectedMaterial(found);
              }}
              className="appearance-none bg-obsidian-elevated text-xs font-mono text-slate-100 pl-2.5 pr-8 py-1.5 rounded border border-obsidian-border hover:border-cryo-cyan/50 focus:outline-none focus:border-cryo-cyan transition-colors cursor-pointer"
            >
              {AEROSPACE_MATERIALS.map(mat => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} ({mat.application.split('&')[0].trim()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-obsidian-elevated px-2 py-1 rounded border border-obsidian-border hidden md:inline-block">
            Base LOC: <span className="text-thermal-amber font-semibold">{selectedMaterial.baseLoc1g}%</span>
          </span>
        </div>

        {/* Mission Atmosphere Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-micro text-slate-400 font-mono mr-1">
            PRESETS:
          </span>
          {MISSION_PRESETS.map(preset => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-cryo-cyan/20 border-cryo-cyan text-cryo-glow font-semibold shadow-sm shadow-cryo-cyan/20'
                    : 'bg-obsidian-elevated/70 border-obsidian-border text-slate-400 hover:text-slate-200 hover:border-slate-600'
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

      {/* Middle Band: 5 Precision Sliders */}
      <div className="px-4 py-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-obsidian-surface/95">
        
        {/* Slider 1: Oxygen (XO2) */}
        <div className="bg-obsidian-elevated/60 p-2 rounded border border-obsidian-border flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cryo-cyan" />
              Oxygen (X_O2)
            </span>
            <span className="font-mono-numbers font-bold text-cryo-glow bg-cryo-dark/60 px-1.5 py-0.2 rounded border border-cryo-cyan/30">
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
            className="w-full accent-cryo-cyan cursor-pointer h-1.5 bg-obsidian-deep rounded"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>15% (Earth Hypoxic)</span>
            <span>21%</span>
            <span>45% (High Enriched)</span>
          </div>
        </div>

        {/* Slider 2: Pressure (P_total) */}
        <div className="bg-obsidian-elevated/60 p-2 rounded border border-obsidian-border flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-thermal-amber" />
              Total Pressure (P)
            </span>
            <span className="font-mono-numbers font-bold text-thermal-amber bg-thermal-amber/10 px-1.5 py-0.2 rounded border border-thermal-amber/30">
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
            className="w-full accent-thermal-amber cursor-pointer h-1.5 bg-obsidian-deep rounded"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>4.0 psi (Suit)</span>
            <span>8.2 (Artemis)</span>
            <span>14.7 (Sea-level)</span>
          </div>
        </div>

        {/* Slider 3: Gravity (g) */}
        <div className="bg-obsidian-elevated/60 p-2 rounded border border-obsidian-border flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Gravity Vector (g)
            </span>
            <span className="font-mono-numbers font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
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
            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-obsidian-deep rounded"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0.00 (µg)</span>
            <span>1.62 (Moon)</span>
            <span>3.71 (Mars)</span>
            <span>9.81 (1g)</span>
          </div>
        </div>

        {/* Slider 4: HVAC Airflow (u_vent) */}
        <div className="bg-obsidian-elevated/60 p-2 rounded border border-obsidian-border flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-400" />
              HVAC Airflow (u_vent)
            </span>
            <span className="font-mono-numbers font-bold text-sky-300 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-400/30">
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
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-obsidian-deep rounded"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0.00 (Stagnant)</span>
            <span>0.15 (ISS Norm)</span>
            <span>0.60 (High Flow)</span>
          </div>
        </div>

        {/* Slider 5: Sample Thickness */}
        <div className="bg-obsidian-elevated/60 p-2 rounded border border-obsidian-border flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" />
              Thickness (τ)
            </span>
            <span className="font-mono-numbers font-bold text-purple-300 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-400/30">
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
            className="w-full accent-purple-400 cursor-pointer h-1.5 bg-obsidian-deep rounded"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0.10 mm (Film)</span>
            <span>1.00 mm</span>
            <span>5.00 mm (Bulk)</span>
          </div>
        </div>

      </div>

      {/* Lower Band: Live Formula Readout Strip */}
      <div className="px-4 py-1.5 bg-obsidian-deep border-t border-obsidian-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className="uppercase tracking-micro font-semibold text-slate-300">LIVE SCALING METRICS:</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 flex-wrap font-mono-numbers text-[11px]">
          {/* G* */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">G* =</span>
            <span className="text-white font-semibold">{physics.gStar.toFixed(3)}</span>
          </div>

          {/* sqrt(G*) */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">√G* =</span>
            <span className="text-cryo-glow font-semibold">{physics.sqrtGStar.toFixed(3)}</span>
          </div>

          {/* OI */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">OI (XO2/0.21) =</span>
            <span className="text-thermal-amber font-semibold">{physics.oxygenIndex.toFixed(2)}</span>
          </div>

          {/* pO2 psi & kPa */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">pO2 =</span>
            <span className="text-sky-300 font-semibold">{physics.pO2Psi.toFixed(2)} psi</span>
            <span className="text-slate-500">({physics.pO2Kpa.toFixed(1)} kPa)</span>
          </div>

          {/* u_eff */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">u_eff =</span>
            <span className="text-emerald-400 font-semibold">{physics.uEff.toFixed(3)} m/s</span>
          </div>

          {/* Confidence C badge */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-obsidian-border">
            <span className="text-slate-400">Confidence C =</span>
            <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
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
