
import React from 'react';
import { ArrowLeft, Crown, TrendingUp, Heart, Calendar } from 'lucide-react';

interface ProfileProps {
  onBack: () => void;
}

const Profile = ({ onBack }: ProfileProps) => {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="text-white/60 hover:text-white mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* Profile Stats */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Your Smart Explainers Journey</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">3</div>
              <div className="text-sm text-white/60">Cards Created</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">12</div>
              <div className="text-sm text-white/60">Cards Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/20">
          <div className="flex items-center mb-3">
            <Crown className="w-6 h-6 text-amber-400 mr-2" />
            <h3 className="text-lg font-semibold">Upgrade to Pro</h3>
          </div>
          
          <p className="text-white/80 text-sm mb-4">
            Unlock unlimited explainer creation, advanced analytics, and premium templates
          </p>
          
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center text-white/70">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Unlimited explainer cards
            </div>
            <div className="flex items-center text-white/70">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Advanced performance analytics
            </div>
            <div className="flex items-center text-white/70">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Priority AI generation
            </div>
          </div>
          
          <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity">
            Upgrade Now - $9/month
          </button>
        </div>
      </div>

      {/* Performance Stats (Premium Preview) */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
          Your Top Performing Explainers
        </h3>
        
        <div className="space-y-3">
          {[
            { title: 'AI Revolution in Healthcare', views: '2.1K', likes: 89 },
            { title: 'Climate Change Solutions', views: '1.8K', likes: 67 },
            { title: 'Cryptocurrency Explained', views: '1.5K', likes: 52 }
          ].map((explainer, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm">{explainer.title}</h4>
                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                  #{index + 1}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-white/60">
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {explainer.views} views
                </div>
                <div className="flex items-center">
                  <Heart className="w-3 h-3 mr-1" />
                  {explainer.likes} likes
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-400 text-xs text-center">
            📊 Detailed analytics available with Pro upgrade
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-400" />
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">Created "AI in Healthcare"</span>
            <span className="text-white/50">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">Saved explainer about climate</span>
            <span className="text-white/50">1 day ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">Completed onboarding</span>
            <span className="text-white/50">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
