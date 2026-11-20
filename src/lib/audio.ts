class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08, delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public click() {
    this.tone(520, 0.06, 'triangle', 0.06);
  }

  public flip() {
    this.tone(420, 0.07, 'sine', 0.06);
    this.tone(580, 0.07, 'sine', 0.05, 0.03);
  }

  public pickup(combo = 1) {
    const pitch = Math.min(980, 520 + combo * 55);
    this.tone(pitch, 0.11, 'sine', 0.08);
    this.tone(pitch * 1.25, 0.12, 'triangle', 0.05, 0.04);
  }

  public match() {
    this.tone(523.25, 0.1, 'sine', 0.07);
    this.tone(659.25, 0.14, 'sine', 0.07, 0.07);
  }

  public hurt() {
    this.tone(190, 0.16, 'sawtooth', 0.07);
    this.tone(140, 0.2, 'triangle', 0.07, 0.06);
  }

  public victory() {
    this.tone(523.25, 0.14, 'sine', 0.08, 0);
    this.tone(659.25, 0.14, 'sine', 0.08, 0.09);
    this.tone(783.99, 0.22, 'sine', 0.08, 0.18);
    this.tone(1046.5, 0.32, 'triangle', 0.07, 0.27);
  }

  public defeat() {
    this.tone(330, 0.18, 'triangle', 0.07, 0);
    this.tone(261.63, 0.28, 'sine', 0.07, 0.14);
  }
}

export const soundEngine = new SoundEngine();
