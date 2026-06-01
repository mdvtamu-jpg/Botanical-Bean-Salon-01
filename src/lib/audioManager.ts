// Client-side Web Audio API synthesizer for cozy retro tape lofi noise, warm wind-chimes, and click sound effects

class AudioManager {
  private ctx: AudioContext | null = null;
  private ambientInterval: any = null;
  private noiseNode: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private activeOscillators: OscillatorNode[] = [];

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a soft, organic "wooden tap" or "porcelain tea cup click"
  public playClick(pitch = 220) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      // Soft pitch envelope bending
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {
      console.warn("Audio Context not allowed yet:", e);
    }
  }

  // Play a delightful crystalline "bell pop" when liking or matching items
  public playPop() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5 chord
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5 chord

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.38);
      osc2.stop(this.ctx.currentTime + 0.38);
    } catch (e) {
      console.warn(e);
    }
  }

  // Generate a comforting cozy coffee steam hiss or static vinyl crackle using synthesized brown noise
  private startTapeCrackle() {
    if (!this.ctx || this.noiseNode) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter white noise to brownian noise (which sounds like gentle rain or moving wind)
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // boost amplitude
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    if (this.masterGain) {
      noiseGain.connect(this.masterGain);
    }

    noise.start();
    this.noiseNode = noise;
  }

  // Play a beautiful calming, resonant chord structure (Cmaj7 -> Am9 -> Fmaj7)
  private playCozyChime(frequency: number, duration: number, volume = 0.03) {
    if (!this.ctx || !this.isAmbientPlaying) return;

    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.0); // slow fade-in
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration - 0.5);

      osc.connect(filter);
      filter.connect(gain);
      if (this.masterGain) {
        gain.connect(this.masterGain);
      }

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
      this.activeOscillators.push(osc);

      // cleanup references
      setTimeout(() => {
        this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
      }, duration * 1000);
    } catch (e) {
      // safe catching
    }
  }

  // Start the procedurally generated loop in the background
  public startAmbientLoop() {
    this.initCtx();
    if (!this.ctx || this.isAmbientPlaying) return;

    this.isAmbientPlaying = true;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.startTapeCrackle();

    // Infinite sequence of gentle warm bell-chime notes simulating organic wind chimes in a glasshouse cafe
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
      [220.00, 261.63, 329.63, 392.00, 440.00], // Am9 (A3, C4, E4, G4, A4)
      [174.61, 261.63, 349.23, 440.00], // Fmaj7 (F3, C4, F4, A4)
    ];

    let chordIdx = 0;
    const playNextBar = () => {
      if (!this.isAmbientPlaying) return;

      const currentChord = chords[chordIdx];
      // Play 3 notes from the current chord randomly staggered
      currentChord.forEach((freq, idx) => {
        const stagger = idx * 0.75 + Math.random() * 0.4;
        setTimeout(() => {
          this.playCozyChime(freq, 4.0, 0.04);
        }, stagger * 1000);
      });

      chordIdx = (chordIdx + 1) % chords.length;
      this.ambientInterval = setTimeout(playNextBar, 5000);
    };

    playNextBar();
  }

  // Stop background soundscapes
  public stopAmbientLoop() {
    this.isAmbientPlaying = false;
    clearTimeout(this.ambientInterval);

    try {
      if (this.noiseNode) {
        (this.noiseNode as any).stop();
        this.noiseNode = null;
      }
      this.activeOscillators.forEach(osc => {
        try { osc.stop(); } catch(e) {}
      });
      this.activeOscillators = [];
    } catch (e) {
      console.warn(e);
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1);
    }
  }

  public isAmbientRunning() {
    return this.isAmbientPlaying;
  }
}

export const audio = new AudioManager();
