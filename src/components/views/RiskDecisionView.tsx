import React, { useState } from 'react';
import { 
  AtmosphereState, 
  MaterialProperties, 
  PhysicsOutputs 
} from '../../types/physics';
import { FlameVisualizer } from '../canvas/FlameVisualizer';
import { generateComparativeCurves } from '../../physics/engine';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Download, 
  Info, 
  ArrowUpRight, 
  TrendingUp,
  Cpu,
  Flame,
  Gauge,
  Sliders,
  Printer,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine, 
  Area, 
  AreaChart 
} from 'recharts';

interface RiskDecisionViewProps {
  atmosphere: AtmosphereState;
  material: MaterialProperties;
  physics: PhysicsOutputs;
}

export const RiskDecisionView: React.FC<RiskDecisionViewProps> = ({
  atmosphere,
  material,
  physics,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    step1: true,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
  });

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const curveData = generateComparativeCurves(atmosphere, material);

  // Status color helpers
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-telemetry-emerald border-telemetry-emerald/40 bg-telemetry-emerald/10';
      case 'CONDITIONAL':
        return 'text-telemetry-gold border-telemetry-gold/40 bg-telemetry-gold/10';
      case 'HIGH':
        return 'text-thermal-amber border-thermal-amber/40 bg-thermal-amber/10';
      case 'CRITICAL':
        return 'text-plasma-red border-plasma-red/50 bg-plasma-red/15 animate-pulse';
      default:
        return 'text-rose-400 border-rose-500/50 bg-rose-950/40';
    }
  };

  const downloadJsonReport = () => {
    const reportData = {
      platform: 'SAFIR PyroGrav Spacecraft Fire Risk Platform',
      timestampUtc: new Date().toISOString(),
      evaluationAtmosphere: atmosphere,
      material: material,
      physicsCalculations: physics,
      checklistVerification: checklist,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAFIR_SAFETY_REPORT_${material.id.toUpperCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] mx-auto">
      
      {/* LEFT PANEL: 60FPS Microgravity Flame Morphology Visualizer (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        <FlameVisualizer 
          atmosphere={atmosphere} 
          material={material} 
          physics={physics} 
        />

        {/* Tactical Material & Thermophysical Footprint */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-border">
            <span className="text-slate-300 font-semibold tracking-micro uppercase flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cryo-cyan" />
              Thermophysical Material Properties
            </span>
            <span className="text-[10px] text-slate-500">{material.standardTestRef.split('/')[0]}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">Chemical: </span>
              <span className="text-slate-300">{material.chemicalName}</span>
            </div>
            <div>
              <span className="text-slate-500">Spread Coeff (C_mat): </span>
              <span className="text-cryo-glow font-bold">{material.cMat} mm/s</span>
            </div>
            <div>
              <span className="text-slate-500">Velocity Exponent (n): </span>
              <span className="text-slate-300 font-bold">{material.velocityExponent}</span>
            </div>
            <div>
              <span className="text-slate-500">Thermal Conduct (k): </span>
              <span className="text-slate-300">{material.thermalConductivity} W/(m·K)</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-obsidian-border/50 text-[10px] text-slate-400">
              <span className="text-slate-500">Spaceflight Application: </span>
              {material.application}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Risk Classification HUD, 90% Bayesian CI & Comparative Curve (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        
        {/* Risk Classification HUD Card */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 relative corner-bracket-container corner-bracket-amber">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono tracking-micro text-slate-400">
              SAFETY STATUS CLASSIFICATION
            </span>
            <span className="text-xs font-mono text-slate-400">
              R_fire Score: <strong className="text-white font-mono-numbers">{physics.compositeRisk.toFixed(3)}</strong>
            </span>
          </div>

          {/* Hard Safety Lock Alert or Normal Risk Badge */}
          {physics.isSafetyLocked ? (
            <div className="p-3 rounded border border-plasma-red/50 bg-plasma-red/10 text-plasma-red mb-3 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-plasma-red animate-pulse" />
              <div>
                <div className="font-bold text-xs uppercase tracking-micro">
                  INSUFFICIENT EVIDENCE (SAFETY LOCK ENGAGED)
                </div>
                <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Confidence Score C = {(physics.confidenceScore * 100).toFixed(1)}% is below certified safety threshold (35.0%).
                  Low/Safe certification is strictly inhibited until microgravity test evidence is validated.
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-3 rounded border mb-3 flex items-center justify-between ${getRiskColor(physics.riskLevel)}`}>
              <div className="flex items-center gap-2">
                {physics.riskLevel === 'LOW' && <CheckCircle2 className="w-5 h-5 text-telemetry-emerald" />}
                {physics.riskLevel === 'CONDITIONAL' && <AlertTriangle className="w-5 h-5 text-telemetry-gold" />}
                {physics.riskLevel === 'HIGH' && <AlertTriangle className="w-5 h-5 text-thermal-amber" />}
                {physics.riskLevel === 'CRITICAL' && <ShieldAlert className="w-5 h-5 text-plasma-red" />}
                <div>
                  <div className="text-xs uppercase tracking-widest font-mono font-bold">
                    FLIGHT RISK: {physics.riskLevel}
                  </div>
                  <div className="text-[10px] opacity-80 font-mono">
                    {physics.riskLevel === 'LOW' && 'Acceptable for uncontained flight application'}
                    {physics.riskLevel === 'CONDITIONAL' && 'Requires secondary containment or suppression'}
                    {physics.riskLevel === 'HIGH' && 'Unacceptable hazard: High propagation likelihood'}
                    {physics.riskLevel === 'CRITICAL' && 'Immediate catastrophic propagation risk'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono-numbers">
                  {(physics.compositeRisk * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* 90% Bayesian Credible Interval Bars for Key Parameters */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[10px] font-mono uppercase tracking-micro text-slate-400 flex items-center justify-between">
              <span>90% Bayesian Credible Estimates</span>
              <span className="text-slate-500">Uncertainty Exp: x{(1 + 1.4 * (1 - physics.confidenceScore)).toFixed(2)}</span>
            </div>

            {/* Metric 1: Flame Spread Rate (V_f) */}
            <div className="bg-obsidian-deep/80 p-2 rounded border border-obsidian-border text-xs font-mono">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-300">Opposed Spread (V_f):</span>
                <span className="font-bold text-thermal-amber font-mono-numbers">
                  {physics.flameSpreadRate.toFixed(3)} mm/s
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>90% CI Bounds:</span>
                <span className="text-slate-300 font-mono-numbers">
                  [{physics.ciLower90.toFixed(3)} — {physics.ciUpper90.toFixed(3)}] mm/s
                </span>
              </div>
              <div className="w-full bg-obsidian-elevated h-1.5 rounded-full mt-1.5 overflow-hidden relative">
                <div 
                  className="bg-thermal-amber h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (physics.flameSpreadRate / 2.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Limiting Oxygen Concentration (LOC) */}
            <div className="bg-obsidian-deep/80 p-2 rounded border border-obsidian-border text-xs font-mono">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-300">Effective LOC:</span>
                <span className="font-bold text-cryo-glow font-mono-numbers">
                  {physics.effectiveLoc.toFixed(1)} % O2
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Current Cabin X_O2:</span>
                <span className={`font-mono-numbers font-semibold ${
                  (atmosphere.oxygen * 100) < physics.effectiveLoc ? 'text-emerald-400' : 'text-plasma-red'
                }`}>
                  {(atmosphere.oxygen * 100).toFixed(1)} % ({
                    (atmosphere.oxygen * 100) < physics.effectiveLoc ? 'Sub-LOC Quenched' : 'Above LOC Combustible'
                  })
                </span>
              </div>
            </div>

            {/* Metric 3: Heat Release Rate (HRR) */}
            <div className="bg-obsidian-deep/80 p-2 rounded border border-obsidian-border text-xs font-mono">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-300">Peak Heat Release (HRR):</span>
                <span className="font-bold text-orange-400 font-mono-numbers">
                  {physics.effectiveHrr} kW/m²
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Ignition Delay (t_ign):</span>
                <span className="text-slate-300 font-mono-numbers">{physics.effectiveIgnitionDelay} s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparative Curve Chart (1g vs Target Gravity across O2%) */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3 text-xs font-mono flex-1 min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cryo-cyan" />
              Spread vs Oxygen: 1g vs Target Gravity
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-cryo-glow">
                <span className="w-2 h-0.5 bg-cryo-glow" /> Target g
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-0.5 bg-slate-500 stroke-dashed" /> 1g Lab
              </span>
            </div>
          </div>

          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curveData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="targetCiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="oxygenPercent" 
                  stroke="#64748B" 
                  tick={{ fontSize: 9, fill: '#64748B' }}
                  tickFormatter={v => `${v}%`}
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{ fontSize: 9, fill: '#64748B' }}
                  tickFormatter={v => `${v}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0B0F17', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                  }}
                  formatter={(val: any) => [`${val} mm/s`, '']}
                  labelFormatter={lbl => `Oxygen: ${lbl}% O2`}
                />
                <ReferenceLine 
                  x={Math.round(atmosphere.oxygen * 100)} 
                  stroke="#F97316" 
                  strokeDasharray="2 2"
                  label={{ value: 'CURRENT', fill: '#F97316', fontSize: 8, position: 'top' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ciUpperTargetG" 
                  stroke="none" 
                  fill="url(#targetCiGrad)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="spreadRateTargetG" 
                  stroke="#06B6D4" 
                  strokeWidth={2} 
                  dot={false}
                  name="Target Gravity"
                />
                <Line 
                  type="monotone" 
                  dataKey="spreadRate1G" 
                  stroke="#64748B" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4" 
                  dot={false}
                  name="1g Earth WSTF"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-500 text-center mt-1">
            Opposed flame spread rate (mm/s) across oxygen fraction X_O2. Shaded band denotes 90% Bayesian CI.
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: 5-Axis Confidence Breakdown, Mitigation Protocol & Export (3 Cols) */}
      <div className="lg:col-span-3 flex flex-col gap-3">
        
        {/* 5-Axis Evidence Confidence Breakdown */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-border">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              5-Axis Confidence Model
            </span>
            <span className="text-emerald-400 font-bold font-mono-numbers">
              C = {(physics.confidenceScore * 100).toFixed(1)}%
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {/* Q */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Data Quality (0.25 Q):</span>
              <span className="text-slate-200 font-mono-numbers font-semibold">{(physics.scoreQ * 100).toFixed(0)}%</span>
            </div>
            {/* R */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Repeatability (0.15 R):</span>
              <span className="text-slate-200 font-mono-numbers font-semibold">{(physics.scoreR * 100).toFixed(0)}%</span>
            </div>
            {/* A */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Applicability (0.30 A):</span>
              <span className="text-cryo-glow font-mono-numbers font-semibold">{(physics.scoreA * 100).toFixed(0)}%</span>
            </div>
            {/* Coverage */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Domain Cov (0.20 C_cov):</span>
              <span className="text-slate-200 font-mono-numbers font-semibold">{(physics.scoreCoverage * 100).toFixed(0)}%</span>
            </div>
            {/* T */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Facility Tier (0.10 T):</span>
              <span className="text-slate-200 font-mono-numbers font-semibold">{(physics.scoreT * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-obsidian-border/50 text-[10px] text-slate-500 leading-tight">
            Formula: C = 0.25Q + 0.15R + 0.30A + 0.20C_cov + 0.10T. Safety lock active when C &lt; 0.35.
          </div>
        </div>

        {/* Dynamic Engineering Mitigation Protocol Checklist */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3 text-xs font-mono flex-1">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-border">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-thermal-amber" />
              Dynamic Mitigation Protocol
            </span>
            <span className="text-[10px] text-slate-400">NASA Flight Rule</span>
          </div>

          <div className="space-y-2">
            {[
              { id: 'step1', label: '1. Isolate Branch Power / Avionics Bus', critical: true },
              { id: 'step2', label: '2. Inhibit Cabin Ventilation (< 0.05 m/s)', critical: atmosphere.ventilation > 0.10 },
              { id: 'step3', label: '3. Depress Cabin to Safe LOC Threshold', critical: (atmosphere.oxygen * 100) > physics.effectiveLoc },
              { id: 'step4', label: '4. Arm Clean-Agent Flooding System', critical: physics.compositeRisk > 0.50 },
              { id: 'step5', label: '5. Don Crew OBA Respiratory Packs', critical: true },
            ].map(item => (
              <label 
                key={item.id} 
                className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                  checklist[item.id] 
                    ? 'bg-obsidian-elevated text-slate-300' 
                    : item.critical 
                    ? 'bg-plasma-red/10 border border-plasma-red/30 text-rose-300' 
                    : 'text-slate-400 hover:bg-obsidian-elevated/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist[item.id] || false}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-0.5 accent-thermal-amber rounded"
                />
                <span className="text-[11px] leading-tight select-none">
                  {item.label}
                  {item.critical && !checklist[item.id] && (
                    <span className="text-[9px] text-plasma-red font-bold ml-1.5">[MANDATORY]</span>
                  )}
                </span>
              </label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-obsidian-border flex flex-col gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full py-2 px-3 rounded bg-cryo-cyan/20 border border-cryo-cyan/50 text-cryo-glow hover:bg-cryo-cyan/30 transition-colors flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-micro"
            >
              <FileText className="w-3.5 h-3.5" />
              Safety Decision Report
            </button>
            <button
              onClick={downloadJsonReport}
              className="w-full py-1.5 px-3 rounded bg-obsidian-elevated border border-obsidian-border text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON Flight Telemetry
            </button>
          </div>
        </div>

      </div>

      {/* Safety Decision Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-obsidian-surface border border-obsidian-border max-w-2xl w-full rounded p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cryo-cyan" />
                <h3 className="text-sm font-bold tracking-wide text-white font-mono uppercase">
                  NASA Safety Review Board — Flight Decision Memo
                </h3>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-xs font-mono space-y-3 text-slate-300">
              <div className="p-3 bg-obsidian-deep rounded border border-obsidian-border grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500">Document ID:</span> SRB-SAFIR-2026-F982</div>
                <div><span className="text-slate-500">Date Generated:</span> {new Date().toUTCString()}</div>
                <div><span className="text-slate-500">Material Evaluated:</span> <strong className="text-white">{material.name}</strong></div>
                <div><span className="text-slate-500">Flight Regime:</span> {atmosphere.gravity === 0 ? 'Microgravity 0.0g' : `${atmosphere.gravity} m/s²`} | {atmosphere.pressurePsi} psi | {(atmosphere.oxygen * 100).toFixed(1)}% O2</div>
              </div>

              <div>
                <h4 className="text-white font-bold text-xs mb-1">1. EXECUTIVE SAFETY DETERMINATION</h4>
                <div className={`p-2.5 rounded border text-xs font-semibold ${getRiskColor(physics.riskLevel)}`}>
                  CLASSIFICATION: {physics.riskLevel} (R_fire = {physics.compositeRisk.toFixed(3)})
                </div>
                <p className="mt-1.5 text-slate-400 text-[11px] leading-relaxed">
                  {physics.isSafetyLocked
                    ? 'SAFETY INHIBIT ENGAGED: In accordance with NASA SP-2016-6105, empirical confidence C is inadequate to certify this flight configuration. Additional drop tower or ISS SoFIE rack testing is legally mandated prior to mission authorization.'
                    : `Material flammability has been quantitatively certified against NASA-STD-6001B. Flame spread rate is modeled at ${physics.flameSpreadRate.toFixed(3)} mm/s with 90% confidence envelope [${physics.ciLower90.toFixed(3)} - ${physics.ciUpper90.toFixed(3)}] mm/s.`}
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold text-xs mb-1">2. PHYSICS SCALING SUMMARY</h4>
                <div className="grid grid-cols-3 gap-2 bg-obsidian-deep p-2.5 rounded border border-obsidian-border text-[11px]">
                  <div>G* Buoyancy: <strong className="text-white">{physics.gStar}</strong></div>
                  <div>Oxygen Index OI: <strong className="text-white">{physics.oxygenIndex}</strong></div>
                  <div>Effective u_eff: <strong className="text-white">{physics.uEff} m/s</strong></div>
                  <div>pO2 Partial: <strong className="text-white">{physics.pO2Psi} psi</strong></div>
                  <div>Limiting LOC: <strong className="text-white">{physics.effectiveLoc}%</strong></div>
                  <div>HRR Peak: <strong className="text-white">{physics.effectiveHrr} kW/m²</strong></div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold text-xs mb-1">3. ACTION CHECKLIST VERIFICATION</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li>Power Isolation: {checklist.step1 ? 'VERIFIED (Armed)' : 'PENDING'}</li>
                  <li>Ventilation Inhibit (&lt;0.05 m/s): {checklist.step2 ? 'CONFIRMED' : 'OPEN'}</li>
                  <li>Cabin Depress to Safe LOC: {checklist.step3 ? 'EXECUTED' : 'STANDBY'}</li>
                  <li>Clean-Agent Suppressant: {checklist.step4 ? 'ARMED' : 'DISARMED'}</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-obsidian-border flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded bg-obsidian-elevated border border-obsidian-border text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-mono"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={downloadJsonReport}
                className="px-3 py-1.5 rounded bg-cryo-cyan/20 border border-cryo-cyan text-cryo-glow hover:bg-cryo-cyan/30 flex items-center gap-1.5 text-xs font-mono font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
