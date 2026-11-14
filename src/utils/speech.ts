// Speech Synthesis and Recognition utility for ASTRA AI Agent
import { AISettings } from '../types/physics';

// Global speech synthesis
export function speakText(text: string, settings: AISettings) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!settings.autoSpeak) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = settings.speechRate || 1.0;
    
    // Choose voice based on male/female selection
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (settings.voiceGender === 'male') {
      utterance.pitch = (settings.speechPitch || 1.0) * 0.85; // Deeper tone for male
      selectedVoice = voices.find(v => 
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('david') || 
         v.name.toLowerCase().includes('guy') || 
         v.name.toLowerCase().includes('george') || 
         v.name.toLowerCase().includes('daniel')) && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en')) || null;
    } else {
      utterance.pitch = (settings.speechPitch || 1.0) * 1.15; // Higher, crisp tone for female
      selectedVoice = voices.find(v => 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('zira') || 
         v.name.toLowerCase().includes('samantha') || 
         v.name.toLowerCase().includes('karen') || 
         v.name.toLowerCase().includes('victoria')) && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en')) || null;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

// Speech recognition helper
export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onError: (err: any) => void,
  onEnd: () => void
): any {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      onError(event);
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  } catch (e) {
    return null;
  }
}
