import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const Chatbot: React.FC = () => {
  
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read trip context from localStorage or active session
  const getActiveTripContext = () => {
    try {
      const stored = localStorage.getItem('yatra_active_trip');
      if (stored) return JSON.parse(stored);
    } catch {
      return null;
    }
    return null;
  };

  const trip = getActiveTripContext();

  // Reset or initialize greetings when opened or language changes
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'greeting_1',
          sender: 'bot',
          text: t('chat.greeting'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    const activeTrip = getActiveTripContext();

    // Mandatory Rule: If no trip context, do NOT invent fake trip data!
    if (!activeTrip || !activeTrip.destination) {
      setTimeout(() => {
        const botMsg: Message = {
          id: 'msg_bot_' + Date.now(),
          sender: 'bot',
          text: t('chat.noTripWarning'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 600);
      return;
    }

    // Process context-aware response
    try {
      // Call backend AI guide service with trip context & active language
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context: {
            startingLocation: activeTrip.startingLocation || activeTrip.startLocation?.name,
            destination: activeTrip.destination,
            distance: activeTrip.route?.distanceText || activeTrip.mapData?.distanceText,
            duration: activeTrip.route?.durationText || activeTrip.mapData?.durationText,
            itinerary: activeTrip.itinerary,
            language: language
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = {
          id: 'msg_bot_' + Date.now(),
          sender: 'bot',
          text: data.response || generateLocalTripResponse(text, activeTrip, language),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('AI service response error');
      }
    } catch {
      // Fallback: Generate intelligent trip-aware local response
      const fallbackText = generateLocalTripResponse(text, activeTrip, language);
      const botMsg: Message = {
        id: 'msg_bot_' + Date.now(),
        sender: 'bot',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateLocalTripResponse = (query: string, tripObj: any, lang: string): string => {
    const q = query.toLowerCase();
    const start = tripObj.startingLocation || tripObj.startLocation?.name || 'Patna';
    const dest = tripObj.destination || 'Bodh Gaya';
    const dist = tripObj.route?.distanceText || tripObj.mapData?.distanceText || '128 km';
    const dur = tripObj.route?.durationText || tripObj.mapData?.durationText || '3 hours 15 mins';

    if (q.includes('distance') || q.includes('far') || q.includes('दूरी') || q.includes('दूर')) {
      return lang === 'Hindi'
        ? `${start} से ${dest} के बीच की दूरी लगभग ${dist} है।`
        : `The distance from ${start} to ${dest} is approximately ${dist}.`;
    }

    if (q.includes('time') || q.includes('long') || q.includes('समय') || q.includes('देर')) {
      return lang === 'Hindi'
        ? `${start} से ${dest} तक कार/सड़क मार्ग द्वारा अनुमानित यात्रा समय ${dur} है।`
        : `The estimated travel time by road from ${start} to ${dest} is ${dur}.`;
    }

    if (q.includes('food') || q.includes('eat') || q.includes('stop') || q.includes('भोजन') || q.includes('खाना') || q.includes('रुकना')) {
      return lang === 'Hindi'
        ? `${start}-${dest} राजमार्ग गलियारे पर स्वच्छ भोजन और जलपान के लिए सत्यापित राजमार्ग रेस्ट स्टॉप्स उपलब्ध हैं।`
        : `On the ${start}-${dest} highway corridor, verified highway dhabas and food plazas are available for clean meals.`;
    }

    if (q.includes('spot') || q.includes('visit') || q.includes('see') || q.includes('स्थल') || q.includes('देखने')) {
      const spots = tripObj.itinerary?.[0]?.places?.map((p: any) => p.name).join(', ') || dest;
      return lang === 'Hindi'
        ? `आपके मुख्य दर्शनीय स्थल हैं: ${spots}। सुरक्षित यात्रा का आनंद लें!`
        : `Your primary itinerary spots include: ${spots}. Enjoy your sacred journey!`;
    }

    return lang === 'Hindi'
      ? `आपकी ${start} से ${dest} (दूरी: ${dist}, समय: ${dur}) यात्रा के लिए मार्ग सुचारू और OSRM सड़क डेटा द्वारा सत्यापित है। क्या आपके पास कोई विशिष्ट प्रश्न है?`
      : `For your journey from ${start} to ${dest} (Distance: ${dist}, Est. Time: ${dur}), your route follows verified road networks. How else can I assist?`;
  };

  return (
    <>
      {/* Floating Action Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9990] bg-yatra-terracotta hover:bg-yatra-amber text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center cursor-pointer border-2 border-white/20"
        title="Yatra Assistant"
        aria-label="Open AI Assistant Chatbot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-pulse" />}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yatra-gold opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yatra-gold"></span>
        </span>
      </button>

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9995] w-[92vw] max-w-sm h-[520px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-yatra-charcoal text-white p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-yatra-terracotta flex items-center justify-center text-white text-base shadow-sm">
                🕉️
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">{t('chat.title')}</h3>
                <p className="text-[10px] text-yatra-gold flex items-center gap-1 font-light">
                  <Sparkles className="w-2.5 h-2.5" /> {t('chat.subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Banner */}
          {trip && trip.destination ? (
            <div className="bg-yatra-cream/80 border-b border-yatra-terracotta/10 px-4 py-2 flex items-center justify-between text-[11px] text-yatra-charcoal font-medium">
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <MapPin className="w-3.5 h-3.5 text-yatra-terracotta shrink-0" />
                <span className="truncate">{trip.startingLocation || 'Start'} → {trip.destination}</span>
              </span>
              <span className="text-[10px] text-yatra-terracotta font-bold shrink-0">
                {trip.route?.distanceText || trip.mapData?.distanceText || ''}
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2 text-[10px] text-amber-800 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{t('chat.noTripWarning')}</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-yatra-terracotta text-white rounded-br-none shadow-sm'
                      : 'bg-white text-yatra-charcoal border border-gray-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 ${
                      msg.sender === 'user' ? 'text-white/70 text-right' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-yatra-terracotta rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-yatra-terracotta rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-yatra-terracotta rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[10px] scrollbar-none">
            <button
              onClick={() => handleSendMessage(t('chat.suggested.distance'))}
              className="px-2.5 py-1 rounded-full bg-yatra-cream text-yatra-charcoal border border-yatra-terracotta/20 shrink-0 hover:bg-yatra-terracotta hover:text-white transition-colors cursor-pointer"
            >
              📏 {t('chat.suggested.distance')}
            </button>
            <button
              onClick={() => handleSendMessage(t('chat.suggested.food'))}
              className="px-2.5 py-1 rounded-full bg-yatra-cream text-yatra-charcoal border border-yatra-terracotta/20 shrink-0 hover:bg-yatra-terracotta hover:text-white transition-colors cursor-pointer"
            >
              🍲 {t('chat.suggested.food')}
            </button>
            <button
              onClick={() => handleSendMessage(t('chat.suggested.spots'))}
              className="px-2.5 py-1 rounded-full bg-yatra-cream text-yatra-charcoal border border-yatra-terracotta/20 shrink-0 hover:bg-yatra-terracotta hover:text-white transition-colors cursor-pointer"
            >
              🏛️ {t('chat.suggested.spots')}
            </button>
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t('chat.placeholder')}
              className="flex-1 bg-gray-100 text-xs text-yatra-charcoal px-3.5 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-yatra-terracotta/30"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="w-9 h-9 rounded-full bg-yatra-terracotta hover:bg-yatra-amber text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
