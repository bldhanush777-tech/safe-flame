import React from 'react';
import type { AISettings, AppTheme } from '../../types/physics';
import { speakText } from '../../utils/speech';
import { playTelemetryChirp } from '../../utils/audio';
import { 
  Settings, 
  Palette, 
  Volume2, 
  Sliders, 
  Check, 
  Moon, 
  Sun, 
  Sparkles, 
  Terminal, 
  Radio, 
  Flame, 
  Layers,
  Gauge
} from 'lucide-react';

interface SettingsViewProps {
  settings: AISettings;
  setSettings: React.Dispatch<React.SetStateAction<AISettings>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
}) => {
  const themes: Array<{
    id: AppTheme;
    name: string;
    description: string;
    primaryBg: string;
    accentColor: string;
    badge: string;
  }> = [
    {
      id: 'obsidian',
      name: 'Deep Space Obsidian',
      description: 'Default tactical aerospace interface modeled after SpaceX Dragon & Palantir Foundry telemetry.',
      primaryBg: '#06080D',
      accentColor: '#38BDF8',
      badge: 'STANDARD FLIGHT',
    },
    {
      id: 'apollo',
      name: 'Apollo Retro Telemetry',
      description: 'Classic monochrome amber CRT phosphor with CRT scanlines from Apollo Guidance Computer consoles.',
      primaryBg: '#0C0A05',
      accentColor: '#F59E0B',
      badge: 'VINTAGE 1969',
    },
    {
      id: 'cryo',
      name: 'Cryo Starship Clean',
      description: 'High-contrast frosty cyan & titanium glass interface for cleanroom and orbital flight deck operations.',
      primaryBg: '#070F1A',
      accentColor: '#06B6D4',
      badge: 'CRYO LAB',
    },
    {
      id: 'mars',
      name: 'Mars Orbital Night',
      description: 'Deep crimson obsidian with plasma red accents tailored for nighttime Martian surface habitat crew quarters.',
      primaryBg: '#0F0507',
      accentColor: '#EF4444',
      badge: 'MARTIAN SURFACE',
    },
  ];

  const handleThemeChange = (newTheme: AppTheme) => {
    setSettings(prev => ({ ...prev, activeTheme: newTheme }));
    document.documentElement.setAttribute('data-theme', newTheme);
    playTelemetryChirp(settings.soundEffects);
  };

  const handleVoiceTest = (gender: 'male' | 'female') => {
    const tempSettings = { ...settings, voiceGender: gender, autoSpeak: true };
    speakText(`ASTRA voice assistant calibrated to ${gender} speech synthesis profile.`, tempSettings);
  };

  return (
    <div className="p-4 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
      
      {/* LEFT COLUMN: Aerospace Themes Selection (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-obsidian-border">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-cryo-cyan" />
              <span className="font-semibold text-white uppercase text-xs">
                Aerospace Telemetry Color Themes (4 Options)
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Active: <strong className="text-white uppercase">{settings.activeTheme}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map(t => {
              const isSelected = settings.activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  style={{ backgroundColor: t.primaryBg }}
                  className={`p-3.5 rounded border text-left transition-all relative flex flex-col justify-between h-36 ${
                    isSelected 
                      ? 'ring-2 ring-cryo-cyan shadow-xl' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{t.name}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-cryo-cyan text-obsidian-deep flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                      style={{ color: t.accentColor, borderColor: `${t.accentColor}50`, backgroundColor: `${t.accentColor}15` }}
                    >
                      {t.badge}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accentColor }} />
                    <span className="text-[9px] text-slate-400">Sample Accent Tone</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound & Telemetry Alerts */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-obsidian-border">
            <Radio className="w-4 h-4 text-thermal-amber" />
            <span className="font-semibold text-white uppercase text-xs">
              Audio Telemetry & Acoustic Alarm Feedback
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold text-xs">Acoustic Sound Effects & Alarms</div>
                <div className="text-[10px] text-slate-400">
                  Plays synthesized Web Audio warning chirps when smoke detectors breach threshold or suppressant discharges.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={e => setSettings(prev => ({ ...prev, soundEffects: e.target.checked }))}
                className="w-4 h-4 accent-cryo-cyan rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Voice Agent Configuration (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        
        {/* Voice Selection Card */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-obsidian-border">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cryo-cyan" />
              <span className="font-semibold text-white uppercase text-xs">
                AI Voice Assistant Persona (2 Options)
              </span>
            </div>
            <span className="text-[10px] bg-cryo-cyan/10 text-cryo-glow px-2 py-0.5 rounded border border-cryo-cyan/20">
              ASTRA SPEECH
            </span>
          </div>

          {/* Voice Gender Switcher */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => {
                setSettings(prev => ({ ...prev, voiceGender: 'male' }));
                handleVoiceTest('male');
              }}
              className={`p-3 rounded border text-left transition-all ${
                settings.voiceGender === 'male'
                  ? 'bg-cryo-cyan/20 border-cryo-cyan text-white font-bold shadow-sm shadow-cryo-cyan/20'
                  : 'bg-obsidian-deep border-obsidian-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs">Commander (Male)</span>
                {settings.voiceGender === 'male' && <Check className="w-3.5 h-3.5 text-cryo-cyan" />}
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Deep baritone astronaut synthesized profile</div>
            </button>

            <button
              onClick={() => {
                setSettings(prev => ({ ...prev, voiceGender: 'female' }));
                handleVoiceTest('female');
              }}
              className={`p-3 rounded border text-left transition-all ${
                settings.voiceGender === 'female'
                  ? 'bg-cryo-cyan/20 border-cryo-cyan text-white font-bold shadow-sm shadow-cryo-cyan/20'
                  : 'bg-obsidian-deep border-obsidian-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs">Flight Director (Female)</span>
                {settings.voiceGender === 'female' && <Check className="w-3.5 h-3.5 text-cryo-cyan" />}
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Crisp, clear mission control voice persona</div>
            </button>
          </div>

          {/* Auto Speak Toggle */}
          <div className="p-3 bg-obsidian-deep rounded border border-obsidian-border flex items-center justify-between mb-4">
            <div>
              <div className="text-white font-bold text-xs">Autonomous Voice Responses</div>
              <div className="text-[10px] text-slate-400">Speak out responses automatically when commands complete.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={e => setSettings(prev => ({ ...prev, autoSpeak: e.target.checked }))}
              className="w-4 h-4 accent-cryo-cyan rounded cursor-pointer"
            />
          </div>

          {/* Voice Tuning Sliders */}
          <div className="space-y-3 pt-2 border-t border-obsidian-border">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Speech Rate</span>
                <span className="text-white font-bold font-mono-numbers">{settings.speechRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.1}
                value={settings.speechRate}
                onChange={e => setSettings(prev => ({ ...prev, speechRate: parseFloat(e.target.value) }))}
                className="w-full accent-cryo-cyan cursor-pointer h-1.5 bg-obsidian-elevated rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Speech Pitch</span>
                <span className="text-white font-bold font-mono-numbers">{settings.speechPitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.1}
                value={settings.speechPitch}
                onChange={e => setSettings(prev => ({ ...prev, speechPitch: parseFloat(e.target.value) }))}
                className="w-full accent-cryo-cyan cursor-pointer h-1.5 bg-obsidian-elevated rounded"
              />
            </div>

            <button
              onClick={() => handleVoiceTest(settings.voiceGender)}
              className="w-full py-2 rounded bg-obsidian-elevated border border-obsidian-border text-slate-200 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-colors mt-2"
            >
              <Volume2 className="w-3.5 h-3.5 text-cryo-glow" />
              Test Voice Persona
            </button>
          </div>
        </div>

        {/* Units Configuration */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-obsidian-border">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white uppercase text-xs">
              Aerospace Units & Telemetry Standards
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Pressure Display Primary:</span>
            <div className="flex items-center gap-1">
              {(['psi', 'kpa'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setSettings(prev => ({ ...prev, pressureUnit: u }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    settings.pressureUnit === u 
                      ? 'bg-cryo-cyan text-obsidian-deep' 
                      : 'bg-obsidian-deep text-slate-400 border border-obsidian-border'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
