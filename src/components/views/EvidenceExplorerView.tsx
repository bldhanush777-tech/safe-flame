import React, { useState } from 'react';
import { 
  AtmosphereState, 
  EvidenceRecord, 
  MaterialId, 
  PhysicsOutputs, 
  SimilarityResult 
} from '../../types/physics';
import { AEROSPACE_MATERIALS } from '../../data/materials';
import { 
  Database, 
  Search, 
  PlusCircle, 
  Filter, 
  Code, 
  Copy, 
  Check, 
  ExternalLink, 
  Sliders, 
  Sparkles,
  X,
  FileCheck2,
  Calendar,
  Layers,
  BarChart2
} from 'lucide-react';

interface EvidenceExplorerViewProps {
  atmosphere: AtmosphereState;
  evidenceRecords: EvidenceRecord[];
  setEvidenceRecords: React.Dispatch<React.SetStateAction<EvidenceRecord[]>>;
  rankedResults: SimilarityResult[];
  activeMaterialId: MaterialId;
}

export const EvidenceExplorerView: React.FC<EvidenceExplorerViewProps> = ({
  atmosphere,
  evidenceRecords,
  setEvidenceRecords,
  rankedResults,
  activeMaterialId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<string>('ALL');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('ALL');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(rankedResults[0]?.record.id || '');
  const [copiedJson, setCopiedJson] = useState(false);
  const [showIngestModal, setShowIngestModal] = useState(false);

  // New Record Form State
  const [newRecord, setNewRecord] = useState<Partial<EvidenceRecord>>({
    missionCampaign: 'ISS SoFIE Solid Fuel Ignition 2024',
    facility: 'ISS FLARE',
    facilityTier: 0.95,
    materialId: activeMaterialId,
    materialName: AEROSPACE_MATERIALS.find(m => m.id === activeMaterialId)?.name || 'PMMA Cast Acrylic',
    testDate: new Date().toISOString().split('T')[0],
    sampleThicknessMm: atmosphere.thicknessMm,
    oxygen: atmosphere.oxygen,
    pressurePsi: atmosphere.pressurePsi,
    gravity: atmosphere.gravity,
    flowVelocity: atmosphere.ventilation,
    measuredFlameSpread: 0.42,
    measuredLoc: 18.5,
    measuredHrr: 340,
    ignitionDelay: 4.5,
    qualityScore: 0.92,
    repeatability: 0.90,
    sampleSize: 6,
    notes: 'Tele-robotic combustion experiment inside CIR rack. Microgravity diffusion flame with wake soot emissions.',
    doiOrReport: 'NASA-CR-2024-884120',
  });

  // Filter records
  const filteredResults = rankedResults.filter(item => {
    const r = item.record;
    const matchesSearch = 
      r.missionCampaign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.facility.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFacility = selectedFacility === 'ALL' || r.facility === selectedFacility;
    const matchesMat = selectedMaterialFilter === 'ALL' || r.materialId === selectedMaterialFilter;

    return matchesSearch && matchesFacility && matchesMat;
  });

  const selectedRecord = evidenceRecords.find(r => r.id === selectedRecordId) || filteredResults[0]?.record;

  const handleCopyJson = () => {
    if (!selectedRecord) return;
    navigator.clipboard.writeText(JSON.stringify(selectedRecord, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: EvidenceRecord = {
      id: `EVD-USER-${Date.now().toString().slice(-4)}`,
      missionCampaign: newRecord.missionCampaign || 'Ad-Hoc Flight Test',
      facility: (newRecord.facility as any) || 'ISS FLARE',
      facilityTier: Number(newRecord.facilityTier) || 0.90,
      materialId: (newRecord.materialId as MaterialId) || 'pmma',
      materialName: AEROSPACE_MATERIALS.find(m => m.id === newRecord.materialId)?.name || 'PMMA Cast Acrylic',
      testDate: newRecord.testDate || new Date().toISOString().split('T')[0],
      sampleThicknessMm: Number(newRecord.sampleThicknessMm) || 1.0,
      oxygen: Number(newRecord.oxygen) || 0.21,
      pressurePsi: Number(newRecord.pressurePsi) || 14.7,
      gravity: Number(newRecord.gravity) || 0.0,
      flowVelocity: Number(newRecord.flowVelocity) || 0.15,
      measuredFlameSpread: Number(newRecord.measuredFlameSpread) || 0.5,
      measuredLoc: Number(newRecord.measuredLoc) || 20.0,
      measuredHrr: Number(newRecord.measuredHrr) || 300,
      ignitionDelay: Number(newRecord.ignitionDelay) || 5.0,
      qualityScore: Number(newRecord.qualityScore) || 0.9,
      repeatability: Number(newRecord.repeatability) || 0.9,
      sampleSize: Number(newRecord.sampleSize) || 5,
      notes: newRecord.notes || 'User ingested test record',
      doiOrReport: newRecord.doiOrReport || 'USER-SPEC-2026',
    };

    setEvidenceRecords(prev => [created, ...prev]);
    setSelectedRecordId(created.id);
    setShowIngestModal(false);
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] mx-auto font-sans text-xs">
      
      {/* LEFT & CENTER (8 Cols): Filter Controls & Mahalanobis-Ranked Evidence Table */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        {/* Controls Toolbar */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns, DOIs, facilities, keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-obsidian-deep/80 border border-obsidian-border px-3.5 py-2 rounded-full text-xs text-slate-200 placeholder-slate-500 w-full focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Facility Filter */}
            <select
              value={selectedFacility}
              onChange={e => setSelectedFacility(e.target.value)}
              className="bg-obsidian-deep/80 border border-obsidian-border text-slate-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">All Facilities ({evidenceRecords.length})</option>
              <option value="ISS FLARE">ISS FLARE</option>
              <option value="Cygnus Saffire">Cygnus Saffire</option>
              <option value="ISS BASS-II">ISS BASS-II</option>
              <option value="ZARM Drop Tower">ZARM Drop Tower</option>
              <option value="Zero-G Parabolic">Zero-G Parabolic</option>
              <option value="WSTF NASA-STD-6001B">WSTF 1g Ground</option>
            </select>

            {/* Material Filter */}
            <select
              value={selectedMaterialFilter}
              onChange={e => setSelectedMaterialFilter(e.target.value)}
              className="bg-obsidian-deep/80 border border-obsidian-border text-slate-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">All Materials</option>
              {AEROSPACE_MATERIALS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {/* Ingest Record Button */}
            <button
              onClick={() => setShowIngestModal(true)}
              className="bg-thermal-amber/20 hover:bg-thermal-amber/30 text-thermal-amber border border-thermal-amber/50 px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-all shadow-md shadow-thermal-amber/15 btn-modern"
            >
              <PlusCircle className="w-4 h-4" />
              Ingest Test Record
            </button>
          </div>
        </div>

        {/* Live Ranked Evidence Table */}
        <div className="glass-panel overflow-hidden flex-1 flex flex-col">
          <div className="px-5 py-3.5 bg-obsidian-deep/80 border-b border-obsidian-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="squircle-icon w-7 h-7 text-accent">
                <Database className="w-3.5 h-3.5" />
              </div>
              <span className="text-white font-heading font-bold text-sm tracking-tight">
                Empirical Microgravity Flame Library ({filteredResults.length} Matched)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Ranked Live by Mahalanobis Similarity Metric d(e,t)
            </span>
          </div>

          <div className="overflow-x-auto max-h-[560px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-obsidian-elevated/80 text-[10px] uppercase text-slate-400 sticky top-0 border-b border-obsidian-border z-10 tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Similarity / Rank</th>
                  <th className="py-2.5 px-4">Campaign / ID</th>
                  <th className="py-2.5 px-4">Facility</th>
                  <th className="py-2.5 px-4">Material Fuel</th>
                  <th className="py-2.5 px-4 text-center">Δ Atm Profile</th>
                  <th className="py-2.5 px-4 text-right">Spread Rate</th>
                  <th className="py-2.5 px-4 text-right">Applicability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-border/40 text-xs">
                {filteredResults.map((item, idx) => {
                  const r = item.record;
                  const isSelected = r.id === selectedRecord?.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRecordId(r.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-accent/15 text-white font-medium' 
                          : 'hover:bg-obsidian-elevated/40 text-slate-300'
                      }`}
                    >
                      {/* Similarity & Rank */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold font-mono-numbers">#{idx + 1}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-numbers ${
                            item.distance < 1.0 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                              : item.distance < 2.5 
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' 
                              : 'bg-slate-700/30 text-slate-400 border border-slate-700'
                          }`}>
                            d = {item.distance.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Campaign / ID */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{r.missionCampaign}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.id} • {r.testDate}</div>
                      </td>

                      {/* Facility */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-obsidian-elevated/80 text-slate-300 border border-obsidian-border text-[10px] font-medium">
                          {r.facility}
                        </span>
                      </td>

                      {/* Material Fuel */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{r.materialName}</div>
                        <div className="text-[10px] text-slate-400 font-mono-numbers">{r.sampleThicknessMm.toFixed(2)} mm</div>
                      </td>

                      {/* Color-Coded Delta Badges */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Delta O2 */}
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono-numbers ${
                            Math.abs(item.deltaO2) < 2.0 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                          }`} title="Delta O2%">
                            ΔO₂:{item.deltaO2 > 0 ? `+${item.deltaO2}` : item.deltaO2}%
                          </span>

                          {/* Delta Pressure */}
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono-numbers ${
                            Math.abs(item.deltaP) < 1.5 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                          }`} title="Delta Pressure psi">
                            ΔP:{item.deltaP > 0 ? `+${item.deltaP}` : item.deltaP}psi
                          </span>

                          {/* Delta Gravity */}
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono-numbers ${
                            Math.abs(item.deltaG) < 0.2 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-sky-950/60 text-sky-300 border border-sky-500/30'
                          }`} title="Delta Gravity m/s²">
                            Δg:{item.deltaG > 0 ? `+${item.deltaG}` : item.deltaG}
                          </span>
                        </div>
                      </td>

                      {/* Spread Rate */}
                      <td className="py-3 px-4 text-right font-mono-numbers font-bold text-thermal-amber whitespace-nowrap">
                        {r.measuredFlameSpread.toFixed(2)} mm/s
                      </td>

                      {/* Applicability */}
                      <td className="py-3 px-4 text-right font-mono-numbers whitespace-nowrap">
                        <span className="text-accent-glow font-bold">
                          {(item.applicability * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL (4 Cols): Split-Screen JSON Schema Inspector */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="glass-panel p-5 text-xs flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2">
                <div className="squircle-icon w-7 h-7 text-accent">
                  <Code className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-heading font-bold text-white text-xs uppercase tracking-tight">
                  EvidenceRecord Schema Inspector
                </h4>
              </div>
              <button
                onClick={handleCopyJson}
                className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-full bg-obsidian-deep/80 border border-obsidian-border transition-colors btn-modern"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedJson ? 'Copied' : 'Copy JSON'}
              </button>
            </div>

            {selectedRecord ? (
              <div className="space-y-3 flex-1 flex flex-col">
                {/* Record Metadata Card */}
                <div className="bg-obsidian-deep/80 p-3 rounded-2xl border border-obsidian-border text-xs space-y-1.5">
                  <div className="text-white font-bold">{selectedRecord.missionCampaign}</div>
                  <div className="text-slate-400 text-[11px]">
                    Ref: <span className="text-accent-glow font-mono">{selectedRecord.doiOrReport}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-obsidian-border/50 text-[11px]">
                    <div>Quality Q: <strong className="text-emerald-400 font-mono-numbers">{selectedRecord.qualityScore}</strong></div>
                    <div>Repeatability R: <strong className="text-emerald-400 font-mono-numbers">{selectedRecord.repeatability}</strong></div>
                    <div>Facility Tier T: <strong className="text-slate-200 font-mono-numbers">{selectedRecord.facilityTier}</strong></div>
                    <div>Sample Count: <strong className="text-slate-200 font-mono-numbers">{selectedRecord.sampleSize}</strong></div>
                  </div>
                </div>

                {/* Formatted JSON Tree */}
                <div className="flex-1 bg-obsidian-deep/90 p-3 rounded-2xl border border-obsidian-border overflow-y-auto max-h-[360px] font-mono text-[11px] leading-relaxed text-slate-300 shadow-inner">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                </div>

                <div className="text-[10px] text-slate-400 mt-2">
                  Verified microgravity combustion experiment record. Fully indexed into Bayesian Gaussian applicability kernel.
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No test record selected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ingest New NASA Test Record Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-panel max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs border border-white/20">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <div className="squircle-icon w-8 h-8 text-thermal-amber">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-base tracking-tight text-white uppercase">
                  Ingest Empirical NASA Flame Test Record
                </h3>
              </div>
              <button 
                onClick={() => setShowIngestModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIngestSubmit} className="my-5 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Mission / Test Campaign</label>
                  <input
                    type="text"
                    required
                    value={newRecord.missionCampaign || ''}
                    onChange={e => setNewRecord(prev => ({ ...prev, missionCampaign: e.target.value }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-accent text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Test Facility</label>
                  <select
                    value={newRecord.facility || 'ISS FLARE'}
                    onChange={e => setNewRecord(prev => ({ ...prev, facility: e.target.value as any }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-accent text-xs cursor-pointer"
                  >
                    <option value="ISS FLARE">ISS FLARE</option>
                    <option value="Cygnus Saffire">Cygnus Saffire</option>
                    <option value="ISS BASS-II">ISS BASS-II</option>
                    <option value="ZARM Drop Tower">ZARM Drop Tower</option>
                    <option value="Zero-G Parabolic">Zero-G Parabolic</option>
                    <option value="WSTF NASA-STD-6001B">WSTF NASA-STD-6001B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Material Fuel</label>
                  <select
                    value={newRecord.materialId || 'pmma'}
                    onChange={e => {
                      const id = e.target.value as MaterialId;
                      const mat = AEROSPACE_MATERIALS.find(m => m.id === id);
                      setNewRecord(prev => ({ 
                        ...prev, 
                        materialId: id,
                        materialName: mat?.name || ''
                      }));
                    }}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-accent text-xs cursor-pointer"
                  >
                    {AEROSPACE_MATERIALS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Oxygen Fraction (X_O2)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    max="0.50"
                    value={newRecord.oxygen || 0.21}
                    onChange={e => setNewRecord(prev => ({ ...prev, oxygen: parseFloat(e.target.value) }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 text-xs font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Total Pressure (psi)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.pressurePsi || 14.7}
                    onChange={e => setNewRecord(prev => ({ ...prev, pressurePsi: parseFloat(e.target.value) }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 text-xs font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Gravity (m/s²)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newRecord.gravity || 0.0}
                    onChange={e => setNewRecord(prev => ({ ...prev, gravity: parseFloat(e.target.value) }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 text-xs font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Flow Velocity (m/s)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRecord.flowVelocity || 0.15}
                    onChange={e => setNewRecord(prev => ({ ...prev, flowVelocity: parseFloat(e.target.value) }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 text-xs font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Flame Spread Rate (mm/s)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRecord.measuredFlameSpread || 0.50}
                    onChange={e => setNewRecord(prev => ({ ...prev, measuredFlameSpread: parseFloat(e.target.value) }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 text-xs font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Sample Thickness (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.sampleThicknessMm || 1.0}
                    onChange={e => setNewRecord(prev => ({ ...prev, sampleThicknessMm: parseFloat(e.target.value) }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 text-xs font-mono-numbers"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">NASA Report / DOI Reference</label>
                  <input
                    type="text"
                    value={newRecord.doiOrReport || ''}
                    onChange={e => setNewRecord(prev => ({ ...prev, doiOrReport: e.target.value }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 text-xs font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">Experimental Notes & Observations</label>
                  <textarea
                    rows={2}
                    value={newRecord.notes || ''}
                    onChange={e => setNewRecord(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-obsidian-deep/80 border border-obsidian-border rounded-xl px-3 py-2 text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-obsidian-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 rounded-full bg-obsidian-elevated text-slate-300 hover:text-white text-xs font-semibold btn-modern"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-thermal-amber text-obsidian-deep font-bold hover:bg-thermal-orange transition-all text-xs uppercase shadow-lg shadow-thermal-amber/25 btn-modern"
                >
                  Commit & Ingest Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
