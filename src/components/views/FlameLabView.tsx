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
  ShieldCheck, 
  Compass,
  Zap,
  Sliders
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
    <div className="p-4 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
      
      {/* Visualizer Hero Area (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        <div className="h-[520px] w-full">
          <FlameVisualizer 
            atmosphere={atmosphere} 
            material={material} 
            physics={physics} 
          />
        </div>

        {/* Real-Time Optical Pyrometry & Flame Hydrodynamics HUD */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 bg-obsidian-deep rounded border border-obsidian-border">
            <div className="text-[10px] text-slate-500 uppercase">Combustion Regime</div>
            <div className="text-white font-bold text-xs mt-1 truncate" title={regimeName}>
              {regimeName}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {sqrtG < 0.1 ? 'Spherical diffusion blue core' : 'Convective buoyancy plume'}
            </div>
          </div>

          <div className="p-2.5 bg-obsidian-deep rounded border border-obsidian-border">
            <div className="text-[10px] text-slate-500 uppercase">Estimated Core Temp</div>
            <div className="text-thermal-amber font-bold text-sm mt-1 font-mono-numbers">
              {physics.flameState === 'EXTINGUISHED' ? '295 K' : `${(1150 + o2Frac * 1200 + pRatio * 150).toFixed(0)} K`}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              CH* chemiluminescence peak
            </div>
          </div>

          <div className="p-2.5 bg-obsidian-deep rounded border border-obsidian-border">
            <div className="text-[10px] text-slate-500 uppercase">Damköhler Number (Da)</div>
            <div className="text-cryo-glow font-bold text-sm mt-1 font-mono-numbers">
              {(3.5 * o2Frac / (atmosphere.ventilation + 0.05)).toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              Chemical rate / Flow rate
            </div>
          </div>

          <div className="p-2.5 bg-obsidian-deep rounded border border-obsidian-border">
            <div className="text-[10px] text-slate-500 uppercase">Rayleigh-Taylor Flicker</div>
            <div className="text-emerald-400 font-bold text-sm mt-1 font-mono-numbers">
              {(8 + 14 * sqrtG).toFixed(1)} Hz
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {sqrtG === 0 ? 'Flicker damped in 0g' : 'Buoyancy shedding frequency'}
            </div>
          </div>
        </div>
      </div>

      {/* Side Information & Thermophysical Profile (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        
        {/* Active Material Card */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-obsidian-border">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cryo-cyan" />
              <span className="font-semibold text-white uppercase text-xs">
                Fuel Thermophysical Profile
              </span>
            </div>
            <span className="text-[10px] bg-cryo-cyan/10 text-cryo-glow px-2 py-0.5 rounded border border-cryo-cyan/20">
              {material.id.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-500">Material Name: </span>
              <strong className="text-white">{material.name}</strong>
            </div>
            <div>
              <span className="text-slate-500">Chemical Backbone: </span>
              <span className="text-slate-300">{material.chemicalName}</span>
            </div>
            <div>
              <span className="text-slate-500">Spaceflight Application: </span>
              <span className="text-slate-300">{material.application}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-obsidian-border">
              <div>
                <span className="text-slate-500">Spread Coeff (C_mat):</span>
                <div className="text-white font-bold">{material.cMat} mm/s</div>
              </div>
              <div>
                <span className="text-slate-500">Velocity Exponent (n):</span>
                <div className="text-white font-bold">{material.velocityExponent}</div>
              </div>
              <div>
                <span className="text-slate-500">Limiting Oxygen (LOC):</span>
                <div className="text-thermal-amber font-bold">{material.baseLoc1g}%</div>
              </div>
              <div>
                <span className="text-slate-500">Base HRR (1g):</span>
                <div className="text-white font-bold">{material.baseHrr} kW/m²</div>
              </div>
              <div>
                <span className="text-slate-500">Thermal Cond. (k):</span>
                <div className="text-slate-300">{material.thermalConductivity} W/(m·K)</div>
              </div>
              <div>
                <span className="text-slate-500">Soot Yield (Y_s):</span>
                <div className="text-slate-300">{(material.sootYield * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Microgravity Flame Mechanics Reference */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 flex-1 text-slate-300 text-[11px] leading-relaxed space-y-2">
          <div className="text-xs font-semibold text-white uppercase tracking-micro flex items-center gap-1.5 pb-2 border-b border-obsidian-border">
            <Flame className="w-3.5 h-3.5 text-thermal-amber" />
            Microgravity Combustion Physics
          </div>
          <p>
            In Earth gravity (1g), hot combustion products rise rapidly by natural buoyancy (u_b ~ 0.30 m/s), drawing in oxidizer from the base to sustain a tall flickering teardrop flame.
          </p>
          <p>
            In true orbital microgravity (G* = 0), natural convective buoyant updrafts vanish completely. Oxidizer can only reach the fuel through molecular diffusion or forced spacecraft cabin ventilation (u_vent).
          </p>
          <p className="text-slate-400 text-[10px] pt-1 border-t border-obsidian-border">
            This creates a hemispherical blue reaction zone with low peak flame temperature, longer chemical residence time, and an accumulation of soot particles trailing downwind.
          </p>
        </div>

      </div>

    </div>
  );
};
