// Web Audio API generator for Quranic phonetic demonstrations

class QuranAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Plays a melodic vocal-resonant tone matching the specific Tajweed phoneme
  playTajweedPhoneticDemo(type: string, onEnd?: () => void) {
    const ctx = this.getContext();
    if (!ctx) {
      if (onEnd) onEnd();
      return;
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Secondary harmonic oscillator to mimic human vocal tract resonance
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    osc.type = 'sine';
    subOsc.type = 'triangle';

    let duration = 2.0;

    switch (type) {
      case 'imalah': // e.g. Majraha: pitch slides gently upwards/inwards like a soft 'ay'
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.8);
        osc.frequency.linearRampToValueAtTime(290, now + 1.8);
        subOsc.frequency.setValueAtTime(130, now);
        duration = 2.2;
        break;

      case 'sakt': // e.g. Iwaja Qayyima: distinct 2-beat gap in sound
        osc.frequency.setValueAtTime(280, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.setValueAtTime(0.001, now + 0.6); // silent pause for sakt
        gain.gain.setValueAtTime(0.001, now + 1.2);
        gain.gain.setValueAtTime(0.3, now + 1.25); // resume with second word
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
        duration = 2.5;
        break;

      case 'tasheel': // e.g. A'ajamiy: soft glottal easing
        osc.frequency.setValueAtTime(290, now);
        osc.frequency.linearRampToValueAtTime(270, now + 0.4);
        osc.frequency.linearRampToValueAtTime(310, now + 1.5);
        duration = 1.9;
        break;

      case 'ishmam_rawm': // e.g. Ta'manna: strong nasal resonance with smooth contour
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.linearRampToValueAtTime(245, now + 1.2);
        duration = 2.4;
        break;

      case 'idgham_khas': // e.g. Yal-hath-dhalik: quick blend into rich vibration
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(250, now + 1.6);
        duration = 2.0;
        break;

      default:
        osc.frequency.setValueAtTime(270, now);
        duration = 1.8;
    }

    // Envelope
    if (type !== 'sakt') {
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);

    osc.stop(now + duration);
    subOsc.stop(now + duration);

    if (onEnd) {
      setTimeout(() => {
        onEnd();
      }, duration * 1000);
    }
  }
}

export const phoneticAudioEngine = new QuranAudioEngine();
