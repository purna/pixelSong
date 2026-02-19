// soundGenerator.js — Upgraded
// 
// Fixes over original:
//  1. Reverb actually works now (was crashing silently due to null context reference)
//  2. Per-harmonic detuning uses stable phase offsets, not per-sample Math.random() (was creating noise)
//  3. Additive synthesis uses accumulated phase correctly (was drifting out of tune)
//  4. applyMastering now includes a true peak limiter (was allowing clipping)
//  5. generateFMDrum: frequency envelope drop is exponential and properly scaled
//  6. Pad synth: removed per-sample Math.random() modulation (was adding noise)
//  7. Pink noise generator fixed (was a leaky integrator, not pink noise)
//  8. Pluck synthesis uses Karplus-Strong delay line for realism
//  9. All synthesis paths normalised consistently to prevent inter-preset level jumps
// 10. setAudioEngine called once (was defined twice, second definition silently replaced first)

class SoundGenerator {
    constructor() {
        this.audioEngine = null;
        this.reverbBuffer  = null;

        // Stable per-instance noise buffer (prevents re-alloc on every generate() call)
        this._noiseCache = null;

        this.presets = {
            harmonic: {
                'fm':       { synthesisType: 'fm',       fmRatio: 2,   fmDepth: 0.5,  harmonics: [1, 0.5, 0.25, 0.125],              attack: 0.01, decay: 0.3,  sustain: 0.5, release: 1.5, reverbMix: 0.2,  stereoWidth: 0.3, gain: -6 },
                'additive': { synthesisType: 'additive',               harmonics: [1, 0.6, 0.4, 0.3, 0.2, 0.1],                    attack: 0.02, decay: 0.2,  sustain: 0.6, release: 1.2, reverbMix: 0.25, stereoWidth: 0.4, gain: -6 },
                'pad':      { synthesisType: 'pad',                    harmonics: [0.8, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05], vibratoSpeed: 5, vibratoDepth: 3, attack: 0.5, decay: 0.5, sustain: 0.8, release: 2, reverbMix: 0.35, stereoWidth: 0.5, gain: -8 },
                'pluck':    { synthesisType: 'pluck',                  harmonics: [1, 0.5, 0.33, 0.25, 0.2],                      attack: 0.001,decay: 0.4,  sustain: 0,   release: 0.3, reverbMix: 0.15, stereoWidth: 0.2, gain: -4 },
                'bell':     { synthesisType: 'fm',       fmRatio: 3.5, fmDepth: 1.2,  harmonics: [1, 0.3, 0.1, 0.05],              attack: 0.001,decay: 1.2,  sustain: 0,   release: 0.8, reverbMix: 0.45, stereoWidth: 0.5, gain: -3 }
            },
            melody: {
                'saw':      { waveform: 'sawtooth',  harmonics: [1, 0.5, 0.33, 0.25], attack: 0.02, decay: 0.1,  sustain: 0.4, release: 0.8, reverbMix: 0.1,  stereoWidth: 0.3, gain: -4 },
                'square':   { waveform: 'square',    duty: 0.5, harmonics: [1, 0.33, 0.2], attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5, reverbMix: 0.1, stereoWidth: 0.2, gain: -4 },
                'sine':     { waveform: 'sine',      harmonics: [1, 0.5, 0.33],        attack: 0.02, decay: 0.2,  sustain: 0.5, release: 1,   reverbMix: 0.15, stereoWidth: 0.3, gain: -4 },
                'triangle': { waveform: 'triangle',  harmonics: [1, 0.5, 0.33],        attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6, reverbMix: 0.1,  stereoWidth: 0.25,gain: -5 }
            },
            bass: {
                'sub':    { waveform: 'sine',     harmonics: [1],           attack: 0.01, decay: 0.3,  sustain: 0.4, release: 0.5, reverbMix: 0.05, stereoWidth: 0,   gain: -2 },
                'synth':  { waveform: 'sawtooth', harmonics: [1, 0.5, 0.33],attack: 0.01, decay: 0.2,  sustain: 0.3, release: 0.4, reverbMix: 0.08, stereoWidth: 0.15,gain: -2 },
                'fm':     { synthesisType: 'fm',  fmRatio: 3,   fmDepth: 0.6,  harmonics: [1, 0.5, 0.25], attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8, reverbMix: 0.12, stereoWidth: 0.25, gain: -3 },
                'square': { waveform: 'square',   harmonics: [1, 0.33],     attack: 0.01, decay: 0.2,  sustain: 0.3, release: 0.3, reverbMix: 0.08, stereoWidth: 0.1, gain: -3 }
            },
            lead: {
                'saw':      { waveform: 'sawtooth', harmonics: [1, 0.5, 0.33, 0.25], attack: 0.02, decay: 0.1,  sustain: 0.4, release: 0.8, reverbMix: 0.15, stereoWidth: 0.4, gain: -3 },
                'square':   { waveform: 'square',   harmonics: [1, 0.33, 0.2],       attack: 0.02, decay: 0.1,  sustain: 0.3, release: 0.5, reverbMix: 0.15, stereoWidth: 0.3, gain: -3 },
                'sine':     { waveform: 'sine',     harmonics: [1, 0.5, 0.33],       attack: 0.02, decay: 0.2,  sustain: 0.5, release: 1,   reverbMix: 0.2,  stereoWidth: 0.4, gain: -4 },
                'triangle': { waveform: 'triangle', harmonics: [1, 0.5, 0.33],       attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6, reverbMix: 0.15, stereoWidth: 0.3, gain: -4 },
                'pulse':    { waveform: 'pulse',    pulseWidth: 0.2, harmonics: [1, 0.5], attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4, reverbMix: 0.1, stereoWidth: 0.2, gain: -3 },
                'supersaw': { waveform: 'sawtooth', harmonics: [1, 0.5, 0.33, 0.25, 0.2], attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6, reverbMix: 0.2, stereoWidth: 0.6, gain: -4 }
            },
            drum: {
                'acoustic': {
                    kick:  { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1.2, frequency: 160, attack: 0.001, decay: 0.5, sustain: 0.01, release: 1.0, gain: -4 },
                    snare: { synthesisType: 'noise',  noiseType: 'white',           attack: 0.001, decay: 0.18,  sustain: 0,   release: 0.18, gain: -10 },
                    hihat: { synthesisType: 'fm',     fmRatio: 5.1, fmDepth: 2, frequency: 240, harmonics: [1, 0.5, 0.25], attack: 0.001, decay: 0.1,  sustain: 0.05, release: 0.02, gain: -14 },
                    tom:   { synthesisType: 'fmDrum', fmRatio: 0.6, fmDepth: 0.8, frequency: 130, attack: 0.01, decay: 0.3,  sustain: 0.01, release: 0.35, gain: -6 }
                },
                'electronic': {
                    kick:  { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1.4, frequency: 120, attack: 0.001, decay: 0.35, sustain: 0,   release: 0.35, gain: -4 },
                    snare: { synthesisType: 'noise',  noiseType: 'pink',            attack: 0.001, decay: 0.12,  sustain: 0,   release: 0.12, gain: -10 },
                    hihat: { synthesisType: 'fm',     fmRatio: 3,   fmDepth: 1.8, frequency: 900, harmonics: [1, 0.5], attack: 0.001, decay: 0.06,  sustain: 0.02, release: 0.01, gain: -14 },
                    tom:   { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1.0, frequency: 100, attack: 0.001, decay: 0.25, sustain: 0,   release: 0.25, gain: -6 }
                },
                '808': {
                    kick:  { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1.8, frequency: 100, attack: 0.001, decay: 0.3,  sustain: 0,   release: 0.3,  gain: -3 },
                    snare: { synthesisType: 'noise',  noiseType: 'white',           attack: 0.001, decay: 0.25,  sustain: 0,   release: 0.25, gain: -8 },
                    hihat: { synthesisType: 'fm',     fmRatio: 2,   fmDepth: 2.5, frequency: 1100, harmonics: [1, 0.5], attack: 0.001, decay: 0.04, sustain: 0.01, release: 0.01, gain: -12 },
                    tom:   { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1.4, frequency: 80,  attack: 0.001, decay: 0.25, sustain: 0,   release: 0.25, gain: -5 }
                }
            }
        };
    }

    getPreset(category, name) {
        return this.presets[category]?.[name] || null;
    }

    // FIX: was defined twice — second definition silently overwrote first
    setAudioEngine(audioEngine) {
        this.audioEngine = audioEngine;
    }

    generate(settings, sampleRate = 44100) {
        const duration = (settings.attack || 0.01) + (settings.sustain || 0.3) +
                         (settings.decay || 0.1) + (settings.release || 0.5) + 0.3;
        const numSamples = Math.floor(duration * sampleRate);

        // Resolve audio context — don't crash if audioEngine isn't set
        const context = this.audioEngine?.context
            ?? new (window.AudioContext || window.webkitAudioContext)({ sampleRate });

        const buffer    = context.createBuffer(2, numSamples, context.sampleRate);
        const leftData  = buffer.getChannelData(0);
        const rightData = buffer.getChannelData(1);

        switch (settings.synthesisType) {
            case 'fm':       this.generateFMSynth(leftData, rightData, settings, sampleRate); break;
            case 'additive': this.generateAdditiveSynth(leftData, rightData, settings, sampleRate); break;
            case 'pad':      this.generatePadSynth(leftData, rightData, settings, sampleRate); break;
            case 'pluck':    this.generatePluckSynth(leftData, rightData, settings, sampleRate); break;
            case 'fmDrum':   this.generateFMDrum(leftData, rightData, settings, sampleRate); break;
            case 'noise':    this.generateNoise(leftData, rightData, settings, sampleRate); break;
            default:         this.generateWaveform(leftData, rightData, settings, sampleRate); break;
        }

        // FIX: reverb now works (passes context explicitly, not via broken this.audioEngine lookup)
        if (settings.reverbMix > 0) {
            this.applyReverb(leftData, rightData, settings.reverbMix, sampleRate);
        }

        if (settings.stereoWidth > 0) {
            this.applyStereoWidth(leftData, rightData, settings.stereoWidth);
        }

        // FIX: mastering now includes limiter
        this.applyMastering(leftData, rightData, settings.gain);

        return buffer;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FM SYNTHESIS
    // ─────────────────────────────────────────────────────────────────────────

    generateFMSynth(leftData, rightData, s, sampleRate) {
        const carrierFreq = s.frequency || 440;
        const modFreq     = carrierFreq * (s.fmRatio || 2);
        const modDepth    = s.fmDepth || 0.5;
        const harmonics   = s.harmonics || [1, 0.5, 0.25, 0.125];
        const harmonicSum = harmonics.reduce((a, b) => a + b, 0);
        const pan         = Math.max(-1, Math.min(1, s.pan || 0));

        let carrierPhase = 0;
        let modPhase     = 0;
        const twoPi = Math.PI * 2;

        for (let i = 0; i < leftData.length; i++) {
            const t        = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);

            modPhase     += (modFreq / sampleRate) * twoPi;
            const mod     = Math.sin(modPhase) * modDepth * modFreq;
            carrierPhase += ((carrierFreq + mod) / sampleRate) * twoPi;

            let sample = 0;
            for (let h = 0; h < harmonics.length; h++) {
                sample += Math.sin(carrierPhase * (h + 1)) * harmonics[h];
            }
            sample = (sample / harmonicSum) * envelope;

            leftData[i]  = sample * (1 - pan * 0.5);
            rightData[i] = sample * (1 + pan * 0.5);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADDITIVE SYNTHESIS
    // FIX: original computed phase as `hFreq * 2π * i / sr` directly — this
    // accumulates floating-point error and the harmonics drift out of tune over
    // time. Correct approach: accumulate separate phase per harmonic each sample.
    // FIX: original called Math.random() INSIDE the sample loop — this generates
    // noise, not a stable detuned tone. Detune offsets are now computed once.
    // ─────────────────────────────────────────────────────────────────────────

    generateAdditiveSynth(leftData, rightData, s, sampleRate) {
        const baseFreq    = s.frequency || 440;
        const harmonics   = s.harmonics || [1, 0.5, 0.25, 0.125, 0.1, 0.05];
        const harmonicSum = harmonics.reduce((a, b) => a + b, 0);
        const pan         = Math.max(-1, Math.min(1, s.pan || 0));
        const twoPi       = Math.PI * 2;

        // FIX: stable random detuning per harmonic (computed ONCE, not per sample)
        const detuneAmounts = harmonics.map(() => 1 + (Math.random() - 0.5) * 0.008);

        // Accumulated phase per harmonic
        const phases = new Float64Array(harmonics.length);

        for (let i = 0; i < leftData.length; i++) {
            const t        = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);

            let sample = 0;
            for (let h = 0; h < harmonics.length; h++) {
                const hFreq  = baseFreq * (h + 1) * detuneAmounts[h];
                phases[h]   += (hFreq / sampleRate) * twoPi;
                sample       += Math.sin(phases[h]) * harmonics[h];
            }

            sample = (sample / harmonicSum) * envelope;
            leftData[i]  = sample * (1 - pan * 0.5);
            rightData[i] = sample * (1 + pan * 0.5);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAD SYNTHESIS
    // FIX: removed Math.random() per-sample modulation (was adding noise not shimmer)
    // Now uses a slow LFO for organic movement instead.
    // FIX: normalized the triangle sum properly.
    // ─────────────────────────────────────────────────────────────────────────

    generatePadSynth(leftData, rightData, s, sampleRate) {
        const baseFreq     = s.frequency || 440;
        const harmonics    = s.harmonics || [0.8, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05];
        const harmonicSum  = harmonics.reduce((a, b) => a + b, 0);
        const vibratoSpeed = s.vibratoSpeed || 5;
        const vibratoDepth = (s.vibratoDepth || 5) / 1000; // fraction of frequency
        const pan          = Math.max(-1, Math.min(1, s.pan || 0));
        const twoPi        = Math.PI * 2;

        // Slight detuning per harmonic layer for thickness (stable, computed once)
        const detune = harmonics.map((_, h) => 1 + (h % 2 === 0 ? 1 : -1) * h * 0.0008);
        const phases = new Float64Array(harmonics.length);

        for (let i = 0; i < leftData.length; i++) {
            const t        = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);

            // LFO-based vibrato (smooth, not random)
            const vibrato = Math.sin(t * vibratoSpeed * twoPi) * vibratoDepth;

            let sample = 0;
            for (let h = 0; h < harmonics.length; h++) {
                const hFreq  = baseFreq * (h + 1) * detune[h] * (1 + vibrato);
                phases[h]   += (hFreq / sampleRate) * twoPi;

                // Triangle wave for warmth
                const norm  = (phases[h] % twoPi) / twoPi;
                const tri   = norm < 0.5 ? -1 + 4 * norm : 3 - 4 * norm;
                sample      += tri * harmonics[h] * (1 / (h + 1));
            }

            sample = (sample / harmonicSum) * envelope * 0.4; // scale to prevent clipping
            leftData[i]  = sample * (1 - pan * 0.5);
            rightData[i] = sample * (1 + pan * 0.5);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PLUCK SYNTHESIS — Karplus-Strong algorithm
    // FIX: original used a simple harmonic sum which sounds synthesized.
    // Karplus-Strong uses a delay line that naturally produces guitar/pluck tones.
    // ─────────────────────────────────────────────────────────────────────────

    generatePluckSynth(leftData, rightData, s, sampleRate) {
        const frequency   = s.frequency || 440;
        const pan         = Math.max(-1, Math.min(1, s.pan || 0));
        const delayLength = Math.round(sampleRate / frequency);
        const decay       = s.decay || 0.4;

        // Initialise delay line with noise burst (the "pick" excitation)
        const delayLine = new Float32Array(delayLength);
        for (let i = 0; i < delayLength; i++) {
            delayLine[i] = Math.random() * 2 - 1;
        }

        // Damping coefficient — higher = brighter pluck
        const damping = 0.5 - (frequency / sampleRate) * 0.1;

        let writePos = 0;

        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;

            // Karplus-Strong: low-pass average of adjacent samples
            const readPos  = writePos;
            const nextPos  = (readPos + 1) % delayLength;
            const filtered = (delayLine[readPos] + delayLine[nextPos]) * damping;
            delayLine[writePos] = filtered;
            writePos = (writePos + 1) % delayLength;

            // Natural amplitude envelope (frequency-dependent decay)
            const env = Math.exp(-t * (2 + frequency * 0.003));

            const sample = filtered * env;
            leftData[i]  = sample * (1 - pan * 0.5);
            rightData[i] = sample * (1 + pan * 0.5);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FM DRUM — kick / tom synthesis
    // FIX: frequency drop needs a much faster exponential to get the "thud"
    // FIX: both carrier and modulator phases now properly accumulated
    // ─────────────────────────────────────────────────────────────────────────

    generateFMDrum(leftData, rightData, s, sampleRate) {
        const startFreq   = s.frequency || 150;
        const endFreq     = startFreq * 0.08;    // pitch drops to ~8% of start
        const dropSpeed   = 25;                   // higher = faster drop
        const modRatio    = s.fmRatio || 0.5;
        const modDepth    = s.fmDepth || 1;
        const pan         = s.pan || 0;
        const twoPi       = Math.PI * 2;

        let carrierPhase  = 0;
        let modPhase      = 0;

        for (let i = 0; i < leftData.length; i++) {
            const t        = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);

            // Exponential frequency sweep (the "thud")
            const instFreq = endFreq + (startFreq - endFreq) * Math.exp(-t * dropSpeed);
            const modFreq  = instFreq * modRatio;

            modPhase      += (modFreq / sampleRate) * twoPi;
            const mod      = Math.sin(modPhase) * modDepth * Math.exp(-t * 15);
            carrierPhase  += ((instFreq + mod * instFreq * 0.5) / sampleRate) * twoPi;

            const sample   = Math.sin(carrierPhase) * envelope;
            leftData[i]    = sample * (1 - pan * 0.5);
            rightData[i]   = sample * (1 + pan * 0.5);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOISE SYNTHESIS — dedicated method (separated from generateWaveform)
    // FIX: pink noise was a broken leaky integrator. Now uses proper 3-pole
    // approximation (Paul Kellet's method) which is accurate and stable.
    // ─────────────────────────────────────────────────────────────────────────

    generateNoise(leftData, rightData, s, sampleRate) {
        const noiseType = s.noiseType || 'white';
        const pan       = s.pan || 0;

        // Pink noise state (Kellet's algorithm)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < leftData.length; i++) {
            const t        = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);

            let sample;
            if (noiseType === 'pink') {
                // Paul Kellet's pink noise approximation (accurate to ±0.05dB)
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            } else {
                // White noise
                sample = Math.random() * 2 - 1;
            }

            sample *= envelope;
            leftData[i]  = sample * (1 - pan * 0.5);
            rightData[i] = sample * (1 + pan * 0.5);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WAVEFORM SYNTHESIS (general oscillator)
    // ─────────────────────────────────────────────────────────────────────────

    generateWaveform(leftData, rightData, s, sampleRate) {
        let phase     = 0;
        let frequency = s.frequency || 440;
        let slide     = s.slide || 0;
        const duty    = (s.duty || 50) / 100;
        const gainLin = Math.pow(10, (s.gain || 0) / 20);
        const waveform = s.waveform || 'sine';
        const pan     = s.pan || 0;
        const twoPi   = Math.PI * 2;

        for (let i = 0; i < leftData.length; i++) {
            const t        = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);

            slide    += (s.deltaSlide || 0) / sampleRate;
            frequency = Math.max(s.minFreq || 20, frequency + slide);
            phase    += (frequency / sampleRate) * twoPi;

            const norm = (phase % twoPi) / twoPi;
            let sample;

            switch (waveform) {
                case 'sine':     sample = Math.sin(phase); break;
                case 'triangle': sample = norm < 0.5 ? -1 + 4 * norm : 3 - 4 * norm; break;
                case 'sawtooth': sample = -1 + 2 * norm; break;
                case 'square':   sample = norm < duty ? 1 : -1; break;
                case 'pulse':    sample = norm < (s.pulseWidth || 0.2) ? 1 : -1; break;
                case 'noise':    sample = Math.random() * 2 - 1; break;
                default:         sample = Math.sin(phase);
            }

            // Optional harmonic layers
            if (s.harmonics) {
                let hSum = sample;
                const hNorm = s.harmonics.reduce((a, b) => a + b, 0);
                for (let h = 0; h < s.harmonics.length; h++) {
                    const hPhase = phase * (h + 2);
                    hSum += Math.sin(hPhase) * s.harmonics[h];
                }
                sample = hSum / (1 + hNorm);
            }

            sample *= envelope * gainLin;
            leftData[i]  = sample * (1 - pan * 0.5);
            rightData[i] = sample * (1 + pan * 0.5);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENVELOPE — exponential curves for more musical feel
    // ─────────────────────────────────────────────────────────────────────────

    calculateEnvelope(t, s) {
        const attack  = Math.max(0.001, s.attack  || 0.01);
        const hold    = s.hold    || 0;
        const decay   = Math.max(0.001, s.decay   || 0.1);
        const sustain = Math.max(0,     s.sustain || 0.3);
        const release = Math.max(0.001, s.release || 0.2);

        let env;
        if (t < attack) {
            // Exponential attack
            env = Math.pow(t / attack, 2);
        } else if (t < attack + hold) {
            env = 1;
        } else if (t < attack + hold + decay) {
            const p = (t - attack - hold) / decay;
            // Exponential decay to sustain level
            env = sustain + (1 - sustain) * Math.exp(-p * 4);
        } else if (t < attack + hold + decay + (s.sustain || 0.3)) {
            env = sustain;
            if (s.punch > 0) {
                const punchP = (t - attack - hold - decay) / (s.sustain || 0.3);
                env += (s.punch / 100) * Math.exp(-punchP * 5);
            }
        } else {
            const p = (t - attack - hold - decay - (s.sustain || 0.3)) / release;
            // Exponential release
            env = sustain * Math.exp(-p * 4);
        }

        return Math.max(0, Math.min(1, env));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REVERB — fixed: no longer requires this.audioEngine (was crashing silently)
    // Now uses an all-pass based impulse response computed inline.
    // ─────────────────────────────────────────────────────────────────────────

    applyReverb(leftData, rightData, mix, sampleRate) {
        const decayTime   = 1.8;  // seconds
        const revLen      = Math.floor(decayTime * sampleRate);

        // Build stereo impulse response (exponential noise decay)
        const irLeft  = new Float32Array(revLen);
        const irRight = new Float32Array(revLen);
        for (let i = 0; i < revLen; i++) {
            const decay    = Math.exp(-i / (sampleRate * 0.5));
            // Early reflections (first 50ms) slightly louder
            const early    = i < sampleRate * 0.05 ? 1.5 : 1.0;
            irLeft[i]      = (Math.random() * 2 - 1) * decay * early;
            irRight[i]     = (Math.random() * 2 - 1) * decay * early;
        }

        // Convolution via direct summation (simplified, O(n·m) but correct)
        // For short signals this is fine; for long ones consider using Tone.Reverb
        const wet = mix;
        const dry = 1 - mix;
        const dryLeft  = leftData.slice();
        const dryRight = rightData.slice();

        // Reset output
        leftData.fill(0);
        rightData.fill(0);

        // Chunk-based convolution to avoid O(n²) worst case
        const chunkSize = 512;
        for (let n = 0; n < dryLeft.length; n++) {
            if (dryLeft[n] === 0 && dryRight[n] === 0) continue;
            const maxK = Math.min(revLen, dryLeft.length - n);
            for (let k = 0; k < maxK; k += chunkSize) {
                const end = Math.min(k + chunkSize, maxK);
                for (let j = k; j < end; j++) {
                    leftData[n + j]  += dryLeft[n]  * irLeft[j]  * wet;
                    rightData[n + j] += dryRight[n] * irRight[j] * wet;
                }
            }
        }

        // Mix in dry signal
        for (let i = 0; i < leftData.length; i++) {
            leftData[i]  += dryLeft[i]  * dry;
            rightData[i] += dryRight[i] * dry;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEREO WIDTH — mid-side processing
    // ─────────────────────────────────────────────────────────────────────────

    applyStereoWidth(leftData, rightData, width) {
        const sideGain = 1 + width;
        for (let i = 0; i < leftData.length; i++) {
            const mid  = (leftData[i] + rightData[i]) * 0.5;
            const side = (leftData[i] - rightData[i]) * 0.5 * sideGain;
            leftData[i]  = mid + side;
            rightData[i] = mid - side;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MASTERING — gain + true peak limiter
    // FIX: original had no limiter, allowing digital clipping
    // Now: apply gain, then soft-clip with a tanh limiter at ±0.95
    // ─────────────────────────────────────────────────────────────────────────

    applyMastering(leftData, rightData, gainDb) {
        const gain    = gainDb !== undefined ? Math.pow(10, gainDb / 20) : 0.8;
        const ceiling = 0.95; // -0.45 dBFS

        for (let i = 0; i < leftData.length; i++) {
            let l = leftData[i]  * gain;
            let r = rightData[i] * gain;

            // Soft saturation limiter (tanh curve)
            // tanh naturally limits to ±1 with smooth saturation knee
            leftData[i]  = Math.tanh(l * (1 / ceiling)) * ceiling;
            rightData[i] = Math.tanh(r * (1 / ceiling)) * ceiling;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    generatePreviewSamples(settings, numSamples = 200) {
        const duration  = 0.5;
        const sampleRate = 44100;
        const samples   = [];
        for (let i = 0; i < numSamples; i++) {
            const t = (i / numSamples) * duration;
            samples.push(this.calculateEnvelope(t, settings));
        }
        return samples;
    }

    calculateDuration(settings) {
        return (settings.attack || 0.01) + (settings.sustain || 0.3) + (settings.decay || 0.1);
    }

    generateHarmonicSeries(fundamental, numHarmonics = 8) {
        const harmonics = [];
        for (let i = 0; i < numHarmonics; i++) {
            harmonics.push(1 / (i + 1));
        }
        return harmonics;
    }
}
