
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  videoUrl?: string;
  audioUrl?: string;
  isActive: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  subtitleData?: any;
  className?: string;
}

const VideoPlayer = ({ 
  videoUrl, 
  audioUrl, 
  isActive, 
  isPlaying, 
  onPlayPause,
  subtitleData,
  className = ""
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');

  // Auto-play when active
  useEffect(() => {
    if (isActive && isPlaying) {
      if (videoRef.current) {
        videoRef.current.play().catch(console.error);
      }
      if (audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isActive, isPlaying]);

  // Update progress and subtitles
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        setProgress(progress);
        
        // Update subtitles based on current time
        if (subtitleData?.words) {
          const currentWord = subtitleData.words.find((word: any) => 
            video.currentTime >= word.start && video.currentTime <= word.end
          );
          if (currentWord) {
            setCurrentSubtitle(currentWord.text);
          }
        }
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [subtitleData]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Video Element */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          muted={isMuted}
          loop
          playsInline
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-white/50 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-8 h-8" />
            </div>
            <p className="text-sm">Video processing...</p>
          </div>
        </div>
      )}

      {/* Audio Element (separate for voiceover) */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          muted={isMuted}
          loop
        />
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
        <div 
          className="h-full bg-white transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtitles */}
      {currentSubtitle && (
        <div className="absolute bottom-8 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-white text-lg font-medium leading-relaxed">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            variant="ghost"
            onClick={onPlayPause}
            className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </Button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="absolute top-4 right-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleMute}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayer;
