/* Original chiptune music and sound effects synthesized with WebAudio. */
(function () {
  const TRACKS = {
    meadow: {
      bpm: 118,
      lead: [76, 79, 84, 79, 76, 79, 86, 84, 81, 79, 76, 74, 76, 79, 84, 76, 77, 81, 84, 81, 79, 77, 76, 74, 76, 79, 81, 79, 76, 74, 72, 0],
      bass: [48, 0, 0, 0, 48, 0, 55, 0, 53, 0, 0, 0, 48, 0, 55, 0, 53, 0, 0, 0, 50, 0, 55, 0, 48, 0, 55, 0, 48, 0, 0, 0],
    },
    forest: {
      bpm: 102,
      lead: [69, 0, 72, 76, 79, 76, 72, 0, 74, 0, 77, 74, 72, 69, 67, 0, 65, 69, 72, 69, 67, 65, 64, 0, 69, 0, 72, 76, 74, 72, 69, 0],
      bass: [45, 0, 0, 0, 45, 0, 48, 0, 41, 0, 0, 0, 43, 0, 38, 0, 41, 0, 0, 0, 45, 0, 43, 0, 45, 0, 48, 0, 45, 0, 0, 0],
    },
    cave: {
      bpm: 126,
      lead: [62, 0, 65, 0, 69, 0, 65, 62, 60, 0, 62, 0, 65, 0, 62, 0, 58, 0, 62, 65, 69, 67, 65, 0, 62, 0, 58, 0, 55, 0, 0, 0],
      bass: [38, 0, 38, 0, 38, 0, 45, 0, 36, 0, 36, 0, 41, 0, 43, 0, 34, 0, 34, 0, 41, 0, 38, 0, 38, 0, 45, 0, 38, 0, 0, 0],
    },
    boss: {
      bpm: 146,
      lead: [60, 60, 72, 0, 67, 0, 70, 0, 72, 0, 70, 67, 65, 0, 67, 0, 60, 60, 72, 0, 75, 0, 72, 0, 70, 67, 65, 0, 60, 0, 0, 0],
      bass: [36, 0, 36, 0, 36, 0, 43, 0, 39, 0, 39, 0, 41, 0, 36, 0, 36, 0, 36, 0, 38, 0, 38, 0, 36, 0, 43, 0, 36, 0, 36, 0],
    },
  };

  const AudioSys = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    noise: null,
    started: false,
    muted: false,
    trackName: null,
    step: 0,
    nextTime: 0,
    timer: null,
    duckUntil: 0,

    unlock() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) {
        const ctx = new AC();
        this.ctx = ctx;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 18;
        comp.ratio.value = 3.2;
        comp.attack.value = 0.003;
        comp.release.value = 0.2;
        this.master = ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.9;
        this.master.connect(comp);
        comp.connect(ctx.destination);
        this.musicGain = ctx.createGain();
        this.musicGain.gain.value = 0.22;
        this.musicGain.connect(this.master);
        this.sfxGain = ctx.createGain();
        this.sfxGain.gain.value = 0.42;
        this.sfxGain.connect(this.master);
        const n = ctx.sampleRate;
        const buf = ctx.createBuffer(1, n, n);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
        this.noise = buf;
        this.timer = setInterval(() => this.pump(), 50);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.started = true;
      if (!this.trackName) this.playTrack("meadow");
    },

    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.9;
    },

    playTrack(name) {
      if (!TRACKS[name]) name = "meadow";
      if (this.trackName === name) return;
      this.trackName = name;
      this.step = 0;
      if (this.ctx) this.nextTime = this.ctx.currentTime + 0.06;
    },

    duck(sec) {
      if (!this.ctx) return;
      this.duckUntil = this.ctx.currentTime + sec;
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.05);
      this.musicGain.gain.setTargetAtTime(0.22, this.ctx.currentTime + sec, 0.08);
    },

    pump() {
      if (!this.started || !this.trackName || !this.ctx) return;
      if (this.nextTime < this.ctx.currentTime) this.nextTime = this.ctx.currentTime + 0.02;
      const track = TRACKS[this.trackName];
      const stepDur = 60 / track.bpm / 2;
      const len = track.lead.length;
      while (this.nextTime < this.ctx.currentTime + 0.28) {
        this.scheduleStep(track, this.step % len, this.nextTime);
        this.step++;
        this.nextTime += stepDur;
      }
    },

    scheduleStep(track, i, time) {
      try {
        const midiLead = track.lead[i];
        const midiBass = track.bass[i];
        if (midiLead) this.tone(this.musicGain, time, midiToFreq(midiLead), 0.16, "square", 0.045, 1500);
        if (midiBass) this.tone(this.musicGain, time, midiToFreq(midiBass), 0.22, "triangle", 0.09, 400);
        if (i % 8 === 0) this.kick(time);
        if (i % 8 === 4) this.snare(time);
        if (i % 2 === 1) this.hat(time, 0.035);
      } catch (err) { /* keep the game running if a note fails */ }
    },

    tone(bus, time, freq, dur, type, peak, cutoff) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(40, freq), time);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(filter);
      filter.connect(g);
      g.connect(bus);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    },

    noiseBurst(time, dur, peak, filterType, freq) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(peak, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      src.start(time);
      src.stop(time + dur);
    },

    kick(time) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(170, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.34, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.17);
    },

    snare(time) {
      this.noiseBurst(time, 0.12, 0.12, "bandpass", 1800);
    },

    hat(time, peak) {
      this.noiseBurst(time, 0.04, peak || 0.05, "highpass", 7000);
    },

    sfx(name) {
      if (!this.started || !this.ctx) return;
      const t = this.ctx.currentTime;
      const g = this.sfxGain;
      try {
        if (name === "attack") {
          this.tone(g, t, 620, 0.09, "square", 0.08, 2200);
          this.noiseBurst(t, 0.07, 0.1, "highpass", 1200);
        } else if (name === "hit") {
          this.tone(g, t, 220, 0.1, "square", 0.1, 900);
          this.noiseBurst(t, 0.08, 0.14, "bandpass", 600);
        } else if (name === "hurt") {
          this.tone(g, t, 160, 0.18, "sawtooth", 0.1, 700);
        } else if (name === "jump") {
          const o = this.ctx.createOscillator();
          o.type = "square";
          o.frequency.setValueAtTime(420, t);
          o.frequency.exponentialRampToValueAtTime(760, t + 0.1);
          const gn = this.ctx.createGain();
          gn.gain.setValueAtTime(0.0001, t);
          gn.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
          gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
          o.connect(gn); gn.connect(g);
          o.start(t); o.stop(t + 0.13);
        } else if (name === "land") {
          this.noiseBurst(t, 0.06, 0.06, "lowpass", 400);
        } else if (name === "coin") {
          this.tone(g, t, 880, 0.07, "square", 0.07, 3000);
          this.tone(g, t + 0.07, 1320, 0.1, "square", 0.07, 3000);
        } else if (name === "heal") {
          this.tone(g, t, 523, 0.08, "triangle", 0.1, 2000);
          this.tone(g, t + 0.08, 784, 0.12, "triangle", 0.1, 2000);
        } else if (name === "level") {
          this.duck(1.3);
          [523, 659, 784, 1046].forEach((f, i) => this.tone(g, t + i * 0.11, f, 0.22, "triangle", 0.12, 2400));
        } else if (name === "skill") {
          const o = this.ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(280, t);
          o.frequency.exponentialRampToValueAtTime(980, t + 0.22);
          const filter = this.ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 1800;
          const gn = this.ctx.createGain();
          gn.gain.setValueAtTime(0.0001, t);
          gn.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
          gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          o.connect(filter); filter.connect(gn); gn.connect(g);
          o.start(t); o.stop(t + 0.3);
          this.noiseBurst(t, 0.16, 0.08, "bandpass", 1400);
        } else if (name === "nova") {
          this.duck(0.8);
          this.tone(g, t, 196, 0.3, "sawtooth", 0.1, 800);
          this.tone(g, t + 0.05, 784, 0.4, "triangle", 0.12, 2000);
          this.noiseBurst(t, 0.3, 0.16, "lowpass", 900);
        } else if (name === "ui") {
          this.tone(g, t, 660, 0.05, "square", 0.05, 2000);
        } else if (name === "deny") {
          this.tone(g, t, 140, 0.12, "square", 0.06, 500);
        } else if (name === "portal") {
          [784, 988, 1175].forEach((f, i) => this.tone(g, t + i * 0.08, f, 0.16, "triangle", 0.09, 2400));
        } else if (name === "death") {
          const o = this.ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(320, t);
          o.frequency.exponentialRampToValueAtTime(60, t + 0.4);
          const gn = this.ctx.createGain();
          gn.gain.setValueAtTime(0.1, t);
          gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
          o.connect(gn); gn.connect(g);
          o.start(t); o.stop(t + 0.45);
        } else if (name === "roar") {
          this.tone(g, t, 90, 0.35, "sawtooth", 0.1, 300);
          this.noiseBurst(t, 0.28, 0.12, "lowpass", 240);
        }
      } catch (err) { /* ignore audio scheduling errors */ }
    },
  };

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  window.LuminaAudio = AudioSys;
})();
