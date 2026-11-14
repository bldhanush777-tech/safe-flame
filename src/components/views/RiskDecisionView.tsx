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
    <div className="p-4 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
      
      {/* LEFT COLUMN: Risk HUD & Bayesian Credible Intervals (6 Cols) */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        
        {/* Risk Classification HUD Card */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="squircle-icon w-8 h-8 text-accent-glow">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm tracking-tight text-white">
                  Mission Safety Flight Classification
                </h3>
                <span className="text-[10px] text-slate-400">Quantitative NASA-STD-6001B Flammability Rating</span>
              </div>
            </div>
            <div className="bg-obsidian-elevated/70 px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-300">
              R_fire Score: <strong className="text-white font-mono-numbers font-bold">{physics.compositeRisk.toFixed(3)}</strong>
            </div>
          </div>

          {/* Hard Safety Lock Alert or Normal Risk Badge */}
          {physics.isSafetyLocked ? (
            <div className="p-4 rounded-2xl border border-plasma-red/50 bg-plasma-red/10 text-plasma-red mb-4 flex items-start gap-3 shadow-lg shadow-plasma-red/10">
              <div className="w-9 h-9 rounded-xl bg-plasma-red/20 border border-plasma-red/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 text-plasma-red animate-pulse" />
              </div>
              <div>
                <div className="font-heading font-bold text-xs uppercase tracking-wider">
                  INSUFFICIENT EVIDENCE (SAFETY LOCK ENGAGED)
                </div>
                <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Confidence Score C = <strong className="text-white font-mono-numbers">{(physics.confidenceScore * 100).toFixed(1)}%</strong> is below the required safety threshold (35.0%).
                  Flight clearance is locked out until empirical microgravity testing is completed.
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl border mb-4 flex items-center justify-between shadow-lg ${getRiskColor(physics.riskLevel)}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  {physics.riskLevel === 'LOW' && <CheckCircle2 className="w-5 h-5 text-telemetry-emerald" />}
                  {physics.riskLevel === 'CONDITIONAL' && <AlertTriangle className="w-5 h-5 text-telemetry-gold" />}
                  {physics.riskLevel === 'HIGH' && <AlertTriangle className="w-5 h-5 text-thermal-amber" />}
                  {physics.riskLevel === 'CRITICAL' && <ShieldAlert className="w-5 h-5 text-plasma-red animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-heading font-bold">
                    FLIGHT RISK RATING: {physics.riskLevel}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {physics.riskLevel === 'LOW' && 'Acceptable for uncontained spacecraft installation'}
                    {physics.riskLevel === 'CONDITIONAL' && 'Requires secondary containment or automatic suppression'}
                    {physics.riskLevel === 'HIGH' && 'Unacceptable hazard: High propagation likelihood'}
                    {physics.riskLevel === 'CRITICAL' && 'Immediate catastrophic propagation risk'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-heading font-black font-mono-numbers">
                  {(physics.compositeRisk * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* 90% Bayesian Credible Interval Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Metric 1: Flame Spread Rate */}
            <div className="bg-obsidian-deep/80 p-3 rounded-xl border border-obsidian-border/80 hover:border-thermal-amber/40 transition-colors">
              <div className="text-[10px] text-slate-400 font-medium">Opposed Spread (V_f)</div>
              <div className="text-thermal-amber font-heading font-bold text-base my-0.5 font-mono-numbers">
                {physics.flameSpreadRate.toFixed(3)} mm/s
              </div>
              <div className="text-[10px] text-slate-500 font-mono-numbers">
                90% CI: [{physics.ciLower90.toFixed(2)} - {physics.ciUpper90.toFixed(2)}]
              </div>
              <div className="w-full bg-obsidian-elevated h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-thermal-amber to-plasma-red h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (physics.flameSpreadRate / 2.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Effective LOC */}
            <div className="bg-obsidian-deep/80 p-3 rounded-xl border border-obsidian-border/80 hover:border-accent/40 transition-colors">
              <div className="text-[10px] text-slate-400 font-medium">Effective LOC</div>
              <div className="text-accent-glow font-heading font-bold text-base my-0.5 font-mono-numbers">
                {physics.effectiveLoc.toFixed(1)}% O₂
              </div>
              <div className={`text-[10px] font-semibold ${
                (atmosphere.oxygen * 100) < physics.effectiveLoc ? 'text-emerald-400' : 'text-plasma-red'
              }`}>
                {(atmosphere.oxygen * 100) < physics.effectiveLoc ? 'Sub-LOC Quenched' : 'Above LOC Combustible'}
              </div>
            </div>

            {/* Metric 3: Peak HRR */}
            <div className="bg-obsidian-deep/80 p-3 rounded-xl border border-obsidian-border/80 hover:border-orange-400/40 transition-colors">
              <div className="text-[10px] text-slate-400 font-medium">Peak HRR</div>
              <div className="text-orange-400 font-heading font-bold text-base my-0.5 font-mono-numbers">
                {physics.effectiveHrr} kW/m²
              </div>
              <div className="text-[10px] text-slate-400">
                Ignition Delay: <strong className="text-white font-mono-numbers">{physics.effectiveIgnitionDelay}s</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Comparative Curve Chart (1g vs Target Gravity across O2%) */}
        <div className="glass-panel p-5 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="squircle-icon w-8 h-8 text-accent">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                  Flame Spread Sensitivity: 1g vs Target Gravity
                </h4>
                <div className="text-[10px] text-slate-400">Continuous Bayesian scaling envelope across oxygen concentration</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] bg-obsidian-deep/80 px-3 py-1 rounded-full border border-white/10">
              <span className="flex items-center gap-1.5 text-accent-glow font-medium">
                <span className="w-2.5 h-1 rounded-full bg-accent" /> Target g
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <span className="w-2.5 h-1 rounded-full bg-slate-500" /> 1g Earth
              </span>
            </div>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curveData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="targetCiGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-color, #06B6D4)" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="var(--accent-color, #06B6D4)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis 
                  dataKey="oxygenPercent" 
                  stroke="#64748B" 
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={v => `${v}%`}
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={v => `${v}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface, #0D111A)', 
                    borderColor: 'var(--border-color, rgba(255,255,255,0.15))', 
                    fontSize: '11px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  }}
                  formatter={(val: any) => [`${val} mm/s`, '']}
                  labelFormatter={lbl => `Oxygen: ${lbl}% O2`}
                />
                <ReferenceLine 
                  x={Math.round(atmosphere.oxygen * 100)} 
                  stroke="#F97316" 
                  strokeDasharray="3 3"
                  label={{ value: 'CURRENT ATM', fill: '#F97316', fontSize: 9, position: 'top' }}
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
                  stroke="var(--accent-color, #06B6D4)" 
                  strokeWidth={2.5} 
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
          <div className="text-[10px] text-slate-400 text-center mt-2">
            Opposed flame spread rate (mm/s) across oxygen fraction X_O2. Shaded band denotes 90% Bayesian CI.
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: 5-Axis Confidence Breakdown & Engineering Mitigation Protocol (6 Cols) */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        
        {/* 5-Axis Evidence Confidence Breakdown */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-obsidian-border">
            <div className="flex items-center gap-2.5">
              <div className="squircle-icon w-8 h-8 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                  5-Axis Evidence Confidence Model
                </h4>
                <div className="text-[10px] text-slate-400">Bayesian multi-parameter empirical weighting</div>
              </div>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 font-bold font-mono-numbers text-xs shadow-sm">
              C = {(physics.confidenceScore * 100).toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-obsidian-deep/80 rounded-xl border border-obsidian-border/80 flex justify-between items-center hover:border-slate-600 transition-colors">
              <div>
                <span className="text-slate-300 font-medium">Data Quality (0.25 Q):</span>
                <div className="text-[10px] text-slate-500">Historical flight sensor integrity</div>
              </div>
              <span className="text-white font-mono-numbers font-bold text-sm">{(physics.scoreQ * 100).toFixed(0)}%</span>
            </div>

            <div className="p-3 bg-obsidian-deep/80 rounded-xl border border-obsidian-border/80 flex justify-between items-center hover:border-slate-600 transition-colors">
              <div>
                <span className="text-slate-300 font-medium">Repeatability (0.15 R):</span>
                <div className="text-[10px] text-slate-500">Sample size & burn consistency</div>
              </div>
              <span className="text-white font-mono-numbers font-bold text-sm">{(physics.scoreR * 100).toFixed(0)}%</span>
            </div>

            <div className="p-3 bg-obsidian-deep/80 rounded-xl border border-obsidian-border/80 flex justify-between items-center hover:border-accent/40 transition-colors">
              <div>
                <span className="text-slate-300 font-medium">Applicability (0.30 A):</span>
                <div className="text-[10px] text-slate-500">Mahalanobis similarity match</div>
              </div>
              <span className="text-accent-glow font-mono-numbers font-bold text-sm">{(physics.scoreA * 100).toFixed(0)}%</span>
            </div>

            <div className="p-3 bg-obsidian-deep/80 rounded-xl border border-obsidian-border/80 flex justify-between items-center hover:border-slate-600 transition-colors">
              <div>
                <span className="text-slate-300 font-medium">Domain Cov (0.20 C_cov):</span>
                <div className="text-[10px] text-slate-500">Tested pressure & oxygen hull</div>
              </div>
              <span className="text-white font-mono-numbers font-bold text-sm">{(physics.scoreCoverage * 100).toFixed(0)}%</span>
            </div>

            <div className="col-span-1 sm:col-span-2 p-3 bg-obsidian-deep/80 rounded-xl border border-obsidian-border/80 flex justify-between items-center hover:border-slate-600 transition-colors">
              <div>
                <span className="text-slate-300 font-medium">Test Facility Tier (0.10 T):</span>
                <div className="text-[10px] text-slate-500">Tier 1 (ISS FLARE / Cygnus Saffire) vs Tier 2 (Parabolic)</div>
              </div>
              <span className="text-white font-mono-numbers font-bold text-sm">{(physics.scoreT * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Dynamic Mitigation Protocol Checklist */}
        <div className="glass-panel p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <div className="squircle-icon w-8 h-8 text-thermal-amber">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                    Dynamic Engineering Mitigation Protocol
                  </h4>
                  <div className="text-[10px] text-slate-400">Flight-rule compliant procedural countermeasures</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-obsidian-deep px-2.5 py-1 rounded-full border border-white/10">
                NASA FLIGHT RULE
              </span>
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
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    checklist[item.id] 
                      ? 'bg-obsidian-elevated/70 text-slate-200 border border-white/10' 
                      : item.critical 
                      ? 'bg-plasma-red/10 border border-plasma-red/30 text-rose-300' 
                      : 'text-slate-400 hover:bg-obsidian-elevated/40 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.id] || false}
                    onChange={() => toggleCheck(item.id)}
                    className="mt-0.5 accent-thermal-amber w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-xs leading-snug select-none flex-1">
                    {item.label}
                    {item.critical && !checklist[item.id] && (
                      <span className="text-[10px] text-plasma-red font-bold ml-2 bg-plasma-red/20 px-1.5 py-0.5 rounded-full border border-plasma-red/40">[MANDATORY]</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-obsidian-border flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex-1 py-2.5 px-4 rounded-full bg-accent/20 border border-accent/60 text-accent-glow hover:bg-accent/30 transition-all flex items-center justify-center gap-2 font-semibold text-xs tracking-wide shadow-lg shadow-accent/15 btn-modern"
            >
              <FileText className="w-4 h-4" />
              Safety Decision Memo
            </button>
            <button
              onClick={downloadJsonReport}
              className="flex-1 py-2.5 px-4 rounded-full bg-obsidian-elevated border border-obsidian-border text-slate-300 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2 text-xs font-semibold btn-modern"
            >
              <Download className="w-4 h-4" />
              Export JSON Telemetry
            </button>
          </div>
        </div>

      </div>

      {/* Safety Decision Memo Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-panel max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <div className="squircle-icon w-8 h-8 text-accent">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-base tracking-tight text-white uppercase">
                  NASA Safety Review Board — Flight Decision Memo
                </h3>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 text-xs space-y-4 text-slate-300">
              <div className="p-4 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-500">Document ID:</span> <span className="font-mono text-white">SRB-SAFIR-2026-F982</span></div>
                <div><span className="text-slate-500">Date Generated:</span> {new Date().toUTCString()}</div>
                <div><span className="text-slate-500">Material Evaluated:</span> <strong className="text-white">{material.name}</strong></div>
                <div><span className="text-slate-500">Flight Regime:</span> <span className="text-accent-glow font-medium">{atmosphere.gravity === 0 ? 'Microgravity 0.0g' : `${atmosphere.gravity} m/s²`} | {atmosphere.pressurePsi} psi | {(atmosphere.oxygen * 100).toFixed(1)}% O2</span></div>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs uppercase text-slate-300 mb-2">1. EXECUTIVE SAFETY DETERMINATION</h4>
                <div className={`p-3 rounded-xl border text-xs font-semibold ${getRiskColor(physics.riskLevel)}`}>
                  CLASSIFICATION: {physics.riskLevel} (R_fire = {physics.compositeRisk.toFixed(3)})
                </div>
                <p className="mt-2 text-slate-400 text-xs leading-relaxed">
                  {physics.isSafetyLocked
                    ? 'SAFETY INHIBIT ENGAGED: In accordance with NASA SP-2016-6105, empirical confidence C is inadequate to certify this flight configuration. Additional drop tower or ISS SoFIE rack testing is legally mandated prior to mission authorization.'
                    : `Material flammability has been quantitatively certified against NASA-STD-6001B. Flame spread rate is modeled at ${physics.flameSpreadRate.toFixed(3)} mm/s with 90% confidence envelope [${physics.ciLower90.toFixed(3)} - ${physics.ciUpper90.toFixed(3)}] mm/s.`}
                </p>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs uppercase text-slate-300 mb-2">2. PHYSICS SCALING SUMMARY</h4>
                <div className="grid grid-cols-3 gap-2.5 bg-obsidian-deep/80 p-3 rounded-2xl border border-obsidian-border text-xs font-mono">
                  <div>G* Buoyancy: <strong className="text-white">{physics.gStar}</strong></div>
                  <div>Oxygen Index OI: <strong className="text-white">{physics.oxygenIndex}</strong></div>
                  <div>Effective u_eff: <strong className="text-white">{physics.uEff} m/s</strong></div>
                  <div>pO2 Partial: <strong className="text-white">{physics.pO2Psi} psi</strong></div>
                  <div>Limiting LOC: <strong className="text-white">{physics.effectiveLoc}%</strong></div>
                  <div>HRR Peak: <strong className="text-white">{physics.effectiveHrr} kW/m²</strong></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-obsidian-border flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-full bg-obsidian-elevated border border-obsidian-border text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold btn-modern"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
              <button
                onClick={downloadJsonReport}
                className="px-4 py-2 rounded-full bg-accent/20 border border-accent/60 text-accent-glow hover:bg-accent/30 flex items-center gap-2 text-xs font-semibold shadow-lg shadow-accent/20 btn-modern"
              >
                <Download className="w-4 h-4" />
                Download JSON File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
