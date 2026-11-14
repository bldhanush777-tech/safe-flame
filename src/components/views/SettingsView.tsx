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
  Gauge,
  Film
} from 'lucide-react';

interface SettingsViewProps {
  settings: AISettings;
  setSettings: React.Dispatch<React.SetStateAction<AISettings>>;
  onReplayIntro?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
  onReplayIntro,
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
      description: 'Ultra-modern tactical aerospace interface styled with deep carbon obsidian and cyber cyan accents.',
      primaryBg: '#07090E',
      accentColor: '#38BDF8',
      badge: 'CYBER CYAN',
    },
    {
      id: 'starship',
      name: 'Starship Titanium',
      description: 'High-energy combustion flight deck palette featuring dark matte titanium and solar amber glow.',
      primaryBg: '#0A0A0D',
      accentColor: '#F97316',
      badge: 'SOLAR AMBER',
    },
    {
      id: 'nebula',
      name: 'Cosmic Nebula',
      description: 'Futuristic deep space aesthetic with ultraviolet accents and aurora telemetry highlights.',
      primaryBg: '#080612',
      accentColor: '#A855F7',
      badge: 'NEON VIOLET',
    },
    {
      id: 'mars',
      name: 'Martian Surface',
      description: 'Bold planetary exploration palette with dusk obsidian surfaces and plasma coral accents.',
      primaryBg: '#0F0607',
      accentColor: '#EF4444',
      badge: 'SOLAR CRIMSON',
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
    <div className="p-4 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
      
      {/* LEFT COLUMN: Aerospace Themes Selection (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-obsidian-border">
            <div className="flex items-center gap-2.5">
              <div className="squircle-icon w-8 h-8 text-accent">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm tracking-tight text-white">
                  Aerospace Telemetry Color Themes (4 Options)
                </h3>
                <span className="text-[10px] text-slate-400">Dynamic system-wide visual styles calibrated for mission operations</span>
              </div>
            </div>
            <span className="text-[10px] bg-obsidian-deep/80 px-3 py-1 rounded-full border border-white/10 text-slate-300 font-mono">
              ACTIVE: <strong className="text-white uppercase font-bold">{settings.activeTheme}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {themes.map(t => {
              const isSelected = settings.activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-40 group ${
                    isSelected 
                      ? 'ring-2 shadow-2xl scale-[1.02]' 
                      : 'border-white/10 hover:border-white/25 hover:scale-[1.01]'
                  }`}
                  style={{
                    backgroundColor: t.primaryBg,
                    borderColor: isSelected ? t.accentColor : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected ? `0 10px 30px -5px ${t.accentColor}35` : 'none',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-heading font-bold text-white text-sm">{t.name}</span>
                      {isSelected && (
                        <span 
                          className="w-5 h-5 rounded-full text-obsidian-deep flex items-center justify-center shadow-md font-bold"
                          style={{ backgroundColor: t.accentColor }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span 
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full border inline-block font-mono"
                      style={{ color: t.accentColor, borderColor: `${t.accentColor}50`, backgroundColor: `${t.accentColor}15` }}
                    >
                      {t.badge}
                    </span>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: t.accentColor }} />
                      <span className="text-[10px] text-slate-400 font-medium">Accent Swatch</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{t.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound & Telemetry Alerts */}
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-obsidian-border">
            <div className="squircle-icon w-8 h-8 text-thermal-amber">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                Audio Telemetry & Acoustic Alarm Feedback
              </h4>
              <div className="text-[10px] text-slate-400">Synthesized Web Audio sirens, thruster discharges and chirps</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border">
              <div>
                <div className="text-white font-semibold text-xs">Acoustic Sound Effects & Alarms</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Plays synthesized Web Audio warning chirps when smoke detectors breach threshold or suppressant discharges.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={e => setSettings(prev => ({ ...prev, soundEffects: e.target.checked }))}
                className="w-4 h-4 accent-accent rounded cursor-pointer ml-4"
              />
            </div>
          </div>
        </div>

        {/* Cinematic Mission Intro Video Replay */}
        {onReplayIntro && (
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="squircle-icon w-8 h-8 text-accent">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                    Spacecraft Atmospheric Intro Video
                  </h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Replay the high-definition launch visualization with mission audio and ratio controls.
                  </div>
                </div>
              </div>
              <button
                onClick={onReplayIntro}
                className="px-4 py-2 rounded-full bg-accent/20 hover:bg-accent text-accent-glow hover:text-black border border-accent/50 text-xs font-bold uppercase transition-all flex items-center gap-2 shadow-md shadow-accent/20 btn-modern whitespace-nowrap"
              >
                <Film className="w-3.5 h-3.5" />
                Replay Intro
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: AI Voice Agent Configuration (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* Voice Selection Card */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-obsidian-border">
            <div className="flex items-center gap-2.5">
              <div className="squircle-icon w-8 h-8 text-accent">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                  AI Voice Assistant Persona (2 Options)
                </h4>
                <div className="text-[10px] text-slate-400">Web Speech API neural voice profile selection</div>
              </div>
            </div>
            <span className="text-[10px] bg-accent/15 text-accent-glow px-2.5 py-0.5 rounded-full border border-accent/30 font-mono font-semibold">
              ASTRA SPEECH
            </span>
          </div>

          {/* Voice Gender Switcher */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                setSettings(prev => ({ ...prev, voiceGender: 'male' }));
                handleVoiceTest('male');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                settings.voiceGender === 'male'
                  ? 'bg-accent/20 border-accent text-white font-bold shadow-md shadow-accent/20'
                  : 'bg-obsidian-deep/80 border-obsidian-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-heading font-bold text-white">Commander (Male)</span>
                {settings.voiceGender === 'male' && <Check className="w-4 h-4 text-accent-glow" />}
              </div>
              <div className="text-[10px] text-slate-400">Deep baritone astronaut synthesized profile</div>
            </button>

            <button
              onClick={() => {
                setSettings(prev => ({ ...prev, voiceGender: 'female' }));
                handleVoiceTest('female');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                settings.voiceGender === 'female'
                  ? 'bg-accent/20 border-accent text-white font-bold shadow-md shadow-accent/20'
                  : 'bg-obsidian-deep/80 border-obsidian-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-heading font-bold text-white">Flight Director (Female)</span>
                {settings.voiceGender === 'female' && <Check className="w-4 h-4 text-accent-glow" />}
              </div>
              <div className="text-[10px] text-slate-400">Crisp, clear mission control voice persona</div>
            </button>
          </div>

          {/* Auto Speak Toggle */}
          <div className="p-3.5 bg-obsidian-deep/80 rounded-2xl border border-obsidian-border flex items-center justify-between mb-4">
            <div>
              <div className="text-white font-semibold text-xs">Autonomous Voice Responses</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Speak out responses automatically when commands complete.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={e => setSettings(prev => ({ ...prev, autoSpeak: e.target.checked }))}
              className="w-4 h-4 accent-accent rounded cursor-pointer ml-3"
            />
          </div>

          {/* Voice Tuning Sliders */}
          <div className="space-y-3.5 pt-3 border-t border-obsidian-border">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
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
                className="w-full accent-accent cursor-pointer h-2 bg-obsidian-elevated rounded-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
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
                className="w-full accent-accent cursor-pointer h-2 bg-obsidian-elevated rounded-full"
              />
            </div>

            <button
              onClick={() => handleVoiceTest(settings.voiceGender)}
              className="w-full py-2.5 rounded-full bg-obsidian-elevated border border-obsidian-border text-slate-200 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all mt-3 btn-modern"
            >
              <Volume2 className="w-4 h-4 text-accent-glow" />
              Test Voice Persona
            </button>
          </div>
        </div>

        {/* Units Configuration */}
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-obsidian-border">
            <div className="squircle-icon w-8 h-8 text-emerald-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm tracking-tight text-white">
                Aerospace Units & Telemetry Standards
              </h4>
              <div className="text-[10px] text-slate-400">Metric and imperial engineering conversions</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Pressure Display Primary:</span>
            <div className="flex items-center gap-1.5 bg-obsidian-deep/80 p-1 rounded-full border border-white/10">
              {(['psi', 'kpa'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setSettings(prev => ({ ...prev, pressureUnit: u }))}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all ${
                    settings.pressureUnit === u 
                      ? 'bg-accent text-obsidian-deep shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
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
