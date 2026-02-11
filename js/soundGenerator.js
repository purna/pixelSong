// soundGenerator.js - Enhanced sound synthesis with FM, reverb, and richer tones

class SoundGenerator {
    constructor() {
        this.audioEngine = null;
        this.reverbBuffer = null;
        
        // Enhanced presets for different instrument types
        this.presets = {
            // Harmonic/Polyphonic presets
            harmonic: {
                'fm': { synthesisType: 'fm', fmRatio: 2, fmDepth: 0.5, harmonics: [1, 0.5, 0.25, 0.125], attack: 0.01, decay: 0.3, sustain: 0.5, release: 1.5, reverbMix: 0.2, stereoWidth: 0.3, gain: -6 },
                'additive': { synthesisType: 'additive', harmonics: [1, 0.6, 0.4, 0.3, 0.2, 0.1], attack: 0.02, decay: 0.2, sustain: 0.6, release: 1.2, reverbMix: 0.25, stereoWidth: 0.4, gain: -6 },
                'pad': { synthesisType: 'pad', harmonics: [0.8, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05], vibratoSpeed: 5, vibratoDepth: 3, attack: 0.5, decay: 0.5, sustain: 0.8, release: 2, reverbMix: 0.35, stereoWidth: 0.5, gain: -8 },
                'pluck': { synthesisType: 'pluck', harmonics: [1, 0.5, 0.33, 0.25, 0.2], attack: 0.001, decay: 0.4, sustain: 0, release: 0.3, reverbMix: 0.15, stereoWidth: 0.2, gain: -4 },
                'bell': { synthesisType: 'fm', fmRatio: 3, fmDepth: 0.8, harmonics: [1, 0.3, 0.1, 0.05], attack: 0.001, decay: 1, sustain: 0, release: 0.5, reverbMix: 0.4, stereoWidth: 0.5, gain: -3 }
            },
            // Melody/Monophonic presets
            melody: {
                'saw': { waveform: 'sawtooth', harmonics: [1, 0.5, 0.33, 0.25], attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8, reverbMix: 0.1, stereoWidth: 0.3, gain: -4 },
                'square': { waveform: 'square', duty: 0.5, harmonics: [1, 0.33, 0.2], attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5, reverbMix: 0.1, stereoWidth: 0.2, gain: -4 },
                'sine': { waveform: 'sine', harmonics: [1, 0.5, 0.33], attack: 0.02, decay: 0.2, sustain: 0.5, release: 1, reverbMix: 0.15, stereoWidth: 0.3, gain: -4 },
                'triangle': { waveform: 'triangle', harmonics: [1, 0.5, 0.33], attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6, reverbMix: 0.1, stereoWidth: 0.25, gain: -5 }
            },
            // Bass presets
            bass: {
                'sub': { waveform: 'sine', harmonics: [1], attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5, reverbMix: 0.1, stereoWidth: 0, gain: -2 },
                'synth': { waveform: 'sawtooth', harmonics: [1, 0.5, 0.33], attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4, reverbMix: 0.1, stereoWidth: 0.2, gain: -2 },
                'fm': { synthesisType: 'fm', fmRatio: 3, fmDepth: 0.6, harmonics: [1, 0.5, 0.25], attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8, reverbMix: 0.15, stereoWidth: 0.3, gain: -3 },
                'square': { waveform: 'square', harmonics: [1, 0.33], attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3, reverbMix: 0.1, stereoWidth: 0.1, gain: -3 }
            },
            // Lead presets
            lead: {
                'saw': { waveform: 'sawtooth', harmonics: [1, 0.5, 0.33, 0.25], attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8, reverbMix: 0.15, stereoWidth: 0.4, gain: -3 },
                'square': { waveform: 'square', harmonics: [1, 0.33, 0.2], attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5, reverbMix: 0.15, stereoWidth: 0.3, gain: -3 },
                'sine': { waveform: 'sine', harmonics: [1, 0.5, 0.33], attack: 0.02, decay: 0.2, sustain: 0.5, release: 1, reverbMix: 0.2, stereoWidth: 0.4, gain: -4 },
                'triangle': { waveform: 'triangle', harmonics: [1, 0.5, 0.33], attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6, reverbMix: 0.15, stereoWidth: 0.3, gain: -4 },
                'pulse': { waveform: 'pulse', pulseWidth: 0.2, harmonics: [1, 0.5], attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4, reverbMix: 0.1, stereoWidth: 0.2, gain: -3 },
                'supersaw': { waveform: 'sawtooth', harmonics: [1, 0.5, 0.33, 0.25, 0.2], attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6, reverbMix: 0.2, stereoWidth: 0.5, gain: -4 }
            },
            // Drum presets
            drum: {
                'acoustic': {
                    kick: { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1, frequency: 150, attack: 0.001, decay: 0.4, sustain: 0.01, release: 1, gain: -4 },
                    snare: { synthesisType: 'noise', attack: 0.001, decay: 0.15, sustain: 0, release: 0.15, gain: -10 },
                    hihat: { synthesisType: 'fm', fmRatio: 5.1, fmDepth: 2, frequency: 200, harmonics: [1, 0.5, 0.25], attack: 0.001, decay: 0.08, sustain: 0.05, release: 0.01, gain: -15 },
                    tom: { synthesisType: 'fmDrum', fmRatio: 0.6, fmDepth: 0.8, frequency: 120, attack: 0.01, decay: 0.25, sustain: 0.01, release: 0.25, gain: -6 }
                },
                'electronic': {
                    kick: { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1.2, frequency: 120, attack: 0.001, decay: 0.3, sustain: 0, release: 0.3, gain: -4 },
                    snare: { synthesisType: 'noise', noiseType: 'pink', attack: 0.001, decay: 0.1, sustain: 0, release: 0.1, gain: -10 },
                    hihat: { synthesisType: 'fm', fmRatio: 3, fmDepth: 1.5, frequency: 800, harmonics: [1, 0.5], attack: 0.001, decay: 0.05, sustain: 0.02, release: 0.01, gain: -15 },
                    tom: { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1, frequency: 100, attack: 0.001, decay: 0.2, sustain: 0, release: 0.2, gain: -6 }
                },
                '808': {
                    kick: { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1.5, frequency: 100, attack: 0.001, decay: 0.25, sustain: 0, release: 0.25, gain: -3 },
                    snare: { synthesisType: 'noise', attack: 0.001, decay: 0.2, sustain: 0, release: 0.2, gain: -8 },
                    hihat: { synthesisType: 'fm', fmRatio: 2, fmDepth: 2, frequency: 1000, harmonics: [1, 0.5], attack: 0.001, decay: 0.03, sustain: 0.01, release: 0.01, gain: -12 },
                    tom: { synthesisType: 'fmDrum', fmRatio: 0.5, fmDepth: 1.2, frequency: 80, attack: 0.001, decay: 0.2, sustain: 0, release: 0.2, gain: -5 }
                }
            }
        };
    }

    getPreset(category, name) {
        return this.presets[category]?.[name] || null;
    }

    setAudioEngine(audioEngine) {
        this.audioEngine = audioEngine;
    }

    setAudioEngine(audioEngine) {
        this.audioEngine = audioEngine;
    }

    generate(settings, sampleRate = 44100) {
        const duration = settings.attack + settings.sustain + settings.decay + 0.5; // Extra tail for reverb
        const samples = Math.floor(duration * sampleRate);
        
        // Use the AudioEngine's context if available
        let context;
        if (this.audioEngine && this.audioEngine.context) {
            context = this.audioEngine.context;
        } else {
            context = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const buffer = context.createBuffer(2, samples, context.sampleRate); // Stereo
        const leftData = buffer.getChannelData(0);
        const rightData = buffer.getChannelData(1);

        // Generate audio data based on synthesis type
        switch (settings.synthesisType) {
            case 'fm':
                this.generateFMSynth(leftData, rightData, settings, sampleRate);
                break;
            case 'additive':
                this.generateAdditiveSynth(leftData, rightData, settings, sampleRate);
                break;
            case 'pad':
                this.generatePadSynth(leftData, rightData, settings, sampleRate);
                break;
            case 'pluck':
                this.generatePluckSynth(leftData, rightData, settings, sampleRate);
                break;
            case 'fmDrum':
                this.generateFMDrum(leftData, rightData, settings, sampleRate);
                break;
            default:
                this.generateWaveform(leftData, rightData, settings, sampleRate);
        }

        // Apply effects
        if (settings.reverbMix > 0) {
            this.applyReverb(leftData, rightData, settings.reverbMix, sampleRate);
        }

        // Apply stereo width
        if (settings.stereoWidth > 0) {
            this.applyStereoWidth(leftData, rightData, settings.stereoWidth);
        }

        // Master gain and limiting
        this.applyMastering(leftData, rightData, settings.gain);

        return buffer;
    }

    // FM Synthesis - rich, bell-like tones
    generateFMSynth(leftData, rightData, s, sampleRate) {
        const carrierFreq = s.frequency;
        const modFreq = s.frequency * (s.fmRatio || 2);
        const modDepth = s.fmDepth || 0.5;
        const harmonics = s.harmonics || [1, 0.5, 0.25, 0.125, 0.0625];
        
        let phase = 0;
        let modPhase = 0;

        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);
            
            // FM modulation
            modPhase += (modFreq / sampleRate) * Math.PI * 2;
            const mod = Math.sin(modPhase) * modDepth * envelope;
            
            // Carrier with modulation
            const finalFreq = carrierFreq + mod * 100;
            phase += (finalFreq / sampleRate) * Math.PI * 2;
            
            // Sum of harmonics
            let sample = 0;
            for (let h = 0; h < harmonics.length; h++) {
                const hPhase = phase * (h + 1);
                sample += Math.sin(hPhase) * harmonics[h];
            }
            sample /= harmonics.reduce((a, b) => a + b, 0);
            
            // Pan
            const pan = s.pan || 0;
            leftData[i] = sample * envelope * (1 - pan);
            rightData[i] = sample * envelope * (1 + pan);
        }
    }

    // Additive Synthesis - building sound from sine waves
    generateAdditiveSynth(leftData, rightData, s, sampleRate) {
        const baseFreq = s.frequency;
        const harmonics = s.harmonics || [1, 0.5, 0.25, 0.125, 0.1, 0.05];
        const harmonicPhases = harmonics.map(() => Math.random() * Math.PI * 2);
        
        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);
            
            let sample = 0;
            for (let h = 0; h < harmonics.length; h++) {
                const hFreq = baseFreq * (h + 1);
                const hPhase = harmonicPhases[h] + (hFreq / sampleRate) * Math.PI * 2 * i;
                // Add slight detuning for warmth
                const detune = 1 + (Math.random() - 0.5) * 0.01;
                sample += Math.sin(hPhase * detune) * harmonics[h];
            }
            
            // Normalize
            sample /= harmonics.reduce((a, b) => a + b, 0);
            
            const pan = s.pan || 0;
            leftData[i] = sample * envelope * (1 - pan);
            rightData[i] = sample * envelope * (1 + pan);
        }
    }

    // Pad Synthesis - lush, evolving pads
    generatePadSynth(leftData, rightData, s, sampleRate) {
        const baseFreq = s.frequency;
        const harmonics = s.harmonics || [0.8, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05];
        const vibratoSpeed = s.vibratoSpeed || 5;
        const vibratoDepth = s.vibratoDepth || 5;
        
        let phase = 0;
        
        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);
            
            // Slow attack for pads
            const padEnvelope = 1 - Math.exp(-t * 3) * envelope;
            
            // Vibrato
            const vibrato = Math.sin(t * vibratoSpeed * Math.PI * 2) * (vibratoDepth / 100);
            
            let sample = 0;
            for (let h = 0; h < harmonics.length; h++) {
                const hFreq = baseFreq * (h + 1);
                const hPhase = phase * (h + 1);
                // Use triangle for warmer pad sound
                const trianglePhase = (hPhase % (Math.PI * 2)) / (Math.PI * 2);
                const triangle = trianglePhase < 0.5 
                    ? -1 + 4 * trianglePhase 
                    : 3 - 4 * trianglePhase;
                sample += triangle * harmonics[h] * (1 / (h + 1));
            }
            
            phase += ((baseFreq + vibrato * 10) / sampleRate) * Math.PI * 2;
            
            // Add slight random modulation
            sample *= 1 + (Math.random() - 0.5) * 0.02;
            
            const pan = s.pan || 0;
            leftData[i] = sample * padEnvelope * 0.3 * (1 - pan);
            rightData[i] = sample * padEnvelope * 0.3 * (1 + pan);
        }
    }

    // Pluck Synthesis - string-like plucks
    generatePluckSynth(leftData, rightData, s, sampleRate) {
        const baseFreq = s.frequency;
        
        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);
            
            // Harmonic series with decay based on frequency
            let sample = 0;
            for (let h = 1; h <= 8; h++) {
                const hFreq = baseFreq * h;
                const decay = Math.exp(-t * h * 0.5);
                const phase = (hFreq / sampleRate) * Math.PI * 2 * i;
                sample += Math.sin(phase) * (1 / h) * decay;
            }
            
            // Harmonic content decay
            sample *= Math.exp(-t * 2);
            
            const pan = s.pan || 0;
            leftData[i] = sample * envelope * 0.5 * (1 - pan);
            rightData[i] = sample * envelope * 0.5 * (1 + pan);
        }
    }

    // FM Drum - punchy electronic drums
    generateFMDrum(leftData, rightData, s, sampleRate) {
        const freq = s.frequency || 150;
        const modFreq = s.fmRatio || 0.5;
        const modDepth = s.fmDepth || 1;
        
        let phase = 0;
        let modPhase = 0;
        
        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);
            
            // Frequency drop for punch
            const freqDrop = freq * Math.exp(-t * 20);
            
            // FM modulation for drum character
            modPhase += (freq * modFreq / sampleRate) * Math.PI * 2;
            const mod = Math.sin(modPhase) * modDepth * Math.exp(-t * 10);
            
            const finalFreq = freqDrop + mod * 100;
            phase += (finalFreq / sampleRate) * Math.PI * 2;
            
            const sample = Math.sin(phase);
            
            const pan = s.pan || 0;
            leftData[i] = sample * envelope * (1 - pan);
            rightData[i] = sample * envelope * (1 + pan);
        }
    }

    // Original waveform generator (enhanced)
    generateWaveform(leftData, rightData, s, sampleRate) {
        let phase = 0;
        let frequency = s.frequency || 440;
        let slide = s.slide || 0;
        let duty = (s.duty || 50) / 100;
        
        const gainLinear = Math.pow(10, s.gain / 20) || 0.5;
        const waveform = s.waveform || 'sine';
        const noiseType = s.noiseType || 'white';
        
        // Noise buffer for noise synthesis
        let noiseBuffer = null;
        if (s.synthesisType === 'noise') {
            const bufferSize = sampleRate * 2; // 2 seconds buffer
            noiseBuffer = new Float32Array(bufferSize);
            for (let i = 0; i < bufferSize; i++) {
                if (noiseType === 'pink') {
                    // Pink noise approximation
                    const white = Math.random() * 2 - 1;
                    noiseBuffer[i] = (noiseBuffer[i-1] || 0) + (0.02 * white) / 1.02;
                    noiseBuffer[i] *= 0.98;
                } else {
                    // White noise
                    noiseBuffer[i] = Math.random() * 2 - 1;
                }
            }
        }
        
        for (let i = 0; i < leftData.length; i++) {
            const t = i / sampleRate;
            const envelope = this.calculateEnvelope(t, s);

            // Frequency slide
            slide += (s.deltaSlide || 0) / sampleRate;
            frequency = Math.max(s.minFreq || 20, frequency + slide);

            let sample = 0;

            if (s.synthesisType === 'noise') {
                // Noise synthesis
                sample = noiseBuffer[i % noiseBuffer.length];
            } else {
                phase += (frequency / sampleRate) * Math.PI * 2;
                
                switch (waveform) {
                    case 'sine':
                        sample = Math.sin(phase);
                        break;
                    
                    case 'triangle':
                        const trianglePhase = (phase % (Math.PI * 2)) / (Math.PI * 2);
                        sample = trianglePhase < 0.5 
                            ? -1 + 4 * trianglePhase 
                            : 3 - 4 * trianglePhase;
                        break;
                    
                    case 'sawtooth':
                        sample = -1 + 2 * ((phase % (Math.PI * 2)) / (Math.PI * 2));
                        break;
                    
                    case 'noise':
                        sample = Math.random() * 2 - 1;
                        break;
                    
                    case 'square':
                        sample = (phase % (Math.PI * 2)) < (Math.PI * 2 * duty) ? 1 : -1;
                        break;
                    
                    case 'pulse':
                        const pulseWidth = s.pulseWidth || 0.5;
                        sample = (phase % (Math.PI * 2)) < (Math.PI * 2 * pulseWidth) ? 1 : -1;
                        break;
                    
                    case 'wavetable':
                        if (s.wavetable) {
                            const wtIndex = ((phase / (Math.PI * 2)) * s.wavetable.length) % s.wavetable.length;
                            const idx = Math.floor(wtIndex);
                            const frac = wtIndex - idx;
                            const nextIdx = (idx + 1) % s.wavetable.length;
                            sample = s.wavetable[idx] * (1 - frac) + s.wavetable[nextIdx] * frac;
                        } else {
                            sample = Math.sin(phase);
                        }
                        break;
                    
                    default:
                        sample = Math.sin(phase);
                }
            }

            // Add harmonics if specified
            if (s.harmonics && !s.synthesisType) {
                let harmonicSample = sample;
                for (let h = 2; h <= s.harmonics.length + 1; h++) {
                    const hPhase = phase * h;
                    const hWeight = s.harmonics[h - 2] || 0;
                    harmonicSample += Math.sin(hPhase) * hWeight * 0.5;
                }
                sample = harmonicSample / (1 + s.harmonics.reduce((a, b) => a + b, 0) * 0.5);
            }

            const pan = s.pan || 0;
            leftData[i] = sample * envelope * gainLinear * (1 - pan);
            rightData[i] = sample * envelope * gainLinear * (1 + pan);
        }
    }

    // Enhanced envelope with more stages
    calculateEnvelope(t, settings) {
        const attack = settings.attack || 0.01;
        const decay = settings.decay || 0.1;
        const sustain = settings.sustain || 0.3;
        const release = settings.release || 0.1;
        const hold = settings.hold || 0;
        
        let envelope = 0;
        
        if (t < attack) {
            // Attack - use exponential for smoother start
            envelope = Math.pow(t / attack, 2);
        } else if (t < attack + hold) {
            // Hold at peak
            envelope = 1;
        } else if (t < attack + hold + decay) {
            // Decay to sustain
            const decayProgress = (t - attack - hold) / decay;
            envelope = 1 - (1 - sustain) * decayProgress;
        } else if (t < attack + hold + decay + sustain) {
            // Sustain phase
            envelope = sustain;
            
            // Apply punch if enabled
            if (settings.punch > 0) {
                const punchStart = attack + hold + decay;
                const punchProgress = (t - punchStart) / sustain;
                envelope += (settings.punch / 100) * Math.exp(-punchProgress * 3);
            }
        } else {
            // Release
            const releaseProgress = (t - attack - hold - decay - sustain) / release;
            envelope = sustain * (1 - Math.pow(releaseProgress, 2));
        }
        
        return Math.max(0, Math.min(1, envelope));
    }

    // Simple reverb using convolution
    applyReverb(leftData, rightData, mix, sampleRate) {
        const reverbLength = Math.floor(2 * sampleRate);
        const reverbBuffer = this.audioEngine.context.createBuffer(2, reverbLength, sampleRate);
        
        // Generate reverb impulse
        for (let channel = 0; channel < 2; channel++) {
            const data = reverbBuffer.getChannelData(channel);
            for (let i = 0; i < reverbLength; i++) {
                // Exponential decay noise
                const decay = Math.exp(-i / (sampleRate * 0.5));
                data[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        
        // Mix reverb (simplified convolution)
        const dryLeft = [...leftData];
        const dryRight = [...rightData];
        
        for (let i = 0; i < leftData.length; i++) {
            let reverbSample = 0;
            const reverbData = reverbBuffer.getChannelData(0);
            
            // Simple delay-based reverb approximation
            for (let j = 0; j < Math.min(i, reverbLength); j += 100) {
                reverbSample += reverbData[j] * 0.1;
            }
            
            leftData[i] = dryLeft[i] * (1 - mix) + reverbSample * mix;
            rightData[i] = dryRight[i] * (1 - mix) + reverbSample * mix;
        }
    }

    // Stereo width adjustment
    applyStereoWidth(leftData, rightData, width) {
        const mid = new Float32Array(leftData.length);
        const side = new Float32Array(leftData.length);
        
        for (let i = 0; i < leftData.length; i++) {
            mid[i] = (leftData[i] + rightData[i]) / 2;
            side[i] = (leftData[i] - rightData[i]) / 2;
        }
        
        for (let i = 0; i < leftData.length; i++) {
            leftData[i] = mid[i] + side[i] * (1 + width);
            rightData[i] = mid[i] - side[i] * (1 + width);
        }
    }

    // Mastering - gain and limiting
    applyMastering(leftData, rightData, gainDb) {
        const gain = Math.pow(10, gainDb / 20) || 0.8;
        
        for (let i = 0; i < leftData.length; i++) {
            leftData[i] *= gain;
            rightData[i] *= gain;
        }
    }

    generatePreviewSamples(settings, numSamples = 200) {
        const duration = 0.5;
        const sampleRate = 44100;
        const samples = [];
        
        for (let i = 0; i < numSamples; i++) {
            const t = (i / numSamples) * duration;
            const envelope = this.calculateEnvelope(t, settings);
            samples.push(envelope);
        }
        
        return samples;
    }

    calculateDuration(settings) {
        return (settings.attack || 0.01) + (settings.sustain || 0.3) + (settings.decay || 0.1);
    }

    // Generate harmonic series for additive synthesis
    generateHarmonicSeries(fundamental, numHarmonics = 8) {
        const harmonics = [];
        for (let i = 0; i < numHarmonics; i++) {
            // Decreasing amplitude for higher harmonics
            harmonics.push(1 / (i + 1));
        }
        return harmonics;
    }
}
