
import React from 'react';
import { User, Plus, Home } from 'lucide-react';

interface NavigationProps {
  activeTab: 'daily' | 'create' | 'profile';
  onTabChange: (tab: 'daily' | 'create' | 'profile') => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-sm mx-auto">
        <button
          onClick={() => onTabChange('daily')}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'daily' 
              ? 'text-blue-400 bg-blue-400/10' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Daily</span>
        </button>
        
        <button
          onClick={() => onTabChange('create')}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'create' 
              ? 'text-blue-400 bg-blue-400/10' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Plus className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Create</span>
        </button>
        
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'profile' 
              ? 'text-blue-400 bg-blue-400/10' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <User className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
