
interface AudioConfig {
  text: string;
  voice?: string;
  backgroundMusic?: boolean;
  musicVolume?: number;
  speechVolume?: number;
}

export class AudioService {
  private audioContext: AudioContext | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;
  private speechAudio: HTMLAudioElement | null = null;
  private gainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;

  // Free background music URLs (royalty-free from Pixabay)
  private backgroundTracks = [
    'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', // Inspiring Corporate
    'https://cdn.pixabay.com/audio/2022/08/02/audio_2165f1a07b.mp3', // Smooth Jazz
    'https://cdn.pixabay.com/audio/2022/03/10/audio_df9bd7e2eb.mp3', // Ambient
    'https://cdn.pixabay.com/audio/2022/01/18/audio_84c1117a1c.mp3', // News Theme
    'https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3', // Soft Background
  ];

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private async generateSpeech(text: string, voice: string = 'alloy'): Promise<string> {
    try {
      // Use Web Speech API for better, free TTS
      if ('speechSynthesis' in window) {
        return new Promise((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Configure for more natural speech
          utterance.rate = 0.85;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          // Try to find a good voice
          const voices = speechSynthesis.getVoices();
          const preferredVoices = voices.filter(v => 
            v.name.includes('Google') || 
            v.name.includes('Microsoft') || 
            v.name.includes('Natural') ||
            v.lang.includes('en-US')
          );
          
          if (preferredVoices.length > 0) {
            utterance.voice = preferredVoices[0];
          }

          utterance.onend = () => resolve('speech-completed');
          utterance.onerror = () => reject(new Error('Speech synthesis failed'));
          
          speechSynthesis.speak(utterance);
        });
      } else {
        throw new Error('Speech synthesis not supported');
      }
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw error;
    }
  }

  private getRandomBackgroundTrack(): string {
    return this.backgroundTracks[Math.floor(Math.random() * this.backgroundTracks.length)];
  }

  async playNarration(config: AudioConfig): Promise<void> {
    try {
      this.initAudioContext();
      
      // Stop any existing audio
      this.stop();

      if (config.backgroundMusic) {
        // Start background music
        this.backgroundAudio = new Audio(this.getRandomBackgroundTrack());
        this.backgroundAudio.loop = true;
        this.backgroundAudio.volume = config.musicVolume || 0.3;
        this.backgroundAudio.crossOrigin = 'anonymous';
        
        try {
          await this.backgroundAudio.play();
        } catch (error) {
          console.log('Background music failed to load, continuing with speech only');
        }
      }

      // Generate and play speech
      await this.generateSpeech(config.text);

    } catch (error) {
      console.error('Audio narration failed:', error);
      throw error;
    }
  }

  stop(): void {
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    // Stop background music
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
      this.backgroundAudio = null;
    }

    // Stop speech audio
    if (this.speechAudio) {
      this.speechAudio.pause();
      this.speechAudio.currentTime = 0;
      this.speechAudio = null;
    }
  }

  setVolume(speechVolume: number, musicVolume?: number): void {
    if (this.speechAudio) {
      this.speechAudio.volume = speechVolume;
    }
    
    if (this.backgroundAudio && musicVolume !== undefined) {
      this.backgroundAudio.volume = musicVolume;
    }
  }

  isPlaying(): boolean {
    return speechSynthesis.speaking || (this.backgroundAudio && !this.backgroundAudio.paused);
  }
}

export const audioService = new AudioService();
