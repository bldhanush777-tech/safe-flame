import React, { useState, useEffect, useRef } from 'react';
import type { 
  AtmosphereState, 
  MaterialProperties, 
  PhysicsOutputs, 
  SmokeDetector, 
  SuppressantType 
} from '../../types/physics';
import { SUPPRESSANT_OPTIONS } from '../../data/materials';
import { playAlarmBeep, playSuppressantDischargeSound } from '../../utils/audio';
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
  Clock, 
  BellRing,
  Activity,
  Layers,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [simTime, setSimTime] = useState(0); // 0 to 120 seconds
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

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
      alarmThreshold: 1.5,
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

  // Detector time-history for telemetry graph
  const [telemetryHistory, setTelemetryHistory] = useState<Array<{
    time: number;
    detAlpha: number;
    detBeta: number;
    detGamma: number;
  }>>([{ time: 0, detAlpha: 0, detBeta: 0, detGamma: 0 }]);

  // Suppressant System
  const [selectedSuppressant, setSelectedSuppressant] = useState<SuppressantType>('water_mist');
  const [isDischarging, setIsDischarging] = useState(false);
  const [suppressantActiveRemaining, setSuppressantActiveRemaining] = useState(0);

  // 2D Concentration Matrix: C_s[y][x] (0 to 100%)
  const smokeGridRef = useRef<number[][]>(
    Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0))
  );
  const [, setRenderTrigger] = useState(0);

  // Velocity parameters
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
    setTelemetryHistory([{ time: 0, detAlpha: 0, detBeta: 0, detGamma: 0 }]);
    setRenderTrigger(c => c + 1);
  };

  // Re-simulate from t=0 to targetTime for deterministic scrubbing & telemetry chart
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

    const history: Array<{ time: number; detAlpha: number; detBeta: number; detGamma: number }> = [];

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

      // Update detector alarms
      let anyJustAlarmed = false;
      localDetectors = localDetectors.map(det => {
        const localConcentration = currentGrid[det.y][det.x];
        const currentObs = Number((localConcentration * 0.08).toFixed(2));
        const justAlarmed = !det.alarmed && currentObs >= det.alarmThreshold;
        if (justAlarmed) anyJustAlarmed = true;

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

      if (anyJustAlarmed && soundEnabled) {
        playAlarmBeep(true);
      }

      // Record point for graph every 2 seconds
      if (Math.round(t * 10) % 20 === 0) {
        history.push({
          time: Number(t.toFixed(1)),
          detAlpha: localDetectors[0]?.currentObscuration || 0,
          detBeta: localDetectors[1]?.currentObscuration || 0,
          detGamma: localDetectors[2]?.currentObscuration || 0,
        });
      }
    }

    smokeGridRef.current = currentGrid;
    setDetectors(localDetectors);
    setTelemetryHistory(history);
    setRenderTrigger(c => c + 1);
  };

  // Step simulation forward by dt
  const stepSimulation = (dt: number) => {
    const grid = smokeGridRef.current;
    const nextGrid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));

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

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const C = grid[y][x];

        const C_left = x > 0 ? grid[y][x - 1] : C;
        const C_right = x < GRID_COLS - 1 ? grid[y][x + 1] : C;
        const C_up = y > 0 ? grid[y - 1][x] : C;
        const C_down = y < GRID_ROWS - 1 ? grid[y + 1][x] : C;

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

    smokeGridRef.current = nextGrid;

    // Check alarms
    let anyAlarmTriggered = false;
    setDetectors(prevDetectors =>
      prevDetectors.map(det => {
        const localConcentration = nextGrid[det.y][det.x];
        const currentObs = Number((localConcentration * 0.08).toFixed(2));
        const justAlarmed = !det.alarmed && currentObs >= det.alarmThreshold;
        if (justAlarmed) anyAlarmTriggered = true;

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

    if (anyAlarmTriggered && soundEnabled) {
      playAlarmBeep(true);
    }

    // Append to graph history
    setTelemetryHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.time - simTime) < 1.0) return prev;
      return [
        ...prev.slice(-40),
        {
          time: Number(simTime.toFixed(1)),
          detAlpha: Number((nextGrid[detectors[0].y][detectors[0].x] * 0.08).toFixed(2)),
          detBeta: Number((nextGrid[detectors[1].y][detectors[1].x] * 0.08).toFixed(2)),
          detGamma: Number((nextGrid[detectors[2].y][detectors[2].x] * 0.08).toFixed(2)),
        }
      ];
    });

    setRenderTrigger(c => c + 1);
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
  }, [isPlaying, simSpeed, isDischarging, fireCell, selectedSuppressant, atmosphere, material, soundEnabled]);

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
    if (soundEnabled) {
      playSuppressantDischargeSound(true);
    }
    if (!isPlaying) setIsPlaying(true);
  };

  const currentSuppressantInfo = SUPPRESSANT_OPTIONS.find(s => s.id === selectedSuppressant);
  const anyDetectorAlarmed = detectors.some(d => d.alarmed);

  return (
    <div className="p-4 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
      
      {/* LEFT & CENTER (8 Cols): 2D Finite-Difference Habitat Cabin Grid & Transient Chart */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        
        {/* Controls Toolbar */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cryo-cyan" />
            <span className="font-semibold text-white uppercase tracking-micro text-[11px]">
              Habitat Smoke Transport & Suppression Solver
            </span>
            {anyDetectorAlarmed && (
              <span className="flex items-center gap-1 text-plasma-red bg-plasma-red/20 border border-plasma-red/40 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                <BellRing className="w-3 h-3" />
                CABIN ALARM ACTIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded bg-obsidian-deep border border-obsidian-border text-slate-400 hover:text-white"
              title={soundEnabled ? 'Mute Alarm Audio' : 'Enable Alarm Audio'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cryo-glow" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-colors ${
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
              className="p-1.5 rounded bg-obsidian-deep hover:bg-obsidian-elevated text-slate-400 hover:text-white border border-obsidian-border"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 bg-obsidian-deep px-1.5 py-1 rounded border border-obsidian-border text-[10px]">
              {([1, 2, 4] as const).map(sp => (
                <button
                  key={sp}
                  onClick={() => setSimSpeed(sp)}
                  className={`px-1.5 py-0.2 rounded ${simSpeed === sp ? 'text-cryo-glow font-bold bg-cryo-cyan/20' : 'text-slate-500'}`}
                >
                  {sp}x
                </button>
              ))}
            </div>

            <div className="text-right min-w-[75px]">
              <span className="text-[10px] text-slate-400">T = </span>
              <span className="font-bold text-white text-xs font-mono-numbers">{simTime.toFixed(1)}s</span>
              <span className="text-[9px] text-slate-500"> / 120s</span>
            </div>
          </div>
        </div>

        {/* Time Slider Scrubber */}
        <div className="bg-obsidian-deep px-4 py-2 border border-obsidian-border rounded-sm flex items-center gap-3 text-xs">
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
          <span className="text-[10px] text-slate-400">Deterministic Time Scrubber</span>
        </div>

        {/* Placement Selector Buttons */}
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
            Set Fire Source [{fireCell.x}, {fireCell.y}]
          </button>

          <button
            onClick={() => setActivePlacementTool(activePlacementTool === 'DET_ALPHA' ? 'NONE' : 'DET_ALPHA')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] border ${
              activePlacementTool === 'DET_ALPHA' 
                ? 'bg-cryo-cyan/20 text-cryo-glow border-cryo-cyan' 
                : 'bg-obsidian-surface border-obsidian-border text-slate-300'
            }`}
          >
            Move Det α (Ceiling)
          </button>

          <button
            onClick={() => setActivePlacementTool(activePlacementTool === 'DET_BETA' ? 'NONE' : 'DET_BETA')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] border ${
              activePlacementTool === 'DET_BETA' 
                ? 'bg-cryo-cyan/20 text-cryo-glow border-cryo-cyan' 
                : 'bg-obsidian-surface border-obsidian-border text-slate-300'
            }`}
          >
            Move Det β (Central)
          </button>

          <button
            onClick={() => setActivePlacementTool(activePlacementTool === 'DET_GAMMA' ? 'NONE' : 'DET_GAMMA')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] border ${
              activePlacementTool === 'DET_GAMMA' 
                ? 'bg-cryo-cyan/20 text-cryo-glow border-cryo-cyan' 
                : 'bg-obsidian-surface border-obsidian-border text-slate-300'
            }`}
          >
            Move Det γ (Exhaust)
          </button>

          {activePlacementTool !== 'NONE' && (
            <span className="text-[10px] text-thermal-amber animate-pulse font-semibold ml-2">
              Click any cell in the habitat grid below to place!
            </span>
          )}
        </div>

        {/* 2D Habitat Grid Visualizer */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 relative overflow-hidden">
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

                    <div className="flex items-center justify-center">
                      {isFire && (
                        <Flame className="w-5 h-5 text-plasma-red animate-bounce" />
                      )}
                      {anyDet && !isFire && (
                        <Radio className={`w-3.5 h-3.5 ${anyDet.alarmed ? 'text-plasma-red animate-spin' : 'text-cryo-cyan'}`} />
                      )}
                    </div>

                    <div className="text-[9px] font-mono-numbers text-right text-slate-300">
                      {conc > 0.1 ? `${conc.toFixed(0)}%` : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Grid Resolution: Δx=0.5m, Δy=0.5m | Solved via Upwind Advection-Diffusion PDE</span>
            {isDischarging && (
              <span className="text-thermal-amber font-bold flex items-center gap-1 animate-pulse">
                <Droplet className="w-3.5 h-3.5" /> SUPPRESSANT DISCHARGING ({suppressantActiveRemaining.toFixed(1)}s)
              </span>
            )}
          </div>
        </div>

        {/* Real-time Obscuration Transient Telemetry Chart */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cryo-cyan" />
              Transient Smoke Obscuration Curve (% / m)
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-sky-400">Det α (Ceiling)</span>
              <span className="text-emerald-400">Det β (Aisle)</span>
              <span className="text-purple-400">Det γ (Exhaust)</span>
              <span className="text-plasma-red font-bold">1.5% Threshold</span>
            </div>
          </div>

          <div className="w-full h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 9, fill: '#64748B' }} tickFormatter={v => `${v}s`} />
                <YAxis stroke="#64748B" tick={{ fontSize: 9, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F17', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                  formatter={(val: any) => [`${val} %/m`, '']}
                  labelFormatter={lbl => `T = ${lbl}s`}
                />
                <ReferenceLine y={1.5} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'ALARM', fill: '#EF4444', fontSize: 8 }} />
                <Line type="monotone" dataKey="detAlpha" stroke="#38BDF8" strokeWidth={1.5} dot={false} name="Det Alpha" />
                <Line type="monotone" dataKey="detBeta" stroke="#10B981" strokeWidth={1.5} dot={false} name="Det Beta" />
                <Line type="monotone" dataKey="detGamma" stroke="#C084FC" strokeWidth={1.5} dot={false} name="Det Gamma" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN (4 Cols): Detector Status, Time-to-Alarm & Suppressant Controls */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        
        {/* Detector Status & Time-to-Alarm HUD */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-obsidian-border">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cryo-cyan" />
              Sensor Detection Readouts
            </span>
            <span className="text-[10px] text-slate-400">Alarm Limit: 1.2–1.8 %/m</span>
          </div>

          <div className="space-y-2.5">
            {detectors.map(det => (
              <div 
                key={det.id}
                className={`p-2.5 rounded border text-[11px] ${
                  det.alarmed 
                    ? 'bg-plasma-red/15 border-plasma-red/60 text-white shadow-sm shadow-plasma-red/20' 
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
                  Sensor: {det.type} | Pos: [{det.x}, {det.y}]
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Obscuration: <strong className={det.alarmed ? 'text-plasma-red' : 'text-slate-200'}>{det.currentObscuration.toFixed(2)} %/m</strong></span>
                  <span>Threshold: {det.alarmThreshold.toFixed(1)} %/m</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1.5 border-t border-white/5 mt-1.5">
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
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-obsidian-border">
              <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-thermal-amber" />
                Suppressant Comparative Engine
              </span>
              <span className="text-[10px] text-slate-400">NASA Habitability</span>
            </div>

            <div className="space-y-2 mb-3">
              {SUPPRESSANT_OPTIONS.map(sup => {
                const isSelected = selectedSuppressant === sup.id;
                return (
                  <button
                    key={sup.id}
                    onClick={() => setSelectedSuppressant(sup.id)}
                    className={`w-full text-left p-2.5 rounded border transition-colors ${
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

            {currentSuppressantInfo && (
              <div className="p-3 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[10.5px] leading-relaxed mb-3">
                <div className="flex items-center gap-1 font-bold text-thermal-amber mb-1">
                  <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
                  MICROGRAVITY DISPERSION WARNING:
                </div>
                {currentSuppressantInfo.microgravityWarning}
                <div className="mt-1 text-slate-400 text-[10px]">
                  <span className="text-slate-300 font-semibold">Mechanism:</span> {currentSuppressantInfo.mechanism}
                </div>
              </div>
            )}
          </div>

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
