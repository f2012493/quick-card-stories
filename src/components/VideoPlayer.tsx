
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Clock } from 'lucide-react';
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

  // Check if we have actual video content (not placeholder URLs)
  const hasRealVideo = videoUrl && !videoUrl.includes('example.com');
  const hasRealAudio = audioUrl && !audioUrl.includes('example.com');

  // Auto-play when active - with better error handling
  useEffect(() => {
    const playMedia = async () => {
      if (isActive && isPlaying && hasRealVideo) {
        try {
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            await videoRef.current.play();
          }
        } catch (error) {
          console.log('Video auto-play prevented:', error);
        }
      } else {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }

      if (isActive && isPlaying && hasRealAudio) {
        try {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
          }
        } catch (error) {
          console.log('Audio auto-play prevented:', error);
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    };

    playMedia();
  }, [isActive, isPlaying, hasRealVideo, hasRealAudio]);

  // Update progress and subtitles
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasRealVideo) return;

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
  }, [subtitleData, hasRealVideo]);

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
      {/* Video Element or Placeholder */}
      {hasRealVideo ? (
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
          <div className="text-white/70 text-center px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <Clock className="w-10 h-10" />
            </div>
            <p className="text-lg font-medium mb-2">Content Ready</p>
            <p className="text-sm text-white/50 max-w-xs">
              This article is available in text format. Video content coming soon.
            </p>
          </div>
        </div>
      )}

      {/* Audio Element (separate for voiceover) */}
      {hasRealAudio && (
        <audio
          ref={audioRef}
          src={audioUrl}
          muted={isMuted}
          loop
        />
      )}

      {/* Progress Bar - only show if we have real video */}
      {hasRealVideo && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className="h-full bg-white transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Subtitles */}
      {currentSubtitle && hasRealVideo && (
        <div className="absolute bottom-8 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-white text-lg font-medium leading-relaxed">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay - only show for real video */}
      {hasRealVideo && (
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
      )}

      {/* Volume Control - only show if we have real media */}
      {(hasRealVideo || hasRealAudio) && (
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
      )}
    </div>
  );
};

export default VideoPlayer;
