
import React, { useState, useEffect } from 'react';
import { Clock, Zap, Turtle } from 'lucide-react';

interface ReadingSpeedProps {
  onSpeedChange: (speed: number) => void;
}

const ReadingSpeed = ({ onSpeedChange }: ReadingSpeedProps) => {
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const savedSpeed = localStorage.getItem('reading-speed');
    if (savedSpeed) {
      const parsedSpeed = parseFloat(savedSpeed);
      setSpeed(parsedSpeed);
      onSpeedChange(parsedSpeed);
    }
  }, [onSpeedChange]);

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    onSpeedChange(newSpeed);
    localStorage.setItem('reading-speed', newSpeed.toString());
    setShowControls(false);
  };

  const getSpeedIcon = () => {
    if (speed <= 0.75) return <Turtle className="w-4 h-4" />;
    if (speed >= 1.25) return <Zap className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getSpeedLabel = () => {
    if (speed <= 0.75) return 'Slow';
    if (speed >= 1.25) return 'Fast';
    return 'Normal';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowControls(!showControls)}
        className="flex items-center space-x-1 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors border border-white/20 text-sm"
        title="Reading speed"
      >
        {getSpeedIcon()}
        <span>{getSpeedLabel()}</span>
      </button>

      {showControls && (
        <div className="absolute bottom-12 left-0 bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-white/20 space-y-2 min-w-32">
          <div className="text-white text-xs text-center mb-2">Reading Speed</div>
          {[0.5, 0.75, 1, 1.25, 1.5].map((speedOption) => (
            <button
              key={speedOption}
              onClick={() => changeSpeed(speedOption)}
              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                speed === speedOption ? 'bg-blue-600 text-white' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              {speedOption}x {speedOption <= 0.75 ? '🐢' : speedOption >= 1.25 ? '⚡' : '⏱️'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingSpeed;
