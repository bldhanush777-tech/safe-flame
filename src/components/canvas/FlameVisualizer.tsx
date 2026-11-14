import React, { useRef, useEffect, useState } from 'react';
import { AtmosphereState, MaterialProperties, PhysicsOutputs } from '../../types/physics';
import { Eye, Wind, Radio, Flame, Sparkles, Activity, ShieldAlert, Zap } from 'lucide-react';

interface FlameVisualizerProps {
  atmosphere: AtmosphereState;
  material: MaterialProperties;
  physics: PhysicsOutputs;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  type: 'flame' | 'soot' | 'spark' | 'smoke';
}

export const FlameVisualizer: React.FC<FlameVisualizerProps> = ({
  atmosphere,
  material,
  physics,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Visual overlay toggles
  const [showVectors, setShowVectors] = useState(true);
  const [showHeatFlux, setShowHeatFlux] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [overrideState, setOverrideState] = useState<'AUTO' | 'NORMAL' | 'SMOLDER' | 'EXTINGUISHED'>('AUTO');

  // Particles storage in ref so canvas animation runs at 60fps without react re-renders
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Determine current active flame mode
  const effectiveState = overrideState === 'AUTO' ? physics.flameState : overrideState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      timeRef.current += 0.016; // approx 60fps
      const time = timeRef.current;

      const width = canvas.width;
      const height = canvas.height;

      // Clear with dark tactical background
      ctx.fillStyle = '#06080D';
      ctx.fillRect(0, 0, width, height);

      // Draw faint tactical engineering grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Origin of flame (bottom-center of burner sample)
      const originX = width * 0.42;
      const originY = height * 0.72;

      // Draw Fuel Sample Plate / Sample Holder
      const sampleWidth = 140;
      const sampleHeight = Math.max(4, Math.min(16, atmosphere.thicknessMm * 3.5));
      
      // Sample glow & body
      ctx.save();
      // Sample material body
      const sampleGrad = ctx.createLinearGradient(originX - 60, originY, originX + 80, originY + sampleHeight);
      sampleGrad.addColorStop(0, '#1E293B');
      sampleGrad.addColorStop(0.5, '#334155');
      sampleGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = sampleGrad;
      ctx.fillRect(originX - 60, originY, sampleWidth, sampleHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(originX - 60, originY, sampleWidth, sampleHeight);

      // Sample label on burner
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`${material.name.toUpperCase()} [${atmosphere.thicknessMm.toFixed(2)}mm]`, originX - 54, originY + sampleHeight + 11);
      ctx.restore();

      // Physical parameters
      const gStar = atmosphere.gravity / 9.81;
      const sqrtG = Math.sqrt(Math.max(0, gStar));
      const uVent = atmosphere.ventilation; // m/s
      const o2Frac = atmosphere.oxygen; // 0.15 to 0.45
      const pRatio = atmosphere.pressurePsi / 14.7;

      // Buoyant velocity component (rising upward)
      const uBuoyant = sqrtG * 0.30; // m/s
      // Effective draft vector
      // Horizontal draft from ventilation (left-to-right)
      const vxVentScale = uVent * 180;
      // Vertical lift from gravity buoyancy
      const vyBuoyantScale = uBuoyant * 220;

      // Rayleigh-Taylor flicker frequency increases with gravity
      const flickerFreq = 8 + 14 * sqrtG;
      const flickerAmp = 0.08 * sqrtG;
      const flicker = 1.0 + Math.sin(time * flickerFreq) * flickerAmp + Math.sin(time * 23.4) * (0.04 * sqrtG);

      // If EXTINGUISHED / QUENCHED
      if (effectiveState === 'EXTINGUISHED') {
        // Render quenched smolder smoke
        // Emit smoke particles
        if (showParticles && Math.random() < 0.6) {
          particlesRef.current.push({
            x: originX + (Math.random() - 0.5) * 30,
            y: originY - 2,
            vx: vxVentScale * 0.15 + (Math.random() - 0.5) * 0.5,
            vy: -0.6 - Math.random() * 0.8,
            life: 0,
            maxLife: 70 + Math.random() * 40,
            size: 4 + Math.random() * 6,
            r: 140,
            g: 145,
            b: 155,
            alpha: 0.45,
            type: 'smoke',
          });
        }

        // Draw cold sample hotspot
        const coldGlow = ctx.createRadialGradient(originX, originY, 0, originX, originY, 25);
        coldGlow.addColorStop(0, 'rgba(148, 163, 184, 0.25)');
        coldGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = coldGlow;
        ctx.beginPath();
        ctx.arc(originX, originY, 25, 0, Math.PI * 2);
        ctx.fill();

        // Extinction Banner
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(width * 0.15, height * 0.15, width * 0.70, 48);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(width * 0.15, height * 0.15, width * 0.70, 48);
        ctx.fillStyle = '#EF4444';
        ctx.font = '600 11px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('COMBUSTION QUENCHED / SELF-EXTINGUISHED', width * 0.5, height * 0.15 + 20);
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(physics.quenchingMechanism || 'XO2 below Limiting Oxygen Concentration', width * 0.5, height * 0.15 + 36);
        ctx.restore();
      } else if (effectiveState === 'SMOLDERING') {
        // SMOLDERING: Dull deep amber/red ember glow, lots of dark soot smoke, minimal luminous flame
        const emberGlow = ctx.createRadialGradient(originX, originY, 2, originX, originY, 40);
        emberGlow.addColorStop(0, 'rgba(234, 88, 12, 0.85)');
        emberGlow.addColorStop(0.3, 'rgba(185, 28, 28, 0.55)');
        emberGlow.addColorStop(0.8, 'rgba(120, 53, 15, 0.2)');
        emberGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = emberGlow;
        ctx.beginPath();
        ctx.arc(originX, originY - 4, 40, 0, Math.PI * 2);
        ctx.fill();

        // Emit heavy smolder smoke
        if (showParticles && Math.random() < 0.7) {
          particlesRef.current.push({
            x: originX + (Math.random() - 0.5) * 25,
            y: originY - 3,
            vx: vxVentScale * 0.25 + (Math.random() - 0.5) * 0.8,
            vy: -0.8 - Math.random() * 1.2,
            life: 0,
            maxLife: 90 + Math.random() * 50,
            size: 5 + Math.random() * 8,
            r: 100 + Math.random() * 30,
            g: 95 + Math.random() * 20,
            b: 95,
            alpha: 0.55,
            type: 'smoke',
          });
        }
      } else {
        // NORMAL ACTIVE COMBUSTION
        // Base dimensions of flame governed by physics
        // In 1g: tall teardrop plume (height ~ 90-140px, width ~ 35-50px)
        // In micro-g: broad hemispherical dome (height ~ 45-60px, width ~ 70-100px)
        const baseHeight = 45 + (vyBuoyantScale * 0.45 + pRatio * 15) * flicker;
        const baseWidth = (75 - sqrtG * 35) * (1.0 + o2Frac * 0.6);

        // Core tilt angle caused by ventilation
        const tiltX = (vxVentScale * 0.25) / (1.0 + sqrtG * 1.5);

        // Radiant Heat Flux Rings
        if (showHeatFlux) {
          ctx.save();
          const numRings = 3;
          for (let i = 1; i <= numRings; i++) {
            const ringRadius = (baseHeight * 0.7 + i * 28) * (0.95 + Math.sin(time * 3 + i) * 0.05);
            ctx.beginPath();
            ctx.ellipse(
              originX + tiltX * 0.3,
              originY - baseHeight * 0.35,
              ringRadius * 1.15,
              ringRadius * 0.85,
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = i === 1 ? 'rgba(249, 115, 22, 0.18)' : i === 2 ? 'rgba(249, 115, 22, 0.09)' : 'rgba(56, 189, 248, 0.06)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Color chemistry based on Oxygen concentration
        // 21% O2: Soft Blue base, Amber-Orange mantle, dark soot tip
        // 34%+ O2: Intense Incandescent White/Cyan core, radiant orange fringes
        // Micro-g (G* = 0): Distinct blue spherical diffusion flame with amber wake
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Outer Mantle Flame
        const mantleGrad = ctx.createRadialGradient(
          originX + tiltX * 0.4,
          originY - baseHeight * 0.3,
          4,
          originX + tiltX * 0.5,
          originY - baseHeight * 0.4,
          baseWidth * 0.9
        );

        if (o2Frac > 0.30) {
          // Hyper-oxygenated incandescent white/yellow/cyan
          mantleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          mantleGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.85)');
          mantleGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.7)');
          mantleGrad.addColorStop(0.9, 'rgba(239, 68, 68, 0.3)');
          mantleGrad.addColorStop(1, 'transparent');
        } else if (sqrtG < 0.2) {
          // Pure microgravity blue diffusion flame (NASA BASS style)
          mantleGrad.addColorStop(0, 'rgba(147, 197, 253, 0.9)');
          mantleGrad.addColorStop(0.35, 'rgba(59, 130, 246, 0.75)');
          mantleGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.45)');
          mantleGrad.addColorStop(1, 'transparent');
        } else {
          // Standard terrestrial / partial buoyant flame
          mantleGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
          mantleGrad.addColorStop(0.3, 'rgba(249, 115, 22, 0.85)');
          mantleGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.4)');
          mantleGrad.addColorStop(1, 'transparent');
        }

        // Draw Flame Geometry:
        // In 1g: Teardrop bezier
        // In micro-g: Hemispherical dome
        ctx.fillStyle = mantleGrad;
        ctx.beginPath();
        if (sqrtG > 0.5) {
          // 1G TEARDROP
          ctx.moveTo(originX - baseWidth * 0.45, originY);
          ctx.bezierCurveTo(
            originX - baseWidth * 0.5, originY - baseHeight * 0.4,
            originX - baseWidth * 0.2 + tiltX * 0.5, originY - baseHeight * 0.85,
            originX + tiltX, originY - baseHeight
          );
          ctx.bezierCurveTo(
            originX + baseWidth * 0.2 + tiltX * 0.8, originY - baseHeight * 0.85,
            originX + baseWidth * 0.5 + tiltX * 0.4, originY - baseHeight * 0.4,
            originX + baseWidth * 0.45, originY
          );
          ctx.closePath();
          ctx.fill();
        } else {
          // MICRO-G / HYPO-G DOME (BASS / FLARE Hemispherical)
          const domeRadiusX = baseWidth * 0.55;
          const domeRadiusY = baseHeight * 0.8;
          ctx.ellipse(
            originX + tiltX * 0.5,
            originY - domeRadiusY * 0.4,
            domeRadiusX,
            domeRadiusY * 0.65,
            (tiltX * 0.004),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Blue Luminous Radical Flame Base (CH* & C2* Chemiluminescence)
        const baseBlueGrad = ctx.createRadialGradient(
          originX,
          originY,
          1,
          originX,
          originY,
          24 * (1.0 + o2Frac * 0.5)
        );
        baseBlueGrad.addColorStop(0, 'rgba(6, 182, 212, 0.95)');
        baseBlueGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.65)');
        baseBlueGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = baseBlueGrad;
        ctx.beginPath();
        ctx.ellipse(originX, originY - 3, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Emit dynamic soot & flame particles
        if (showParticles) {
          // Flame ejection particles
          const spawnCount = o2Frac > 0.30 ? 3 : 2;
          for (let i = 0; i < spawnCount; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * (sqrtG > 0.4 ? 0.6 : 1.6);
            const speed = 1.2 + Math.random() * (1.5 + vyBuoyantScale * 0.02 + vxVentScale * 0.015);
            particlesRef.current.push({
              x: originX + (Math.random() - 0.5) * 16,
              y: originY - 4,
              vx: Math.cos(angle) * speed + vxVentScale * 0.025,
              vy: Math.sin(angle) * speed - vyBuoyantScale * 0.02,
              life: 0,
              maxLife: 25 + Math.random() * 20,
              size: 2 + Math.random() * 3,
              r: o2Frac > 0.30 ? 255 : 249,
              g: o2Frac > 0.30 ? 220 : 115,
              b: o2Frac > 0.30 ? 120 : 22,
              alpha: 0.9,
              type: 'flame',
            });
          }

          // Soot particles (trailing downwind)
          if (Math.random() < material.sootYield * 8) {
            particlesRef.current.push({
              x: originX + tiltX * 0.6 + (Math.random() - 0.5) * 20,
              y: originY - baseHeight * 0.8,
              vx: vxVentScale * 0.035 + (Math.random() - 0.5) * 0.5,
              vy: -0.4 - vyBuoyantScale * 0.01,
              life: 0,
              maxLife: 60 + Math.random() * 40,
              size: 3 + Math.random() * 4,
              r: 80,
              g: 75,
              b: 70,
              alpha: 0.6,
              type: 'soot',
            });
          }

          // Glowing ember sparks at high oxygen or high heat release
          if (o2Frac > 0.28 && Math.random() < 0.25) {
            particlesRef.current.push({
              x: originX + (Math.random() - 0.5) * 20,
              y: originY - 10,
              vx: (Math.random() - 0.5) * 2 + vxVentScale * 0.03,
              vy: -1.5 - Math.random() * 3 - vyBuoyantScale * 0.02,
              life: 0,
              maxLife: 30 + Math.random() * 25,
              size: 1.5,
              r: 255,
              g: 245,
              b: 150,
              alpha: 1.0,
              type: 'spark',
            });
          }
        }
      }

      // Update & Draw Particles
      if (showParticles) {
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life++;
          p.x += p.vx;
          p.y += p.vy;

          const progress = p.life / p.maxLife;
          if (progress >= 1.0) {
            particles.splice(i, 1);
            continue;
          }

          const currentAlpha = p.alpha * (1.0 - progress);
          const currentSize = p.type === 'smoke' || p.type === 'soot' ? p.size * (1 + progress * 1.5) : p.size * (1 - progress * 0.5);

          ctx.save();
          if (p.type === 'flame' || p.type === 'spark') {
            ctx.globalCompositeOperation = 'screen';
          }
          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Airflow & Convection Vectors
      if (showVectors) {
        ctx.save();
        // Ventilation arrow (forced flow left to right)
        const vecStartX = 28;
        const vecStartY = originY - 40;
        const arrowLen = Math.min(80, 20 + uVent * 140);

        ctx.strokeStyle = '#38BDF8';
        ctx.fillStyle = '#38BDF8';
        ctx.lineWidth = 1.5;

        // Draw main ventilation vector
        ctx.beginPath();
        ctx.moveTo(vecStartX, vecStartY);
        ctx.lineTo(vecStartX + arrowLen, vecStartY);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(vecStartX + arrowLen, vecStartY);
        ctx.lineTo(vecStartX + arrowLen - 7, vecStartY - 4);
        ctx.lineTo(vecStartX + arrowLen - 7, vecStartY + 4);
        ctx.closePath();
        ctx.fill();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`u_vent: ${uVent.toFixed(2)} m/s`, vecStartX, vecStartY - 8);

        // Buoyant lift vector (rising vertically)
        if (atmosphere.gravity > 0.1) {
          const bVecX = width - 45;
          const bVecY = originY + 10;
          const bLen = Math.min(75, 12 + uBuoyant * 180);

          ctx.strokeStyle = '#F97316';
          ctx.fillStyle = '#F97316';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(bVecX, bVecY);
          ctx.lineTo(bVecX, bVecY - bLen);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(bVecX, bVecY - bLen);
          ctx.lineTo(bVecX - 4, bVecY - bLen + 6);
          ctx.lineTo(bVecX + 4, bVecY - bLen + 6);
          ctx.closePath();
          ctx.fill();

          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`u_b: ${uBuoyant.toFixed(2)} m/s`, bVecX - 8, bVecY - bLen * 0.5);
        } else {
          // Zero-g tag
          ctx.fillStyle = '#06B6D4';
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText('BUOYANCY SUPPRESSED (G* = 0)', width - 18, originY - 20);
        }

        ctx.restore();
      }

      // Live Telemetry Corner Overlay on Canvas
      ctx.save();
      ctx.fillStyle = 'rgba(6, 8, 13, 0.85)';
      ctx.fillRect(8, 8, 190, 72);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(8, 8, 190, 72);

      // Micro status indicators
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillText('OPTICAL PYROMETRY & MORPHOLOGY', 14, 20);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '8px "JetBrains Mono", monospace';
      const regimeName = 
        sqrtG < 0.1 ? 'DIFFUSIVE HEMISPHERICAL (MICRO-G)' :
        sqrtG < 0.65 ? 'SEMI-BUOYANT TILTED DOME' : 'BUOYANT TURBULENT TEARDROP (1G)';

      ctx.fillText(`REGIME: ${regimeName}`, 14, 32);
      ctx.fillText(`FLICKER RT: ${(flickerFreq).toFixed(1)} Hz`, 14, 44);
      ctx.fillText(`EST CORE TEMP: ${effectiveState === 'EXTINGUISHED' ? '295 K' : `${(1150 + o2Frac * 1200 + pRatio * 150).toFixed(0)} K`}`, 14, 56);
      ctx.fillText(`SOOT YIELD: ${(material.sootYield * 100).toFixed(1)}% | Da: ${(3.5 * o2Frac / (uVent + 0.05)).toFixed(2)}`, 14, 68);

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [atmosphere, material, physics, showVectors, showHeatFlux, showParticles, effectiveState]);

  return (
    <div className="flex flex-col h-full bg-obsidian-surface border border-obsidian-border rounded-sm relative overflow-hidden corner-bracket-container corner-bracket-tl-br">
      {/* Visualizer Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-obsidian-border bg-obsidian-deep/80 text-xs">
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-thermal-amber animate-pulse" />
          <span className="font-semibold tracking-micro text-slate-200 uppercase">
            Microgravity Flame Morphology Engine
          </span>
          <span className="font-mono text-[10px] text-cryo-cyan bg-cryo-cyan/10 px-1.5 py-0.5 rounded border border-cryo-cyan/20">
            60 FPS LIVE
          </span>
        </div>

        {/* State Override Pills */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-mono mr-1">STATE:</span>
          {(['AUTO', 'NORMAL', 'SMOLDER', 'EXTINGUISHED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setOverrideState(st)}
              className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
                overrideState === st
                  ? 'bg-thermal-amber/20 text-thermal-amber border border-thermal-amber/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-obsidian-elevated/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 min-h-[300px] w-full bg-obsidian">
        <canvas
          ref={canvasRef}
          width={540}
          height={380}
          className="w-full h-full block object-contain"
        />

        {/* Floating tactical telemetry badges at bottom right */}
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 pointer-events-none">
          <div className="bg-obsidian-deep/90 border border-obsidian-border px-2 py-1 rounded text-[9px] font-mono text-slate-300 backdrop-blur-sm">
            <span className="text-cryo-glow">u_eff</span> = {physics.uEff.toFixed(3)} m/s
          </div>
          <div className="bg-obsidian-deep/90 border border-obsidian-border px-2 py-1 rounded text-[9px] font-mono text-slate-300 backdrop-blur-sm">
            <span className="text-thermal-amber">G*</span> = {physics.gStar.toFixed(3)} (
            {atmosphere.gravity === 0 ? '0.00g Freefall' : atmosphere.gravity === 1.62 ? 'Lunar 1/6g' : atmosphere.gravity === 3.71 ? 'Mars 3/8g' : 'Earth 1.0g'})
          </div>
        </div>
      </div>

      {/* Sub-bar Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-obsidian-deep border-t border-obsidian-border text-[10px] font-mono">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={showVectors}
              onChange={e => setShowVectors(e.target.checked)}
              className="accent-cryo-cyan rounded"
            />
            <Wind className="w-3 h-3 text-cryo-cyan" />
            <span>Airflow Vectors</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={showHeatFlux}
              onChange={e => setShowHeatFlux(e.target.checked)}
              className="accent-thermal-amber rounded"
            />
            <Radio className="w-3 h-3 text-thermal-amber" />
            <span>Heat Flux Rings</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={showParticles}
              onChange={e => setShowParticles(e.target.checked)}
              className="accent-telemetry-gold rounded"
            />
            <Sparkles className="w-3 h-3 text-telemetry-gold" />
            <span>Soot & Radical Sparks</span>
          </label>
        </div>

        <div className="text-slate-500 text-[9px]">
          RESOLVED GRID: 540x380 px
        </div>
      </div>
    </div>
  );
};
