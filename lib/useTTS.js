import { useEffect, useRef, useState } from 'react';
import { parseTeamIdentifier } from './teamPronunciation';

/**
 * Custom hook for Text-to-Speech using Web Speech API
 * Provides local, browser-native speech synthesis
 */
/**
 * Find the best Google US English voice available
 */
function findGoogleUSEnglishVoice(voices) {
  // Priority order for Google US English voices
  const preferred = [
    'Google US English',
    'Google US English Female',
    'Google US English Male',
  ];

  // Try to find exact match
  for (const voiceName of preferred) {
    const voice = voices.find(v => v.name === voiceName);
    if (voice) return voice.name;
  }

  // Fallback: any Google voice with "US" and "English" in the name
  const anyGoogleUS = voices.find(v =>
    v.name.toLowerCase().includes('google') &&
    v.name.toLowerCase().includes('us') &&
    v.name.toLowerCase().includes('english')
  );
  if (anyGoogleUS) return anyGoogleUS.name;

  // Fallback: any Google English voice
  const anyGoogleEnglish = voices.find(v =>
    v.name.toLowerCase().includes('google') &&
    v.name.toLowerCase().includes('english')
  );
  if (anyGoogleEnglish) return anyGoogleEnglish.name;

  // Last resort: any voice with "google" in name
  const anyGoogle = voices.find(v => v.name.toLowerCase().includes('google'));
  if (anyGoogle) return anyGoogle.name;

  return null;
}

export function useTTS() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [defaultVoice, setDefaultVoice] = useState(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      // Load available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        console.log(availableVoices);
        setVoices(availableVoices);

        // Auto-select Google US English voice
        const googleVoice = findGoogleUSEnglishVoice(availableVoices);
        if (googleVoice) {
          setDefaultVoice(googleVoice);
        }
      };

      // Voices might load asynchronously
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  /**
   * Speak text using Web Speech API
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @param {string} options.voice - Voice name (optional, defaults to Google US English)
   * @param {number} options.rate - Speech rate 0.1-10 (default: 1)
   * @param {number} options.pitch - Speech pitch 0-2 (default: 1)
   * @param {number} options.volume - Volume 0-1 (default: 1)
   * @param {boolean} options.queue - If true, queue this utterance. If false, cancel ongoing speech (default: false)
   */
  const speak = (text, options = {}) => {
    if (!isSupported) {
      console.warn('Web Speech API not supported in this browser');
      return;
    }

    // Cancel any ongoing speech (unless queuing is enabled)
    if (!options.queue) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Apply options
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume !== undefined ? options.volume : 1;

    // Set voice (use provided voice, or default to Google US English, or system default)
    const voiceToUse = options.voice || defaultVoice;
    if (voiceToUse) {
      const selectedVoice = voices.find(v =>
        v.name === voiceToUse || v.lang === voiceToUse
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  /**
   * Cancel current speech
   */
  const cancel = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  /**
   * Pause current speech
   */
  const pause = () => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
    }
  };

  /**
   * Resume paused speech
   */
  const resume = () => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  };

  return {
    speak,
    cancel,
    pause,
    resume,
    isSupported,
    isSpeaking,
    voices,
    defaultVoice,
  };
}

/**
 * Announce team being served with proper pronunciation
 * @param {Object} team - Team object with number and name
 * @param {number|string} field - Field number (1-4)
 * @param {Object} tts - TTS instance from useTTS hook
 * @param {Object} options - Additional speech options
 */
export function announceTeamServed(team, field, tts, options = {}) {
  if (!team) return;

  const teamNumber = team.number || team.teamNumber || 'unknown';

  // Parse team number for proper pronunciation
  // Example: "10012A" → "one hundred twelve Alpha"
  const spokenTeam = parseTeamIdentifier(teamNumber);

  const fieldText = field ? ` please proceed to field ${field}` : '';
  const text = `Team ${spokenTeam}${fieldText}.`;
  const text2 = `${spokenTeam} to field ${field}.`;

  // First announcement - cancels any previous speech
  tts.speak(text, {
    rate: options.rate || 0.7,
    volume: options.volume !== undefined ? options.volume : 1.0,
    voice: options.voice,
    queue: false, // Cancel previous speech
  });

  // Second announcement - queued after the first
  tts.speak(text2, {
    rate: 1.0, // Faster repeat
    volume: options.volume !== undefined ? options.volume : 1.0,
    voice: options.voice,
    queue: true, // Queue this after the first
  });
}
