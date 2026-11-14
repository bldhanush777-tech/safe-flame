export type MaterialId = 
  | 'kapton'
  | 'pmma'
  | 'nomex'
  | 'silicone'
  | 'sibal'
  | 'ultem';

export interface MaterialProperties {
  id: MaterialId;
  name: string;
  chemicalName: string;
  application: string;
  cMat: number; // base spread rate coefficient (mm/s)
  velocityExponent: number; // n (0.40 - 0.55)
  baseLoc1g: number; // Limiting Oxygen Concentration at 1g / 14.7 psi (%)
  baseHrr: number; // Heat Release Rate (kW/m²)
  baseIgnitionDelay: number; // Ignition delay at 1g, 21% O2 (s)
  smokeObscurationIndex: number; // S (0.0 - 1.0)
  suppressionDifficulty: number; // E_suppression (0.0 - 1.0)
  thermalConductivity: number; // W/(m·K)
  sootYield: number; // g soot / g fuel
  standardTestRef: string; // e.g. NASA-STD-6001B Test 1
}

export type MissionPresetId = 'artemis' | 'iss' | 'mars' | 'pre-eva' | 'wstf';

export interface MissionPreset {
  id: MissionPresetId;
  name: string;
  subTitle: string;
  oxygen: number; // 0.15 - 0.45
  pressurePsi: number; // psi
  gravity: number; // m/s²
  ventilation: number; // m/s
  thicknessMm: number; // mm
  description: string;
}

export interface AtmosphereState {
  oxygen: number; // Fraction, e.g. 0.21 (21%)
  pressurePsi: number; // psi (4.0 - 16.0)
  gravity: number; // m/s² (0.00 - 9.81)
  ventilation: number; // m/s (0.00 - 0.60)
  thicknessMm: number; // mm (0.10 - 5.00)
}

export interface EvidenceRecord {
  id: string;
  missionCampaign: string;
  facility: 'ISS FLARE' | 'Cygnus Saffire' | 'ISS BASS-II' | 'ZARM Drop Tower' | 'Zero-G Parabolic' | 'WSTF NASA-STD-6001B';
  facilityTier: number; // 0.6 to 1.0 (Tier T)
  materialId: MaterialId;
  materialName: string;
  testDate: string;
  sampleThicknessMm: number;
  oxygen: number; // fraction 0.15 - 0.45
  pressurePsi: number;
  gravity: number; // m/s²
  flowVelocity: number; // m/s
  measuredFlameSpread: number; // mm/s
  measuredLoc: number; // %
  measuredHrr: number; // kW/m²
  ignitionDelay: number; // s
  qualityScore: number; // Q (0.0 - 1.0)
  repeatability: number; // R (0.0 - 1.0)
  sampleSize: number;
  notes: string;
  doiOrReport: string;
}

export interface SimilarityResult {
  record: EvidenceRecord;
  distance: number; // Mahalanobis distance d(e,t)
  applicability: number; // A = exp(-d²)
  deltaO2: number;
  deltaP: number;
  deltaG: number;
  deltaU: number;
  deltaThick: number;
}

export type RiskLevel = 'INSUFFICIENT EVIDENCE (SAFETY LOCK)' | 'LOW' | 'CONDITIONAL' | 'HIGH' | 'CRITICAL';

export interface PhysicsOutputs {
  // Dimensionless & Scaling
  gStar: number; // G* = g / 9.81
  sqrtGStar: number; // sqrt(G*)
  oxygenIndex: number; // OI = X_O2 / 0.21
  pO2Psi: number; // psi
  pO2Kpa: number; // kPa
  uEff: number; // m/s

  // Spread & Bounds
  flameSpreadRate: number; // mm/s (V_f)
  ciLower90: number; // 5th percentile mm/s
  ciUpper90: number; // 95th percentile mm/s
  
  // Combustion Metrics
  effectiveLoc: number; // %
  effectiveHrr: number; // kW/m²
  effectiveIgnitionDelay: number; // s
  effectiveSmoke: number; // 0 - 1
  effectiveSuppressionDifficulty: number; // 0 - 1

  // Confidence & Verification
  confidenceScore: number; // C (0 - 1)
  scoreQ: number;
  scoreR: number;
  scoreA: number;
  scoreCoverage: number;
  scoreT: number;

  // Composite Risk
  compositeRisk: number; // R_fire (0 - 1)
  riskLevel: RiskLevel;
  isSafetyLocked: boolean;

  // Flame State
  flameState: 'NORMAL_COMBUSTION' | 'SMOLDERING' | 'EXTINGUISHED';
  quenchingMechanism?: string;

  // Evidence Ranking
  topSimilarRecords: SimilarityResult[];
}

export type SuppressantType = 'water_mist' | 'co2' | 'n2_mist' | 'fk_5_1_12';

export interface SuppressantInfo {
  id: SuppressantType;
  name: string;
  formula: string;
  extinctionEfficiency: number; // 0 - 1
  microgravityWarning: string;
  mechanism: string;
  dischargeDurationSec: number;
  cleanAgent: boolean;
}

export interface GridCell {
  x: number;
  y: number;
  smokeConcentration: number; // 0.0 - 100.0%
  temperature: number; // °C
  u: number; // x-velocity m/s
  v: number; // y-velocity m/s
  isObstacle: boolean;
  isFireSource: boolean;
  isHvacInlet: boolean;
  isHvacOutlet: boolean;
}

export interface SmokeDetector {
  id: string;
  name: string;
  type: 'Photoelectric' | 'Dual-Wavelength Laser';
  x: number; // grid cell coords
  y: number;
  alarmThreshold: number; // obscuration %/m (e.g. 1.5)
  currentObscuration: number;
  alarmed: boolean;
  alarmTimeSeconds: number | null;
}
