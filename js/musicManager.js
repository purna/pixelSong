/**
 * Pixel Music Manager
 * Handles audio effects processing and management
 * Organizes all audio effects functionality into a centralized system
 */

class MusicManager {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.effectNodes = {};
        this.currentSettings = null;
        this.initialized = false;
    }

    /**
     * Initialize the Music Manager with audio context
     * @param {AudioContext} context - Web Audio API context
     */
    init(context) {
        this.audioContext = context;
        
        // Create master gain node
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        
        // Initialize effect nodes
        this.initEffectNodes();
        
        this.initialized = true;
        console.log('MusicManager initialized');
    }

    /**
     * Initialize all effect nodes
     */
    initEffectNodes() {
        // Create effect nodes with default values
        this.effectNodes = {
            // Core amplitude & envelope
            gain: this.audioContext.createGain(),
            pan: this.audioContext.createStereoPanner(),
            
            // Filters
            lpf: this.audioContext.createBiquadFilter(),
            hpf: this.audioContext.createBiquadFilter(),
            bpf: this.audioContext.createBiquadFilter(),
            
            // Time & space effects
            delay: this.audioContext.createDelay(),
            reverb: this.audioContext.createConvolver(),
            
            // Distortion & saturation
            distortion: this.audioContext.createWaveShaper(),
            
            // Modulation
            vibrato: this.audioContext.createOscillator(),
            tremolo: this.audioContext.createOscillator()
        };
        
        // Configure filter types
        this.effectNodes.lpf.type = 'lowpass';
        this.effectNodes.hpf.type = 'highpass';
        this.effectNodes.bpf.type = 'bandpass';
        
        // Set default values
        this.setDefaultEffectValues();
        
        // Connect nodes (will be reconfigured when applying effects)
        this.connectEffectChain();
    }

    /**
     * Set default values for all effect nodes
     */
    setDefaultEffectValues() {
        // Core amplitude & envelope
        this.effectNodes.gain.gain.value = 1.0;
        this.effectNodes.pan.pan.value = 0.0;
        
        // Filters - set default frequencies and Q
        this.effectNodes.lpf.frequency.value = 800;
        this.effectNodes.lpf.Q.value = 0.7;
        
        this.effectNodes.hpf.frequency.value = 200;
        this.effectNodes.hpf.Q.value = 0.7;
        
        this.effectNodes.bpf.frequency.value = 1200;
        this.effectNodes.bpf.Q.value = 0.7;
        
        // Delay
        this.effectNodes.delay.delayTime.value = 0.25;
        
        // Distortion - set to linear (no distortion) by default
        this.effectNodes.distortion.curve = this.createDistortionCurve(0.3);
        this.effectNodes.distortion.oversample = '2x';
        
        // Modulation oscillators
        this.effectNodes.vibrato.frequency.value = 4;
        this.effectNodes.vibrato.type = 'sine';
        
        this.effectNodes.tremolo.frequency.value = 8;
        this.effectNodes.tremolo.type = 'sine';
    }

    /**
     * Create distortion curve for waveshaper
     * @param {number} amount - Distortion amount (0-1)
     * @returns {Float32Array} Distortion curve
     */
    createDistortionCurve(amount) {
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < n_samples; i++) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        
        return curve;
    }

    /**
     * Connect effect nodes in processing chain
     */
    connectEffectChain() {
        // Start with source -> gain -> pan
        // Then filters -> delay -> reverb -> distortion -> modulation -> master
        // This will be dynamically reconfigured when applying effects
    }

    /**
     * Apply audio effects to a sound source
     * @param {AudioNode} source - Audio source node
     * @param {Object} settings - Audio effect settings
     */
    applyEffects(source, settings) {
        if (!this.initialized) {
            console.error('MusicManager not initialized');
            return source;
        }
        
        this.currentSettings = settings;
        
        // Start with the source
        let currentNode = source;
        
        // Apply core amplitude & envelope effects
        currentNode = this.applyCoreEffects(currentNode, settings);
        
        // Apply filters
        currentNode = this.applyFilters(currentNode, settings);
        
        // Apply time & space effects
        currentNode = this.applyTimeEffects(currentNode, settings);
        
        // Apply distortion & saturation
        currentNode = this.applyDistortionEffects(currentNode, settings);
        
        // Apply modulation effects
        currentNode = this.applyModulationEffects(currentNode, settings);
        
        // Connect to master output
        currentNode.connect(this.masterGainNode);
        
        return currentNode;
    }

    /**
     * Apply core amplitude & envelope effects
     * @param {AudioNode} node - Input audio node
     * @param {Object} settings - Effect settings
     * @returns {AudioNode} Processed audio node
     */
    applyCoreEffects(node, settings) {
        const effects = settings.audioEffects || {};
        
        // Apply gain
        if (effects.gain !== undefined) {
            this.effectNodes.gain.gain.value = effects.gain;
            node.connect(this.effectNodes.gain);
            node = this.effectNodes.gain;
        }
        
        // Apply pan
        if (effects.pan !== undefined) {
            this.effectNodes.pan.pan.value = effects.pan;
            node.connect(this.effectNodes.pan);
            node = this.effectNodes.pan;
        }
        
        return node;
    }

    /**
     * Apply filter effects
     * @param {AudioNode} node - Input audio node
     * @param {Object} settings - Effect settings
     * @returns {AudioNode} Processed audio node
     */
    applyFilters(node, settings) {
        const effects = settings.audioEffects || {};
        
        // Apply low-pass filter
        if (effects.lpf !== undefined) {
            this.effectNodes.lpf.frequency.value = effects.lpf;
            if (effects.lpq !== undefined) {
                this.effectNodes.lpf.Q.value = effects.lpq;
            }
            node.connect(this.effectNodes.lpf);
            node = this.effectNodes.lpf;
        }
        
        // Apply high-pass filter
        if (effects.hpf !== undefined) {
            this.effectNodes.hpf.frequency.value = effects.hpf;
            if (effects.lpq !== undefined) {
                this.effectNodes.hpf.Q.value = effects.lpq;
            }
            node.connect(this.effectNodes.hpf);
            node = this.effectNodes.hpf;
        }
        
        // Apply band-pass filter
        if (effects.bpf !== undefined) {
            this.effectNodes.bpf.frequency.value = effects.bpf;
            if (effects.lpq !== undefined) {
                this.effectNodes.bpf.Q.value = effects.lpq;
            }
            node.connect(this.effectNodes.bpf);
            node = this.effectNodes.bpf;
        }
        
        return node;
    }

    /**
     * Apply time & space effects
     * @param {AudioNode} node - Input audio node
     * @param {Object} settings - Effect settings
     * @returns {AudioNode} Processed audio node
     */
    applyTimeEffects(node, settings) {
        const effects = settings.audioEffects || {};
        
        // Apply delay
        if (effects.delay !== undefined && effects.delay > 0) {
            this.effectNodes.delay.delayTime.value = effects.delay;
            
            // Create feedback loop if needed
            if (effects.delayfb !== undefined && effects.delayfb > 0) {
                const feedbackGain = this.audioContext.createGain();
                feedbackGain.gain.value = effects.delayfb;
                this.effectNodes.delay.connect(feedbackGain);
                feedbackGain.connect(this.effectNodes.delay);
            }
            
            node.connect(this.effectNodes.delay);
            node = this.effectNodes.delay;
        }
        
        // Apply reverb (simplified - would need impulse response in real implementation)
        if (effects.reverb !== undefined && effects.reverb > 0) {
            // In a real implementation, you would load an impulse response
            // and set it to the convolver node
            // this.effectNodes.reverb.buffer = impulseResponse;
            node.connect(this.effectNodes.reverb);
            node = this.effectNodes.reverb;
        }
        
        return node;
    }

    /**
     * Apply distortion & saturation effects
     * @param {AudioNode} node - Input audio node
     * @param {Object} settings - Effect settings
     * @returns {AudioNode} Processed audio node
     */
    applyDistortionEffects(node, settings) {
        const effects = settings.audioEffects || {};
        
        // Apply distortion
        if (effects.distort !== undefined && effects.distort > 0) {
            this.effectNodes.distortion.curve = this.createDistortionCurve(effects.distort);
            node.connect(this.effectNodes.distortion);
            node = this.effectNodes.distortion;
        }
        
        return node;
    }

    /**
     * Apply modulation effects
     * @param {AudioNode} node - Input audio node
     * @param {Object} settings - Effect settings
     * @returns {AudioNode} Processed audio node
     */
    applyModulationEffects(node, settings) {
        const effects = settings.audioEffects || {};
        
        // Apply vibrato (pitch modulation)
        if (effects.vibrato !== undefined && effects.vibrato > 0) {
            this.effectNodes.vibrato.frequency.value = effects.vibrato;
            
            const vibratoDepth = effects.vibdepth !== undefined ? effects.vibdepth : 0.02;
            const vibratoGain = this.audioContext.createGain();
            vibratoGain.gain.value = vibratoDepth;
            
            this.effectNodes.vibrato.connect(vibratoGain);
            vibratoGain.connect(this.effectNodes.pan.pan);
            
            this.effectNodes.vibrato.start();
        }
        
        // Apply tremolo (amplitude modulation)
        if (effects.tremolo !== undefined && effects.tremolo > 0) {
            this.effectNodes.tremolo.frequency.value = effects.tremolo;
            
            const tremoloDepth = effects.tremdepth !== undefined ? effects.tremdepth : 0.5;
            const tremoloGain = this.audioContext.createGain();
            tremoloGain.gain.value = tremoloDepth;
            
            this.effectNodes.tremolo.connect(tremoloGain);
            tremoloGain.connect(this.effectNodes.gain.gain);
            
            this.effectNodes.tremolo.start();
        }
        
        return node;
    }

    /**
     * Apply pitch & playback effects
     * @param {AudioNode} node - Input audio node
     * @param {Object} settings - Effect settings
     * @returns {AudioNode} Processed audio node
     */
    applyPitchEffects(node, settings) {
        const effects = settings.audioEffects || {};
        
        // Apply playback speed (would need to be handled at source level)
        // Apply pitch shifting (would need additional processing)
        // Apply octave shifts (would need additional processing)
        
        return node;
    }

    /**
     * Apply rhythmic & glitch effects
     * @param {AudioNode} node - Input audio node
     * @param {Object} settings - Effect settings
     * @returns {AudioNode} Processed audio node
     */
    applyRhythmicEffects(node, settings) {
        const effects = settings.audioEffects || {};
        
        // Apply chop/stutter/truncate effects
        // These would typically be handled at the source/buffer level
        // rather than as real-time effects
        
        return node;
    }

    /**
     * Clean up and disconnect all effect nodes
     */
    cleanup() {
        // Stop all oscillators
        if (this.effectNodes.vibrato) {
            this.effectNodes.vibrato.stop();
        }
        if (this.effectNodes.tremolo) {
            this.effectNodes.tremolo.stop();
        }
        
        // Disconnect all nodes
        Object.values(this.effectNodes).forEach(node => {
            try {
                node.disconnect();
            } catch (e) {
                // Node might already be disconnected
            }
        });
        
        this.initialized = false;
        console.log('MusicManager cleaned up');
    }

    /**
     * Get current effect settings
     * @returns {Object} Current effect settings
     */
    getCurrentSettings() {
        return this.currentSettings;
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = volume;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicManager;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.MusicManager = MusicManager;
}