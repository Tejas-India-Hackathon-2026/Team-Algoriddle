import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'English' | 'Hindi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  translateInstruction: (instruction: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Header & Nav
  'app.title': { English: 'BIHAR YATRA', Hindi: 'बिहार यात्रा' },
  'app.tagline': { English: 'Beyond The Map', Hindi: 'मानचित्र से परे' },
  'nav.explore': { English: 'Explore', Hindi: 'खोजें' },
  'nav.planTrip': { English: 'Plan Trip', Hindi: 'यात्रा योजना' },
  'nav.hiddenGems': { English: 'Hidden Bihar', Hindi: 'अनदेखा बिहार' },
  'nav.experiences': { English: 'Experiences', Hindi: 'अनुभव' },
  'nav.stays': { English: 'Stays', Hindi: 'आवास' },
  'nav.passport': { English: 'Passport', Hindi: 'पासपोर्ट' },
  'nav.intelligence': { English: 'Tourism Intelligence', Hindi: 'पर्यटन बुद्धिमत्ता' },
  'nav.signIn': { English: 'Sign In', Hindi: 'साइन इन करें' },
  'nav.signOut': { English: 'Sign Out', Hindi: 'साइन आउट' },
  'nav.planMyTrip': { English: 'Plan My Trip', Hindi: 'अपनी यात्रा प्लान करें' },
  

  // Navigation & Route Panel
  'route.setup': { English: 'Route Setup', Hindi: 'मार्ग योजना' },
  'route.startingLocation': { English: 'Starting Location', Hindi: 'प्रारंभिक स्थान' },
  'route.destination': { English: 'Destination', Hindi: 'गंतव्य स्थान' },
  'route.useCurrentLocation': { English: 'Use My Current Location', Hindi: 'मेरे वर्तमान स्थान का उपयोग करें' },
  'route.fastest': { English: '⚡ Fastest Route', Hindi: '⚡ सबसे तेज़ मार्ग' },
  'route.safer': { English: '🛡️ Safer Route', Hindi: '🛡️ सुरक्षित मार्ग' },
  'route.distance': { English: 'Distance', Hindi: 'दूरी' },
  'route.estTime': { English: 'Est. Time', Hindi: 'अनुमानित समय' },
  'route.drivingMode': { English: '🚗 Driving', Hindi: '🚗 ड्राइविंग मोड' },
  'route.startNav': { English: 'Start Navigation', Hindi: 'नेविगेशन शुरू करें' },
  'route.stopNav': { English: 'Stop Navigation', Hindi: 'नेविगेशन बंद करें' },
  'route.recenter': { English: 'My Location', Hindi: 'मेरा स्थान' },
  'route.recalculating': { English: "You're off route. Recalculating...", Hindi: 'आप मार्ग से अलग हैं। पुनः गणना की जा रही है...' },
  'route.destReached': { English: 'Destination reached!', Hindi: 'आप गंतव्य पर पहुँच गए हैं!' },
  'route.noInputs': { English: 'Please select a starting location and destination to plan your journey.', Hindi: 'कृपया अपनी यात्रा की योजना बनाने के लिए प्रारंभिक स्थान और गंतव्य चुनें।' },
  'route.calcError': { English: 'Unable to calculate the route. Please check your connection and try again.', Hindi: 'मार्ग की गणना करने में असमर्थ। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।' },

  // Map Popup Options
  'map.popup.navigateHere': { English: 'Navigate Here', Hindi: 'यहाँ नेविगेट करें' },
  'map.popup.setAsDest': { English: 'Set as Destination', Hindi: 'गंतव्य के रूप में सेट करें' },
  'map.popup.setAsStart': { English: 'Set as Starting Point', Hindi: 'प्रारंभिक बिंदु के रूप में सेट करें' },

  // Chatbot
  'chat.title': { English: 'Yatra Companion AI', Hindi: 'यात्रा साथी एआई' },
  'chat.subtitle': { English: 'Trip Context Intelligent Assistant', Hindi: 'यात्रा संदर्भ बुद्धिमान सहायक' },
  'chat.placeholder': { English: 'Ask a question about your route...', Hindi: 'अपनी यात्रा के बारे में प्रश्न पूछें...' },
  'chat.noTripWarning': { 
    English: 'Please select a starting location and destination first to plan your journey before asking route questions.', 
    Hindi: 'मार्ग संबंधी प्रश्न पूछने से पहले कृपया एक प्रारंभिक स्थान और गंतव्य का चयन करें।' 
  },
  'chat.greeting': {
    English: 'Namaste! I am your Bihar Yatra travel guide. How can I help with your journey today?',
    Hindi: 'नमस्ते! मैं आपका बिहार यात्रा गाइड हूँ। आज आपकी यात्रा में मैं कैसे मदद कर सकता हूँ?'
  },
  'chat.suggested.distance': { English: 'How far is my destination?', Hindi: 'मेरा गंतव्य कितनी दूर है?' },
  'chat.suggested.food': { English: 'Where should I stop for food?', Hindi: 'मुझे भोजन के लिए कहाँ रुकना चाहिए?' },
  'chat.suggested.spots': { English: 'What tourist spots are on this route?', Hindi: 'इस मार्ग पर कौन से पर्यटन स्थल हैं?' },
  'chat.suggested.time': { English: 'What is the estimated travel time?', Hindi: 'अनुमानित यात्रा समय क्या है?' },

  // Misc UI
  'common.loading': { English: 'Loading...', Hindi: 'लोड हो रहा है...' },
  'common.close': { English: 'Close', Hindi: 'बंद करें' },
  'common.error': { English: 'Error', Hindi: 'त्रुटि' },
  'common.speed': { English: 'Current Speed', Hindi: 'वर्तमान गति' },
  'common.nextTurn': { English: 'Next Turn', Hindi: 'अगला मोड़' }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('yatra_language');
    return (saved === 'Hindi' || saved === 'English') ? saved : 'English';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('yatra_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'English' ? 'Hindi' : 'English');
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  // Convert English OSRM navigation step string to Hindi when language is Hindi
  const translateInstruction = (instruction: string): string => {
    if (language === 'English' || !instruction) return instruction;

    let text = instruction;
    
    // Numbers replacement
    text = text.replace(/In (\d+)\s*m/gi, '$1 मीटर बाद');
    text = text.replace(/In ([\d.]+)\s*km/gi, '$1 किमी बाद');

    // Directional instructions
    text = text.replace(/Turn right onto/gi, 'दाईं ओर मुड़ें');
    text = text.replace(/Turn right/gi, 'दाईं ओर मुड़ें');
    text = text.replace(/Turn left onto/gi, 'बाईं ओर मुड़ें');
    text = text.replace(/Turn left/gi, 'बाईं ओर मुड़ें');
    text = text.replace(/Continue straight onto/gi, 'सीधे चलें');
    text = text.replace(/Continue onto/gi, 'आगे बढ़ें');
    text = text.replace(/Keep right at/gi, 'दाएं रखें');
    text = text.replace(/Keep left at/gi, 'बाएं रखें');
    text = text.replace(/Make a U-turn/gi, 'यू-टर्न लें');
    text = text.replace(/Head (north|south|east|west)/gi, 'आगे बढ़ें');
    text = text.replace(/At the roundabout, take the (\d+)(st|nd|rd|th)? exit/gi, 'गोलचक्कर पर $1वां निकास लें');
    text = text.replace(/Destination is on the right/gi, 'गंतव्य आपकी दाईं ओर है');
    text = text.replace(/Destination is on the left/gi, 'गंतव्य आपकी बाईं ओर है');
    text = text.replace(/Destination reached!/gi, 'आप अपने गंतव्य पर पहुँच गए हैं!');
    text = text.replace(/Depart/gi, 'प्रस्थान');
    text = text.replace(/Arrive/gi, 'पहुँचें');

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, translateInstruction }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
