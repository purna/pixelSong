// soundGenerator.js - Core sound synthesis

class SoundGenerator {
    constructor() {
        this.audioEngine = null;
    }

    setAudioEngine(audioEngine) {
        this.audioEngine = audioEngine;
    }

    generate(settings, sampleRate = 44100) {
        const duration = settings.attack + settings.sustain + settings.decay;
        const samples = Math.floor(duration * sampleRate);
        
        // Use the AudioEngine's context if available
        let context;
        if (this.audioEngine && this.audioEngine.context) {
            context = this.audioEngine.context;
        } else {
            // Fallback: create a context for buffer creation only
            context = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const buffer = context.createBuffer(1, samples, context.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate audio data
        this.generateWaveform(data, settings, sampleRate);

        // Apply filters
        if (settings.lpfEnable) {
            this.applyLowPassFilter(data, settings.lpf, sampleRate);
        }
        if (settings.hpfEnable) {
            this.applyHighPassFilter(data, settings.hpf, sampleRate);
        }

        return buffer;
    }

    generateWaveform(data, s, sampleRate) {
        let phase = 0;
        let frequency = s.frequency;
        let slide = s.slide;
        let duty = s.duty / 100;
        let arpTime = 0;
        let arpMult = 1;

        const gainLinear = Math.pow(10, s.gain / 20);
        const waveform = s.waveform || 'square';

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // Calculate envelope
            const envelope = this.calculateEnvelope(t, s);

            // Frequency slide
            slide += s.deltaSlide / sampleRate;
            frequency += slide;
            frequency = Math.max(s.minFreq, frequency);

            // Arpeggiation
            if (s.arpEnable && s.arpSpeed > 0) {
                arpTime += 1 / sampleRate;
                if (arpTime > s.arpSpeed) {
                    arpTime = 0;
                    arpMult = arpMult === 1 ? s.arpMult : 1;
                }
            }

            let finalFreq = frequency * arpMult;

            // Vibrato
            if (s.vibratoEnable && s.vibratoDepth > 0) {
                const vibrato = Math.sin(t * s.vibratoSpeed * Math.PI * 2) * (s.vibratoDepth / 100);
                finalFreq *= 1 + vibrato;
            }

            // Generate waveform based on type
            phase += (finalFreq / sampleRate) * Math.PI * 2;
            let sample = 0;

            switch (waveform) {
                case 'sine':
                    sample = Math.sin(phase);
                    break;
                
                case 'triangle':
                    // Triangle wave: -1 to 1 linear
                    const trianglePhase = (phase % (Math.PI * 2)) / (Math.PI * 2);
                    sample = trianglePhase < 0.5 
                        ? -1 + 4 * trianglePhase 
                        : 3 - 4 * trianglePhase;
                    break;
                
                case 'sawtooth':
                    // Sawtooth wave: linear ramp from -1 to 1
                    sample = -1 + 2 * ((phase % (Math.PI * 2)) / (Math.PI * 2));
                    break;
                
                case 'noise':
                    // White noise: random between -1 and 1
                    sample = Math.random() * 2 - 1;
                    break;
                
                case 'square':
                default:
                    // Square wave with duty cycle
                    sample = (phase % (Math.PI * 2)) < (Math.PI * 2 * duty) ? 1 : -1;
                    break;
            }

            // Duty sweep (only applies to square wave)
            if (waveform === 'square') {
                duty += (s.dutySweep / 100) / sampleRate;
                duty = Math.max(0, Math.min(1, duty));
            }

            data[i] = sample * envelope * gainLinear;
        }
    }

    calculateEnvelope(t, settings) {
        let envelope = 0;
        
        if (t < settings.attack) {
            // Attack phase
            envelope = t / settings.attack;
        } else if (t < settings.attack + settings.sustain) {
            // Sustain phase
            envelope = 1;
            
            // Apply punch if enabled
            if (settings.punch > 0) {
                const punchT = (t - settings.attack) / settings.sustain;
                envelope += (settings.punch / 100) * (1 - punchT);
            }
        } else {
            // Decay phase
            const decayT = (t - settings.attack - settings.sustain) / settings.decay;
            envelope = 1 - decayT;
        }
        
        return Math.max(0, Math.min(1, envelope));
    }

    applyLowPassFilter(data, cutoff, sampleRate) {
        const RC = 1.0 / (cutoff * 2 * Math.PI);
        const dt = 1.0 / sampleRate;
        const alpha = dt / (RC + dt);
        
        for (let i = 1; i < data.length; i++) {
            data[i] = data[i - 1] + alpha * (data[i] - data[i - 1]);
        }
    }

    applyHighPassFilter(data, cutoff, sampleRate) {
        const RC = 1.0 / (cutoff * 2 * Math.PI);
        const dt = 1.0 / sampleRate;
        const alpha = RC / (RC + dt);
        
        let y = 0;
        for (let i = 1; i < data.length; i++) {
            y = alpha * (y + data[i] - data[i - 1]);
            data[i] = y;
        }
    }

    calculateDuration(settings) {
        return settings.attack + settings.sustain + settings.decay;
    }

    // Generate multiple samples for waveform preview
    generatePreviewSamples(settings, numSamples = 200) {
        const duration = this.calculateDuration(settings);
        const samples = [];
        
        for (let i = 0; i < numSamples; i++) {
            const t = (i / numSamples) * duration;
            const envelope = this.calculateEnvelope(t, settings);
            samples.push(envelope);
        }
        
        return samples;
    }
}
