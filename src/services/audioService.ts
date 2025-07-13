
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
  private backgroundOscillator: OscillatorNode | null = null;

  private async initializeAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume audio context if suspended (common on mobile)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        console.log('AudioContext initialized:', this.audioContext.state);
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
      console.log('Available voices:', voices.length);
      
      if (voices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          console.log('Voices loaded:', speechSynthesis.getVoices().length);
          this.isInitialized = true;
        });
        
        // Wait a bit for voices to load
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        this.isInitialized = true;
      }
    }
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    console.log('Getting preferred voice from', voices.length, 'available voices');
    
    // Prefer English voices with natural sounding names
    const preferredVoices = voices.filter(voice => 
      voice.lang.includes('en') && (
        voice.name.includes('Google') ||
        voice.name.includes('Microsoft') ||
        voice.name.includes('Natural') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Alex') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Daniel')
      )
    );

    const selectedVoice = preferredVoices[0] || voices.find(v => v.lang.includes('en-US')) || voices[0] || null;
    console.log('Selected voice:', selectedVoice?.name, selectedVoice?.lang);
    return selectedVoice;
  }

  private async startBackgroundMusic(volume: number): Promise<void> {
    if (this.backgroundOscillator) {
      this.backgroundOscillator.stop();
      this.backgroundOscillator = null;
    }

    try {
      await this.initializeAudioContext();
      
      const audioContext = this.audioContext;
      if (audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a subtle ambient tone
        oscillator.frequency.setValueAtTime(110, audioContext.currentTime); // A2 note
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume * 0.05, audioContext.currentTime); // Very subtle
        
        oscillator.start();
        this.backgroundOscillator = oscillator;
        
        console.log('Background music started with volume:', volume * 0.05);
      }
    } catch (error) {
      console.log('Background music failed to start:', error);
    }
  }

  async playNarration(config: AudioConfig): Promise<string> {
    console.log('Starting narration with config:', config);
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
      this.utterance.rate = 0.95; // Slightly slower for better comprehension
      this.utterance.pitch = 1.0;
      this.utterance.volume = config.speechVolume || 1.0;

      const preferredVoice = this.getPreferredVoice();
      if (preferredVoice) {
        this.utterance.voice = preferredVoice;
        console.log('Using voice:', preferredVoice.name);
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
            setTimeout(() => this.stop(), 100);
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

        // Ensure speech synthesis is ready
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
        }

        console.log('Starting speech synthesis with text:', config.text.substring(0, 50) + '...');
        speechSynthesis.speak(this.utterance);
      });
    } catch (error) {
      if (this.currentPlaybackId === playbackId) {
        this.stop();
      }
      throw error;
    }
  }

  stop(): void {
    console.log('Stopping audio service');
    this.currentPlaybackId = null;

    // Stop speech synthesis
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    this.utterance = null;

    // Stop background music
    if (this.backgroundOscillator) {
      try {
        this.backgroundOscillator.stop();
      } catch (error) {
        console.log('Error stopping background oscillator:', error);
      }
      this.backgroundOscillator = null;
    }
  }

  isPlaying(): boolean {
    return speechSynthesis.speaking;
  }

  setVolume(speechVolume: number, musicVolume?: number): void {
    if (this.utterance) {
      this.utterance.volume = Math.max(0, Math.min(1, speechVolume));
    }
  }

  // Method to handle user interaction for mobile audio unlock
  async enableAudioForMobile(): Promise<void> {
    try {
      await this.initializeAudioContext();
      
      // Initialize speech synthesis
      await this.initializeSpeechSynthesis();
      
      // Try to play a very short silent utterance to unlock audio
      if ('speechSynthesis' in window) {
        const testUtterance = new SpeechSynthesisUtterance(' ');
        testUtterance.volume = 0.01;
        testUtterance.rate = 2;
        speechSynthesis.speak(testUtterance);
        
        // Wait a moment then cancel
        setTimeout(() => speechSynthesis.cancel(), 100);
      }
      
      console.log('Mobile audio unlocked successfully');
    } catch (error) {
      console.log('Failed to unlock mobile audio:', error);
      throw error;
    }
  }
}

export const audioService = new AudioService();
