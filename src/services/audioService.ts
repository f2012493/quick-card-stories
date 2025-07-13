
interface AudioConfig {
  text: string;
  voice?: string;
  backgroundMusic?: boolean;
  musicVolume?: number;
  speechVolume?: number;
}

export class AudioService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;
  private isInitialized = false;
  private currentPlaybackId: string | null = null;
  private audioContext: AudioContext | null = null;

  // Free background music URLs
  private backgroundTracks = [
    'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    'https://cdn.pixabay.com/audio/2022/08/02/audio_2165f1a07b.mp3',
    'https://cdn.pixabay.com/audio/2022/03/10/audio_df9bd7e2eb.mp3',
    'https://cdn.pixabay.com/audio/2022/01/18/audio_84c1117a1c.mp3',
  ];

  private async initializeAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume audio context if suspended (common on mobile)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.log('AudioContext initialization failed:', error);
      }
    }
  }

  private async initializeSpeechSynthesis() {
    if (!this.isInitialized && 'speechSynthesis' in window) {
      // Initialize audio context for mobile compatibility
      await this.initializeAudioContext();
      
      // Force load voices
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          this.isInitialized = true;
        });
      } else {
        this.isInitialized = true;
      }
    }
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    
    // Prefer English voices with natural sounding names
    const preferredVoices = voices.filter(voice => 
      voice.lang.includes('en') && (
        voice.name.includes('Google') ||
        voice.name.includes('Microsoft') ||
        voice.name.includes('Natural') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Alex')
      )
    );

    return preferredVoices[0] || voices.find(v => v.lang.includes('en-US')) || voices[0] || null;
  }

  private async startBackgroundMusic(volume: number): Promise<void> {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio = null;
    }

    try {
      await this.initializeAudioContext();
      
      const trackUrl = this.backgroundTracks[Math.floor(Math.random() * this.backgroundTracks.length)];
      this.backgroundAudio = new Audio(trackUrl);
      this.backgroundAudio.volume = Math.max(0, Math.min(1, volume));
      this.backgroundAudio.loop = true;
      this.backgroundAudio.crossOrigin = 'anonymous';
      
      // Add event listeners for mobile compatibility
      this.backgroundAudio.addEventListener('canplaythrough', () => {
        console.log('Background music ready to play');
      });
      
      this.backgroundAudio.addEventListener('error', (e) => {
        console.log('Background music error:', e);
      });
      
      // For mobile: play after user interaction
      await this.backgroundAudio.play();
      console.log('Background music started');
    } catch (error) {
      console.log('Background music failed to load:', error);
      this.backgroundAudio = null;
    }
  }

  async playNarration(config: AudioConfig): Promise<string> {
    await this.initializeSpeechSynthesis();
    
    const playbackId = Math.random().toString(36).substr(2, 9);
    this.currentPlaybackId = playbackId;

    try {
      // Stop any existing playback
      this.stop();

      // Start background music if requested
      if (config.backgroundMusic && config.musicVolume) {
        await this.startBackgroundMusic(config.musicVolume);
      }

      // Create and configure speech utterance
      this.utterance = new SpeechSynthesisUtterance(config.text);
      this.utterance.rate = 0.9;
      this.utterance.pitch = 1.0;
      this.utterance.volume = config.speechVolume || 1.0;

      const preferredVoice = this.getPreferredVoice();
      if (preferredVoice) {
        this.utterance.voice = preferredVoice;
      }

      return new Promise((resolve, reject) => {
        if (!this.utterance) {
          reject(new Error('Failed to create utterance'));
          return;
        }

        this.utterance.onstart = () => {
          console.log('Speech synthesis started');
        };

        this.utterance.onend = () => {
          console.log('Speech synthesis ended');
          if (this.currentPlaybackId === playbackId) {
            this.stop();
            resolve(playbackId);
          }
        };

        this.utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          if (this.currentPlaybackId === playbackId) {
            this.stop();
            reject(new Error(`Speech synthesis failed: ${event.error}`));
          }
        };

        // For mobile compatibility, ensure speech synthesis is ready
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
        }

        speechSynthesis.speak(this.utterance);
        console.log('Speech synthesis queued');
      });
    } catch (error) {
      if (this.currentPlaybackId === playbackId) {
        this.stop();
      }
      throw error;
    }
  }

  stop(): void {
    this.currentPlaybackId = null;

    // Stop speech synthesis
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    this.utterance = null;

    // Stop background music
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
      this.backgroundAudio = null;
    }
  }

  isPlaying(): boolean {
    return speechSynthesis.speaking || (this.backgroundAudio && !this.backgroundAudio.paused);
  }

  setVolume(speechVolume: number, musicVolume?: number): void {
    if (this.utterance) {
      this.utterance.volume = Math.max(0, Math.min(1, speechVolume));
    }
    
    if (this.backgroundAudio && musicVolume !== undefined) {
      this.backgroundAudio.volume = Math.max(0, Math.min(1, musicVolume));
    }
  }

  // Method to handle user interaction for mobile audio unlock
  async enableAudioForMobile(): Promise<void> {
    try {
      await this.initializeAudioContext();
      
      // Play a silent audio to unlock mobile audio
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAAABAAA=');
      await silentAudio.play();
      silentAudio.pause();
      
      console.log('Mobile audio unlocked');
    } catch (error) {
      console.log('Failed to unlock mobile audio:', error);
    }
  }
}

export const audioService = new AudioService();
