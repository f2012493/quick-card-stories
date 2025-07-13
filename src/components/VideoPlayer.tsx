
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { audioService } from '@/services/audioService';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted
  const [progress, setProgress] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Determine if we have real content or need client-side assembly
  const hasClientAssembly = videoUrl === 'client-assembled';
  const hasClientTTS = audioUrl === 'client-side-tts';
  const hasRealVideo = videoUrl && !videoUrl.includes('example.com') && !hasClientAssembly;
  const hasRealAudio = audioUrl && !audioUrl.includes('example.com') && !hasClientTTS;

  // Enable audio on first user interaction
  const enableAudio = async () => {
    if (!audioEnabled) {
      await audioService.enableAudioForMobile();
      setAudioEnabled(true);
      console.log('Audio enabled by user interaction');
    }
  };

  // Client-side video assembly
  useEffect(() => {
    if (!hasClientAssembly || !subtitleData?.scenes || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    let animationId: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Find current scene
      const currentScene = subtitleData.scenes.find((scene: any) => 
        elapsed >= scene.startTime && elapsed <= scene.endTime
      );

      if (currentScene) {
        // Draw background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text content
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        
        const lines = currentScene.text.split(' ');
        const wordsPerLine = 6;
        for (let i = 0; i < lines.length; i += wordsPerLine) {
          const line = lines.slice(i, i + wordsPerLine).join(' ');
          ctx.fillText(line, canvas.width / 2, 280 + (i / wordsPerLine) * 45);
        }

        // Update subtitles
        const currentWord = currentScene.words?.find((word: any) => 
          elapsed >= word.start && elapsed <= word.end
        );
        if (currentWord) {
          setCurrentSubtitle(currentWord.text);
        }
      }

      setCurrentTime(elapsed);
      setProgress((elapsed / (subtitleData.totalDuration || 1)) * 100);

      if (elapsed < (subtitleData.totalDuration || 0) && isPlaying) {
        animationId = requestAnimationFrame(animate);
      }
    };

    if (isActive && isPlaying) {
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [hasClientAssembly, subtitleData, isActive, isPlaying]);

  // Client-side TTS with improved audio handling
  useEffect(() => {
    if (!hasClientTTS || !isActive || !subtitleData?.subtitles) return;

    const playAudio = async () => {
      if (!audioEnabled) {
        console.log('Audio not enabled yet, waiting for user interaction');
        return;
      }

      if (isPlaying && !isMuted) {
        try {
          const text = subtitleData.subtitles.map((word: any) => word.text).join(' ');
          console.log('Starting TTS for text:', text.substring(0, 100) + '...');
          
          await audioService.playNarration({
            text,
            speechVolume: 0.8,
            backgroundMusic: true,
            musicVolume: 0.1
          });
        } catch (error) {
          console.error('TTS playback failed:', error);
        }
      } else {
        audioService.stop();
      }
    };

    playAudio();

    return () => {
      audioService.stop();
    };
  }, [hasClientTTS, isActive, isPlaying, isMuted, subtitleData, audioEnabled]);

  // Regular video/audio handling
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

  // Update progress and subtitles for real video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasRealVideo) return;

    const updateProgress = () => {
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        setProgress(progress);
        
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

  const handlePlayPause = async () => {
    await enableAudio(); // Enable audio on first interaction
    onPlayPause();
  };

  return (
    <div className={`relative w-full h-full ${className}`} onClick={enableAudio}>
      {/* Audio permission notice */}
      {!audioEnabled && (hasClientTTS || hasRealAudio) && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-white text-sm">
              🔊 Tap anywhere to enable audio
            </p>
          </div>
        </div>
      )}

      {/* Client-assembled video canvas */}
      {hasClientAssembly && (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
          style={{ display: isActive ? 'block' : 'none' }}
        />
      )}

      {/* Regular video element */}
      {hasRealVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          muted={isMuted}
          loop
          playsInline
        />
      )}

      {/* Fallback display */}
      {!hasRealVideo && !hasClientAssembly && (
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

      {/* Audio element for separate voiceover */}
      {hasRealAudio && (
        <audio
          ref={audioRef}
          src={audioUrl}
          muted={isMuted}
          loop
        />
      )}

      {/* Progress bar */}
      {(hasRealVideo || hasClientAssembly || hasClientTTS) && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className="h-full bg-white transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Subtitles */}
      {currentSubtitle && (hasRealVideo || hasClientAssembly || hasClientTTS) && (
        <div className="absolute bottom-8 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-white text-lg font-medium leading-relaxed">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {(hasRealVideo || hasClientAssembly || hasClientTTS) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              variant="ghost"
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </Button>
          </div>
        </div>
      )}

      {/* Volume control */}
      {(hasRealVideo || hasRealAudio || hasClientTTS) && (
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
