import React from 'react';
import type { AtmosphereState, MaterialProperties, PhysicsOutputs } from '../../types/physics';
import { FlameVisualizer } from '../canvas/FlameVisualizer';
import { 
  Flame, 
  Cpu, 
  Radio, 
  Wind, 
  Sparkles, 
  Activity, 
  Zap,
  Layers,
  Thermometer
} from 'lucide-react';

interface FlameLabViewProps {
  atmosphere: AtmosphereState;
  material: MaterialProperties;
  physics: PhysicsOutputs;
}

export const FlameLabView: React.FC<FlameLabViewProps> = ({
  atmosphere,
  material,
  physics,
}) => {
  const gStar = atmosphere.gravity / 9.81;
  const sqrtG = Math.sqrt(Math.max(0, gStar));
  const o2Frac = atmosphere.oxygen;
  const pRatio = atmosphere.pressurePsi / 14.7;

  const regimeName = 
    sqrtG < 0.1 ? 'DIFFUSIVE HEMISPHERICAL (MICRO-G)' :
    sqrtG < 0.65 ? 'SEMI-BUOYANT TILTED DOME' : 'BUOYANT TURBULENT TEARDROP (1G)';

  return (
    <div className="p-5 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans text-xs">
      
      {/* Visualizer Hero Area (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="h-[530px] w-full rounded-2xl overflow-hidden border border-obsidian-border shadow-glass-card">
          <FlameVisualizer 
            atmosphere={atmosphere} 
            material={material} 
            physics={physics} 
          />
        </div>

        {/* Real-Time Optical Pyrometry & Flame Hydrodynamics HUD */}
        <div className="bg-obsidian-surface/90 backdrop-blur-xl border border-obsidian-border rounded-2xl p-4.5 grid grid-cols-2 sm:grid-cols-4 gap-3.5 shadow-glass-card">
          <div className="p-3 bg-obsidian-elevated/40 rounded-xl border border-obsidian-border/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Flame className="w-3.5 h-3.5 text-thermal-amber" />
              <span>COMBUSTION REGIME</span>
            </div>
            <div className="text-white font-heading font-bold text-xs mt-1.5 truncate" title={regimeName}>
              {regimeName}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {sqrtG < 0.1 ? 'Spherical blue diffusion' : 'Buoyancy convective draft'}
            </div>
          </div>

          <div className="p-3 bg-obsidian-elevated/40 rounded-xl border border-obsidian-border/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              <span>CORE TEMPERATURE</span>
            </div>
            <div className="text-thermal-amber font-heading font-bold text-lg mt-1 font-mono-numbers">
              {physics.flameState === 'EXTINGUISHED' ? '295 K' : `${(1150 + o2Frac * 1200 + pRatio * 150).toFixed(0)} K`}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              CH* radical chemiluminescence
            </div>
          </div>

          <div className="p-3 bg-obsidian-elevated/40 rounded-xl border border-obsidian-border/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Activity className="w-3.5 h-3.5 text-accent-glow" />
              <span>DAMKÖHLER NUMBER (Da)</span>
            </div>
            <div className="text-accent-glow font-heading font-bold text-lg mt-1 font-mono-numbers">
              {(3.5 * o2Frac / (atmosphere.ventilation + 0.05)).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Reaction rate / Diffusion rate
            </div>
          </div>

          <div className="p-3 bg-obsidian-elevated/40 rounded-xl border border-obsidian-border/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>R-T FLICKER FREQ</span>
            </div>
            <div className="text-emerald-400 font-heading font-bold text-lg mt-1 font-mono-numbers">
              {(8 + 14 * sqrtG).toFixed(1)} Hz
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {sqrtG === 0 ? 'Flicker damped in 0g' : 'Buoyancy eddy oscillation'}
            </div>
          </div>
        </div>
      </div>

      {/* Side Information & Thermophysical Profile (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        
        {/* Active Material Card */}
        <div className="bg-obsidian-surface/90 backdrop-blur-xl border border-obsidian-border rounded-2xl p-5 shadow-glass-card">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent-glow shadow-sm">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading font-bold text-white text-sm">
                  Fuel Thermophysical Profile
                </span>
                <div className="text-[10px] text-slate-400">NASA Flight Qualification</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-accent/15 text-accent-glow px-2.5 py-0.5 rounded-full border border-accent/30">
              {material.id.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Material Name: </span>
              <strong className="text-white text-sm block mt-0.5 font-heading">{material.name}</strong>
            </div>
            <div>
              <span className="text-slate-400">Chemical Backbone: </span>
              <span className="text-slate-200 block mt-0.5">{material.chemicalName}</span>
            </div>
            <div>
              <span className="text-slate-400">Spaceflight Application: </span>
              <span className="text-slate-300 block mt-0.5 leading-relaxed">{material.application}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-obsidian-border/80 text-[11px]">
              <div className="bg-obsidian-elevated/40 p-2.5 rounded-xl border border-obsidian-border/60">
                <span className="text-slate-400 text-[10px]">Spread Coeff (C_mat)</span>
                <div className="text-white font-bold text-sm font-mono-numbers mt-0.5">{material.cMat} mm/s</div>
              </div>
              <div className="bg-obsidian-elevated/40 p-2.5 rounded-xl border border-obsidian-border/60">
                <span className="text-slate-400 text-[10px]">Velocity Exponent (n)</span>
                <div className="text-white font-bold text-sm font-mono-numbers mt-0.5">{material.velocityExponent}</div>
              </div>
              <div className="bg-obsidian-elevated/40 p-2.5 rounded-xl border border-obsidian-border/60">
                <span className="text-slate-400 text-[10px]">Limiting Oxygen (LOC)</span>
                <div className="text-thermal-amber font-bold text-sm font-mono-numbers mt-0.5">{material.baseLoc1g}%</div>
              </div>
              <div className="bg-obsidian-elevated/40 p-2.5 rounded-xl border border-obsidian-border/60">
                <span className="text-slate-400 text-[10px]">Base HRR (1g)</span>
                <div className="text-white font-bold text-sm font-mono-numbers mt-0.5">{material.baseHrr} kW/m²</div>
              </div>
            </div>
          </div>
        </div>

        {/* Microgravity Flame Mechanics Reference */}
        <div className="bg-obsidian-surface/90 backdrop-blur-xl border border-obsidian-border rounded-2xl p-5 flex-1 shadow-glass-card text-slate-300 text-xs leading-relaxed space-y-2.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-obsidian-border font-heading font-bold text-white text-sm">
            <div className="w-7 h-7 rounded-lg bg-thermal-amber/15 border border-thermal-amber/30 flex items-center justify-center text-thermal-amber">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <span>Microgravity Combustion Physics</span>
          </div>
          <p>
            In Earth gravity (1g), hot combustion products rise rapidly by natural buoyancy (u_b ~ 0.30 m/s), drawing in oxidizer from the base to sustain a tall flickering teardrop flame.
          </p>
          <p>
            In true orbital microgravity (G* = 0), natural convective buoyant updrafts vanish completely. Oxidizer can only reach the fuel through molecular diffusion or forced spacecraft cabin ventilation (u_vent).
          </p>
          <div className="text-slate-400 text-[11px] pt-2 border-t border-obsidian-border/80">
            This results in a hemispherical blue reaction zone with low peak flame temperature, longer chemical residence time, and an accumulation of soot particles trailing downwind.
          </div>
        </div>

      </div>

    </div>
  );
};
