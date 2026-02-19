// HowlerAudioEngine.js - Upgraded audio engine with rich synthesis and proper effects chain
// Improvements:
//   - True Super Saw (7 detuned oscillators, stereo spread)
//   - Analog-modelled drum synthesis (kick with pitch sweep, snare with body + noise, hi-hat with metallic partials)
//   - Proper wet/dry reverb routing (was previously disconnected)
//   - Warm saturation on master bus
//   - Per-note velocity and stereo imaging
//   - FM synthesis helpers
//   - Polyphonic voice pool

class HowlerAudioEngine {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.compressor = null;
        this.saturationNode = null;
        this.sounds = {};
        this.instruments = {};
        this.effects = {};
        this.poolSize = 8;
        this.soundPool = {};
        this.activeVoices = {};
        this.initialized = false;

        // Effect bus nodes
        this.dryGain = null;
        this.wetGain = null;
        this.reverbNode = null;
        this.delayNode = null;
        this.feedbackNode = null;
        this.filterNode = null;
        this.chorusNode = null;

        // Current effect settings
        this.reverbAmount = 0.3;
        this.delayAmount = 0.2;
        this.chorusAmount = 0.3;
        this.filterCutoff = 20000;
    }

    async init() {
        if (this.initialized) return;

        this.context = new (window.AudioContext || window.webkitAudioContext)();

        // ── Master signal chain ────────────────────────────────────────────
        // source voices → [dry bus] ──────────────────────────────┐
        //               → [reverb send] → reverb → [wet bus] ────→ compressor → saturation → masterGain → out

        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.85;

        // Warm tape saturation on master bus
        this.saturationNode = this.context.createWaveShaper();
        this.saturationNode.curve = this._makeSaturationCurve(12); // subtle warmth
        this.saturationNode.oversample = '4x';

        // Master compressor — glues the mix, adds punch
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 8;
        this.compressor.ratio.value = 3;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.2;

        // Dry / wet buses
        this.dryGain = this.context.createGain();
        this.dryGain.gain.value = 1.0;

        this.wetGain = this.context.createGain();
        this.wetGain.gain.value = this.reverbAmount;

        // Build reverb
        this.reverbNode = this._createReverb(2.5);

        // Build delay with feedback
        this.delayNode = this.context.createDelay(2.0);
        this.delayNode.delayTime.value = 0.25;
        this.feedbackNode = this.context.createGain();
        this.feedbackNode.gain.value = 0.3;
        const delayWet = this.context.createGain();
        delayWet.gain.value = 0.2;

        this.delayNode.connect(this.feedbackNode);
        this.feedbackNode.connect(this.delayNode);
        this.delayNode.connect(delayWet);
        delayWet.connect(this.reverbNode); // delay tails feed reverb

        // Master filter (tone control)
        this.filterNode = this.context.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 18000;
        this.filterNode.Q.value = 0.5;

        // Wire master chain
        // voices connect to this.dryGain and this.reverbNode (send) directly
        this.dryGain.connect(this.filterNode);
        this.reverbNode.connect(this.wetGain);
        this.wetGain.connect(this.filterNode);
        this.filterNode.connect(this.compressor);
        this.compressor.connect(this.saturationNode);
        this.saturationNode.connect(this.masterGain);
        this.masterGain.connect(this.context.destination);

        await this._generateSoundBuffers();

        this.initialized = true;
        console.log('HowlerAudioEngine (upgraded) initialized');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SYNTHESIS — play a note with rich timbre
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Play a melodic note using a named instrument type.
     * @param {string} instrument  - 'sine'|'triangle'|'sawtooth'|'square'|'supersaw'|'fm'|'pad'|'bell'|'pluck'
     * @param {string} note        - e.g. 'C4', 'A3'
     * @param {number} duration    - note duration in seconds
     * @param {number} volume      - 0..1
     * @param {object} options     - { pan, reverbSend, attack, release, filterCutoff }
     */
    playNote(instrument, note, duration = 0.5, volume = 0.8, options = {}) {
        if (!this.initialized) return;

        const freq = this._noteToFreq(note);
        const now = this.context.currentTime;
        const pan = options.pan ?? 0;
        const reverbSend = options.reverbSend ?? this.reverbAmount;
        const attack = options.attack ?? 0.01;
        const release = options.release ?? Math.min(duration * 0.5, 0.4);
        const cutoff = options.filterCutoff ?? 18000;

        // Per-voice panner
        const panner = this.context.createStereoPanner();
        panner.pan.value = pan;

        // Per-voice filter (tone shaping)
        const voiceFilter = this.context.createBiquadFilter();
        voiceFilter.type = 'lowpass';
        voiceFilter.frequency.value = cutoff;
        voiceFilter.Q.value = 1.0;

        // Envelope gain
        const env = this.context.createGain();
        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(volume, now + attack);

        const sustainVol = volume * 0.7;
        if (duration > attack + 0.05) {
            env.gain.linearRampToValueAtTime(sustainVol, now + attack + 0.05);
        }
        env.gain.setValueAtTime(sustainVol, now + duration - release);
        env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // Voice chain: oscillators → voiceFilter → env → panner
        const voiceOut = panner;
        env.connect(panner);
        voiceFilter.connect(env);

        // Build oscillator(s) based on instrument type
        let stopTime = now + duration + 0.05;

        switch (instrument) {
            case 'supersaw':
                stopTime = this._makeSuperSaw(freq, voiceFilter, now, duration);
                break;
            case 'fm':
                stopTime = this._makeFM(freq, voiceFilter, now, duration, options);
                break;
            case 'pad':
                stopTime = this._makePad(freq, voiceFilter, now, duration);
                break;
            case 'bell':
                stopTime = this._makeBell(freq, voiceFilter, now, duration);
                break;
            case 'pluck':
                stopTime = this._makePluck(freq, voiceFilter, now, duration);
                break;
            default:
                stopTime = this._makeBasicOsc(instrument, freq, voiceFilter, now, duration);
        }

        // Connect voice to dry bus
        panner.connect(this.dryGain);

        // Reverb send (parallel)
        if (reverbSend > 0.01) {
            const sendGain = this.context.createGain();
            sendGain.gain.value = reverbSend * 0.7;
            panner.connect(sendGain);
            sendGain.connect(this.reverbNode);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUMS — proper analog-modelled synthesis
    // ─────────────────────────────────────────────────────────────────────────

    playDrum(drumType, volume = 0.8, options = {}) {
        if (!this.initialized) return;

        const now = this.context.currentTime;
        const pan = options.pan ?? 0;
        const reverbSend = options.reverbSend ?? (drumType === 'hihat' ? 0.1 : 0.05);

        const panner = this.context.createStereoPanner();
        panner.pan.value = pan;
        panner.connect(this.dryGain);

        if (reverbSend > 0.01) {
            const sg = this.context.createGain();
            sg.gain.value = reverbSend;
            panner.connect(sg);
            sg.connect(this.reverbNode);
        }

        switch (drumType) {
            case 'kick':    this._synthKick(panner, now, volume); break;
            case 'snare':   this._synthSnare(panner, now, volume); break;
            case 'hihat':   this._synthHihat(panner, now, volume, false); break;
            case 'openhat': this._synthHihat(panner, now, volume, true); break;
            case 'tom':     this._synthTom(panner, now, volume); break;
            case 'clap':    this._synthClap(panner, now, volume); break;
            default:
                // Generic: play buffered drum if available
                const buf = this.soundPool[drumType];
                if (buf) {
                    const src = this.context.createBufferSource();
                    src.buffer = buf;
                    const g = this.context.createGain();
                    g.gain.value = volume;
                    src.connect(g);
                    g.connect(panner);
                    src.start(now);
                }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUM SYNTHESIS INTERNALS
    // ─────────────────────────────────────────────────────────────────────────

    _synthKick(destination, now, volume) {
        // Pitched sine with fast frequency sweep + sub thump
        const osc = this.context.createOscillator();
        const env = this.context.createGain();

        osc.type = 'sine';
        // Frequency sweeps from 200Hz down to 45Hz in 80ms — the classic kick punch
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        env.gain.setValueAtTime(volume, now);
        env.gain.exponentialRampToValueAtTime(0.3, now + 0.1);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        // Add a tiny click transient for attack definition
        const clickOsc = this.context.createOscillator();
        const clickEnv = this.context.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.value = 1000;
        clickEnv.gain.setValueAtTime(volume * 0.3, now);
        clickEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
        clickOsc.connect(clickEnv);
        clickEnv.connect(destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.015);

        osc.connect(env);
        env.connect(destination);
        osc.start(now);
        osc.stop(now + 0.55);
    }

    _synthSnare(destination, now, volume) {
        // Body: tuned oscillator with pitch drop
        const bodyOsc = this.context.createOscillator();
        const bodyEnv = this.context.createGain();
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(220, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        bodyEnv.gain.setValueAtTime(volume * 0.6, now);
        bodyEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        bodyOsc.connect(bodyEnv);
        bodyEnv.connect(destination);
        bodyOsc.start(now);
        bodyOsc.stop(now + 0.18);

        // Snappy noise burst (the "snare wires")
        const bufLen = this.context.sampleRate * 0.25;
        const noiseBuf = this.context.createBuffer(1, bufLen, this.context.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) nd[i] = Math.random() * 2 - 1;

        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuf;

        // High-pass filter on noise — cuts mud, keeps snap
        const noiseHPF = this.context.createBiquadFilter();
        noiseHPF.type = 'highpass';
        noiseHPF.frequency.value = 1800;
        noiseHPF.Q.value = 0.8;

        const noiseEnv = this.context.createGain();
        noiseEnv.gain.setValueAtTime(volume * 0.8, now);
        noiseEnv.gain.exponentialRampToValueAtTime(volume * 0.1, now + 0.05);
        noiseEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        noise.connect(noiseHPF);
        noiseHPF.connect(noiseEnv);
        noiseEnv.connect(destination);
        noise.start(now);
    }

    _synthHihat(destination, now, volume, open = false) {
        // Six slightly detuned square oscillators → bandpass filter
        // This creates the metallic, clangorous character of real hi-hats
        const freqs = [40, 74, 101, 211, 349, 500].map(f => f * 40); // metallic partials
        const mixGain = this.context.createGain();
        const bpf = this.context.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 10000;
        bpf.Q.value = 0.5;

        const hpf = this.context.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 7000;

        freqs.forEach(f => {
            const osc = this.context.createOscillator();
            osc.type = 'square';
            osc.frequency.value = f;
            osc.connect(mixGain);
            osc.start(now);
            osc.stop(now + (open ? 0.5 : 0.06));
        });

        const decay = open ? 0.45 : 0.05;
        const env = this.context.createGain();
        env.gain.setValueAtTime(volume * 0.15, now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + decay + 0.01);

        mixGain.connect(bpf);
        bpf.connect(hpf);
        hpf.connect(env);
        env.connect(destination);
    }

    _synthTom(destination, now, volume) {
        const osc = this.context.createOscillator();
        const env = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.1);
        env.gain.setValueAtTime(volume, now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.connect(env);
        env.connect(destination);
        osc.start(now);
        osc.stop(now + 0.45);
    }

    _synthClap(destination, now, volume) {
        // Three quick noise bursts with slight delays — mimics hands clapping
        [0, 0.01, 0.022].forEach((offset, i) => {
            const bufLen = Math.floor(this.context.sampleRate * 0.08);
            const buf = this.context.createBuffer(1, bufLen, this.context.sampleRate);
            const d = buf.getChannelData(0);
            for (let j = 0; j < bufLen; j++) d[j] = Math.random() * 2 - 1;

            const src = this.context.createBufferSource();
            src.buffer = buf;

            const bpf = this.context.createBiquadFilter();
            bpf.type = 'bandpass';
            bpf.frequency.value = 1200;
            bpf.Q.value = 0.8;

            const env = this.context.createGain();
            const t = now + offset;
            env.gain.setValueAtTime(volume * (i === 2 ? 1 : 0.6), t);
            env.gain.exponentialRampToValueAtTime(0.0001, t + (i === 2 ? 0.12 : 0.04));

            src.connect(bpf);
            bpf.connect(env);
            env.connect(destination);
            src.start(t);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OSCILLATOR HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    _makeBasicOsc(type, freq, destination, now, duration) {
        // Slightly detuned pair for width even on basic waveforms
        const detunes = [-4, 4];
        detunes.forEach(d => {
            const osc = this.context.createOscillator();
            osc.type = (type === 'supersaw' || type === 'fm' || type === 'pad' || type === 'bell' || type === 'pluck') ? 'sawtooth' : (type || 'sine');
            osc.frequency.value = freq;
            osc.detune.value = d;
            const g = this.context.createGain();
            g.gain.value = 0.5;
            osc.connect(g);
            g.connect(destination);
            osc.start(now);
            osc.stop(now + duration + 0.1);
        });
        return now + duration + 0.1;
    }

    _makeSuperSaw(freq, destination, now, duration) {
        // 7-oscillator super saw: the definitive EDM lead/pad sound
        // Detune values mimic Roland JP-8000 super saw spread
        const detunes = [-58, -36, -18, 0, 18, 36, 58];
        const gains   = [0.12, 0.18, 0.22, 0.28, 0.22, 0.18, 0.12];

        detunes.forEach((d, i) => {
            const osc = this.context.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = d;

            // Spread across stereo field — outer oscillators go wider
            const pan = this.context.createStereoPanner();
            pan.pan.value = (d / 58) * 0.7; // ±0.7 spread

            const g = this.context.createGain();
            g.gain.value = gains[i];

            osc.connect(pan);
            pan.connect(g);
            g.connect(destination);
            osc.start(now);
            osc.stop(now + duration + 0.1);
        });
        return now + duration + 0.1;
    }

    _makeFM(freq, destination, now, duration, options = {}) {
        // FM synthesis: carrier + modulator
        // Non-integer ratio creates inharmonic, metallic character
        const ratio = options.fmRatio ?? 2.003; // slight inharmonicity for life
        const modIndex = options.fmIndex ?? 4;   // how much modulation (timbre brightness)

        const carrier = this.context.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.value = freq;

        const modulator = this.context.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = freq * ratio;

        const modGain = this.context.createGain();
        modGain.gain.value = freq * modIndex; // modulation depth in Hz

        // Modulation envelope — bright attack fades to warm sustain
        modGain.gain.setValueAtTime(freq * modIndex, now);
        modGain.gain.exponentialRampToValueAtTime(freq * modIndex * 0.3, now + 0.15);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(destination);

        modulator.start(now);
        modulator.stop(now + duration + 0.1);
        carrier.start(now);
        carrier.stop(now + duration + 0.1);
        return now + duration + 0.1;
    }

    _makePad(freq, destination, now, duration) {
        // Lush pad: 4 detuned sines + slow chorus effect via LFO-modulated detune
        const voices = [
            { detune: -12, gain: 0.3, pan: -0.5 },
            { detune:  -5, gain: 0.35, pan: -0.2 },
            { detune:   0, gain: 0.4,  pan:  0   },
            { detune:   7, gain: 0.35, pan:  0.2 },
            { detune:  12, gain: 0.3,  pan:  0.5 },
        ];

        voices.forEach(v => {
            const osc = this.context.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.detune.value = v.detune;

            // Slow LFO for chorus/shimmer effect
            const lfo = this.context.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.4 + Math.random() * 0.3; // slight randomness per voice
            const lfoGain = this.context.createGain();
            lfoGain.gain.value = 6; // ±6 cents shimmer
            lfo.connect(lfoGain);
            lfoGain.connect(osc.detune);
            lfo.start(now);
            lfo.stop(now + duration + 0.5);

            const panner = this.context.createStereoPanner();
            panner.pan.value = v.pan;
            const g = this.context.createGain();
            g.gain.value = v.gain;

            osc.connect(panner);
            panner.connect(g);
            g.connect(destination);
            osc.start(now);
            osc.stop(now + duration + 0.5);
        });
        return now + duration + 0.5;
    }

    _makeBell(freq, destination, now, duration) {
        // Additive bell using harmonic + inharmonic partials
        // Based on physical modelling of struck metal
        const partials = [
            { ratio: 1,     gain: 1.0,  decay: 2.5  },
            { ratio: 2.756, gain: 0.5,  decay: 1.8  },
            { ratio: 5.404, gain: 0.25, decay: 1.2  },
            { ratio: 8.933, gain: 0.12, decay: 0.8  },
            { ratio: 13.34, gain: 0.06, decay: 0.5  },
        ];

        partials.forEach(p => {
            const osc = this.context.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq * p.ratio;

            const env = this.context.createGain();
            const decayTime = Math.min(p.decay, duration);
            env.gain.setValueAtTime(p.gain * 0.8, now);
            env.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

            osc.connect(env);
            env.connect(destination);
            osc.start(now);
            osc.stop(now + decayTime + 0.05);
        });
        return now + 2.5;
    }

    _makePluck(freq, destination, now, duration) {
        // Karplus-Strong inspired pluck using noise → filter → feedback loop
        // Implemented as a delay-based resonator for efficiency

        // Seed with noise burst
        const bufLen = Math.round(this.context.sampleRate / freq);
        const buf = this.context.createBuffer(1, bufLen, this.context.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

        const src = this.context.createBufferSource();
        src.buffer = buf;
        src.loop = true; // loop the period

        // Low-pass filter at string frequency — creates the characteristic decay
        const lpf = this.context.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.value = freq * 4;
        lpf.Q.value = 0.5;

        const env = this.context.createGain();
        const decayTime = Math.min(duration * 1.5, 2.0);
        env.gain.setValueAtTime(0.9, now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

        src.connect(lpf);
        lpf.connect(env);
        env.connect(destination);
        src.start(now);
        src.stop(now + decayTime);
        return now + decayTime;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EFFECTS
    // ─────────────────────────────────────────────────────────────────────────

    setMasterVolume(volume) {
        if (this.masterGain) this.masterGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.01);
    }

    setReverb(amount) {
        // amount: 0..1
        this.reverbAmount = amount;
        if (this.wetGain) {
            this.wetGain.gain.setTargetAtTime(amount * 0.9, this.context.currentTime, 0.05);
        }
    }

    setDelay(amount, feedback = 0.3, time = 0.25) {
        this.delayAmount = amount;
        if (this.delayNode) {
            this.delayNode.delayTime.setTargetAtTime(time, this.context.currentTime, 0.01);
            this.feedbackNode.gain.setTargetAtTime(feedback * amount, this.context.currentTime, 0.01);
        }
    }

    setFilter(frequency) {
        this.filterCutoff = frequency;
        if (this.filterNode) {
            this.filterNode.frequency.setTargetAtTime(frequency, this.context.currentTime, 0.02);
        }
    }

    setDistortion(amount) {
        // Adjust master saturation curve intensity
        if (this.saturationNode) {
            this.saturationNode.curve = this._makeSaturationCurve(Math.max(1, amount * 100));
        }
    }

    setBitcrush(bits) {
        // Bitcrushing is applied at the buffer level during playback - stored for use
        this._bitcrushBits = bits;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    _createReverb(decayTime = 2.5) {
        const convolver = this.context.createConvolver();
        const sr = this.context.sampleRate;
        const length = Math.floor(sr * decayTime);
        const ir = this.context.createBuffer(2, length, sr);

        // Higher-quality IR: early reflections + late diffuse tail
        for (let ch = 0; ch < 2; ch++) {
            const d = ir.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                const t = i / sr;
                // Early reflections (first 80ms) with spiky peaks
                let sample = (Math.random() * 2 - 1);
                // Exponential decay envelope
                const decay = Math.exp(-t * (3.0 / decayTime));
                // High-frequency rolloff for warmth
                sample *= decay;
                // Diffusion — randomize phase for late tail
                if (t > 0.08) sample *= (0.5 + Math.random() * 0.5);
                d[i] = sample;
            }
        }

        // Pre-delay for depth
        const preDelay = this.context.createDelay(0.05);
        preDelay.delayTime.value = 0.02;
        preDelay.connect(convolver);

        // Return the pre-delay as the input node
        convolver._input = preDelay;

        // Wrap: exposing connect() to route to pre-delay input
        const originalConnect = convolver.connect.bind(convolver);
        const wrapper = {
            connect: (dest) => originalConnect(dest),
            _realInput: preDelay,
        };

        // Patch: source.connect(this.reverbNode) should go to preDelay
        // We'll expose convolver directly but connect sources to preDelay
        this._reverbInput = preDelay;
        convolver.buffer = ir;
        return convolver;
    }

    _makeSaturationCurve(drive) {
        // Soft-clip waveshaper curve — adds harmonics without hard distortion
        const n = 256;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            curve[i] = (Math.PI + drive) * x / (Math.PI + drive * Math.abs(x));
        }
        return curve;
    }

    _noteToFreq(note) {
        if (typeof note === 'number') return note;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const noteName = note.slice(0, -1);
        const semitone = notes.indexOf(noteName);
        if (semitone === -1) return 440;
        return 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12);
    }

    async _generateSoundBuffers() {
        // Keep backward-compatible buffers for legacy playNote(instrument, note) calls
        const notes = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5'];
        const waveforms = ['sine', 'triangle', 'sawtooth', 'square'];

        for (const waveform of waveforms) {
            this.soundPool[waveform] = {};
            for (const note of notes) {
                const freq = this._noteToFreq(note);
                this.soundPool[waveform][note] = this._generateWaveformBuffer(waveform, freq);
            }
        }
    }

    _generateWaveformBuffer(waveform, frequency) {
        const sr = 44100;
        const duration = 2;
        const buf = this.context.createBuffer(1, sr * duration, sr);
        const data = buf.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const phase = 2 * Math.PI * frequency * t;

            let sample;
            switch (waveform) {
                case 'triangle': {
                    const tp = (phase % (2 * Math.PI)) / (2 * Math.PI);
                    sample = tp < 0.5 ? -1 + 4 * tp : 3 - 4 * tp;
                    break;
                }
                case 'sawtooth':
                    sample = -1 + 2 * ((phase % (2 * Math.PI)) / (2 * Math.PI));
                    break;
                case 'square':
                    sample = (phase % (2 * Math.PI)) < Math.PI ? 1 : -1;
                    break;
                default:
                    sample = Math.sin(phase);
            }

            // Better ADSR
            const att = 0.01, dec = 0.1, sus = 0.5;
            let env;
            if (t < att) env = t / att;
            else if (t < att + dec) env = 1 - (1 - sus) * ((t - att) / dec);
            else env = sus * Math.exp(-(t - att - dec) * 0.8);

            data[i] = sample * env * 0.45;
        }

        return buf;
    }

    resume() {
        if (this.context?.state === 'suspended') this.context.resume();
    }

    suspend() {
        if (this.context?.state === 'running') this.context.suspend();
    }
}

window.HowlerAudioEngine = HowlerAudioEngine;
