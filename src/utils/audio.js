// Native Web Audio Space Drone Synthesizer

class CosmicDrone {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.oscillators = [];
    this.lfo = null;
    this.delayNode = null;
    this.feedbackGain = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) return;

    // Support standard and webkit audio contexts
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Create Main Gain (volume control)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Create Lowpass Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime); // Keep it deep
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    // Create a slow LFO to modulate filter frequency (creates "breathing" aura)
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow (0.08 Hz)
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(100, this.ctx.currentTime); // sweep filter frequency +/- 100Hz
    this.lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Create Feedback Delay for spatial depth
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.65, this.ctx.currentTime); // 650ms delay
    this.feedbackGain = this.ctx.createGain();
    this.feedbackGain.gain.setValueAtTime(0.45, this.ctx.currentTime); // 45% feedback

    // Connect delay circuit
    filter.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode); // loop feedback

    // Create a Stereo Panner for space widening
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(-0.2, this.ctx.currentTime);
      
      // Connect sound path
      filter.connect(this.masterGain);
      this.delayNode.connect(panner);
      panner.connect(this.masterGain);
    } else {
      filter.connect(this.masterGain);
      this.delayNode.connect(this.masterGain);
    }

    this.masterGain.connect(this.ctx.destination);

    // Build low frequency chord: C2 (65.41Hz), G2 (98.00Hz), C3 (130.81Hz), E3 (164.81Hz)
    const chord = [65.41, 98.00, 130.81, 164.81];
    
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      // Use triangle waves for smooth warmth
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      // Add subtle microtonal detune to create thick analog chorus effect
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, this.ctx.currentTime);

      const oscGain = this.ctx.createGain();
      // Root note gets more volume; higher extensions get less
      const volumes = [0.25, 0.18, 0.15, 0.12];
      oscGain.gain.setValueAtTime(volumes[idx], this.ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(filter);
      
      this.oscillators.push(osc);
    });

    // Start all sound sources
    this.oscillators.forEach(osc => osc.start(0));
    this.lfo.start(0);
  }

  toggle() {
    this.init();

    // Resume AudioContext if it was suspended (browser security autoplay policies)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    
    if (this.isPlaying) {
      // Fade out to prevent popping clicks
      this.masterGain.gain.linearRampToValueAtTime(0, t + 1.2); // 1.2s fade out
      this.isPlaying = false;
    } else {
      // Fade in smoothly
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(0, t);
      this.masterGain.gain.linearRampToValueAtTime(0.7, t + 1.5); // 1.5s fade in
      this.isPlaying = true;
    }

    return this.isPlaying;
  }
}

export const drone = new CosmicDrone();
