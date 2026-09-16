class SoundService {
  private audioCtx: AudioContext | null = null;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  /**
   * Synthesizes a crisp physical stamp/click sound using Web Audio API oscillators
   */
  public playStampSound() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Click transient
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.08);

      // Higher metallic click overlay
      const oscHigh = this.audioCtx.createOscillator();
      const gainHigh = this.audioCtx.createGain();

      oscHigh.type = 'sine';
      oscHigh.frequency.setValueAtTime(800, now);
      oscHigh.frequency.exponentialRampToValueAtTime(100, now + 0.04);

      gainHigh.gain.setValueAtTime(0.2, now);
      gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      oscHigh.connect(gainHigh);
      gainHigh.connect(this.audioCtx.destination);

      oscHigh.start(now);
      oscHigh.stop(now + 0.04);
    } catch (e) {
      // AudioContext fallback ignored
    }
  }
}

export const sound = new SoundService();
