import { 
  AtmosphereState, 
  EvidenceRecord, 
  MaterialProperties, 
  PhysicsOutputs, 
  RiskLevel, 
  SimilarityResult 
} from '../types/physics';

// Mahalanobis standard deviations and weights
const MAHALANOBIS_SIGMA = {
  oxygen: 0.05, // 5% O2
  pressure: 3.0, // psi
  gravity: 2.5, // m/s²
  velocity: 0.15, // m/s
  thickness: 1.0, // mm
};

const MAHALANOBIS_WEIGHTS = {
  oxygen: 0.30,
  pressure: 0.20,
  gravity: 0.25,
  velocity: 0.15,
  thickness: 0.10,
};

/**
 * Calculates Mahalanobis-like weighted distance between target scenario and an evidence record
 */
export function calculateSimilarityDistance(
  target: AtmosphereState,
  record: EvidenceRecord
): { distance: number; applicability: number; deltaO2: number; deltaP: number; deltaG: number; deltaU: number; deltaThick: number } {
  const dO2 = (record.oxygen - target.oxygen) / MAHALANOBIS_SIGMA.oxygen;
  const dP = (record.pressurePsi - target.pressurePsi) / MAHALANOBIS_SIGMA.pressure;
  const dG = (record.gravity - target.gravity) / MAHALANOBIS_SIGMA.gravity;
  const dU = (record.flowVelocity - target.ventilation) / MAHALANOBIS_SIGMA.velocity;
  const dThick = (record.sampleThicknessMm - target.thicknessMm) / MAHALANOBIS_SIGMA.thickness;

  const sumSquares = 
    MAHALANOBIS_WEIGHTS.oxygen * (dO2 * dO2) +
    MAHALANOBIS_WEIGHTS.pressure * (dP * dP) +
    MAHALANOBIS_WEIGHTS.gravity * (dG * dG) +
    MAHALANOBIS_WEIGHTS.velocity * (dU * dU) +
    MAHALANOBIS_WEIGHTS.thickness * (dThick * dThick);

  const distance = Math.sqrt(sumSquares);
  const applicability = Math.exp(- (distance * distance));

  return {
    distance,
    applicability,
    deltaO2: (record.oxygen - target.oxygen) * 100,
    deltaP: record.pressurePsi - target.pressurePsi,
    deltaG: record.gravity - target.gravity,
    deltaU: record.flowVelocity - target.ventilation,
    deltaThick: record.sampleThicknessMm - target.thicknessMm,
  };
}

/**
 * Ranks all evidence records against target atmosphere state
 */
export function rankEvidenceRecords(
  target: AtmosphereState,
  records: EvidenceRecord[],
  activeMaterialId?: string
): SimilarityResult[] {
  return records
    .map(record => {
      const sim = calculateSimilarityDistance(target, record);
      // If materials do not match, penalize applicability slightly for material-specific searches
      const materialMatch = !activeMaterialId || record.materialId === activeMaterialId;
      const adjustedApplicability = materialMatch ? sim.applicability : sim.applicability * 0.4;
      const adjustedDistance = materialMatch ? sim.distance : sim.distance + 1.5;

      return {
        record,
        distance: Number(adjustedDistance.toFixed(3)),
        applicability: Number(adjustedApplicability.toFixed(3)),
        deltaO2: Number(sim.deltaO2.toFixed(1)),
        deltaP: Number(sim.deltaP.toFixed(2)),
        deltaG: Number(sim.deltaG.toFixed(2)),
        deltaU: Number(sim.deltaU.toFixed(2)),
        deltaThick: Number(sim.deltaThick.toFixed(2)),
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Computes parametric hull coverage C_coverage (0 - 1)
 */
function calculateParametricCoverage(target: AtmosphereState): number {
  let score = 1.0;
  // Oxygen penalty outside [0.18, 0.42]
  if (target.oxygen < 0.18) score -= (0.18 - target.oxygen) * 4.0;
  if (target.oxygen > 0.40) score -= (target.oxygen - 0.40) * 5.0;

  // Pressure penalty outside [6.0, 15.5]
  if (target.pressurePsi < 6.0) score -= (6.0 - target.pressurePsi) * 0.08;
  if (target.pressurePsi > 15.5) score -= (target.pressurePsi - 15.5) * 0.15;

  // Flow penalty: in micro-g, stagnant flow < 0.03 m/s has high uncertainty
  if (target.gravity < 0.5 && target.ventilation < 0.04) {
    score -= 0.35; // Stagnation boundary uncertainty
  }

  return Math.max(0.1, Math.min(1.0, score));
}

/**
 * Complete NASA-scaling physics calculations
 */
export function calculatePhysics(
  target: AtmosphereState,
  material: MaterialProperties,
  evidenceRecords: EvidenceRecord[]
): PhysicsOutputs {
  // 1. Gravity-Adjusted Buoyancy
  const gStar = target.gravity / 9.81;
  const sqrtGStar = Math.sqrt(Math.max(0, gStar));

  // 2. Oxygen Enrichment Index & Partial Pressures
  const oxygenIndex = target.oxygen / 0.21;
  const pO2Psi = target.oxygen * target.pressurePsi;
  const pO2Kpa = pO2Psi * 6.89476;

  // 3. Ventilation-Coupled Effective Velocity
  // u_eff = u_vent + k_b * sqrt(G*) * u_b,1g (where u_b,1g = 0.30 m/s, k_b = 1.0)
  const uB1g = 0.30;
  const kB = 1.0;
  const uEff = target.ventilation + kB * sqrtGStar * uB1g;

  // 4. Evidence Retrieval & Confidence Calculation
  const ranked = rankEvidenceRecords(target, evidenceRecords, material.id);
  const materialMatches = ranked.filter(r => r.record.materialId === material.id);
  const primaryMatch = materialMatches[0] || ranked[0];

  // Top-k weighted averages for Q, R, T
  const topK = materialMatches.slice(0, 3);
  const avgQ = topK.length > 0 
    ? topK.reduce((acc, curr) => acc + curr.record.qualityScore, 0) / topK.length 
    : 0.70;
  const avgR = topK.length > 0 
    ? topK.reduce((acc, curr) => acc + curr.record.repeatability, 0) / topK.length 
    : 0.65;
  const avgT = topK.length > 0 
    ? topK.reduce((acc, curr) => acc + curr.record.facilityTier, 0) / topK.length 
    : 0.75;
  const maxA = primaryMatch ? primaryMatch.applicability : 0.40;
  const coverageScore = calculateParametricCoverage(target);

  // Evidence Confidence Score C
  // C = 0.25 Q + 0.15 R + 0.30 A + 0.20 C_coverage + 0.10 T
  const confidenceScore = Math.max(0.05, Math.min(1.0, 
    0.25 * avgQ + 0.15 * avgR + 0.30 * maxA + 0.20 * coverageScore + 0.10 * avgT
  ));

  // 5. Opposed-Flow Flame Spread (V_f)
  // V_f = C_mat * (u_eff)^n * (X_O2 / 0.21)^1.85 * (P_total / 14.7)^0.65 * (1.0 / thickness_mm)^0.45
  const uEffSafe = Math.max(0.005, uEff);
  const thicknessSafe = Math.max(0.1, target.thicknessMm);

  let rawVf = material.cMat *
    Math.pow(uEffSafe, material.velocityExponent) *
    Math.pow(oxygenIndex, 1.85) *
    Math.pow(target.pressurePsi / 14.7, 0.65) *
    Math.pow(1.0 / thicknessSafe, 0.45);

  // 6. Effective LOC calculation
  // In microgravity (G* ~ 0), without buoyancy, LOC increases if flow is very low, but decreases at high flow
  const buoyancyFactor = 1.0 - 0.18 * (1.0 - sqrtGStar);
  const pressureFactor = Math.pow(14.7 / target.pressurePsi, 0.20);
  const effectiveLoc = Number((material.baseLoc1g * buoyancyFactor * pressureFactor).toFixed(1));

  // Determine Quenching / Combustion State
  let flameState: 'NORMAL_COMBUSTION' | 'SMOLDERING' | 'EXTINGUISHED' = 'NORMAL_COMBUSTION';
  let quenchingMechanism: string | undefined = undefined;

  const currentO2Percent = target.oxygen * 100;
  if (currentO2Percent < effectiveLoc) {
    rawVf = 0;
    flameState = 'EXTINGUISHED';
    quenchingMechanism = `Oxygen concentration (${currentO2Percent.toFixed(1)}%) below Limiting Oxygen Concentration (${effectiveLoc.toFixed(1)}%). Self-extinguishment.`;
  } else if (gStar < 0.05 && target.ventilation < 0.02) {
    // Microgravity Stagnation Quenching (Radiational Extinction)
    rawVf *= 0.15;
    flameState = 'SMOLDERING';
    quenchingMechanism = 'Microgravity stagnation: Lack of oxidizer transport and radiative cooling suppresses sustained ignition into low-temperature smolder.';
  } else if (currentO2Percent <= effectiveLoc + 1.5) {
    flameState = 'SMOLDERING';
    quenchingMechanism = 'Marginal combustion zone: Near-LOC smoldering front.';
  }

  const flameSpreadRate = Number(Math.max(0, rawVf).toFixed(3));

  // 7. 90% Bayesian Credible Interval
  // Widened by 1 + 1.4(1 - C)
  const uncertaintyMultiplier = 1.0 + 1.4 * (1.0 - confidenceScore);
  const baseStdDev = Math.max(0.04, 0.14 * flameSpreadRate);
  const margin90 = 1.645 * baseStdDev * uncertaintyMultiplier;

  const ciLower90 = Number(Math.max(0, flameSpreadRate - margin90).toFixed(3));
  const ciUpper90 = Number((flameSpreadRate + margin90).toFixed(3));

  // 8. Derived Combustion Metrics
  // Effective HRR = baseHrr * (X_O2 / 0.21)^1.4 * (P / 14.7)^0.5 * (u_eff / 0.3)^0.3
  const effectiveHrr = flameState === 'EXTINGUISHED' 
    ? 0 
    : Math.round(material.baseHrr * Math.pow(oxygenIndex, 1.4) * Math.pow(target.pressurePsi / 14.7, 0.5) * Math.pow(uEffSafe / 0.3, 0.25));

  // Ignition Delay: decreases with higher O2 and higher pressure
  const effectiveIgnitionDelay = Number(
    Math.max(0.5, (material.baseIgnitionDelay / Math.pow(oxygenIndex, 1.6)) * Math.pow(14.7 / target.pressurePsi, 0.4)).toFixed(1)
  );

  const effectiveSmoke = Number(
    Math.min(1.0, material.smokeObscurationIndex * Math.pow(target.pressurePsi / 14.7, 0.3) * Math.pow(oxygenIndex, 0.5)).toFixed(2)
  );

  const effectiveSuppressionDifficulty = Number(
    Math.min(1.0, material.suppressionDifficulty * (1.0 + 0.22 * (1.0 - sqrtGStar))).toFixed(2)
  );

  // 9. Normalized Risk Components
  // R_fire = 0.25 V_f_hat + 0.25 HRR_hat + 0.20 S_hat + 0.15 D_delay_hat + 0.15 E_suppression_hat
  const vFHat = Math.min(1.0, flameSpreadRate / 2.0); // 2.0 mm/s is extreme
  const hrrHat = Math.min(1.0, effectiveHrr / 500.0);
  const sHat = effectiveSmoke;
  const dDelayHat = Math.min(1.0, Math.max(0.0, 1.0 - (effectiveIgnitionDelay / 12.0)));
  const eSuppHat = effectiveSuppressionDifficulty;

  const compositeRisk = Number(
    Math.min(1.0, Math.max(0.0, 
      0.25 * vFHat + 0.25 * hrrHat + 0.20 * sHat + 0.15 * dDelayHat + 0.15 * eSuppHat
    )).toFixed(3)
  );

  // 10. Risk Level & CRITICAL SAFETY LOCK
  const isSafetyLocked = confidenceScore < 0.35;
  let riskLevel: RiskLevel;

  if (isSafetyLocked) {
    riskLevel = 'INSUFFICIENT EVIDENCE (SAFETY LOCK)';
  } else if (compositeRisk <= 0.25) {
    riskLevel = 'LOW';
  } else if (compositeRisk <= 0.50) {
    riskLevel = 'CONDITIONAL';
  } else if (compositeRisk <= 0.75) {
    riskLevel = 'HIGH';
  } else {
    riskLevel = 'CRITICAL';
  }

  return {
    gStar: Number(gStar.toFixed(3)),
    sqrtGStar: Number(sqrtGStar.toFixed(3)),
    oxygenIndex: Number(oxygenIndex.toFixed(2)),
    pO2Psi: Number(pO2Psi.toFixed(2)),
    pO2Kpa: Number(pO2Kpa.toFixed(1)),
    uEff: Number(uEff.toFixed(3)),
    flameSpreadRate,
    ciLower90,
    ciUpper90,
    effectiveLoc,
    effectiveHrr,
    effectiveIgnitionDelay,
    effectiveSmoke,
    effectiveSuppressionDifficulty,
    confidenceScore: Number(confidenceScore.toFixed(3)),
    scoreQ: Number(avgQ.toFixed(2)),
    scoreR: Number(avgR.toFixed(2)),
    scoreA: Number(maxA.toFixed(2)),
    scoreCoverage: Number(coverageScore.toFixed(2)),
    scoreT: Number(avgT.toFixed(2)),
    compositeRisk,
    riskLevel,
    isSafetyLocked,
    flameState,
    quenchingMechanism,
    topSimilarRecords: ranked,
  };
}

/**
 * Generates comparative curve points (1g vs Target Gravity across O2% [15% to 45%])
 */
export function generateComparativeCurves(
  target: AtmosphereState,
  material: MaterialProperties
): Array<{
  oxygenPercent: number;
  spreadRateTargetG: number;
  spreadRate1G: number;
  ciUpperTargetG: number;
  ciLowerTargetG: number;
  locTarget: number;
  loc1G: number;
}> {
  const points = [];
  const uB1g = 0.30;
  const kB = 1.0;
  const sqrtGTarget = Math.sqrt(Math.max(0, target.gravity / 9.81));
  const uEffTarget = target.ventilation + kB * sqrtGTarget * uB1g;
  const uEff1G = target.ventilation + kB * 1.0 * uB1g;

  const locTarget = material.baseLoc1g * (1.0 - 0.18 * (1.0 - sqrtGTarget)) * Math.pow(14.7 / target.pressurePsi, 0.20);
  const loc1G = material.baseLoc1g * Math.pow(14.7 / target.pressurePsi, 0.20);

  for (let o2Pct = 15; o2Pct <= 45; o2Pct += 2) {
    const o2Frac = o2Pct / 100;
    const oi = o2Frac / 0.21;
    const pTerm = Math.pow(target.pressurePsi / 14.7, 0.65);
    const thickTerm = Math.pow(1.0 / Math.max(0.1, target.thicknessMm), 0.45);

    // Target G spread
    let vTarget = 0;
    if (o2Pct >= locTarget) {
      vTarget = material.cMat *
        Math.pow(Math.max(0.005, uEffTarget), material.velocityExponent) *
        Math.pow(oi, 1.85) *
        pTerm *
        thickTerm;
    }

    // 1G spread
    let v1G = 0;
    if (o2Pct >= loc1G) {
      v1G = material.cMat *
        Math.pow(Math.max(0.005, uEff1G), material.velocityExponent) *
        Math.pow(oi, 1.85) *
        pTerm *
        thickTerm;
    }

    const margin = 0.22 * vTarget;

    points.push({
      oxygenPercent: o2Pct,
      spreadRateTargetG: Number(vTarget.toFixed(3)),
      spreadRate1G: Number(v1G.toFixed(3)),
      ciUpperTargetG: Number((vTarget + margin).toFixed(3)),
      ciLowerTargetG: Number(Math.max(0, vTarget - margin).toFixed(3)),
      locTarget: Number(locTarget.toFixed(1)),
      loc1G: Number(loc1G.toFixed(1)),
    });
  }

  return points;
}
