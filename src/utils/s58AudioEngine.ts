/**
 * BMW S58 3.0L Inline-6 TwinPower Turbo — Atmospheric Web Audio Synthesizer
 *
 * Produces subtle, physically modeled studio acoustics using the Web Audio API:
 * - 6-cylinder 4-stroke firing order harmonics (f0 = RPM / 60 * 3)
 * - Dual-branch M Sport exhaust low-pass resonance & soft saturation
 * - Mono-scroll twin-turbocharger compressor spool & wastegate overrun burbles
 * - Mechanical actuator & latch acoustics for Door, Hood, Central Lock, and Studio controls
 */

export type MechanicalSoundType =
  | 'door-open'
  | 'door-close'
  | 'hood-open'
  | 'hood-close'
  | 'starter-crank'
  | 'bov-flutter'
  | 'lock-chime'
  | 'swatch-click';

export interface S58AudioStatus {
  enabled: boolean;
  engineActive: boolean;
  currentRpm: number;
  targetRpm: number;
  isRevving: boolean;
}

type StatusListener = (status: S58AudioStatus) => void;

function createSoftExhaustCurve(amount = 2.4): Float32Array<ArrayBuffer> {
  const samples = 1024;
  const buffer = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buffer);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

class S58AtmosphericAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineMasterGain: GainNode | null = null;
  private primaryOsc: OscillatorNode | null = null;
  private bankBOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private thirdHarmonicOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private lopeLfo: OscillatorNode | null = null;
  private exhaustFilter: BiquadFilterNode | null = null;
  private intakeFilter: BiquadFilterNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;
  private turboGain: GainNode | null = null;

  private enabled = true;
  private engineActive = false;
  private currentRpm = 780;
  private targetRpm = 780;
  private revHoldUntil = 0;
  private rafId = 0;
  private lastTickTime = 0;
  private listeners = new Set<StatusListener>();
  private gestureBound = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.bindUnlockGestures();
    }
  }

  private bindUnlockGestures(): void {
    if (this.gestureBound || typeof window === 'undefined') return;
    this.gestureBound = true;

    const unlock = () => {
      if (!this.enabled) return;
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('wheel', unlock, { passive: true });
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      try {
        const ctx = new AudioCtx();
        this.ctx = ctx;

        // Master output bus (kept subtle and atmospheric)
        const master = ctx.createGain();
        master.gain.value = this.enabled ? 0.85 : 0;
        master.connect(ctx.destination);
        this.masterGain = master;

        // Engine synthesizer bus
        const engineGain = ctx.createGain();
        engineGain.gain.value = 0.0001;
        engineGain.connect(master);
        this.engineMasterGain = engineGain;

        // Exhaust resonant low-pass filter + subtle harmonic saturation
        // Exhaust resonant low-pass filter + soft harmonic saturation
        const exhaustFilter = ctx.createBiquadFilter();
        exhaustFilter.type = 'lowpass';
        exhaustFilter.frequency.value = 160;
        exhaustFilter.Q.value = 2.6;

        const shaper = ctx.createWaveShaper();
        shaper.curve = createSoftExhaustCurve(2.4);
        shaper.oversample = '2x';

        exhaustFilter.connect(shaper);
        shaper.connect(engineGain);
        this.exhaustFilter = exhaustFilter;

        // Induction intake bandpass filter
        const intakeFilter = ctx.createBiquadFilter();
        intakeFilter.type = 'bandpass';
        intakeFilter.frequency.value = 320;
        intakeFilter.Q.value = 1.8;
        intakeFilter.connect(engineGain);
        this.intakeFilter = intakeFilter;

        // 1. Primary 6-cylinder firing order oscillator — Bank A (f0 = RPM / 60 * 3)
        const primaryOsc = ctx.createOscillator();
        primaryOsc.type = 'sawtooth';
        primaryOsc.frequency.value = 39; // 780 RPM -> 39 Hz
        const primaryGain = ctx.createGain();
        primaryGain.gain.value = 0.38;
        primaryOsc.connect(primaryGain);
        primaryGain.connect(exhaustFilter);
        primaryOsc.start();
        this.primaryOsc = primaryOsc;

        // 1b. Bank B oscillator with subtle 0.35 Hz asymmetric firing pulse detune
        const bankBOsc = ctx.createOscillator();
        bankBOsc.type = 'sawtooth';
        bankBOsc.frequency.value = 39.35;
        const bankBGain = ctx.createGain();
        bankBGain.gain.value = 0.28;
        bankBOsc.connect(bankBGain);
        bankBGain.connect(exhaustFilter);
        bankBOsc.start();
        this.bankBOsc = bankBOsc;

        // 2. Second-harmonic inline-6 metallic rasp oscillator (2 * f0)
        const harmonicOsc = ctx.createOscillator();
        harmonicOsc.type = 'triangle';
        harmonicOsc.frequency.value = 78;
        const harmonicGain = ctx.createGain();
        harmonicGain.gain.value = 0.26;
        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(exhaustFilter);
        harmonicOsc.start();
        this.harmonicOsc = harmonicOsc;

        // 2b. Third-harmonic twin-turbo intake induction growl (3 * f0)
        const thirdHarmonicOsc = ctx.createOscillator();
        thirdHarmonicOsc.type = 'sawtooth';
        thirdHarmonicOsc.frequency.value = 117;
        const thirdHarmonicGain = ctx.createGain();
        thirdHarmonicGain.gain.value = 0.18;
        thirdHarmonicOsc.connect(thirdHarmonicGain);
        thirdHarmonicGain.connect(intakeFilter);
        thirdHarmonicOsc.start();
        this.thirdHarmonicOsc = thirdHarmonicOsc;

        // 3. Deep studio floor sub-harmonic resonance (0.5 * f0)
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = 19.5;
        const subGain = ctx.createGain();
        subGain.gain.value = 0.46;
        subOsc.connect(subGain);
        subGain.connect(engineGain);
        subOsc.start();
        this.subOsc = subOsc;

        // 4. Organic idle lope micro-modulation (4.2 Hz)
        const lopeLfo = ctx.createOscillator();
        lopeLfo.type = 'sine';
        lopeLfo.frequency.value = 4.2;
        const lopeGain = ctx.createGain();
        lopeGain.gain.value = 1.25;
        lopeLfo.connect(lopeGain);
        lopeGain.connect(primaryOsc.frequency);
        lopeGain.connect(bankBOsc.frequency);
        lopeLfo.start();
        this.lopeLfo = lopeLfo;

        // 5. Twin-Turbocharger compressor whistle noise generator
        const noiseLen = ctx.sampleRate * 2;
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;
        noiseSrc.loop = true;

        const turboFilter = ctx.createBiquadFilter();
        turboFilter.type = 'bandpass';
        turboFilter.frequency.value = 2100;
        turboFilter.Q.value = 7.0;

        const turboGain = ctx.createGain();
        turboGain.gain.value = 0.0001;

        noiseSrc.connect(turboFilter);
        turboFilter.connect(turboGain);
        turboGain.connect(engineGain);
        noiseSrc.start();

        this.turboFilter = turboFilter;
        this.turboGain = turboGain;

        this.startKinematicLoop();
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended' && this.enabled) {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private startKinematicLoop(): void {
    if (this.rafId || typeof window === 'undefined') return;
    this.lastTickTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0.004, (now - this.lastTickTime) / 1000));
      this.lastTickTime = now;

      // Return to base idle once rev hold expires
      if (this.revHoldUntil > 0 && now > this.revHoldUntil) {
        this.revHoldUntil = 0;
        this.targetRpm = 780;
        // Trigger M Sport exhaust overrun burbles & BOV flutter on deceleration
        if (this.engineActive && this.enabled && this.currentRpm > 1800) {
          this.playMechanicalSound('bov-flutter');
          this.playExhaustOverrunBurbles();
        }
      }

      const prevRpm = this.currentRpm;
      const accelRate = this.targetRpm > this.currentRpm ? 11.5 : 4.0;
      this.currentRpm += (this.targetRpm - this.currentRpm) * Math.min(1, dt * accelRate);

      if (
        this.ctx &&
        this.primaryOsc &&
        this.bankBOsc &&
        this.harmonicOsc &&
        this.thirdHarmonicOsc &&
        this.subOsc &&
        this.exhaustFilter &&
        this.intakeFilter &&
        this.turboFilter &&
        this.turboGain &&
        this.engineMasterGain
      ) {
        const t = this.ctx.currentTime;
        const f0 = Math.max(28, (this.currentRpm / 60) * 3);

        this.primaryOsc.frequency.setTargetAtTime(f0, t, 0.03);
        this.bankBOsc.frequency.setTargetAtTime(f0 + 0.35, t, 0.03);
        this.harmonicOsc.frequency.setTargetAtTime(f0 * 2, t, 0.03);
        this.thirdHarmonicOsc.frequency.setTargetAtTime(f0 * 3, t, 0.03);
        this.subOsc.frequency.setTargetAtTime(f0 * 0.5, t, 0.04);

        const rpmNorm = Math.max(0, Math.min(1, (this.currentRpm - 780) / 5200));
        const cutoff = 145 + rpmNorm * 880;
        this.exhaustFilter.frequency.setTargetAtTime(cutoff, t, 0.04);
        this.intakeFilter.frequency.setTargetAtTime(320 + rpmNorm * 1100, t, 0.04);

        // Turbo spool responds to positive RPM rate of change and high RPM
        const rpmDelta = Math.max(0, (this.currentRpm - prevRpm) / dt);
        const spoolIntensity = Math.min(1, rpmNorm * 0.70 + (rpmDelta / 4200) * 0.70);
        this.turboFilter.frequency.setTargetAtTime(2100 + spoolIntensity * 2600, t, 0.05);
        this.turboGain.gain.setTargetAtTime(0.002 + spoolIntensity * 0.042, t, 0.05);

        // Master atmospheric engine level: deep rhythmic idle (0.11), muscular when revving (up to 0.22)
        const desiredEngineGain =
          this.engineActive && this.enabled ? 0.11 + rpmNorm * 0.11 : 0.0001;
        this.engineMasterGain.gain.setTargetAtTime(desiredEngineGain, t, 0.12);
      }

      this.notifyListeners();
      this.rafId = window.requestAnimationFrame(tick);
    };

    this.rafId = window.requestAnimationFrame(tick);
  }

  private playExhaustOverrunBurbles(): void {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain || !this.enabled) return;

    const burbleOffsets = [0.05, 0.14, 0.26, 0.39, 0.52];
    burbleOffsets.forEach((delaySec, idx) => {
      const startTime = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      const baseFreq = 96 - idx * 8 + (Math.random() * 10 - 5);
      osc.frequency.setValueAtTime(baseFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(32, startTime + 0.09);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(175, startTime);
      filter.Q.setValueAtTime(3.2, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.12 * (1 - idx * 0.14), startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.095);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.11);
    });
  }

  public setEnabled(nextEnabled: boolean): void {
    this.enabled = nextEnabled;
    if (nextEnabled) {
      const ctx = this.ensureContext();
      if (ctx && this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0.85, ctx.currentTime, 0.08);
      }
    } else if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
    }
    this.notifyListeners();
  }

  public toggleEnabled(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.playMechanicalSound('swatch-click');
    }
    return this.enabled;
  }

  /**
   * Activates or deactivates the continuous S58 idle sound (e.g., when entering the Performance
   * chapter or opening the hood). When transitioning from inactive -> active, triggers a
   * signature warm-start throttle blip.
   */
  public setEngineActive(active: boolean, triggerStartupBlip = true): void {
    const wasActive = this.engineActive;
    this.engineActive = active;

    if (active) {
      this.ensureContext();
      if (!wasActive && triggerStartupBlip) {
        this.triggerRev(3250, 520);
      }
    } else {
      this.targetRpm = 780;
      this.revHoldUntil = 0;
    }
    this.notifyListeners();
  }

  /**
   * Modulates the engine RPM subtly during scroll inside the Performance chapter.
   */
  public setScrollPerformanceRpm(localProgress: number): void {
    if (!this.engineActive) return;
    if (typeof performance !== 'undefined' && performance.now() < this.revHoldUntil) {
      return;
    }
    const clamped = Math.max(0, Math.min(1, localProgress));
    // Gentle swell across the Performance chapter peak (0.35..0.75)
    const arch = Math.sin(clamped * Math.PI);
    this.targetRpm = Math.round(780 + arch * 1150);
  }

  /**
   * Triggers an S58 TwinPower Turbo throttle blip / rev sweep.
   */
  public triggerRev(peakRpm = 5400, durationMs = 780): void {
    this.ensureContext();
    this.engineActive = true;
    this.targetRpm = Math.max(1500, Math.min(7200, peakRpm));
    if (typeof performance !== 'undefined') {
      this.revHoldUntil = performance.now() + durationMs;
    }
    this.notifyListeners();
  }

  /**
   * Plays subtle, tactile mechanical sounds when vehicle components are toggled.
   */
  public playMechanicalSound(type: MechanicalSoundType): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    if (type === 'door-open') {
      // 1. Dual-stage German automotive mechanical latch release (clack-chunk)
      [0, 0.022].forEach((offset, idx) => {
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = idx === 0 ? 'triangle' : 'sawtooth';
        clickOsc.frequency.setValueAtTime(idx === 0 ? 1120 : 640, now + offset);
        clickOsc.frequency.exponentialRampToValueAtTime(180, now + offset + 0.04);
        clickGain.gain.setValueAtTime(0.09, now + offset);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.045);
        clickOsc.connect(clickGain);
        clickGain.connect(this.masterGain!);
        clickOsc.start(now + offset);
        clickOsc.stop(now + offset + 0.05);
      });

      // 2. Frameless coupe window 12mm power-drop micro-servo hum
      const servoOsc = ctx.createOscillator();
      const servoGain = ctx.createGain();
      servoOsc.type = 'sine';
      servoOsc.frequency.setValueAtTime(295, now + 0.035);
      servoOsc.frequency.linearRampToValueAtTime(240, now + 0.18);
      servoGain.gain.setValueAtTime(0.0001, now + 0.035);
      servoGain.gain.linearRampToValueAtTime(0.04, now + 0.06);
      servoGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
      servoOsc.connect(servoGain);
      servoGain.connect(this.masterGain);
      servoOsc.start(now + 0.035);
      servoOsc.stop(now + 0.20);
    } else if (type === 'door-close') {
      // Deep luxury coupe acoustic seal thud (48 Hz fundamental impact + door latch click)
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(88, now);
      thudOsc.frequency.exponentialRampToValueAtTime(26, now + 0.15);
      thudGain.gain.setValueAtTime(0.22, now);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
      thudOsc.connect(thudGain);
      thudGain.connect(this.masterGain);
      thudOsc.start(now);
      thudOsc.stop(now + 0.18);

      // Secondary latch mechanical snap
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(740, now + 0.02);
      snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
      snapGain.gain.setValueAtTime(0.06, now + 0.02);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
      snapOsc.connect(snapGain);
      snapGain.connect(this.masterGain);
      snapOsc.start(now + 0.02);
      snapOsc.stop(now + 0.07);
    } else if (type === 'hood-open') {
      // 1. Dual front kidney hood latch release pops (clack-clack)
      [0, 0.038].forEach((offset, idx) => {
        const latchOsc = ctx.createOscillator();
        const latchGain = ctx.createGain();
        latchOsc.type = 'triangle';
        latchOsc.frequency.setValueAtTime(idx === 0 ? 560 : 440, now + offset);
        latchOsc.frequency.exponentialRampToValueAtTime(120, now + offset + 0.06);
        latchGain.gain.setValueAtTime(0.12, now + offset);
        latchGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.065);
        latchOsc.connect(latchGain);
        latchGain.connect(this.masterGain!);
        latchOsc.start(now + offset);
        latchOsc.stop(now + offset + 0.07);
      });

      // 2. Realistic pneumatic gas-strut pressurized hiss (pssshhhh) as the bonnet lifts
      const hissLen = Math.floor(ctx.sampleRate * 0.42);
      const hissBuf = ctx.createBuffer(1, hissLen, ctx.sampleRate);
      const hissData = hissBuf.getChannelData(0);
      for (let i = 0; i < hissLen; i++) {
        hissData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
      }
      const hissSrc = ctx.createBufferSource();
      hissSrc.buffer = hissBuf;
      const hissFilter = ctx.createBiquadFilter();
      hissFilter.type = 'bandpass';
      hissFilter.frequency.setValueAtTime(2600, now + 0.04);
      hissFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.40);
      hissFilter.Q.value = 3.5;
      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(0.0001, now + 0.04);
      hissGain.gain.linearRampToValueAtTime(0.07, now + 0.08);
      hissGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      hissSrc.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(this.masterGain);
      hissSrc.start(now + 0.04);
      hissSrc.stop(now + 0.44);

      this.setEngineActive(true, true);
    } else if (type === 'hood-close') {
      // Heavy dual front bonnet lock latch slam (ka-thunk)
      const closeOsc = ctx.createOscillator();
      const closeGain = ctx.createGain();
      closeOsc.type = 'sine';
      closeOsc.frequency.setValueAtTime(110, now);
      closeOsc.frequency.exponentialRampToValueAtTime(28, now + 0.14);
      closeGain.gain.setValueAtTime(0.20, now);
      closeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      closeOsc.connect(closeGain);
      closeGain.connect(this.masterGain);
      closeOsc.start(now);
      closeOsc.stop(now + 0.17);

      const metalOsc = ctx.createOscillator();
      const metalGain = ctx.createGain();
      metalOsc.type = 'triangle';
      metalOsc.frequency.setValueAtTime(480, now + 0.015);
      metalOsc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
      metalGain.gain.setValueAtTime(0.09, now + 0.015);
      metalGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      metalOsc.connect(metalGain);
      metalGain.connect(this.masterGain);
      metalOsc.start(now + 0.015);
      metalOsc.stop(now + 0.08);
    } else if (type === 'starter-crank') {
      // High-torque 48V starter motor crank sequence (whir-chk-chk-chk -> ignition roar)
      [0, 0.09, 0.18].forEach((offset, idx) => {
        const crankOsc = ctx.createOscillator();
        const crankGain = ctx.createGain();
        crankOsc.type = 'sawtooth';
        crankOsc.frequency.setValueAtTime(140 + idx * 15, now + offset);
        crankOsc.frequency.exponentialRampToValueAtTime(70, now + offset + 0.07);
        crankGain.gain.setValueAtTime(0.07, now + offset);
        crankGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.075);
        crankOsc.connect(crankGain);
        crankGain.connect(this.masterGain!);
        crankOsc.start(now + offset);
        crankOsc.stop(now + offset + 0.08);
      });
      // Fire up aggressive cold start bark
      this.triggerRev(3400, 750);
    } else if (type === 'bov-flutter') {
      // Twin-turbo compressor blow-off valve flutter (tsst-t-t-t)
      [0, 0.06, 0.13, 0.20].forEach((offset, idx) => {
        const bovLen = Math.floor(ctx.sampleRate * 0.07);
        const bovBuf = ctx.createBuffer(1, bovLen, ctx.sampleRate);
        const bovData = bovBuf.getChannelData(0);
        for (let i = 0; i < bovLen; i++) {
          bovData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
        }
        const bovSrc = ctx.createBufferSource();
        bovSrc.buffer = bovBuf;
        const bovFilter = ctx.createBiquadFilter();
        bovFilter.type = 'bandpass';
        bovFilter.frequency.setValueAtTime(3600 - idx * 300, now + offset);
        bovFilter.Q.value = 5.0;
        const bovGain = ctx.createGain();
        bovGain.gain.setValueAtTime(0.05 * (1 - idx * 0.22), now + offset);
        bovGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.065);
        bovSrc.connect(bovFilter);
        bovFilter.connect(bovGain);
        bovGain.connect(this.masterGain!);
        bovSrc.start(now + offset);
        bovSrc.stop(now + offset + 0.07);
      });
    } else if (type === 'lock-chime') {
      // Subtle BMW central-locking double relay pulse
      [0, 0.11].forEach((offset) => {
        const t0 = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1480, t0);
        osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.035);
        gain.gain.setValueAtTime(0.035, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t0);
        osc.stop(t0 + 0.045);
      });
    } else if (type === 'swatch-click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.035);
    }
  }

  public getStatus(): S58AudioStatus {
    return {
      enabled: this.enabled,
      engineActive: this.engineActive,
      currentRpm: Math.round(this.currentRpm),
      targetRpm: Math.round(this.targetRpm),
      isRevving: this.currentRpm > 1250,
    };
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getStatus();
    this.listeners.forEach((fn) => fn(snapshot));
  }
}

export const s58AudioEngine = new S58AtmosphericAudioEngine();
