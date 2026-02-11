// HowlerAudioEngine.js - Default audio engine using Howler.js
// Works alongside Tone.js for synthesis and effects

class HowlerAudioEngine {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.compressor = null;
        this.sounds = {};
        this.instruments = {};
        this.effects = {};
        this.poolSize = 8; // Polyphony per instrument
        this.soundPool = {};
        this.activeVoices = {};
        this.initialized = false;
        
        // Fallback to Tone.js if needed
        this.toneEngine = null;
        this.useToneFallback = false;
        
        // Web Audio API nodes for effects
        this.reverbNode = null;
        this.delayNode = null;
        this.filterNode = null;
    }

    async init() {
        if (this.initialized) return;
        
        // Create AudioContext
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master gain
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.8;
        
        // Compressor for overall dynamics
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        
        // Effects chain
        this.createEffectsChain();
        
        // Connect master chain
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.context.destination);
        
        // Pre-generate sound buffers
        await this.generateSoundBuffers();
        
        this.initialized = true;
        console.log('Howler Audio Engine initialized');
    }

    createEffectsChain() {
        // Master effects
        this.reverbNode = this.createReverb(2); // 2 second decay
        this.delayNode = this.context.createDelay(1);
        this.delayNode.delayTime.value = 0.25; // 8th notes
        this.feedbackNode = this.context.createGain();
        this.feedbackNode.gain.value = 0.3;
        this.filterNode = this.context.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 20000;
        
        // Connect delay feedback
        this.delayNode.connect(this.feedbackNode);
        this.feedbackNode.connect(this.delayNode);
    }

    createReverb(decayTime) {
        const convolver = this.context.createConvolver();
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * decayTime;
        const impulse = this.context.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.exp(-i / (sampleRate * decayTime * 0.5));
                data[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }

    async generateSoundBuffers() {
        // Generate basic waveform buffers for each note
        const notes = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        const waveforms = ['sine', 'triangle', 'sawtooth', 'square'];
        
        // Generate drum sounds
        await this.generateDrumBuffers();
        
        // Generate note buffers
        for (const waveform of waveforms) {
            this.soundPool[waveform] = {};
            for (const note of notes) {
                const freq = this.noteToFreq(note);
                const buffer = this.generateWaveformBuffer(waveform, freq);
                this.soundPool[waveform][note] = buffer;
            }
        }
    }

    async generateDrumBuffers() {
        // Kick drum
        const kickBuffer = this.context.createBuffer(1, 44100 * 0.5, 44100);
        const kickData = kickBuffer.getChannelData(0);
        for (let i = 0; i < kickData.length; i++) {
            const t = i / 44100;
            const freq = 150 * Math.exp(-t * 20);
            const amp = Math.exp(-t * 8);
            kickData[i] = Math.sin(2 * Math.PI * freq * t) * amp;
        }
        this.soundPool.kick = kickBuffer;
        
        // Snare (noise burst)
        const snareBuffer = this.context.createBuffer(1, 44100 * 0.2, 44100);
        const snareData = snareBuffer.getChannelData(0);
        for (let i = 0; i < snareData.length; i++) {
            const t = i / 44100;
            const amp = Math.exp(-t * 15);
            snareData[i] = (Math.random() * 2 - 1) * amp;
        }
        this.soundPool.snare = snareBuffer;
        
        // Hi-hat (high frequency noise)
        const hihatBuffer = this.context.createBuffer(1, 44100 * 0.05, 44100);
        const hihatData = hihatBuffer.getChannelData(0);
        for (let i = 0; i < hihatData.length; i++) {
            const t = i / 44100;
            const amp = Math.exp(-t * 50);
            hihatData[i] = (Math.random() * 2 - 1) * amp * 0.3;
        }
        this.soundPool.hihat = hihatBuffer;
        
        // Tom
        const tomBuffer = this.context.createBuffer(1, 44100 * 0.3, 44100);
        const tomData = tomBuffer.getChannelData(0);
        for (let i = 0; i < tomData.length; i++) {
            const t = i / 44100;
            const freq = 100 * Math.exp(-t * 8);
            const amp = Math.exp(-t * 5);
            tomData[i] = Math.sin(2 * Math.PI * freq * t) * amp;
        }
        this.soundPool.tom = tomBuffer;
    }

    generateWaveformBuffer(waveform, frequency) {
        const sampleRate = 44100;
        const duration = 2; // 2 seconds max
        const length = sampleRate * duration;
        const buffer = this.context.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const phase = 2 * Math.PI * frequency * t;
            
            let sample;
            switch (waveform) {
                case 'sine':
                    sample = Math.sin(phase);
                    break;
                case 'triangle':
                    const triPhase = (phase % (2 * Math.PI)) / (2 * Math.PI);
                    sample = triPhase < 0.5 ? -1 + 4 * triPhase : 3 - 4 * triPhase;
                    break;
                case 'sawtooth':
                    sample = -1 + 2 * ((phase % (2 * Math.PI)) / (2 * Math.PI));
                    break;
                case 'square':
                    sample = (phase % (2 * Math.PI)) < Math.PI ? 1 : -1;
                    break;
                default:
                    sample = Math.sin(phase);
            }
            
            // ADSR envelope approximation
            const attackTime = 0.01;
            const decayTime = 0.2;
            const sustainLevel = 0.3;
            let envelope;
            
            if (t < attackTime) {
                envelope = t / attackTime;
            } else if (t < attackTime + decayTime) {
                envelope = 1 - (1 - sustainLevel) * ((t - attackTime) / decayTime);
            } else {
                envelope = sustainLevel * Math.exp(-(t - attackTime - decayTime) * 0.5);
            }
            
            data[i] = sample * envelope * 0.5;
        }
        
        return buffer;
    }

    noteToFreq(note) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const noteName = note.slice(0, -1);
        const semitone = notes.indexOf(noteName);
        return 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12);
    }

    playNote(instrument, note, duration = 0.5, volume = 0.8) {
        if (!this.initialized) return;
        
        const pool = this.soundPool[instrument] || this.soundPool.sine;
        const buffer = pool[note] || pool['C4'];
        
        if (!buffer) return;
        
        // Create source node
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        
        // Create gain for envelope
        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;
        
        // Apply envelope
        const now = this.context.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, now + duration * 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        // Connect
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Play
        source.start(now);
        source.stop(now + duration);
    }

    playDrum(drumType, volume = 0.8) {
        if (!this.initialized) return;
        
        const buffer = this.soundPool[drumType];
        if (!buffer) return;
        
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        source.start();
    }

    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }

    setReverb(amount) {
        if (this.reverbNode) {
            // Mix between dry and wet
            // This is simplified - real implementation would need proper routing
        }
    }

    setDelay(amount) {
        if (this.delayNode) {
            this.delayNode.delayTime.value = amount * 0.5;
        }
    }

    setFilter(frequency) {
        if (this.filterNode) {
            this.filterNode.frequency.value = frequency;
        }
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    suspend() {
        if (this.context && this.context.state === 'running') {
            this.context.suspend();
        }
    }

    // Bridge to Tone.js for advanced synthesis
    useToneJS() {
        this.useToneFallback = true;
        if (typeof Tone !== 'undefined') {
            this.toneEngine = {
                start: () => Tone.start(),
                synth: (type) => {
                    switch(type) {
                        case 'fm': return new Tone.PolySynth(Tone.FMSynth);
                        case 'am': return new Tone.PolySynth(Tone.AMSynth);
                        case 'membrane': return new Tone.MembraneSynth();
                        case 'metal': return new Tone.MetalSynth();
                        case 'noise': return new Tone.NoiseSynth();
                        default: return new Tone.PolySynth(Tone.Synth);
                    }
                },
                effects: {
                    reverb: () => new Tone.Reverb({ decay: 2, wet: 0.3 }),
                    delay: () => new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3 }),
                    chorus: () => new Tone.Chorus({ frequency: 4, depth: 0.5, wet: 0.3 }),
                    distortion: () => new Tone.Distortion({ distortion: 0.4 }),
                    filter: () => new Tone.Filter({ frequency: 20000, type: 'lowpass' })
                }
            };
        }
        return this.toneEngine;
    }
}

// Export for use
window.HowlerAudioEngine = HowlerAudioEngine;
