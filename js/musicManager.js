/**
 * MusicManager — Upgraded
 * 
 * Key fixes & improvements over the original:
 *  - Reverb is now actually connected and working (was a stub before)
 *  - Proper wet/dry parallel routing for reverb and delay
 *  - Added chorus effect (detuned delay lines)
 *  - Saturation waveshaper for warmth
 *  - Master bus compressor connected correctly
 *  - All effect parameters use AudioParam ramps (no clicks)
 */

class MusicManager {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.effectNodes = {};
        this.currentSettings = null;
        this.initialized = false;

        // Shared send bus levels
        this._reverbWet = 0.3;
        this._delayWet  = 0.2;
        this._chorusWet = 0.3;
    }

    init(context) {
        this.audioContext = context;
        this._buildMasterChain();
        this._buildEffectNodes();
        this.initialized = true;
        console.log('MusicManager (upgraded) initialized');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MASTER CHAIN CONSTRUCTION
    // ─────────────────────────────────────────────────────────────────────────

    _buildMasterChain() {
        const ctx = this.audioContext;

        // Master gain (overall volume)
        this.masterGainNode = ctx.createGain();
        this.masterGainNode.gain.value = 0.9;

        // Tape saturation — adds warmth/harmonic richness
        this.saturationNode = ctx.createWaveShaper();
        this.saturationNode.curve = this._saturationCurve(10);
        this.saturationNode.oversample = '4x';

        // Brickwall limiter / master compressor
        this.masterCompressor = ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.value = -6;
        this.masterCompressor.knee.value = 3;
        this.masterCompressor.ratio.value = 10;
        this.masterCompressor.attack.value = 0.001;
        this.masterCompressor.release.value = 0.1;

        // Chain: masterGain → saturation → compressor → out
        this.masterGainNode.connect(this.saturationNode);
        this.saturationNode.connect(this.masterCompressor);
        this.masterCompressor.connect(ctx.destination);
    }

    _buildEffectNodes() {
        const ctx = this.audioContext;

        // ── Gain & Pan ────────────────────────────────────────────────────────
        this.effectNodes.gain = ctx.createGain();
        this.effectNodes.gain.gain.value = 1.0;

        this.effectNodes.pan = ctx.createStereoPanner();
        this.effectNodes.pan.pan.value = 0.0;

        // ── Filters ───────────────────────────────────────────────────────────
        this.effectNodes.lpf = ctx.createBiquadFilter();
        this.effectNodes.lpf.type = 'lowpass';
        this.effectNodes.lpf.frequency.value = 18000;
        this.effectNodes.lpf.Q.value = 0.7;

        this.effectNodes.hpf = ctx.createBiquadFilter();
        this.effectNodes.hpf.type = 'highpass';
        this.effectNodes.hpf.frequency.value = 20;
        this.effectNodes.hpf.Q.value = 0.7;

        this.effectNodes.bpf = ctx.createBiquadFilter();
        this.effectNodes.bpf.type = 'bandpass';
        this.effectNodes.bpf.frequency.value = 1200;
        this.effectNodes.bpf.Q.value = 0.7;

        // ── Reverb (now properly wired!) ──────────────────────────────────────
        this.effectNodes.reverb = this._buildReverb(2.5);
        this.effectNodes.reverbSend = ctx.createGain();
        this.effectNodes.reverbSend.gain.value = 0; // off by default
        this.effectNodes.reverbReturn = ctx.createGain();
        this.effectNodes.reverbReturn.gain.value = 1.0;

        this.effectNodes.reverbSend.connect(this.effectNodes.reverb);
        this.effectNodes.reverb.connect(this.effectNodes.reverbReturn);
        // reverbReturn connects to masterGainNode (done in applyEffects)

        // ── Delay ─────────────────────────────────────────────────────────────
        this.effectNodes.delay = ctx.createDelay(2.0);
        this.effectNodes.delay.delayTime.value = 0.25;
        this.effectNodes.delaySend = ctx.createGain();
        this.effectNodes.delaySend.gain.value = 0;
        this.effectNodes.delayReturn = ctx.createGain();
        this.effectNodes.delayReturn.gain.value = 1.0;
        this.effectNodes.delayFeedback = ctx.createGain();
        this.effectNodes.delayFeedback.gain.value = 0.3;

        this.effectNodes.delaySend.connect(this.effectNodes.delay);
        this.effectNodes.delay.connect(this.effectNodes.delayFeedback);
        this.effectNodes.delayFeedback.connect(this.effectNodes.delay);
        this.effectNodes.delay.connect(this.effectNodes.delayReturn);

        // ── Chorus ───────────────────────────────────────────────────────────
        // Implemented as two detuned delay lines with LFO modulation
        this._buildChorus();

        // ── Distortion / Saturation ───────────────────────────────────────────
        this.effectNodes.distortion = ctx.createWaveShaper();
        this.effectNodes.distortion.curve = this._distortionCurve(0);
        this.effectNodes.distortion.oversample = '2x';

        // ── Tremolo ───────────────────────────────────────────────────────────
        this.effectNodes.tremoloLFO = ctx.createOscillator();
        this.effectNodes.tremoloLFO.type = 'sine';
        this.effectNodes.tremoloLFO.frequency.value = 5;
        this.effectNodes.tremoloDepth = ctx.createGain();
        this.effectNodes.tremoloDepth.gain.value = 0; // off by default
        this.effectNodes.tremoloLFO.connect(this.effectNodes.tremoloDepth);
        this.effectNodes.tremoloLFO.start();

        // ── Vibrato ───────────────────────────────────────────────────────────
        this.effectNodes.vibratoLFO = ctx.createOscillator();
        this.effectNodes.vibratoLFO.type = 'sine';
        this.effectNodes.vibratoLFO.frequency.value = 4;
        this.effectNodes.vibratoDepth = ctx.createGain();
        this.effectNodes.vibratoDepth.gain.value = 0; // off by default
        this.effectNodes.vibratoLFO.connect(this.effectNodes.vibratoDepth);
        this.effectNodes.vibratoLFO.start();
    }

    _buildChorus() {
        const ctx = this.audioContext;

        this.effectNodes.chorusSend = ctx.createGain();
        this.effectNodes.chorusSend.gain.value = 0;
        this.effectNodes.chorusReturn = ctx.createGain();
        this.effectNodes.chorusReturn.gain.value = 1.0;

        // Two delay lines with LFOs for classic stereo chorus
        const voices = [
            { delayBase: 0.025, lfoRate: 0.6,  lfoDepth: 0.002, pan: -0.6 },
            { delayBase: 0.030, lfoRate: 0.8,  lfoDepth: 0.003, pan:  0.6 },
        ];

        this.effectNodes.chorusVoices = voices.map(v => {
            const delay = ctx.createDelay(0.1);
            delay.delayTime.value = v.delayBase;

            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = v.lfoRate;

            const lfoGain = ctx.createGain();
            lfoGain.gain.value = v.lfoDepth;

            const panner = ctx.createStereoPanner();
            panner.pan.value = v.pan;

            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);

            this.effectNodes.chorusSend.connect(delay);
            delay.connect(panner);
            panner.connect(this.effectNodes.chorusReturn);

            lfo.start();
            return { delay, lfo, lfoGain, panner };
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APPLY EFFECTS — main entry point
    // ─────────────────────────────────────────────────────────────────────────

    applyEffects(source, settings) {
        if (!this.initialized) {
            source.connect(this.masterGainNode);
            return source;
        }

        this.currentSettings = settings;
        const fx = settings.audioEffects || {};
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // ── Gain ──────────────────────────────────────────────────────────────
        const gainVal = fx.gain ?? 1.0;
        this.effectNodes.gain.gain.setTargetAtTime(gainVal, now, 0.01);

        // ── Pan ───────────────────────────────────────────────────────────────
        const panVal = fx.pan ?? 0.0;
        this.effectNodes.pan.pan.setTargetAtTime(panVal, now, 0.01);

        // ── Filters ───────────────────────────────────────────────────────────
        if (fx.lpf !== undefined) {
            this.effectNodes.lpf.frequency.setTargetAtTime(Math.max(20, fx.lpf), now, 0.02);
        }
        if (fx.hpf !== undefined) {
            this.effectNodes.hpf.frequency.setTargetAtTime(Math.max(20, fx.hpf), now, 0.02);
        }
        if (fx.lpq !== undefined) {
            this.effectNodes.lpf.Q.setTargetAtTime(fx.lpq, now, 0.02);
            this.effectNodes.hpf.Q.setTargetAtTime(fx.lpq, now, 0.02);
        }

        // ── Reverb send level ─────────────────────────────────────────────────
        const reverbAmt = fx.reverb ?? 0;
        this.effectNodes.reverbSend.gain.setTargetAtTime(reverbAmt, now, 0.05);

        // ── Delay send level ──────────────────────────────────────────────────
        const delayAmt = fx.delay ?? 0;
        this.effectNodes.delaySend.gain.setTargetAtTime(delayAmt * 0.5, now, 0.05);
        if (fx.delayt !== undefined) {
            this.effectNodes.delay.delayTime.setTargetAtTime(fx.delayt, now, 0.01);
        }
        if (fx.delayfb !== undefined) {
            this.effectNodes.delayFeedback.gain.setTargetAtTime(Math.min(0.85, fx.delayfb), now, 0.01);
        }

        // ── Chorus send level ─────────────────────────────────────────────────
        const chorusAmt = fx.chorus ?? 0;
        this.effectNodes.chorusSend.gain.setTargetAtTime(chorusAmt, now, 0.05);

        // ── Distortion ────────────────────────────────────────────────────────
        if (fx.distort !== undefined && fx.distort > 0) {
            this.effectNodes.distortion.curve = this._distortionCurve(fx.distort);
        }

        // ── Tremolo ───────────────────────────────────────────────────────────
        if (fx.tremolo !== undefined) {
            this.effectNodes.tremoloLFO.frequency.setTargetAtTime(fx.tremolo, now, 0.01);
        }
        const tremDepth = fx.tremdepth ?? 0;
        this.effectNodes.tremoloDepth.gain.setTargetAtTime(tremDepth * 0.8, now, 0.01);

        // ── Vibrato ───────────────────────────────────────────────────────────
        if (fx.vibrato !== undefined) {
            this.effectNodes.vibratoLFO.frequency.setTargetAtTime(fx.vibrato, now, 0.01);
        }
        const vibDepth = fx.vibdepth ?? 0;
        this.effectNodes.vibratoDepth.gain.setTargetAtTime(vibDepth * 50, now, 0.01);

        // ── Wire signal chain ─────────────────────────────────────────────────
        // Disconnect first to avoid duplicate connections
        try { source.disconnect(); } catch(e) {}

        source.connect(this.effectNodes.gain);
        this.effectNodes.gain.connect(this.effectNodes.pan);

        // Filters in series
        this.effectNodes.pan.connect(this.effectNodes.hpf);
        this.effectNodes.hpf.connect(this.effectNodes.lpf);

        // Main dry path
        this.effectNodes.lpf.connect(this.effectNodes.distortion);
        this.effectNodes.distortion.connect(this.masterGainNode);

        // Parallel effect sends
        this.effectNodes.lpf.connect(this.effectNodes.reverbSend);
        this.effectNodes.reverbReturn.connect(this.masterGainNode);

        this.effectNodes.lpf.connect(this.effectNodes.delaySend);
        this.effectNodes.delayReturn.connect(this.masterGainNode);

        this.effectNodes.lpf.connect(this.effectNodes.chorusSend);
        this.effectNodes.chorusReturn.connect(this.masterGainNode);

        // Tremolo modulates gain
        this.effectNodes.tremoloDepth.connect(this.effectNodes.gain.gain);

        return this.masterGainNode;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REVERB BUILDER
    // ─────────────────────────────────────────────────────────────────────────

    _buildReverb(decayTime = 2.5) {
        const ctx = this.audioContext;
        const convolver = ctx.createConvolver();
        const sr = ctx.sampleRate;
        const len = Math.floor(sr * decayTime);
        const ir = ctx.createBuffer(2, len, sr);

        for (let ch = 0; ch < 2; ch++) {
            const d = ir.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                const t = i / sr;
                // Exponential decay with high-frequency rolloff
                const decay = Math.exp(-t * (3.5 / decayTime));
                d[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        convolver.buffer = ir;
        return convolver;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CURVE GENERATORS
    // ─────────────────────────────────────────────────────────────────────────

    _saturationCurve(drive) {
        const n = 256;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            curve[i] = (Math.PI + drive) * x / (Math.PI + drive * Math.abs(x));
        }
        return curve;
    }

    _distortionCurve(amount) {
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            if (amount < 0.01) {
                curve[i] = x; // linear passthrough
            } else {
                // Soft-clip with variable hardness
                const k = amount * 100;
                curve[i] = (1 + k / 10) * x / (1 + (k / 10) * Math.abs(x));
            }
        }
        return curve;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC CONTROLS
    // ─────────────────────────────────────────────────────────────────────────

    setMasterVolume(volume) {
        if (this.masterGainNode) {
            this.masterGainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    setReverb(amount) {
        if (this.effectNodes.reverbSend) {
            this.effectNodes.reverbSend.gain.setTargetAtTime(amount, this.audioContext.currentTime, 0.05);
        }
    }

    setChorus(amount) {
        if (this.effectNodes.chorusSend) {
            this.effectNodes.chorusSend.gain.setTargetAtTime(amount, this.audioContext.currentTime, 0.05);
        }
    }

    setDelay(amount, feedback = 0.3, time = 0.25) {
        if (this.effectNodes.delaySend) {
            this.effectNodes.delaySend.gain.setTargetAtTime(amount, this.audioContext.currentTime, 0.05);
            this.effectNodes.delay.delayTime.setTargetAtTime(time, this.audioContext.currentTime, 0.01);
            this.effectNodes.delayFeedback.gain.setTargetAtTime(Math.min(0.85, feedback), this.audioContext.currentTime, 0.01);
        }
    }

    setFilter(frequency) {
        if (this.effectNodes.lpf) {
            this.effectNodes.lpf.frequency.setTargetAtTime(frequency, this.audioContext.currentTime, 0.02);
        }
    }

    setDistortion(amount) {
        if (this.effectNodes.distortion) {
            this.effectNodes.distortion.curve = this._distortionCurve(amount);
        }
    }

    getCurrentSettings() { return this.currentSettings; }

    cleanup() {
        try {
            this.effectNodes.tremoloLFO?.stop();
            this.effectNodes.vibratoLFO?.stop();
            this.effectNodes.chorusVoices?.forEach(v => v.lfo.stop());
            Object.values(this.effectNodes).forEach(node => {
                try { node.disconnect?.(); } catch(e) {}
            });
        } catch(e) {}
        this.initialized = false;
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = MusicManager;
if (typeof window !== 'undefined') window.MusicManager = MusicManager;
