
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: (preference: 'reader' | 'creator' | 'both') => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [selectedPreference, setSelectedPreference] = useState<'reader' | 'creator' | 'both' | null>(null);

  const handleContinue = () => {
    if (selectedPreference) {
      onComplete(selectedPreference);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Smart Explainers
          </h1>
          <p className="text-blue-400 text-lg font-medium mb-1">
            Swipe. Understand. Create.
          </p>
          <p className="text-white/60 text-sm">
            Complex topics made simple
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-white text-xl font-semibold mb-6">
            What brings you here?
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={() => setSelectedPreference('reader')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedPreference === 'reader'
                  ? 'border-blue-400 bg-blue-400/10 text-blue-400'
                  : 'border-white/20 bg-white/5 text-white hover:border-white/40'
              }`}
            >
              <div className="text-left">
                <h3 className="font-semibold mb-1">📚 Stay Smart</h3>
                <p className="text-sm opacity-80">
                  Get daily explainers on trending topics
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedPreference('creator')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedPreference === 'creator'
                  ? 'border-blue-400 bg-blue-400/10 text-blue-400'
                  : 'border-white/20 bg-white/5 text-white hover:border-white/40'
              }`}
            >
              <div className="text-left">
                <h3 className="font-semibold mb-1">✍️ Create Content</h3>
                <p className="text-sm opacity-80">
                  Turn complex topics into engaging explainers
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedPreference('both')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedPreference === 'both'
                  ? 'border-blue-400 bg-blue-400/10 text-blue-400'
                  : 'border-white/20 bg-white/5 text-white hover:border-white/40'
              }`}
            >
              <div className="text-left">
                <h3 className="font-semibold mb-1">🚀 Both</h3>
                <p className="text-sm opacity-80">
                  Read daily explainers and create my own
                </p>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedPreference}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
