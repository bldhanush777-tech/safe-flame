import React, { useState, useEffect, useRef } from 'react';
import { 
  AtmosphereState, 
  MaterialProperties, 
  PhysicsOutputs, 
  SmokeDetector, 
  SuppressantType 
} from '../../types/physics';
import { SUPPRESSANT_OPTIONS } from '../../data/materials';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  Wind, 
  Flame, 
  Radio, 
  Droplet, 
  AlertOctagon, 
  Zap, 
  Sliders, 
  Clock, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface SmokeSimulatorViewProps {
  atmosphere: AtmosphereState;
  material: MaterialProperties;
  physics: PhysicsOutputs;
}

const GRID_COLS = 12;
const GRID_ROWS = 6;
const CELL_SIZE_M = 0.5; // 6m x 3m habitat module

export const SmokeSimulatorView: React.FC<SmokeSimulatorViewProps> = ({
  atmosphere,
  material,
  physics,
}) => {
  // Simulation transient state
  const [isPlaying, setIsPlaying] = useState(false);
  const [simTime, setSimTime] = useState(0); // 0 to 120 seconds
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 4x

  // Interactive positions
  const [fireCell, setFireCell] = useState<{ x: number; y: number }>({ x: 3, y: 4 });
  const [activePlacementTool, setActivePlacementTool] = useState<'FIRE' | 'DET_ALPHA' | 'DET_BETA' | 'DET_GAMMA' | 'NONE'>('NONE');

  // Detectors
  const [detectors, setDetectors] = useState<SmokeDetector[]>([
    {
      id: 'det_alpha',
      name: 'Detector Alpha (Ceiling Deck)',
      type: 'Photoelectric',
      x: 5,
      y: 0,
      alarmThreshold: 1.5, // 1.5 % obs/m
      currentObscuration: 0,
      alarmed: false,
      alarmTimeSeconds: null,
    },
    {
      id: 'det_beta',
      name: 'Detector Beta (Central Aisle)',
      type: 'Dual-Wavelength Laser',
      x: 8,
      y: 1,
      alarmThreshold: 1.2,
      currentObscuration: 0,
      alarmed: false,
      alarmTimeSeconds: null,
    },
    {
      id: 'det_gamma',
      name: 'Detector Gamma (Aft Exhaust Port)',
      type: 'Photoelectric',
      x: 11,
      y: 4,
      alarmThreshold: 1.8,
      currentObscuration: 0,
      alarmed: false,
      alarmTimeSeconds: null,
    },
  ]);

  // Suppressant System
  const [selectedSuppressant, setSelectedSuppressant] = useState<SuppressantType>('water_mist');
  const [isDischarging, setIsDischarging] = useState(false);
  const [suppressantActiveRemaining, setSuppressantActiveRemaining] = useState(0);

  // 2D Concentration Matrix: C_s[y][x] (0 to 100%)
  const smokeGridRef = useRef<number[][]>(
    Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0))
  );
  const [renderCounter, setRenderCounter] = useState(0);

  // Velocity field (u, v) based on HVAC and Buoyancy
  // Buoyant lift: v_buoyant = sqrt(G*) * 0.30 m/s
  const sqrtG = Math.sqrt(Math.max(0, atmosphere.gravity / 9.81));
  const uBuoyant = sqrtG * 0.30;
  const uVent = atmosphere.ventilation;

  // Reset simulation
  const handleReset = () => {
    setIsPlaying(false);
    setSimTime(0);
    setIsDischarging(false);
    setSuppressantActiveRemaining(0);
    smokeGridRef.current = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));
    setDetectors(prev =>
      prev.map(d => ({
        ...d,
        currentObscuration: 0,
        alarmed: false,
        alarmTimeSeconds: null,
      }))
    );
    setRenderCounter(c => c + 1);
  };

  // Re-simulate from t=0 to targetTime for instant, deterministic scrubbing
  const runSimulationUpToTime = (targetT: number) => {
    let currentGrid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));
    const currentSuppressantInfo = SUPPRESSANT_OPTIONS.find(s => s.id === selectedSuppressant);
    const lambdaSink = isDischarging ? (currentSuppressantInfo?.extinctionEfficiency || 0.8) * 0.45 : 0.01;
    const sourceRate = isDischarging 
      ? 0.5 
      : physics.flameState === 'EXTINGUISHED' 
      ? 0.0 
      : (material.sootYield * 120 + material.baseHrr * 0.02) * (atmosphere.oxygen / 0.21);

    const Ds = 0.04;
    const dx = CELL_SIZE_M;
    const dy = CELL_SIZE_M;
    const dt = 0.5;

    let localDetectors = detectors.map(d => ({
      ...d,
      currentObscuration: 0,
      alarmed: false,
      alarmTimeSeconds: null as number | null,
    }));

    for (let t = 0; t <= targetT; t += dt) {
      const nextGrid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));

      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          const C = currentGrid[y][x];

          const C_left = x > 0 ? currentGrid[y][x - 1] : C;
          const C_right = x < GRID_COLS - 1 ? currentGrid[y][x + 1] : C;
          const C_up = y > 0 ? currentGrid[y - 1][x] : C;
          const C_down = y < GRID_ROWS - 1 ? currentGrid[y + 1][x] : C;

          const d2C_dx2 = (C_right - 2 * C + C_left) / (dx * dx);
          const d2C_dy2 = (C_down - 2 * C + C_up) / (dy * dy);
          const diffusion = Ds * (d2C_dx2 + d2C_dy2);

          const u = uVent * (1.0 + (x / GRID_COLS) * 0.2);
          const v = -uBuoyant * (1.0 - y / GRID_ROWS);

          const dC_dx = u > 0 ? (C - C_left) / dx : (C_right - C) / dx;
          const dC_dy = v < 0 ? (C_down - C) / dy : (C - C_up) / dy;
          const advection = -(u * dC_dx + v * dC_dy);

          const isSource = x === fireCell.x && y === fireCell.y;
          const S = isSource ? sourceRate : 0;

          const isExhaust = x === GRID_COLS - 1 && y >= GRID_ROWS - 2;
          const exhaustSink = isExhaust ? 0.15 * C : 0;
          const sink = lambdaSink * C + exhaustSink;

          const dC_dt = advection + diffusion + S - sink;
          nextGrid[y][x] = Math.max(0, Math.min(100, C + dC_dt * dt));
        }
      }

      currentGrid = nextGrid;

      // Update detector alarms along the timeline
      localDetectors = localDetectors.map(det => {
        const localConcentration = currentGrid[det.y][det.x];
        const currentObs = Number((localConcentration * 0.08).toFixed(2));
        const alarmed = det.alarmed || currentObs >= det.alarmThreshold;
        const alarmTime = det.alarmed 
          ? det.alarmTimeSeconds 
          : alarmed 
          ? Number(t.toFixed(1)) 
          : null;

        return {
          ...det,
          currentObscuration: currentObs,
          alarmed,
          alarmTimeSeconds: alarmTime,
        };
      });
    }

    smokeGridRef.current = currentGrid;
    setDetectors(localDetectors);
    setRenderCounter(c => c + 1);
  };

  // Step simulation forward by dt (seconds)
  const stepSimulation = (dt: number) => {
    const grid = smokeGridRef.current;
    const nextGrid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));

    // Suppressant sink coefficient Lambda
    const currentSuppressantInfo = SUPPRESSANT_OPTIONS.find(s => s.id === selectedSuppressant);
    const lambdaSink = isDischarging ? (currentSuppressantInfo?.extinctionEfficiency || 0.8) * 0.45 : 0.01;

    // Source generation rate at fireCell
    // Driven by material HRR and soot yield
    const sourceRate = isDischarging 
      ? 0.5 
      : physics.flameState === 'EXTINGUISHED' 
      ? 0.0 
      : (material.sootYield * 120 + material.baseHrr * 0.02) * (atmosphere.oxygen / 0.21);

    const Ds = 0.04; // Diffusion coefficient m²/s
    const dx = CELL_SIZE_M;
    const dy = CELL_SIZE_M;

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const C = grid[y][x];

        // Neighbors
        const C_left = x > 0 ? grid[y][x - 1] : C;
        const C_right = x < GRID_COLS - 1 ? grid[y][x + 1] : C;
        const C_up = y > 0 ? grid[y - 1][x] : C;
        const C_down = y < GRID_ROWS - 1 ? grid[y + 1][x] : C;

        // Diffusion: D * (d2C/dx2 + d2C/dy2)
        const d2C_dx2 = (C_right - 2 * C + C_left) / (dx * dx);
        const d2C_dy2 = (C_down - 2 * C + C_up) / (dy * dy);
        const diffusion = Ds * (d2C_dx2 + d2C_dy2);

        // Advection: - (u * dC/dx + v * dC/dy)
        // Horizontal flow u from left inlet to right outlet
        const u = uVent * (1.0 + (x / GRID_COLS) * 0.2);
        // Vertical buoyant lift v points UP (negative y index)
        // In micro-g (sqrtG = 0), v is 0!
        const v = -uBuoyant * (1.0 - y / GRID_ROWS);

        // Upwind differencing
        const dC_dx = u > 0 ? (C - C_left) / dx : (C_right - C) / dx;
        const dC_dy = v < 0 ? (C_down - C) / dy : (C - C_up) / dy;
        const advection = -(u * dC_dx + v * dC_dy);

        // Source term
        const isSource = x === fireCell.x && y === fireCell.y;
        const S = isSource ? sourceRate : 0;

        // Sink term (exhaust vent at x=11, y=5 and suppressant)
        const isExhaust = x === GRID_COLS - 1 && y >= GRID_ROWS - 2;
        const exhaustSink = isExhaust ? 0.15 * C : 0;
        const sink = lambdaSink * C + exhaustSink;

        // Transient Euler step
        const dC_dt = advection + diffusion + S - sink;
        const newC = Math.max(0, Math.min(100, C + dC_dt * dt));
        nextGrid[y][x] = newC;
      }
    }

    smokeGridRef.current = nextGrid;

    // Update Detectors Obscuration & Time-to-Alarm
    setDetectors(prevDetectors =>
      prevDetectors.map(det => {
        const localConcentration = nextGrid[det.y][det.x];
        // Obscuration %/m is proportional to smoke concentration
        const currentObs = Number((localConcentration * 0.08).toFixed(2));
        const alarmed = det.alarmed || currentObs >= det.alarmThreshold;
        const alarmTime = det.alarmed 
          ? det.alarmTimeSeconds 
          : alarmed 
          ? Number(simTime.toFixed(1)) 
          : null;

        return {
          ...det,
          currentObscuration: currentObs,
          alarmed,
          alarmTimeSeconds: alarmTime,
        };
      })
    );

    setRenderCounter(c => c + 1);
  };

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        const dt = 0.5 * simSpeed;
        setSimTime(prevTime => {
          const nextTime = prevTime + dt;
          if (nextTime >= 120) {
            setIsPlaying(false);
            return 120;
          }
          stepSimulation(dt);
          return nextTime;
        });

        // Handle active suppressant countdown
        if (isDischarging) {
          setSuppressantActiveRemaining(prev => {
            if (prev <= dt) {
              setIsDischarging(false);
              return 0;
            }
            return prev - dt;
          });
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, isDischarging, fireCell, selectedSuppressant, atmosphere, material]);

  // Click handler for grid cells
  const handleCellClick = (x: number, y: number) => {
    if (activePlacementTool === 'FIRE') {
      setFireCell({ x, y });
      setActivePlacementTool('NONE');
    } else if (activePlacementTool === 'DET_ALPHA') {
      setDetectors(prev => prev.map(d => d.id === 'det_alpha' ? { ...d, x, y, alarmed: false, alarmTimeSeconds: null } : d));
      setActivePlacementTool('NONE');
    } else if (activePlacementTool === 'DET_BETA') {
      setDetectors(prev => prev.map(d => d.id === 'det_beta' ? { ...d, x, y, alarmed: false, alarmTimeSeconds: null } : d));
      setActivePlacementTool('NONE');
    } else if (activePlacementTool === 'DET_GAMMA') {
      setDetectors(prev => prev.map(d => d.id === 'det_gamma' ? { ...d, x, y, alarmed: false, alarmTimeSeconds: null } : d));
      setActivePlacementTool('NONE');
    }
  };

  const handleDischargeSuppressant = () => {
    const info = SUPPRESSANT_OPTIONS.find(s => s.id === selectedSuppressant);
    setIsDischarging(true);
    setSuppressantActiveRemaining(info?.dischargeDurationSec || 10);
    if (!isPlaying) setIsPlaying(true);
  };

  const currentSuppressantInfo = SUPPRESSANT_OPTIONS.find(s => s.id === selectedSuppressant);

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] mx-auto font-mono">
      
      {/* LEFT & CENTER (8 Cols): 2D Finite-Difference Habitat Cabin Grid */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        
        {/* Habitat Grid Controls Header */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cryo-cyan" />
            <span className="font-semibold text-white tracking-micro uppercase text-[11px]">
              Transient Cabin Smoke Advection-Diffusion Solver
            </span>
            <span className="text-[10px] bg-obsidian-elevated px-2 py-0.5 rounded border border-obsidian-border text-slate-400">
              6.0m × 3.0m Habitat Cross-Section
            </span>
          </div>

          {/* Time Scrubber & Playback Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1 rounded flex items-center gap-1.5 text-xs font-bold transition-colors ${
                isPlaying 
                  ? 'bg-thermal-amber/20 text-thermal-amber border border-thermal-amber/50' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'PAUSE' : 'RUN SOLVER'}
            </button>

            <button
              onClick={handleReset}
              className="p-1 rounded bg-obsidian-deep hover:bg-obsidian-elevated text-slate-400 hover:text-white border border-obsidian-border"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 bg-obsidian-deep px-1.5 py-0.5 rounded border border-obsidian-border text-[10px]">
              {([1, 2, 4] as const).map(sp => (
                <button
                  key={sp}
                  onClick={() => setSimSpeed(sp)}
                  className={`px-1 rounded ${simSpeed === sp ? 'text-cryo-glow font-bold bg-cryo-cyan/20' : 'text-slate-500'}`}
                >
                  {sp}x
                </button>
              ))}
            </div>

            {/* Time Readout */}
            <div className="text-right min-w-[75px]">
              <span className="text-[10px] text-slate-400">T = </span>
              <span className="font-bold text-white text-xs font-mono-numbers">{simTime.toFixed(1)}s</span>
              <span className="text-[9px] text-slate-500"> / 120s</span>
            </div>
          </div>
        </div>

        {/* Time Slider Scrubber */}
        <div className="bg-obsidian-deep/80 px-4 py-2 border border-obsidian-border rounded-sm flex items-center gap-3 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="range"
            min={0}
            max={120}
            step={0.5}
            value={simTime}
            onChange={e => {
              const targetTime = parseFloat(e.target.value);
              setSimTime(targetTime);
              runSimulationUpToTime(targetTime);
            }}
            className="flex-1 accent-cryo-cyan h-1.5 bg-obsidian-elevated rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-400">Scrub Time</span>
        </div>

        {/* Placement Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-micro">INTERACTIVE PLACEMENT:</span>
          
          <button
            onClick={() => setActivePlacementTool(activePlacementTool === 'FIRE' ? 'NONE' : 'FIRE')}
            className={`px-2 py-1 rounded flex items-center gap-1.5 text-[11px] border ${
              activePlacementTool === 'FIRE' 
                ? 'bg-plasma-red/20 text-plasma-red border-plasma-red' 
                : 'bg-obsidian-surface border-obsidian-border text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-plasma-red" />
            Set Fire Origin [{fireCell.x}, {fireCell.y}]
          </button>

          <button
            onClick={() => setActivePlacementTool(activePlacementTool === 'DET_ALPHA' ? 'NONE' : 'DET_ALPHA')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] border ${
              activePlacementTool === 'DET_ALPHA' 
                ? 'bg-cryo-cyan/20 text-cryo-glow border-cryo-cyan' 
                : 'bg-obsidian-surface border-obsidian-border text-slate-300'
            }`}
          >
            Move Det Alpha
          </button>

          <button
            onClick={() => setActivePlacementTool(activePlacementTool === 'DET_BETA' ? 'NONE' : 'DET_BETA')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] border ${
              activePlacementTool === 'DET_BETA' 
                ? 'bg-cryo-cyan/20 text-cryo-glow border-cryo-cyan' 
                : 'bg-obsidian-surface border-obsidian-border text-slate-300'
            }`}
          >
            Move Det Beta
          </button>

          <button
            onClick={() => setActivePlacementTool(activePlacementTool === 'DET_GAMMA' ? 'NONE' : 'DET_GAMMA')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] border ${
              activePlacementTool === 'DET_GAMMA' 
                ? 'bg-cryo-cyan/20 text-cryo-glow border-cryo-cyan' 
                : 'bg-obsidian-surface border-obsidian-border text-slate-300'
            }`}
          >
            Move Det Gamma
          </button>

          {activePlacementTool !== 'NONE' && (
            <span className="text-[10px] text-thermal-amber animate-pulse font-semibold ml-2">
              Click any cell in the habitat grid below to place!
            </span>
          )}
        </div>

        {/* 2D Habitat Grid Visualizer */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 relative overflow-hidden">
          {/* Airflow Inflow / Exhaust Labels */}
          <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2 font-mono">
            <span className="flex items-center gap-1 text-cryo-cyan">
              ← ECLSS Supply Duct ({uVent.toFixed(2)} m/s Forced Air)
            </span>
            <span className="text-slate-400">
              Buoyancy: {atmosphere.gravity === 0 ? 'SUPPRESSED (G*=0)' : `v_b = ${uBuoyant.toFixed(2)} m/s`}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              Aft Habitat Return Grate →
            </span>
          </div>

          {/* Grid Table */}
          <div className="grid grid-cols-12 gap-1.5 p-2 bg-obsidian-deep rounded border border-obsidian-border/80">
            {smokeGridRef.current.map((row, y) =>
              row.map((conc, x) => {
                const isFire = x === fireCell.x && y === fireCell.y;
                const detAlpha = detectors.find(d => d.id === 'det_alpha' && d.x === x && d.y === y);
                const detBeta = detectors.find(d => d.id === 'det_beta' && d.x === x && d.y === y);
                const detGamma = detectors.find(d => d.id === 'det_gamma' && d.x === x && d.y === y);
                const anyDet = detAlpha || detBeta || detGamma;

                // Color calculation based on smoke concentration
                // 0% -> deep obsidian
                // 20% -> hazy slate
                // 50% -> dark smoke amber
                // 80%+ -> dense dark smoke
                let cellBg = 'rgba(15, 23, 42, 0.4)';
                if (conc > 1) {
                  const alpha = Math.min(0.95, 0.2 + conc * 0.008);
                  cellBg = `rgba(${Math.min(240, 40 + conc * 2.0)}, ${Math.min(180, 30 + conc * 1.5)}, ${Math.min(180, 30 + conc * 1.2)}, ${alpha})`;
                }

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    style={{ backgroundColor: cellBg }}
                    className={`h-16 rounded border transition-all relative flex flex-col justify-between p-1 cursor-pointer select-none ${
                      isFire 
                        ? 'border-plasma-red shadow-lg shadow-plasma-red/30' 
                        : anyDet 
                        ? anyDet.alarmed ? 'border-plasma-red animate-pulse' : 'border-cryo-cyan' 
                        : 'border-white/5 hover:border-cryo-cyan/50'
                    }`}
                  >
                    {/* Top indicator: cell coords or detector badge */}
                    <div className="flex justify-between items-center text-[8px] font-mono leading-none">
                      <span className="text-slate-500">{x},{y}</span>
                      {detAlpha && (
                        <span className={`px-1 py-0.2 rounded font-bold ${detAlpha.alarmed ? 'bg-plasma-red text-white' : 'bg-cryo-cyan text-obsidian-deep'}`}>
                          α {detAlpha.alarmed ? 'ALARM' : ''}
                        </span>
                      )}
                      {detBeta && (
                        <span className={`px-1 py-0.2 rounded font-bold ${detBeta.alarmed ? 'bg-plasma-red text-white' : 'bg-cryo-cyan text-obsidian-deep'}`}>
                          β {detBeta.alarmed ? 'ALARM' : ''}
                        </span>
                      )}
                      {detGamma && (
                        <span className={`px-1 py-0.2 rounded font-bold ${detGamma.alarmed ? 'bg-plasma-red text-white' : 'bg-cryo-cyan text-obsidian-deep'}`}>
                          γ {detGamma.alarmed ? 'ALARM' : ''}
                        </span>
                      )}
                    </div>

                    {/* Center Icon */}
                    <div className="flex items-center justify-center">
                      {isFire && (
                        <Flame className="w-5 h-5 text-plasma-red animate-bounce" />
                      )}
                      {anyDet && !isFire && (
                        <Radio className={`w-3.5 h-3.5 ${anyDet.alarmed ? 'text-plasma-red animate-spin' : 'text-cryo-cyan'}`} />
                      )}
                    </div>

                    {/* Bottom readout: concentration % */}
                    <div className="text-[9px] font-mono-numbers text-right text-slate-300">
                      {conc > 0.1 ? `${conc.toFixed(0)}%` : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Advection Streamlines Hint */}
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Grid Resolution: Δx=0.5m, Δy=0.5m | Solved via Upwind Advection-Diffusion PDE</span>
            {isDischarging && (
              <span className="text-thermal-amber font-bold flex items-center gap-1 animate-pulse">
                <Droplet className="w-3.5 h-3.5" /> SUPPRESSANT ACTIVELY DISCHARGING ({suppressantActiveRemaining.toFixed(1)}s remaining)
              </span>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT PANEL (4 Cols): Detector Status, Time-to-Alarm & Suppressant Controls */}
      <div className="lg:col-span-4 flex flex-col gap-3 text-xs">
        
        {/* Detector Status & Time-to-Alarm HUD */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-border">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cryo-cyan" />
              Smoke Detection Telemetry
            </span>
            <span className="text-[10px] text-slate-400">Alarm Limit: 1.2–1.8 %/m</span>
          </div>

          <div className="space-y-2.5">
            {detectors.map(det => (
              <div 
                key={det.id}
                className={`p-2 rounded border text-[11px] ${
                  det.alarmed 
                    ? 'bg-plasma-red/15 border-plasma-red/60 text-white' 
                    : 'bg-obsidian-deep border-obsidian-border text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{det.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    det.alarmed ? 'bg-plasma-red text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {det.alarmed ? 'ALARM TRIGGERED' : 'CLEAR'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mb-1">
                  Sensor Type: {det.type} | Pos: [{det.x}, {det.y}]
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Obscuration: <strong className={det.alarmed ? 'text-plasma-red' : 'text-slate-200'}>{det.currentObscuration.toFixed(2)} %/m</strong></span>
                  <span>Threshold: {det.alarmThreshold.toFixed(1)} %/m</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1 border-t border-white/5 mt-1">
                  <span>Time-to-Alarm (T_detect):</span>
                  <span className="font-bold text-thermal-amber font-mono-numbers">
                    {det.alarmTimeSeconds !== null ? `${det.alarmTimeSeconds.toFixed(1)} s` : 'Pending (No Alarm)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suppressant Selection & Microgravity Warning System */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-border">
              <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-thermal-amber" />
                Suppressant Comparative Engine
              </span>
              <span className="text-[10px] text-slate-400">NASA Habitability</span>
            </div>

            {/* Suppressant Selector */}
            <div className="space-y-1.5 mb-3">
              {SUPPRESSANT_OPTIONS.map(sup => {
                const isSelected = selectedSuppressant === sup.id;
                return (
                  <button
                    key={sup.id}
                    onClick={() => setSelectedSuppressant(sup.id)}
                    className={`w-full text-left p-2 rounded border transition-colors ${
                      isSelected 
                        ? 'bg-thermal-amber/20 border-thermal-amber text-white font-semibold' 
                        : 'bg-obsidian-deep border-obsidian-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{sup.name}</span>
                      <span className="text-thermal-amber font-bold font-mono-numbers">
                        {(sup.extinctionEfficiency * 100).toFixed(0)}% Eff
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {sup.formula} • {sup.cleanAgent ? 'Clean Agent' : 'Particulate/Liquid'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Microgravity Specific Warning Card */}
            {currentSuppressantInfo && (
              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[10px] leading-relaxed mb-3">
                <div className="flex items-center gap-1 font-bold text-thermal-amber mb-1">
                  <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
                  MICROGRAVITY DISPERSION WARNING:
                </div>
                {currentSuppressantInfo.microgravityWarning}
                <div className="mt-1 text-slate-400">
                  <span className="text-slate-300 font-semibold">Mechanism:</span> {currentSuppressantInfo.mechanism}
                </div>
              </div>
            )}
          </div>

          {/* Suppressant Discharge Button */}
          <button
            onClick={handleDischargeSuppressant}
            disabled={isDischarging}
            className={`w-full py-2.5 px-3 rounded font-bold text-xs uppercase tracking-micro flex items-center justify-center gap-2 transition-all ${
              isDischarging
                ? 'bg-plasma-red text-white animate-pulse'
                : 'bg-thermal-amber hover:bg-thermal-orange text-obsidian-deep shadow-lg shadow-thermal-amber/20'
            }`}
          >
            <Zap className="w-4 h-4" />
            {isDischarging 
              ? `DISCHARGING SUPPRESSANT (${suppressantActiveRemaining.toFixed(0)}s)` 
              : `Discharge ${currentSuppressantInfo?.name || 'Suppressant'}`}
          </button>
        </div>

      </div>

    </div>
  );
};
