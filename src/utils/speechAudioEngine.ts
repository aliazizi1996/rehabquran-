// Enhanced Web Speech API and Vocal Audio Engine for Quranic Pronunciation & Lessons

class SpeechAudioEngine {
  private isSpeakingNow: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;
  private videoAudioOsc: OscillatorNode | null = null;
  private videoGainNode: GainNode | null = null;
  private keepAliveInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Warm up voices when available
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.getArabicVoices();
        };
      }
    }
  }

  // Force unlock Web Audio and SpeechSynthesis on user interaction
  public unlockAudio() {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }

    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Retrieve available Arabic speech voices
  public getArabicVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    return voices.filter(v => v.lang.startsWith('ar'));
  }

  // Sanitizes special Quranic Unicode glyphs (e.g. U+06DF, U+06EA, U+06EB) that crash or stall browser TTS
  public cleanQuranicWordForSpeech(rawWord: string): string {
    if (!rawWord) return '';

    // Direct clean map for common unique Quranic words
    const directMap: Record<string, string> = {
      'مَجْر۪ىٰهَا': 'مَجْرَاهَا',
      'تَأْمَ۫نَّا': 'تَأْمَنَّا',
      'ءَ۬اعْجَمِيٌّ': 'أَأَعْجَمِيٌّ',
      'عِوَجَا ۜ قَيِّمًا': 'عِوَجًا قَيِّمًا',
      'يَلْهَث ذَّٰلِكَ': 'يَلْهَثْ ذَلِكَ',
      'ءَالذَّكَرَيْنِ': 'آلذَّكَرَيْنِ',
      'ءَآلْآنَ': 'آلْآنَ',
      'ءَاللَّهُ': 'آللَّهُ',
      'فَمَا ءَاتَىٰنِۦَ': 'فَمَا آتَانِيَ',
      'بِئْسَ الاِسْمُ': 'بِئْسَ الاسْمُ',
      'سَلَاسِلَا۟': 'سَلَاسِلَا',
      'لَّكِنَّا۟ هُوَ اللَّهُ': 'لَكِنَّا هُوَ اللَّهُ',
      'قَوَارِيرَا۟': 'قَوَارِيرَا',
      'نَخْلُقكُّم': 'نَخْلُقْكُمْ',
      'ارْكَب مَّعَنَا': 'ارْكَبْ مَعَنَا'
    };

    if (directMap[rawWord]) {
      return directMap[rawWord];
    }

    // Strip Quranic annotations like small high signs: ۫, ۪, ۜ, ۟, ۦ, ۬, ۭ
    let cleaned = rawWord
      .replace(/[\u06D6-\u06ED]/g, '') // Quranic annotation marks
      .replace(/ـ/g, '') // Tatweel
      .replace(/\s+/g, ' ')
      .trim();

    // Replace dagger alef (ٰ) with regular alef (ا) if isolated
    cleaned = cleaned.replace(/ٰ/g, 'ا');

    return cleaned;
  }

  // Pronounce word using Web Speech API with fail-safe fallback
  public speakWord(
    wordText: string,
    options?: {
      rate?: number; // default 0.82 for measured recitation
      pitch?: number; // default 1.0
      volume?: number; // default 1.0
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    this.unlockAudio();

    if (typeof window === 'undefined') {
      options?.onEnd?.();
      return;
    }

    const cleanedText = this.cleanQuranicWordForSpeech(wordText);
    const spokenText = cleanedText || wordText;

    if (!('speechSynthesis' in window)) {
      // Fallback: play acoustic phonetic audio if TTS is unavailable
      this.playAcousticFallbackTone(wordText, options?.onEnd);
      return;
    }

    try {
      // Clear previous queue to prevent overlap
      window.speechSynthesis.cancel();
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      this.currentUtterance = utterance;

      utterance.lang = 'ar-SA';
      utterance.rate = options?.rate ?? 0.82;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;

      // Select preferred Arabic voice if available
      const arabicVoices = this.getArabicVoices();
      if (arabicVoices.length > 0) {
        // Prefer natural or high quality voices (e.g. Maged, Laila, Google Arabic, Tarik)
        const preferred = arabicVoices.find(v => 
          v.name.includes('Natural') || 
          v.name.includes('Google') || 
          v.name.includes('Maged') || 
          v.name.includes('Tarik') ||
          v.lang === 'ar-SA'
        ) || arabicVoices[0];
        utterance.voice = preferred;
      }

      this.isSpeakingNow = true;
      options?.onStart?.();

      utterance.onstart = () => {
        this.isSpeakingNow = true;
        // Chromium workaround: resume every 2s to prevent silent stall
        this.keepAliveInterval = setInterval(() => {
          if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 1500);
      };

      utterance.onend = () => {
        this.isSpeakingNow = false;
        if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error, switching to audio chime fallback:', e);
        this.isSpeakingNow = false;
        if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
        this.playAcousticFallbackTone(wordText, options?.onEnd);
        options?.onError?.(e);
      };

      // Force play
      window.speechSynthesis.speak(utterance);

      // Safari/iOS edge case: if not started within 300ms, call resume
      setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 200);

    } catch (err) {
      console.warn('Failed to speak via Web Speech API:', err);
      this.playAcousticFallbackTone(wordText, options?.onEnd);
    }
  }

  // Stops any ongoing speech immediately
  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    this.isSpeakingNow = false;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingNow;
  }

  // Melodic acoustic fallback tone ensuring audible user feedback in all browsers
  public playAcousticFallbackTone(word: string, onEnd?: () => void) {
    try {
      this.unlockAudio();
      if (!this.audioCtx) {
        onEnd?.();
        return;
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      // Harmonic base frequency
      osc.frequency.setValueAtTime(293.66, now); // D4 note (spiritual resonant frequency)
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.4); // E4
      osc.frequency.linearRampToValueAtTime(392.00, now + 0.9); // G4

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.25);

      setTimeout(() => {
        onEnd?.();
      }, 1250);
    } catch {
      onEnd?.();
    }
  }

  // Interactive Video Player Audio Synthesizer (Ensures unmuted playback has audible spiritual sound)
  public setVideoPlaybackSound(isPlaying: boolean, volume: number, isMuted: boolean, playbackSpeed: number = 1.0) {
    try {
      this.unlockAudio();
      if (!this.audioCtx) return;

      const effectiveVolume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));

      if (isPlaying && effectiveVolume > 0) {
        if (!this.videoAudioOsc) {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          const baseFreq = 220 * playbackSpeed; // Warm resonant vocal tone
          osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);

          gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(effectiveVolume * 0.15, this.audioCtx.currentTime + 0.2);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();

          this.videoAudioOsc = osc;
          this.videoGainNode = gain;
        } else if (this.videoGainNode) {
          this.videoGainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
          this.videoGainNode.gain.linearRampToValueAtTime(effectiveVolume * 0.15, this.audioCtx.currentTime + 0.1);
          if (this.videoAudioOsc) {
            this.videoAudioOsc.frequency.setValueAtTime(220 * playbackSpeed, this.audioCtx.currentTime);
          }
        }
      } else {
        if (this.videoGainNode && this.videoAudioOsc) {
          this.videoGainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
          this.videoGainNode.gain.linearRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.15);
          setTimeout(() => {
            if (this.videoAudioOsc) {
              try {
                this.videoAudioOsc.stop();
                this.videoAudioOsc.disconnect();
              } catch {}
              this.videoAudioOsc = null;
              this.videoGainNode = null;
            }
          }, 200);
        }
      }
    } catch {
      // Safe noop
    }
  }
}

export const speechAudioEngine = new SpeechAudioEngine();
