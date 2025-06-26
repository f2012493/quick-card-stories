
import React, { useState, useEffect } from 'react';
import VideoFeed from '../components/VideoFeed';
import Navigation from '../components/Navigation';
import Onboarding from '../components/Onboarding';
import ExplainerGenerator from '../components/ExplainerGenerator';
import Profile from '../components/Profile';
import { Toaster } from 'sonner';

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userPreference, setUserPreference] = useState<'reader' | 'creator' | 'both' | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'create' | 'profile'>('daily');

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('smart-explainers-onboarded');
    const savedPreference = localStorage.getItem('smart-explainers-preference') as 'reader' | 'creator' | 'both' | null;
    
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    } else {
      setUserPreference(savedPreference);
    }
  }, []);

  const handleOnboardingComplete = (preference: 'reader' | 'creator' | 'both') => {
    setUserPreference(preference);
    setShowOnboarding(false);
    localStorage.setItem('smart-explainers-onboarded', 'true');
    localStorage.setItem('smart-explainers-preference', preference);
    
    // Set default tab based on preference
    if (preference === 'creator') {
      setActiveTab('create');
    }
  };

  const handleCreateExplainer = () => {
    setActiveTab('create');
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-center">
          <h1 className="text-white font-bold text-lg">Smart Explainers</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-20">
        {activeTab === 'daily' && (
          <VideoFeed onCreateExplainer={handleCreateExplainer} />
        )}
        
        {activeTab === 'create' && (
          <ExplainerGenerator onBack={() => setActiveTab('daily')} />
        )}
        
        {activeTab === 'profile' && (
          <Profile onBack={() => setActiveTab('daily')} />
        )}
      </div>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
