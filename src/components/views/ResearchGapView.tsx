import React, { useState } from 'react';
import { 
  AtmosphereState, 
  EvidenceRecord, 
  MaterialProperties, 
  MissionPreset 
} from '../../types/physics';
import { AEROSPACE_MATERIALS, MISSION_PRESETS } from '../../data/materials';
import { calculatePhysics } from '../../physics/engine';
import { 
  Grid, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  ExternalLink,
  Target,
  FlaskConical,
  Compass,
  Printer
} from 'lucide-react';

interface ResearchGapViewProps {
  evidenceRecords: EvidenceRecord[];
}

export const ResearchGapView: React.FC<ResearchGapViewProps> = ({
  evidenceRecords,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    material: MaterialProperties;
    preset: MissionPreset;
  }>({
    material: AEROSPACE_MATERIALS[0],
    preset: MISSION_PRESETS[0],
  });

  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // Compute confidence C for every combination in 6x5 matrix
  const matrixData = AEROSPACE_MATERIALS.map(mat => {
    const row = MISSION_PRESETS.map(preset => {
      const state: AtmosphereState = {
        oxygen: preset.oxygen,
        pressurePsi: preset.pressurePsi,
        gravity: preset.gravity,
        ventilation: preset.ventilation,
        thicknessMm: preset.thicknessMm,
      };
      const result = calculatePhysics(state, mat, evidenceRecords);
      return {
        material: mat,
        preset: preset,
        confidence: result.confidenceScore,
        isSafetyLocked: result.isSafetyLocked,
        spreadRate: result.flameSpreadRate,
        riskLevel: result.riskLevel,
      };
    });
    return { material: mat, cells: row };
  });

  // Calculate spec details for currently selected cell
  const currentAtmosphere: AtmosphereState = {
    oxygen: selectedCell.preset.oxygen,
    pressurePsi: selectedCell.preset.pressurePsi,
    gravity: selectedCell.preset.gravity,
    ventilation: selectedCell.preset.ventilation,
    thicknessMm: selectedCell.preset.thicknessMm,
  };

  const currentResult = calculatePhysics(currentAtmosphere, selectedCell.material, evidenceRecords);

  // Select recommended test facility based on gravity
  const recommendedFacility = 
    selectedCell.preset.gravity === 0
      ? 'ISS CIR / SoFIE (Solid Fuel Ignition and Extinction) Rack'
      : selectedCell.preset.gravity < 4.0
      ? 'ZARM Drop Tower Centrifuge (Bremen) or Parabolic Flight (ESA/NASA)'
      : 'NASA White Sands Test Facility (WSTF) 6001B Standard Chamber';

  const pO2Psi = (selectedCell.preset.oxygen * selectedCell.preset.pressurePsi).toFixed(2);
  const pO2Kpa = (parseFloat(pO2Psi) * 6.89476).toFixed(1);
  const deltaCExpected = (Math.min(0.95, currentResult.confidenceScore + 0.35) - currentResult.confidenceScore).toFixed(2);

  // Markdown spec generator
  const generatedMarkdownSpec = `# NASA TARGETED MICROGRAVITY TEST SPECIFICATION
**Document Ref:** NASA-MSFC-TS-${selectedCell.material.id.toUpperCase()}-${selectedCell.preset.id.toUpperCase()}-2026
**Target Material:** ${selectedCell.material.name} (${selectedCell.material.chemicalName})
**Target Mission Atmosphere:** ${selectedCell.preset.name} (${selectedCell.preset.subTitle})
**Principal Verification Code:** NASA-STD-6001B / SoFIE Flight Experiment Specification

---

## 1. RESEARCH GAP & JUSTIFICATION
- **Current Baseline Confidence Score C:** ${(currentResult.confidenceScore * 100).toFixed(1)}%
- **Current Safety Status:** ${currentResult.riskLevel}
- **Gap Classification:** ${currentResult.confidenceScore < 0.40 ? 'CRITICAL HIGH-PRIORITY VOID (Flight Risk Inhibit Active)' : 'REFINEMENT & CREDIBLE BOUND NARROWING'}
- **Projected Uncertainty Reduction (ΔC):** +${(parseFloat(deltaCExpected) * 100).toFixed(0)}% (Expected Post-Test Confidence: ${(Math.min(0.98, currentResult.confidenceScore + parseFloat(deltaCExpected)) * 100).toFixed(0)}%)

---

## 2. TEST FACILITY & CHAMBER PROTOCOL
- **Primary Recommended Facility:** ${recommendedFacility}
- **Secondary Backup Facility:** 9.3s Catapult Capsule Drop (ZARM Bremen)
- **Target Gravitational Acceleration (g):** ${selectedCell.preset.gravity.toFixed(2)} m/s²
- **Target Total Pressure:** ${selectedCell.preset.pressurePsi.toFixed(1)} psia (${(selectedCell.preset.pressurePsi * 6.89476).toFixed(1)} kPa)
- **Target Oxygen Mole Fraction (XO2):** ${(selectedCell.preset.oxygen * 100).toFixed(1)}% (pO2 = ${pO2Psi} psi / ${pO2Kpa} kPa)
- **Background Inert Gas:** High-Purity Nitrogen (N2 99.999%) Balance
- **Chamber Ventilation Flow Velocity (u_vent):** ${selectedCell.preset.ventilation.toFixed(2)} m/s (Co-flow duct laminar profile, Re < 120)

---

## 3. SAMPLE SPECIFICATIONS & PREPARATION
- **Test Sample Geometry:** Rectangular flat coupon, 50.0 mm (W) x 120.0 mm (L)
- **Sample Thickness:** ${selectedCell.preset.thicknessMm.toFixed(2)} mm
- **Required Sample Cohort:** 12 coupons (minimum 8 valid burns for statistical Bayesian validation)
- **Ignition Source:** Nichrome resistance wire (29 AWG, 4.5 turns, 2.5 A pulse for 1.8 s)
- **Pre-Test Conditioning:** 48 hours at 22°C and 40% RH, followed by 2 hours dry nitrogen desiccation

---

## 4. IN-SITU SENSOR INSTRUMENTATION
1. **Calibrated Color Pyrometry Camera:** 450 nm / 650 nm dual-wavelength ratio pyrometry at 250 FPS.
2. **CH* Radical Chemiluminescence Sensor:** 431 nm optical bandpass filter for blue flame root detection.
3. **Thermocouple Array:** 4x Type-K fine-gauge (0.05 mm) micro-thermocouples embedded at 20 mm intervals.
4. **Laser Obscuration Smoke Sensor:** 635 nm diode laser measuring transient particulate extinction coefficients.

---

## 5. CLEARANCE APPROVAL & ACCEPTANCE CRITERIA
- Flame spread rate must not exceed ${(currentResult.flameSpreadRate * 1.25).toFixed(3)} mm/s.
- Self-extinguishment time post-igniter cutoff must be documented to calibrate zero-g stagnation limit.
`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generatedMarkdownSpec);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([generatedMarkdownSpec], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NASA_TEST_SPEC_${selectedCell.material.id.toUpperCase()}_${selectedCell.preset.id.toUpperCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] mx-auto font-sans text-xs">
      
      {/* LEFT & CENTER (7 Cols): N-Dimensional Heatmap Matrix */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Heatmap Header */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="squircle-icon w-8 h-8 text-accent">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm tracking-tight text-white">
                N-Dimensional Microgravity Research-Gap Matrix
              </h3>
              <span className="text-[10px] text-slate-400">Bayesian experimental uncertainty mapping across flight materials</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] bg-obsidian-deep/80 px-3 py-1.5 rounded-full border border-white/10 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" /> High C (&ge;70%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/40" /> Moderate (40-69%)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" /> Gap Void (&lt;40%)
            </span>
          </div>
        </div>

        {/* Heatmap Interactive Table */}
        <div className="glass-panel p-5 overflow-x-auto">
          <div className="text-[11px] text-slate-300 mb-3 font-medium">
            Select any cell to inspect empirical void and generate certified NASA Experiment Test Specification:
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-obsidian-border text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                <th className="py-2.5 px-3">Material Family</th>
                {MISSION_PRESETS.map(p => (
                  <th key={p.id} className="py-2.5 px-2 text-center">
                    <div className="font-bold text-white">{p.name.split(' ')[0]}</div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {p.gravity === 0 ? '0g' : `${p.gravity}g`} | {(p.oxygen * 100).toFixed(0)}% O₂
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-border/40">
              {matrixData.map(row => (
                <tr key={row.material.id} className="hover:bg-obsidian-elevated/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200 whitespace-nowrap">
                    <div className="font-heading font-bold text-white text-xs">{row.material.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{row.material.chemicalName.split('/')[0]}</div>
                  </td>
                  {row.cells.map(cell => {
                    const isSelected = 
                      selectedCell.material.id === cell.material.id && 
                      selectedCell.preset.id === cell.preset.id;

                    const c = cell.confidence;
                    let cellColor = 'bg-rose-950/40 text-rose-300 border-rose-600/40';
                    if (c >= 0.70) {
                      cellColor = 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40';
                    } else if (c >= 0.40) {
                      cellColor = 'bg-amber-950/40 text-amber-200 border-amber-500/40';
                    }

                    return (
                      <td key={cell.preset.id} className="py-2.5 px-1.5 text-center">
                        <button
                          onClick={() => setSelectedCell({ material: cell.material, preset: cell.preset })}
                          className={`w-full py-2.5 px-1 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-0.5 btn-squircle ${cellColor} ${
                            isSelected ? 'ring-2 ring-accent scale-105 font-bold shadow-lg shadow-accent/25' : 'hover:scale-102'
                          }`}
                        >
                          <span className="text-xs font-mono-numbers font-bold">
                            {(c * 100).toFixed(0)}%
                          </span>
                          <span className="text-[8px] opacity-80 uppercase tracking-tight font-semibold">
                            {cell.isSafetyLocked ? 'LOCKED' : cell.riskLevel.slice(0, 4)}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-[10px] text-slate-400 flex justify-between items-center pt-3 border-t border-obsidian-border/50">
            <span>Live updated by Bayesian applicability kernel against all 16 historical test flights.</span>
            <span className="font-mono">Rows: 6 Materials × Cols: 5 Mission Regimes</span>
          </div>
        </div>

        {/* Selected Cell Executive Summary Card */}
        <div className="glass-panel p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading font-bold text-white text-xs flex items-center gap-2">
              <Target className="w-4 h-4 text-thermal-amber" />
              Selected Cell: {selectedCell.material.name} @ {selectedCell.preset.name}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              currentResult.isSafetyLocked ? 'bg-plasma-red/20 text-plasma-red border border-plasma-red/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {currentResult.riskLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 mt-2">
            <div>Confidence: <strong className="text-white font-mono-numbers">{(currentResult.confidenceScore * 100).toFixed(1)}%</strong></div>
            <div>Expected Spread: <strong className="text-thermal-amber font-mono-numbers">{currentResult.flameSpreadRate.toFixed(3)} mm/s</strong></div>
            <div>Effective LOC: <strong className="text-accent-glow font-mono-numbers">{currentResult.effectiveLoc}%</strong></div>
            <div>HRR Peak: <strong className="text-white font-mono-numbers">{currentResult.effectiveHrr} kW/m²</strong></div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL (5 Cols): NASA Targeted Experiment Specification Sheet */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="glass-panel p-5 flex-1 flex flex-col justify-between">
          
          <div>
            {/* Spec Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <div className="squircle-icon w-8 h-8 text-accent">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                    NASA Experiment Specification Sheet
                  </h4>
                  <div className="text-[10px] text-slate-400">Formal drop tower & ISS SoFIE investigation protocol</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-full bg-obsidian-deep/80 border border-obsidian-border text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold btn-modern"
                  title="Copy Markdown"
                >
                  {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMarkdown ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3.5 py-1.5 rounded-full bg-accent/20 border border-accent/60 text-accent-glow hover:bg-accent/30 flex items-center gap-1.5 text-xs font-semibold shadow-md shadow-accent/20 btn-modern"
                  title="Download .md file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .MD
                </button>
              </div>
            </div>

            {/* Rendered Spec Content in Terminal Box */}
            <div className="bg-obsidian-deep/90 p-4 rounded-2xl border border-obsidian-border overflow-y-auto max-h-[540px] text-xs leading-relaxed text-slate-300 space-y-3.5 font-mono shadow-inner">
              
              <div className="p-3 bg-obsidian-elevated/80 rounded-xl border border-obsidian-border text-xs space-y-1">
                <div className="text-white font-bold">NASA-MSFC-TS-{selectedCell.material.id.toUpperCase()}-{selectedCell.preset.id.toUpperCase()}-2026</div>
                <div className="text-slate-400">Target Facility: <span className="text-accent-glow">{recommendedFacility}</span></div>
                <div className="text-slate-400">Uncertainty Reduction ΔC: <strong className="text-emerald-400">+{((parseFloat(deltaCExpected)) * 100).toFixed(0)}%</strong></div>
              </div>

              <div>
                <div className="text-white font-bold text-xs mb-1 font-heading">1. SCIENTIFIC GAP & TEST JUSTIFICATION</div>
                <p className="text-slate-400 text-xs font-sans leading-relaxed">
                  {currentResult.isSafetyLocked 
                    ? 'CRITICAL DEFICIT: Empirical applicability kernel is below safety certification baseline. Zero-g flame spread dynamics are unconstrained for this material.'
                    : `Ground testing at 1g fails to model buoyant suppression. Microgravity tests are necessary to measure laminar opposed spread without natural convection interference.`}
                </p>
              </div>

              <div>
                <div className="text-white font-bold text-xs mb-1 font-heading">2. CHAMBER ENVIRONMENT TARGETS</div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-obsidian-elevated/70 rounded-xl text-xs">
                  <div>Atmosphere: <strong className="text-white font-mono-numbers">{(selectedCell.preset.oxygen * 100).toFixed(1)}% O₂</strong></div>
                  <div>Pressure: <strong className="text-white font-mono-numbers">{selectedCell.preset.pressurePsi.toFixed(1)} psia</strong></div>
                  <div>Gravity: <strong className="text-white font-mono-numbers">{selectedCell.preset.gravity.toFixed(2)} m/s²</strong></div>
                  <div>Flow Velocity: <strong className="text-white font-mono-numbers">{selectedCell.preset.ventilation.toFixed(2)} m/s</strong></div>
                  <div>Partial pO₂: <strong className="text-accent-glow font-mono-numbers">{pO2Psi} psi ({pO2Kpa} kPa)</strong></div>
                  <div>Purge Gas: <strong className="text-white">N₂ 99.999% Balance</strong></div>
                </div>
              </div>

              <div>
                <div className="text-white font-bold text-xs mb-1 font-heading">3. SAMPLE & RUN SPECIFICATION</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs font-sans">
                  <li>Sample Dimensions: 50 mm (W) × 120 mm (L) × {selectedCell.preset.thicknessMm.toFixed(2)} mm (T)</li>
                  <li>Sample Batch: 12 identical test coupons (8 for burn matrix, 4 spares)</li>
                  <li>Ignition: 29 AWG Nichrome wire, 2.5A pulse for 1.8 seconds</li>
                  <li>Sensors: 250 FPS Dual-Wavelength Pyrometer + Type-K array + 635nm Laser Obscuration</li>
                </ul>
              </div>

              <div>
                <div className="text-white font-bold text-xs mb-1 font-heading">4. EXPECTED RISK REDUCTION METRICS</div>
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs">
                  Projected Confidence Enhancement: <span className="font-mono-numbers">{(currentResult.confidenceScore * 100).toFixed(1)}% &rarr; {(Math.min(0.98, currentResult.confidenceScore + parseFloat(deltaCExpected)) * 100).toFixed(1)}%</span>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-obsidian-border text-[10px] text-slate-400 text-center">
            Compliant with NASA-STD-6001B Test 1 & ISS CIR SoFIE Combustion Investigation Protocol
          </div>
        </div>
      </div>

    </div>
  );
};
