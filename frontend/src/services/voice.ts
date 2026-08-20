// Web Speech API interface definitions
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

export function speak(text: string, lang = 'en-IN') {
  if ('speechSynthesis' in window) {
    // Cancel any active speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (lang.startsWith('hi')) {
      selectedVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      utterance.lang = 'hi-IN';
    } else {
      selectedVoice = voices.find(v => v.lang.includes('en') || v.lang.includes('IN'));
      utterance.lang = 'en-IN';
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech Synthesis is not supported in this browser.");
  }
}

export function startListening(onResult: (text: string) => void, onError?: (err: string) => void, lang = 'en-IN') {
  const SpeechRecognition = (window as unknown as Window).SpeechRecognition || (window as unknown as Window).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    if (onError) onError("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
    return null;
  }
  
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = lang.startsWith('hi') ? 'hi-IN' : 'en-IN';
  
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };
  
  if (onError) {
    recognition.onerror = (event: { error: string }) => {
      onError(event.error);
    };
  }
  
  recognition.start();
  return recognition;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
