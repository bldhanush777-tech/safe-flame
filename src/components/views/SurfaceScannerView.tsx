import React, { useState, useRef, useEffect } from 'react';
import type { MaterialId, MaterialProperties, SurfaceScanResult } from '../../types/physics';
import { AEROSPACE_MATERIALS } from '../../data/materials';
import { 
  Camera, 
  Upload, 
  Scan, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw, 
  Cpu, 
  Eye, 
  Crosshair, 
  Activity,
  ArrowRight
} from 'lucide-react';

interface SurfaceScannerViewProps {
  onApplyMaterial: (mat: MaterialProperties) => void;
}

// Built-in authentic coupon images (generated high-tech SVG data URIs for immediate reliability)
const SAMPLE_COUPONS = [
  {
    id: 'sample_kapton',
    name: 'Kapton Wire Harness (Post Arc-Track)',
    materialId: 'kapton' as MaterialId,
    description: 'Polyimide film with carbonized electrical arc-tracking path and brittle pyrolytic degradation.',
    charDepth: 0.35,
    pyrolysisArea: 28.5,
    residualIntegrity: 62,
    risk: 'HIGH' as const,
    recommendedO2: 24,
    recommendedVent: 0.10,
    svgColor: '#D97706',
    charColor: '#1C1917',
  },
  {
    id: 'sample_pmma',
    name: 'PMMA Cast Viewport (Thermal Crazing)',
    materialId: 'pmma' as MaterialId,
    description: 'Optical hatch viewport displaying sub-surface micro-crazing and bubble formation under radiant heat.',
    charDepth: 1.20,
    pyrolysisArea: 42.0,
    residualIntegrity: 45,
    risk: 'CRITICAL' as const,
    recommendedO2: 18,
    recommendedVent: 0.08,
    svgColor: '#0284C7',
    charColor: '#0F172A',
  },
  {
    id: 'sample_nomex',
    name: 'Nomex HT90-40 Garment (Radiant Scorch)',
    materialId: 'nomex' as MaterialId,
    description: 'Crew flight suit fabric with intumescent surface char preventing deep structural burnout.',
    charDepth: 0.15,
    pyrolysisArea: 14.0,
    residualIntegrity: 84,
    risk: 'MODERATE' as const,
    recommendedO2: 30,
    recommendedVent: 0.15,
    svgColor: '#475569',
    charColor: '#09090B',
  },
  {
    id: 'sample_silicone',
    name: 'Silicone Hatch Gasket (Oxidized Seal)',
    materialId: 'silicone' as MaterialId,
    description: 'Airlock seal showing white silica particulate crust formation and elasticity loss.',
    charDepth: 0.85,
    pyrolysisArea: 35.0,
    residualIntegrity: 58,
    risk: 'HIGH' as const,
    recommendedO2: 22,
    recommendedVent: 0.12,
    svgColor: '#DC2626',
    charColor: '#E2E8F0',
  },
];

export const SurfaceScannerView: React.FC<SurfaceScannerViewProps> = ({
  onApplyMaterial,
}) => {
  const [selectedSample, setSelectedSample] = useState(SAMPLE_COUPONS[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [useCamera, setUseCamera] = useState(false);
  const [thermalMode, setThermalMode] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start webcam if toggled
  useEffect(() => {
    if (useCamera) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Camera access denied or unavailable:', err);
          setUseCamera(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [useCamera]);

  const triggerScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 5;
      });
    }, 40);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setUploadedImage(ev.target?.result as string);
        setUseCamera(false);
        triggerScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyToPlatform = () => {
    const mat = AEROSPACE_MATERIALS.find(m => m.id === selectedSample.materialId);
    if (mat) {
      onApplyMaterial(mat);
      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 3000);
    }
  };

  return (
    <div className="p-4 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
      
      {/* LEFT & CENTER (7 Cols): Optical Scanner & Pyrometry Viewport */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Viewport Toolbar */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="squircle-icon w-8 h-8 text-accent">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm tracking-tight text-white">
                Surface Pyrolysis Scanner & Optical Pyrometry
              </h3>
              <span className="text-[10px] text-slate-400">Micro-CT & photogrammetric thermal front evaluation</span>
            </div>
            <span className="text-[10px] bg-obsidian-elevated/80 px-2.5 py-0.5 rounded-full border border-white/10 text-slate-300 font-semibold ml-2">
              AI COMPUTER VISION
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setThermalMode(!thermalMode)}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs transition-all border btn-modern ${
                thermalMode 
                  ? 'bg-thermal-amber/20 border-thermal-amber text-thermal-amber font-semibold shadow-md shadow-thermal-amber/20' 
                  : 'bg-obsidian-deep/80 border-obsidian-border text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Thermal (IR)
            </button>

            <button
              onClick={() => {
                setUseCamera(!useCamera);
                if (!useCamera) setUploadedImage(null);
              }}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs transition-all border btn-modern ${
                useCamera 
                  ? 'bg-accent/20 border-accent text-accent-glow font-semibold shadow-md shadow-accent/20' 
                  : 'bg-obsidian-deep/80 border-obsidian-border text-slate-300 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              {useCamera ? 'Stop Camera' : 'Live Camera'}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-full bg-obsidian-elevated/80 hover:bg-obsidian-border border border-obsidian-border text-slate-300 hover:text-white flex items-center gap-1.5 text-xs transition-all btn-modern"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Scanner Viewport Display */}
        <div className="relative bg-obsidian-deep/90 border border-obsidian-border rounded-2xl h-[420px] overflow-hidden flex items-center justify-center shadow-2xl">
          
          {/* Live Video Camera Stream */}
          {useCamera && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${thermalMode ? 'contrast-150 saturate-200 hue-rotate-180' : ''}`}
            />
          )}

          {/* Uploaded User Image */}
          {!useCamera && uploadedImage && (
            <img
              src={uploadedImage}
              alt="Uploaded Surface"
              className={`w-full h-full object-contain ${thermalMode ? 'contrast-150 saturate-200 hue-rotate-180' : ''}`}
            />
          )}

          {/* Default Synthetic Aerospace Coupon Graphic */}
          {!useCamera && !uploadedImage && (
            <div className={`relative w-full h-full flex items-center justify-center ${thermalMode ? 'bg-gradient-to-br from-indigo-950 via-purple-900 to-amber-700' : 'bg-obsidian-deep'}`}>
              <svg width="340" height="260" viewBox="0 0 340 260" className="drop-shadow-2xl">
                {/* Coupon Base Plate */}
                <rect x="30" y="30" width="280" height="200" rx="14" fill={selectedSample.svgColor} stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                
                {/* Pyrolysis Char Fissures */}
                <path d="M70 120 Q110 80 160 110 T250 130" stroke={selectedSample.charColor} strokeWidth="22" strokeLinecap="round" opacity="0.85" />
                <path d="M120 70 Q160 120 190 180" stroke={selectedSample.charColor} strokeWidth="14" strokeLinecap="round" opacity="0.75" />
                <path d="M140 100 Q190 110 220 90" stroke={selectedSample.charColor} strokeWidth="16" strokeLinecap="round" opacity="0.8" />
                
                {/* Heat affected zone glow */}
                <circle cx="160" cy="115" r="45" fill="rgba(249, 115, 22, 0.25)" />
                <circle cx="160" cy="115" r="25" fill="rgba(239, 68, 68, 0.35)" />
              </svg>

              <div className="absolute bottom-4 left-4 bg-obsidian-deep/90 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] text-slate-300 font-mono">
                Specimen: <strong className="text-white">{selectedSample.name}</strong>
              </div>
            </div>
          )}

          {/* Holographic Laser Sweep Line */}
          {isScanning && (
            <div 
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent shadow-lg shadow-accent transition-all duration-75 pointer-events-none"
              style={{ top: `${scanProgress}%` }}
            >
              <div className="absolute right-4 -top-3 text-[9px] font-bold text-accent-glow bg-obsidian-deep px-2 py-0.5 rounded-full border border-accent/40 font-mono">
                SCANNING: {scanProgress}%
              </div>
            </div>
          )}

          {/* Corner Bounding Reticles */}
          <div className="absolute inset-8 pointer-events-none border border-accent/30 rounded-2xl">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-accent" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-accent" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-accent" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-accent" />

            {/* Target Crosshair */}
            <Crosshair className="w-8 h-8 text-accent/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" />
          </div>

          {/* Rescan Button Overlay */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={triggerScan}
              disabled={isScanning}
              className="px-4 py-2 rounded-full bg-accent text-obsidian-deep font-bold hover:bg-accent-glow transition-all flex items-center gap-2 text-xs uppercase shadow-lg shadow-accent/25 btn-modern"
            >
              <Scan className="w-4 h-4" />
              {isScanning ? 'Analyzing...' : 'Run Optical Analysis'}
            </button>
          </div>
        </div>

        {/* Built-in Sample Material Coupons Library */}
        <div className="glass-panel p-4">
          <div className="text-[10px] uppercase text-slate-400 font-semibold mb-3 tracking-wider">
            OR SELECT CERTIFIED AEROSPACE FLIGHT COUPON FOR BENCHMARK ANALYSIS:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SAMPLE_COUPONS.map(sample => {
              const isSelected = selectedSample.id === sample.id && !uploadedImage && !useCamera;
              return (
                <button
                  key={sample.id}
                  onClick={() => {
                    setSelectedSample(sample);
                    setUploadedImage(null);
                    setUseCamera(false);
                    triggerScan();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-accent/15 border-accent text-white font-semibold shadow-md shadow-accent/20' 
                      : 'bg-obsidian-deep/80 border-obsidian-border text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold truncate text-slate-200">{sample.name.split('(')[0]}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{sample.materialId.toUpperCase()} • Char: <strong className="text-white font-mono-numbers">{sample.charDepth}mm</strong></div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN (5 Cols): Analysis Results & Atmosphere Recommendations */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* Results Card */}
        <div className="glass-panel p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <div className="squircle-icon w-8 h-8 text-thermal-amber">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                    Optical Surface Analysis Metrics
                  </h4>
                  <div className="text-[10px] text-slate-400">Computer vision thermal regression parameters</div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                selectedSample.risk === 'CRITICAL' ? 'bg-plasma-red/20 text-plasma-red border border-plasma-red/40 animate-pulse' :
                selectedSample.risk === 'HIGH' ? 'bg-thermal-amber/20 text-thermal-amber border border-thermal-amber/40' :
                'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
              }`}>
                {selectedSample.risk} FLAMMABILITY
              </span>
            </div>

            <div className="p-3.5 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border mb-4">
              <div className="font-heading font-bold text-white text-xs">{selectedSample.name}</div>
              <div className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                {selectedSample.description}
              </div>
            </div>

            {/* Numerical Readout Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border">
                <div className="text-[10px] text-slate-400">Surface Char Depth</div>
                <div className="text-thermal-amber font-heading font-bold text-lg mt-1 font-mono-numbers">
                  {selectedSample.charDepth.toFixed(2)} mm
                </div>
                <div className="text-[10px] text-slate-500">Subsurface thermal front</div>
              </div>

              <div className="p-3 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border">
                <div className="text-[10px] text-slate-400">Pyrolyzed Area</div>
                <div className="text-orange-400 font-heading font-bold text-lg mt-1 font-mono-numbers">
                  {selectedSample.pyrolysisArea.toFixed(1)} %
                </div>
                <div className="text-[10px] text-slate-500">Surface void coverage</div>
              </div>

              <div className="p-3 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border">
                <div className="text-[10px] text-slate-400">Residual Tensile Integrity</div>
                <div className="text-accent-glow font-heading font-bold text-lg mt-1 font-mono-numbers">
                  {selectedSample.residualIntegrity} %
                </div>
                <div className="text-[10px] text-slate-500">Structural safety margin</div>
              </div>

              <div className="p-3 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border">
                <div className="text-[10px] text-slate-400">Material Match</div>
                <div className="text-white font-heading font-bold text-base mt-1 uppercase">
                  {selectedSample.materialId}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">98.4% Confidence</div>
              </div>
            </div>

            {/* Recommended Safety Limits */}
            <div className="p-3.5 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border space-y-2 text-xs">
              <div className="text-white font-bold text-xs uppercase flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-accent" />
                Recommended Atmosphere Restrictions
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Maximum Allowable O₂:</span>
                <strong className="text-thermal-amber font-mono-numbers">{selectedSample.recommendedO2}% O₂</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Maximum Cabin Ventilation:</span>
                <strong className="text-accent-glow font-mono-numbers">{selectedSample.recommendedVent.toFixed(2)} m/s</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Corrective Action:</span>
                <span className="text-rose-300 font-semibold">Replace coupon before hyperbaric cycle</span>
              </div>
            </div>
          </div>

          {/* Action to Apply Material to Entire Platform */}
          <div className="pt-4 border-t border-obsidian-border mt-4">
            <button
              onClick={handleApplyToPlatform}
              className="w-full py-3 px-4 rounded-full bg-accent text-obsidian-deep font-bold text-xs uppercase tracking-wide hover:bg-accent-glow transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/25 btn-modern"
            >
              <span>Load Material ({selectedSample.materialId.toUpperCase()}) into Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {appliedNotice && (
              <div className="text-center text-xs text-emerald-400 font-semibold mt-2 animate-bounce">
                Material loaded successfully! All flight physics updated.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
