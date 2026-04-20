// presets.js - Sound presets and random generation

class Presets {
    constructor() {
        this.presets = {
            // --- GAME FX ---
            pickup: {
                attack: 0, sustain: 0.075, punch: 48, decay: 0.053,
                frequency: 1243, minFreq: 3, slide: 0, deltaSlide: 0,
                vibratoEnable: false, vibratoDepth: 0, vibratoSpeed: 0,
                arpEnable: true, arpMult: 1.18, arpSpeed: 0.085,
                duty: 50, waveform: 'square',
                lpfEnable: false, lpf: 22050, hpfEnable: false, hpf: 0,
                volume: 0.5
            },
            laser: {
                attack: 0, sustain: 0.15, punch: 0, decay: 0.3,
                frequency: 800, minFreq: 100, slide: -0.5, deltaSlide: 0,
                vibratoEnable: false, duty: 25, waveform: 'square',
                lpfEnable: true, lpf: 8000, hpfEnable: false, hpf: 0,
                volume: 0.6
            },
            explosion: {
                attack: 0, sustain: 0.5, punch: 80, decay: 0.8,
                frequency: 80, minFreq: 20, slide: -0.3, deltaSlide: 0,
                vibratoEnable: false, duty: 50, waveform: 'noise',
                lpfEnable: true, lpf: 1500, hpfEnable: true, hpf: 100,
                volume: 0.8
            },
            powerup: {
                attack: 0, sustain: 0.2, punch: 0, decay: 0.4,
                frequency: 200, minFreq: 0, slide: 0.6, deltaSlide: 0.1,
                vibratoEnable: true, vibratoDepth: 30, vibratoSpeed: 10,
                arpEnable: false, duty: 50, waveform: 'sine',
                lpfEnable: false, lpf: 22050, hpfEnable: false, hpf: 0,
                volume: 0.6
            },
            hit: {
                attack: 0, sustain: 0.05, punch: 100, decay: 0.15,
                frequency: 150, minFreq: 0, slide: -0.8, deltaSlide: 0,
                vibratoEnable: false, duty: 50, waveform: 'square',
                lpfEnable: true, lpf: 3000, hpfEnable: true, hpf: 50,
                volume: 0.7
            },
            jump: {
                attack: 0, sustain: 0.1, punch: 50, decay: 0.25,
                frequency: 400, minFreq: 0, slide: 0.4, deltaSlide: 0,
                vibratoEnable: false, duty: 50, waveform: 'square',
                lpfEnable: false, lpf: 22050, hpfEnable: false, hpf: 0,
                volume: 0.6
            },
            blip: {
                attack: 0, sustain: 0.04, punch: 0, decay: 0.08,
                frequency: 800, minFreq: 0, slide: 0, deltaSlide: 0,
                vibratoEnable: false, duty: 50, waveform: 'sine',
                lpfEnable: false, lpf: 22050, hpfEnable: false, hpf: 0,
                volume: 0.6
            },
            
            // --- FOOTSTEPS ---
            step_stone: {
                attack: 0.005, sustain: 0.02, punch: 40, decay: 0.08,
                frequency: 300, minFreq: 50, slide: -0.1, deltaSlide: 0,
                vibratoEnable: false, waveform: 'noise',
                lpfEnable: true, lpf: 8000, hpfEnable: true, hpf: 400,
                volume: 0.8
            },
            step_wood: {
                attack: 0.01, sustain: 0.03, punch: 10, decay: 0.08,
                frequency: 150, minFreq: 50, slide: 0, deltaSlide: 0,
                vibratoEnable: false, waveform: 'noise',
                lpfEnable: true, lpf: 1200, hpfEnable: true, hpf: 100,
                volume: 1.0 // Wood needs more gain as it's filtered heavily
            },
            step_sand: {
                attack: 0.02, sustain: 0.05, punch: 0, decay: 0.15,
                frequency: 800, minFreq: 0, slide: 0, deltaSlide: 0,
                vibratoEnable: false, waveform: 'noise',
                lpfEnable: true, lpf: 3000, hpfEnable: false, hpf: 0,
                volume: 0.6
            },
            step_gravel: {
                attack: 0.005, sustain: 0.05, punch: 50, decay: 0.12,
                frequency: 600, minFreq: 0, slide: 0, deltaSlide: 0,
                vibratoEnable: false, waveform: 'noise',
                lpfEnable: true, lpf: 5000, hpfEnable: true, hpf: 200,
                volume: 0.7
            },
            step_snow: {
                attack: 0.01, sustain: 0.08, punch: 20, decay: 0.15,
                frequency: 1200, minFreq: 0, slide: 0, deltaSlide: 0,
                vibratoEnable: false, waveform: 'noise',
                lpfEnable: true, lpf: 6000, hpfEnable: true, hpf: 800,
                volume: 0.5
            },

            // --- UI / SYNTH ---
            click: {
                attack: 0, sustain: 0.02, punch: 0, decay: 0.05,
                frequency: 1200, minFreq: 0, slide: 0, deltaSlide: 0,
                vibratoEnable: false, duty: 50, waveform: 'square',
                lpfEnable: false, lpf: 22050, hpfEnable: false, hpf: 0,
                volume: 0.5
            },
            hover: {
                attack: 0.01, sustain: 0.06, punch: 0, decay: 0.05,
                frequency: 1000, minFreq: 0, slide: 0, deltaSlide: 0,
                vibratoEnable: false, waveform: 'triangle',
                lpfEnable: false, lpf: 22050, hpfEnable: false, hpf: 0,
                volume: 0.4
            },
            synth_pad: {
                attack: 0.1, sustain: 0.3, punch: 0, decay: 0.2,
                frequency: 440, minFreq: 0, slide: 0, deltaSlide: 0,
                vibratoEnable: true, vibratoDepth: 20, vibratoSpeed: 5,
                arpEnable: false, duty: 50, waveform: 'sawtooth',
                lpfEnable: false, lpf: 22050, hpfEnable: false, hpf: 0,
                volume: 0.6
            },
            alarm: {
                 attack: 0.01, sustain: 0.2, punch: 0, decay: 0.1,
                 frequency: 880, minFreq: 0, slide: 0, deltaSlide: 0,
                 vibratoEnable: false, arpEnable: true, arpMult: 1.5, arpSpeed: 0.15,
                 waveform: 'square', volume: 0.6
            }
        };
    }

    get(name) {
        return this.presets[name] ? { ...this.presets[name] } : null;
    }

    getAll() {
        return Object.keys(this.presets);
    }

    // Generate random with constraints
    generateRandom() {
        const waveforms = ['square', 'sine', 'triangle', 'sawtooth', 'noise'];
        
        // Musical scales (frequencies in Hz) - Pentatonic, Major, Minor
        const pentatonicScale = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
        const majorScale = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        const minorScale = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 523.25, 587.33, 622.25];
        
        // Chord progressions for more musical randomness
        const chords = [
            // Major chord tones
            { root: 261.63, third: 329.63, fifth: 392.00 }, // C
            { root: 293.66, third: 369.99, fifth: 440.00 }, // D
            { root: 196.00, third: 246.94, fifth: 293.66 }, // G
            { root: 220.00, third: 277.18, fifth: 329.63 }, // A
            // Minor chord tones  
            { root: 146.83, third: 174.61, fifth: 220.00 }, // Am
            { root: 164.81, third: 196.00, fifth: 246.94 }, // Bdim
            { root: 110.00, third: 130.81, fifth: 164.81 }, // G
        ];
        
        // Pick a random musical approach
        const approach = Math.random();
        
        let frequency, attack, sustain, decay, vibratoEnable, arpEnable;
        
        if (approach < 0.4) {
            // 40% - Use pentatonic scale note
            frequency = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];
            attack = Math.random() * 0.15;
            sustain = 0.1 + Math.random() * 0.4;
            decay = 0.1 + Math.random() * 0.5;
            vibratoEnable = Math.random() > 0.6;
            arpEnable = Math.random() > 0.7;
        } else if (approach < 0.7) {
            // 30% - Use major scale (cheerful)
            frequency = majorScale[Math.floor(Math.random() * majorScale.length)];
            attack = 0.01 + Math.random() * 0.1;
            sustain = 0.2 + Math.random() * 0.3;
            decay = 0.2 + Math.random() * 0.4;
            vibratoEnable = Math.random() > 0.5;
            arpEnable = Math.random() > 0.8;
        } else if (approach < 0.9) {
            // 20% - Use chord tone (harmonic)
            const chord = chords[Math.floor(Math.random() * chords.length)];
            const toneType = Math.random();
            frequency = toneType < 0.33 ? chord.root : (toneType < 0.66 ? chord.third : chord.fifth);
            attack = 0.02 + Math.random() * 0.1;
            sustain = 0.3 + Math.random() * 0.3;
            decay = 0.3 + Math.random() * 0.4;
            vibratoEnable = Math.random() > 0.5;
            arpEnable = Math.random() > 0.6;
        } else {
            // 10% - Minor scale (moody)
            frequency = minorScale[Math.floor(Math.random() * minorScale.length)];
            attack = 0.1 + Math.random() * 0.2;
            sustain = 0.2 + Math.random() * 0.3;
            decay = 0.4 + Math.random() * 0.5;
            vibratoEnable = Math.random() > 0.4;
            arpEnable = Math.random() > 0.8;
        }
        
        // Envelope shapes for instruments
        const envelopeType = Math.random();
        let punch = 0;
        if (envelopeType < 0.25) {
            // Plucky
            attack = 0.001;
            decay = 0.1 + Math.random() * 0.2;
            sustain = 0;
        } else if (envelopeType < 0.5) {
            // Soft pad
            attack = 0.2 + Math.random() * 0.3;
            decay = 0.3 + Math.random() * 0.3;
            punch = 0;
        } else if (envelopeType < 0.75) {
            // Synth with punch
            decay = 0.1 + Math.random() * 0.2;
            punch = 20 + Math.random() * 40;
        }
        
        return {
            attack: attack,
            sustain: sustain,
            punch: punch,
            decay: decay,
            frequency: frequency,
            minFreq: Math.random() * 100,
            slide: (Math.random() - 0.5) * 0.3,
            deltaSlide: (Math.random() - 0.5) * 0.1,
            vibratoEnable: vibratoEnable,
            vibratoDepth: vibratoEnable ? 10 + Math.random() * 30 : 0,
            vibratoSpeed: 3 + Math.random() * 15,
            arpEnable: arpEnable,
            arpMult: 0.5 + Math.random() * 1.0,
            arpSpeed: arpEnable ? 0.05 + Math.random() * 0.2 : 0,
            duty: 30 + Math.random() * 50,
            waveform: waveforms[Math.floor(Math.random() * 4)], // Exclude noise for musical
            volume: 0.4 + Math.random() * 0.3
        };
    }
}