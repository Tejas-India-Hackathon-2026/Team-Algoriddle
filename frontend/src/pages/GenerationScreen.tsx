import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import { generateTrip } from '../services/api.ts';

export default function GenerationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile;

  const stepsList = [
    "Analyzing your interests",
    "Checking destination heritage corridors",
    "Optimizing real road routes",
    "Matching your budget & local fares",
    "Checking travel conditions",
    "Checking live weather forecast",
    "Finding verified local discoveries"
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Guard against direct URL access or incomplete profile data
    if (!profile || !profile.destination || !profile.startingLocation || !profile.startDate) {
      navigate('/planner', { 
        replace: true, 
        state: { error: 'Please fill in your starting point, destination, and starting date before generating your journey.' } 
      });
      return;
    }

    // Animate progression of checks
    if (currentStep < stepsList.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      // Once completed, fetch from backend and navigate
      const triggerAPI = async () => {
        try {
          const trip = await generateTrip(profile);
          if (!trip || !trip.destination || !trip.itinerary) {
            throw new Error("Failed to generate complete itinerary");
          }
          localStorage.setItem('yatra_active_trip', JSON.stringify(trip));
          navigate('/itinerary', { state: { trip } });
        } catch (err: any) {
          console.error("Trip generation error:", err);
          setErrorMsg(err.message || "Failed to generate your personalized itinerary.");
          setTimeout(() => {
            navigate('/planner', { 
              replace: true, 
              state: { error: 'Could not generate itinerary for the selected parameters. Please check your inputs.' } 
            });
          }, 2500);
        }
      };
      triggerAPI();
    }
  }, [currentStep, profile, navigate, stepsList.length]);

  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center px-6">
      <div className="bg-white rounded-[32px] p-8 md:p-12 border border-gray-100 shadow-premium max-w-md w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-full bg-yatra-terracotta/10 flex items-center justify-center text-yatra-terracotta animate-pulse">
            <Sparkles className="w-8 h-8 fill-yatra-gold text-yatra-gold" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-yatra-terracotta border-t-transparent animate-spin"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-yatra-charcoal">✨ Crafting your Bihar journey...</h2>
          <p className="text-xs text-yatra-slate font-light">
            {profile?.startingLocation} → {profile?.destination} ({profile?.duration || 2} Days)
          </p>
        </div>

        {errorMsg ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="text-left space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            {stepsList.map((stepName, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 text-xs transition-all duration-300 ${isCompleted ? 'text-yatra-forest font-semibold' : isCurrent ? 'text-yatra-terracotta font-semibold animate-pulse' : 'text-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isCompleted ? 'bg-yatra-forest/10 border-yatra-forest text-yatra-forest' : isCurrent ? 'border-yatra-terracotta' : 'border-gray-200'}`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>
                  <span>{isCompleted ? `✓ ${stepName}` : stepName}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
