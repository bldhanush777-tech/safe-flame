import React, { useState } from 'react';
import type { AtmosphereState, MaterialProperties, PhysicsOutputs } from '../../types/physics';
import { generateComparativeCurves } from '../../physics/engine';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Download, 
  TrendingUp,
  Sliders,
  Printer,
  X,
  Radio,
  Layers,
  ChevronRight
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
    <div className="p-4 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
      
      {/* LEFT COLUMN: Risk HUD & Bayesian Credible Intervals (6 Cols) */}
      <div className="lg:col-span-6 flex flex-col gap-3">
        
        {/* Risk Classification HUD Card */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 relative corner-bracket-container corner-bracket-amber">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-micro text-slate-400">
              MISSION SAFETY FLIGHT CLASSIFICATION
            </span>
            <span className="text-xs text-slate-400">
              R_fire Score: <strong className="text-white font-mono-numbers">{physics.compositeRisk.toFixed(3)}</strong>
            </span>
          </div>

          {/* Hard Safety Lock Alert or Normal Risk Badge */}
          {physics.isSafetyLocked ? (
            <div className="p-3.5 rounded border border-plasma-red/50 bg-plasma-red/10 text-plasma-red mb-3 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-plasma-red animate-pulse" />
              <div>
                <div className="font-bold text-xs uppercase tracking-micro">
                  INSUFFICIENT EVIDENCE (SAFETY LOCK ENGAGED)
                </div>
                <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Confidence Score C = {(physics.confidenceScore * 100).toFixed(1)}% is below the required safety threshold (35.0%).
                  Flight clearance is locked out until empirical microgravity testing is completed.
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-3.5 rounded border mb-3 flex items-center justify-between ${getRiskColor(physics.riskLevel)}`}>
              <div className="flex items-center gap-2.5">
                {physics.riskLevel === 'LOW' && <CheckCircle2 className="w-5 h-5 text-telemetry-emerald" />}
                {physics.riskLevel === 'CONDITIONAL' && <AlertTriangle className="w-5 h-5 text-telemetry-gold" />}
                {physics.riskLevel === 'HIGH' && <AlertTriangle className="w-5 h-5 text-thermal-amber" />}
                {physics.riskLevel === 'CRITICAL' && <ShieldAlert className="w-5 h-5 text-plasma-red" />}
                <div>
                  <div className="text-xs uppercase tracking-widest font-bold">
                    FLIGHT RISK RATING: {physics.riskLevel}
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {physics.riskLevel === 'LOW' && 'Acceptable for uncontained spacecraft installation'}
                    {physics.riskLevel === 'CONDITIONAL' && 'Requires secondary containment or automatic suppression'}
                    {physics.riskLevel === 'HIGH' && 'Unacceptable hazard: High propagation likelihood'}
                    {physics.riskLevel === 'CRITICAL' && 'Immediate catastrophic propagation risk'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono-numbers">
                  {(physics.compositeRisk * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* 90% Bayesian Credible Interval Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Metric 1: Flame Spread Rate */}
            <div className="bg-obsidian-deep p-2.5 rounded border border-obsidian-border">
              <div className="text-[10px] text-slate-400">Opposed Spread (V_f)</div>
              <div className="text-thermal-amber font-bold text-sm my-0.5 font-mono-numbers">
                {physics.flameSpreadRate.toFixed(3)} mm/s
              </div>
              <div className="text-[9px] text-slate-500 font-mono-numbers">
                90% CI: [{physics.ciLower90.toFixed(2)} - {physics.ciUpper90.toFixed(2)}]
              </div>
              <div className="w-full bg-obsidian-elevated h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-thermal-amber h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (physics.flameSpreadRate / 2.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Effective LOC */}
            <div className="bg-obsidian-deep p-2.5 rounded border border-obsidian-border">
              <div className="text-[10px] text-slate-400">Effective LOC</div>
              <div className="text-cryo-glow font-bold text-sm my-0.5 font-mono-numbers">
                {physics.effectiveLoc.toFixed(1)}% O₂
              </div>
              <div className={`text-[9px] font-semibold ${
                (atmosphere.oxygen * 100) < physics.effectiveLoc ? 'text-emerald-400' : 'text-plasma-red'
              }`}>
                {(atmosphere.oxygen * 100) < physics.effectiveLoc ? 'Sub-LOC Quenched' : 'Above LOC Combustible'}
              </div>
            </div>

            {/* Metric 3: Peak HRR */}
            <div className="bg-obsidian-deep p-2.5 rounded border border-obsidian-border">
              <div className="text-[10px] text-slate-400">Peak HRR</div>
              <div className="text-orange-400 font-bold text-sm my-0.5 font-mono-numbers">
                {physics.effectiveHrr} kW/m²
              </div>
              <div className="text-[9px] text-slate-500">
                Ignition Delay: {physics.effectiveIgnitionDelay}s
              </div>
            </div>
          </div>
        </div>

        {/* Comparative Curve Chart (1g vs Target Gravity across O2%) */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cryo-cyan" />
              Flame Spread Sensitivity: 1g vs Target Gravity
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-cryo-glow">
                <span className="w-2 h-0.5 bg-cryo-glow" /> Target g
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-0.5 bg-slate-500 stroke-dashed" /> 1g Earth
              </span>
            </div>
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curveData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="targetCiGrad2" x1="0" y1="0" x2="0" y2="1">
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
                  label={{ value: 'CURRENT ATM', fill: '#F97316', fontSize: 8, position: 'top' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ciUpperTargetG" 
                  stroke="none" 
                  fill="url(#targetCiGrad2)" 
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

      {/* RIGHT COLUMN: 5-Axis Confidence Breakdown & Engineering Mitigation Protocol (6 Cols) */}
      <div className="lg:col-span-6 flex flex-col gap-3">
        
        {/* 5-Axis Evidence Confidence Breakdown */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-obsidian-border">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              5-Axis Evidence Confidence Model
            </span>
            <span className="text-emerald-400 font-bold font-mono-numbers text-sm">
              C = {(physics.confidenceScore * 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="p-2 bg-obsidian-deep rounded border border-obsidian-border flex justify-between items-center">
              <div>
                <span className="text-slate-400">Data Quality (0.25 Q):</span>
                <div className="text-[9px] text-slate-500">Historical flight sensor integrity</div>
              </div>
              <span className="text-white font-mono-numbers font-bold">{(physics.scoreQ * 100).toFixed(0)}%</span>
            </div>

            <div className="p-2 bg-obsidian-deep rounded border border-obsidian-border flex justify-between items-center">
              <div>
                <span className="text-slate-400">Repeatability (0.15 R):</span>
                <div className="text-[9px] text-slate-500">Sample size & burn consistency</div>
              </div>
              <span className="text-white font-mono-numbers font-bold">{(physics.scoreR * 100).toFixed(0)}%</span>
            </div>

            <div className="p-2 bg-obsidian-deep rounded border border-obsidian-border flex justify-between items-center">
              <div>
                <span className="text-slate-400">Applicability (0.30 A):</span>
                <div className="text-[9px] text-slate-500">Mahalanobis similarity match</div>
              </div>
              <span className="text-cryo-glow font-mono-numbers font-bold">{(physics.scoreA * 100).toFixed(0)}%</span>
            </div>

            <div className="p-2 bg-obsidian-deep rounded border border-obsidian-border flex justify-between items-center">
              <div>
                <span className="text-slate-400">Domain Cov (0.20 C_cov):</span>
                <div className="text-[9px] text-slate-500">Tested pressure & oxygen hull</div>
              </div>
              <span className="text-white font-mono-numbers font-bold">{(physics.scoreCoverage * 100).toFixed(0)}%</span>
            </div>

            <div className="col-span-1 sm:col-span-2 p-2 bg-obsidian-deep rounded border border-obsidian-border flex justify-between items-center">
              <div>
                <span className="text-slate-400">Test Facility Tier (0.10 T):</span>
                <div className="text-[9px] text-slate-500">Tier 1 (ISS FLARE / Cygnus Saffire) vs Tier 2 (Parabolic)</div>
              </div>
              <span className="text-white font-mono-numbers font-bold">{(physics.scoreT * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Dynamic Mitigation Protocol Checklist */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 flex-1">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-obsidian-border">
            <span className="text-slate-300 font-semibold uppercase tracking-micro text-[11px] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-thermal-amber" />
              Dynamic Engineering Mitigation Protocol
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
                className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                  checklist[item.id] 
                    ? 'bg-obsidian-elevated text-slate-200' 
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
                <span className="text-[11px] leading-tight select-none flex-1">
                  {item.label}
                  {item.critical && !checklist[item.id] && (
                    <span className="text-[9px] text-plasma-red font-bold ml-1.5">[MANDATORY]</span>
                  )}
                </span>
              </label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-obsidian-border flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex-1 py-2 px-3 rounded bg-cryo-cyan/20 border border-cryo-cyan/50 text-cryo-glow hover:bg-cryo-cyan/30 transition-colors flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-micro"
            >
              <FileText className="w-3.5 h-3.5" />
              Safety Decision Memo
            </button>
            <button
              onClick={downloadJsonReport}
              className="flex-1 py-2 px-3 rounded bg-obsidian-elevated border border-obsidian-border text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON Telemetry
            </button>
          </div>
        </div>

      </div>

      {/* Safety Decision Memo Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-obsidian-surface border border-obsidian-border max-w-2xl w-full rounded p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cryo-cyan" />
                <h3 className="text-sm font-bold tracking-wide text-white uppercase">
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

            <div className="my-4 text-xs space-y-3 text-slate-300">
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
