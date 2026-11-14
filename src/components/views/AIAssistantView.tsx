import React, { useState, useEffect, useRef } from 'react';
import type { 
  AIMessage, 
  AISettings, 
  AtmosphereState, 
  MaterialId, 
  MaterialProperties, 
  MissionPresetId 
} from '../../types/physics';
import { AEROSPACE_MATERIALS, MISSION_PRESETS } from '../../data/materials';
import { speakText, createSpeechRecognizer } from '../../utils/speech';
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Flame, 
  Wind, 
  Scan, 
  Grid, 
  Sliders, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  Terminal,
  Activity,
  Compass
} from 'lucide-react';

interface AIAssistantViewProps {
  settings: AISettings;
  setSettings: React.Dispatch<React.SetStateAction<AISettings>>;
  atmosphere: AtmosphereState;
  setAtmosphere: React.Dispatch<React.SetStateAction<AtmosphereState>>;
  selectedMaterial: MaterialProperties;
  setSelectedMaterial: (mat: MaterialProperties) => void;
  setActivePresetId: (id: MissionPresetId | null) => void;
  onNavigate: (module: string) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  settings,
  setSettings,
  atmosphere,
  setAtmosphere,
  selectedMaterial,
  setSelectedMaterial,
  setActivePresetId,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'astra',
      text: 'Greetings Commander. I am ASTRA (Automated Spacecraft Thermal & Risk Agent). I monitor microgravity combustion physics, telemetry scaling, and life-support safety. You can speak to me or type commands to navigate pages, adjust atmospheres, or query flight flammability data.',
      timestamp: '00:00:01',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const recognizerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Natural Language Command Execution
  const processCommand = (userInput: string) => {
    const text = userInput.trim();
    if (!text) return;

    // Add user message
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    const lower = text.toLowerCase();
    let responseText = '';
    let actionTaken = '';
    let actionType: AIMessage['actionType'] = 'INFO';

    // 1. Navigation Commands
    if (lower.includes('smoke') || lower.includes('suppression') || lower.includes('detector')) {
      onNavigate('SMOKE_SIMULATOR');
      responseText = 'Navigating to Cabin Smoke Advection-Diffusion & Suppression Simulator.';
      actionTaken = 'Navigated to Smoke Simulator';
      actionType = 'NAVIGATE';
    } else if (lower.includes('flame') || lower.includes('morphology') || lower.includes('visualizer')) {
      onNavigate('FLAME_LAB');
      responseText = 'Navigating to Microgravity Flame Morphology Lab.';
      actionTaken = 'Navigated to Flame Lab';
      actionType = 'NAVIGATE';
    } else if (lower.includes('risk') || lower.includes('decision') || lower.includes('hud') || lower.includes('safety lock')) {
      onNavigate('RISK_DECISION');
      responseText = 'Navigating to Flight Risk & Safety Decision HUD.';
      actionTaken = 'Navigated to Risk Decision View';
      actionType = 'NAVIGATE';
    } else if (lower.includes('scanner') || lower.includes('camera') || lower.includes('surface') || lower.includes('char')) {
      onNavigate('SURFACE_SCANNER');
      responseText = 'Opening Surface Pyrolysis Scanner & Optical Pyrometry View.';
      actionTaken = 'Navigated to Surface Scanner';
      actionType = 'NAVIGATE';
    } else if (lower.includes('evidence') || lower.includes('record') || lower.includes('flight test') || lower.includes('history')) {
      onNavigate('EVIDENCE_EXPLORER');
      responseText = 'Navigating to NASA Empirical Evidence Explorer.';
      actionTaken = 'Navigated to Evidence Explorer';
      actionType = 'NAVIGATE';
    } else if (lower.includes('gap') || lower.includes('matrix') || lower.includes('spec') || lower.includes('research')) {
      onNavigate('RESEARCH_GAP');
      responseText = 'Opening N-Dimensional Research-Gap Matrix & Test Spec Generator.';
      actionTaken = 'Navigated to Research Gap View';
      actionType = 'NAVIGATE';
    } else if (lower.includes('setting') || lower.includes('theme') || lower.includes('voice')) {
      onNavigate('SETTINGS');
      responseText = 'Opening Platform Settings & Mission Configuration.';
      actionTaken = 'Navigated to Settings';
      actionType = 'NAVIGATE';
    }

    // 2. Mission Atmosphere Presets
    else if (lower.includes('artemis')) {
      const p = MISSION_PRESETS[0];
      setActivePresetId(p.id);
      setAtmosphere({ oxygen: p.oxygen, pressurePsi: p.pressurePsi, gravity: p.gravity, ventilation: p.ventilation, thicknessMm: p.thicknessMm });
      responseText = 'Mission atmosphere calibrated to Artemis Lunar Cabin (34% O2, 8.2 psi, 1.62 m/s² Lunar gravity).';
      actionTaken = 'Loaded Artemis Lunar Preset';
      actionType = 'PRESET';
    } else if (lower.includes('iss') || lower.includes('station')) {
      const p = MISSION_PRESETS[1];
      setActivePresetId(p.id);
      setAtmosphere({ oxygen: p.oxygen, pressurePsi: p.pressurePsi, gravity: p.gravity, ventilation: p.ventilation, thicknessMm: p.thicknessMm });
      responseText = 'Mission atmosphere calibrated to ISS Standard Cabin (21% O2, 14.7 psi, 0.00g microgravity).';
      actionTaken = 'Loaded ISS Preset';
      actionType = 'PRESET';
    } else if (lower.includes('mars')) {
      const p = MISSION_PRESETS[2];
      setActivePresetId(p.id);
      setAtmosphere({ oxygen: p.oxygen, pressurePsi: p.pressurePsi, gravity: p.gravity, ventilation: p.ventilation, thicknessMm: p.thicknessMm });
      responseText = 'Mission atmosphere calibrated to Mars Surface Habitat (28% O2, 10.2 psi, 3.71 m/s² gravity).';
      actionTaken = 'Loaded Mars Preset';
      actionType = 'PRESET';
    } else if (lower.includes('eva') || lower.includes('suitlock')) {
      const p = MISSION_PRESETS[3];
      setActivePresetId(p.id);
      setAtmosphere({ oxygen: p.oxygen, pressurePsi: p.pressurePsi, gravity: p.gravity, ventilation: p.ventilation, thicknessMm: p.thicknessMm });
      responseText = 'Mission atmosphere calibrated to Pre-EVA Suitlock (38% O2, 8.0 psi, extreme flammability regime).';
      actionTaken = 'Loaded Pre-EVA Preset';
      actionType = 'PRESET';
    } else if (lower.includes('earth') || lower.includes('wstf') || lower.includes('1g')) {
      const p = MISSION_PRESETS[4];
      setActivePresetId(p.id);
      setAtmosphere({ oxygen: p.oxygen, pressurePsi: p.pressurePsi, gravity: p.gravity, ventilation: p.ventilation, thicknessMm: p.thicknessMm });
      responseText = 'Atmosphere set to Earth 1g White Sands Test Facility Ground Calibration.';
      actionTaken = 'Loaded Earth 1g Preset';
      actionType = 'PRESET';
    }

    // 3. Material Changes
    else if (lower.includes('kapton') || lower.includes('polyimide')) {
      const mat = AEROSPACE_MATERIALS.find(m => m.id === 'kapton');
      if (mat) {
        setSelectedMaterial(mat);
        responseText = 'Selected Polyimide (Kapton FN) Wire Harness insulation as active fuel.';
        actionTaken = 'Switched Material to Kapton';
        actionType = 'MATERIAL';
      }
    } else if (lower.includes('pmma') || lower.includes('acrylic') || lower.includes('viewport')) {
      const mat = AEROSPACE_MATERIALS.find(m => m.id === 'pmma');
      if (mat) {
        setSelectedMaterial(mat);
        responseText = 'Selected PMMA Cast Acrylic optical viewport glazing as active fuel.';
        actionTaken = 'Switched Material to PMMA';
        actionType = 'MATERIAL';
      }
    } else if (lower.includes('nomex') || lower.includes('suit') || lower.includes('fabric')) {
      const mat = AEROSPACE_MATERIALS.find(m => m.id === 'nomex');
      if (mat) {
        setSelectedMaterial(mat);
        responseText = 'Selected Nomex HT90-40 flame-resistant flight suit fabric as active fuel.';
        actionTaken = 'Switched Material to Nomex';
        actionType = 'MATERIAL';
      }
    } else if (lower.includes('silicone') || lower.includes('seal') || lower.includes('gasket')) {
      const mat = AEROSPACE_MATERIALS.find(m => m.id === 'silicone');
      if (mat) {
        setSelectedMaterial(mat);
        responseText = 'Selected Silicone Elastomer hatch pressure seal as active fuel.';
        actionTaken = 'Switched Material to Silicone';
        actionType = 'MATERIAL';
      }
    } else if (lower.includes('ultem') || lower.includes('pei') || lower.includes('3d')) {
      const mat = AEROSPACE_MATERIALS.find(m => m.id === 'ultem');
      if (mat) {
        setSelectedMaterial(mat);
        responseText = 'Selected Ultem 9085 3D-printed ducting thermoplastic as active fuel.';
        actionTaken = 'Switched Material to Ultem';
        actionType = 'MATERIAL';
      }
    }

    // 4. Aerospace Physics Queries
    else if (lower.includes('why') && (lower.includes('blue') || lower.includes('sphere') || lower.includes('shape'))) {
      responseText = 'In microgravity (G* = 0), natural buoyant updrafts vanish. Combustion products do not rise, so molecular diffusion dominates oxidizer transport. This creates a spherical, cooler blue reaction zone rich in CH* chemiluminescence, with hot soot trailing downwind.';
      actionType = 'INFO';
    } else if (lower.includes('safety lock') || lower.includes('why locked')) {
      responseText = 'The Safety Lock engages whenever Evidence Confidence C drops below 0.35. Under NASA flight safety directives, if empirical ground or flight evidence is too sparse, the platform is legally blocked from authorizing uncontained flight usage.';
      actionType = 'INFO';
    } else {
      responseText = `Understood: "${text}". I have logged the request in mission flight telemetry. You can ask me to navigate to any module, calibrate mission presets, or evaluate material flammability parameters.`;
      actionType = 'INFO';
    }

    // Speak response
    speakText(responseText, settings);

    // Append AI response
    const astraMsg: AIMessage = {
      id: `astra-${Date.now()}`,
      sender: 'astra',
      text: responseText,
      timestamp: new Date().toLocaleTimeString(),
      actionTaken,
      actionType,
    };

    setMessages(prev => [...prev, astraMsg]);
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      const recognizer = createSpeechRecognizer(
        transcript => {
          setIsListening(false);
          processCommand(transcript);
        },
        err => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        setIsListening(true);
        try {
          recognizer.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setSttSupported(false);
      }
    }
  };

  return (
    <div className="p-4 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
      
      {/* LEFT COLUMN: Interactive Chat & Voice Agent Viewport (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        
        {/* Agent Header */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cryo-cyan/20 border border-cryo-cyan flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-cryo-glow" />
            </div>
            <div>
              <span className="font-semibold text-white uppercase tracking-micro text-[11px]">
                ASTRA Aerospace Flight & Thermal AI Agent
              </span>
              <div className="text-[9px] text-slate-400">
                Voice Assistant: <strong className="text-cryo-glow">{settings.voiceGender === 'male' ? 'Commander (Male)' : 'Flight Director (Female)'}</strong> • Auto-Speak: {settings.autoSpeak ? 'ON' : 'MUTED'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettings(prev => ({ ...prev, autoSpeak: !prev.autoSpeak }))}
              className="p-1.5 rounded bg-obsidian-deep border border-obsidian-border text-slate-400 hover:text-white"
              title={settings.autoSpeak ? 'Mute AI Voice' : 'Enable AI Voice'}
            >
              {settings.autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-cryo-glow" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <span className="flex items-center gap-1 text-[10px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              <Activity className="w-3 h-3 animate-pulse" /> ONLINE
            </span>
          </div>
        </div>

        {/* Message Log Viewport */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 h-[440px] overflow-y-auto space-y-3 relative flex flex-col">
          {messages.map(msg => {
            const isAstra = msg.sender === 'astra';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${isAstra ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isAstra ? 'bg-cryo-cyan/20 border border-cryo-cyan text-cryo-glow' : 'bg-thermal-amber/20 border border-thermal-amber text-thermal-amber'
                }`}>
                  {isAstra ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`p-3 rounded border text-[11px] leading-relaxed ${
                  isAstra 
                    ? 'bg-obsidian-deep border-obsidian-border text-slate-200' 
                    : 'bg-obsidian-elevated border-obsidian-border text-white'
                }`}>
                  <div className="flex items-center justify-between gap-3 text-[9px] text-slate-500 mb-1 font-mono">
                    <span className="font-bold text-slate-400">{isAstra ? 'ASTRA (AI)' : 'MISSION COMMANDER'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div>{msg.text}</div>
                  
                  {msg.actionTaken && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1 text-[9px] text-cryo-glow font-bold">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ACTION: {msg.actionTaken}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Recognition & Text */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-2 flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded transition-all flex items-center justify-center ${
              isListening 
                ? 'bg-plasma-red text-white animate-pulse shadow-lg shadow-plasma-red/30' 
                : 'bg-obsidian-deep hover:bg-obsidian-elevated text-cryo-glow border border-obsidian-border'
            }`}
            title={isListening ? 'Stop Listening' : 'Speak to ASTRA (Voice Input)'}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') processCommand(inputText);
            }}
            placeholder={isListening ? 'Listening to voice command...' : 'Type a command (e.g. "Take me to smoke simulator", "Set Artemis atmosphere")...'}
            className="flex-1 bg-obsidian-deep border border-obsidian-border rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cryo-cyan"
          />

          <button
            onClick={() => processCommand(inputText)}
            className="p-2 rounded bg-cryo-cyan text-obsidian-deep font-bold hover:bg-cryo-glow transition-all"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: Quick Prompts & Autonomous Platform Capabilities (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        
        {/* Quick Voice & Command Shortcuts */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-obsidian-border">
            <Sparkles className="w-3.5 h-3.5 text-thermal-amber" />
            <span className="font-semibold text-white uppercase text-xs">
              Quick Voice Command Prompts
            </span>
          </div>

          <div className="space-y-1.5">
            {[
              { label: 'Take me to Smoke Simulator', icon: Wind },
              { label: 'Switch to Flame Lab', icon: Flame },
              { label: 'Open Surface Scanner', icon: Scan },
              { label: 'Set atmosphere to Artemis Cabin', icon: Compass },
              { label: 'Switch atmosphere to ISS 0g', icon: Activity },
              { label: 'Change material to Kapton Wire', icon: Sliders },
              { label: 'Why are flames blue in microgravity?', icon: Bot },
              { label: 'Show me Research Gaps', icon: Grid },
            ].map(prompt => (
              <button
                key={prompt.label}
                onClick={() => processCommand(prompt.label)}
                className="w-full p-2 rounded bg-obsidian-deep border border-obsidian-border text-slate-300 hover:text-white hover:border-cryo-cyan/50 text-left flex items-center justify-between text-[11px] transition-colors"
              >
                <span>"{prompt.label}"</span>
                <prompt.icon className="w-3 h-3 text-slate-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* AI Capabilities Information */}
        <div className="bg-obsidian-surface border border-obsidian-border rounded-sm p-4 flex-1 text-[11px] text-slate-300 space-y-2">
          <div className="text-xs font-semibold text-white uppercase tracking-micro flex items-center gap-1.5 pb-2 border-b border-obsidian-border">
            <Terminal className="w-3.5 h-3.5 text-cryo-cyan" />
            Autonomous Platform Control
          </div>
          <p className="text-slate-400">
            ASTRA is equipped with full telemetric hooks into the application state. When commanded, ASTRA can:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[10.5px]">
            <li>Instantly navigate between all 8 modules</li>
            <li>Adjust cabin oxygen (X_O2) and total pressure</li>
            <li>Switch mission presets (*Artemis, ISS, Mars, Pre-EVA, Earth*)</li>
            <li>Swap active flight materials (*Kapton, PMMA, Nomex, Silicone, Sibal, Ultem*)</li>
            <li>Synthesize responses using natural astronaut voice profiles</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
