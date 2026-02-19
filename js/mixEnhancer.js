/**
 * MixEnhancer.js - Professional mixing utilities
 * 
 * A drop-in addition with four independent improvements:
 * 1. Mid-Side stereo widener
 * 2. Presence EQ (4-band master EQ)
 * 3. Humanizer utilities for natural feel
 * 4. Staging presets for proper instrument positioning
 * 
 * Usage:
 *   - Call MixEnhancer.humanizeTime() and MixEnhancer.humanizeVelocity() when scheduling notes
 *   - Use MixEnhancer.getPanPreset('kick') for proper instrument panning
 *   - Use MixEnhancer.getReverbSend('bass') for appropriate reverb amounts
 *   - Wire up midSideWidener and presenceEQ in your audio chain
 */

const MixEnhancer = {
    // Configuration
    config: {
        // Humanizer settings
        timeVariationMs: 8,      // ±8ms timing variation
        velocityVariation: 0.1,   // ±10% velocity variation
        
        // Stereo widener settings
        stereoWidth: 0.6,         // 0-1, how wide the stereo field is
        bassCenterFreq: 200,      // Hz - below this, bass stays centered
        
        // Presence EQ settings (dB boosts/cuts)
        eq: {
            subBass: 2,           // +2dB at 80Hz for weight
            lowMid: -1.5,         // -1.5dB at 400Hz to remove boxiness
            presence: 1,          // +1dB at 3kHz for clarity
            air: 1.5              // +1.5dB at 8kHz for air
        }
    },

    // Audio nodes (to be wired by the audio engine)
    audioContext: null,
    isInitialized: false,

    // EQ nodes
    subBassFilter: null,
    lowMidFilter: null,
    presenceFilter: null,
    airFilter: null,

    /**
     * Initialize the MixEnhancer audio nodes
     * Call this after your AudioContext is created
     */
    init(audioContext) {
        if (this.isInitialized) return;
        
        this.audioContext = audioContext;
        
        // Create Presence EQ (4-band)
        this._createPresenceEQ();
        
        this.isInitialized = true;
        console.log('MixEnhancer initialized');
    },

    /**
     * Create 4-band Presence EQ
     * Sub-bass (80Hz), Low-mid (400Hz), Presence (3kHz), Air (8kHz)
     */
    _createPresenceEQ() {
        const ctx = this.audioContext;
        
        // Create 4-band EQ using BiquadFilters
        this.subBassFilter = ctx.createBiquadFilter();
        this.subBassFilter.type = 'lowshelf';
        this.subBassFilter.frequency.value = 80;
        this.subBassFilter.gain.value = this.config.eq.subBass;
        this.subBassFilter.Q.value = 0.7;

        this.lowMidFilter = ctx.createBiquadFilter();
        this.lowMidFilter.type = 'peaking';
        this.lowMidFilter.frequency.value = 400;
        this.lowMidFilter.gain.value = this.config.eq.lowMid;
        this.lowMidFilter.Q.value = 1.0;

        this.presenceFilter = ctx.createBiquadFilter();
        this.presenceFilter.type = 'peaking';
        this.presenceFilter.frequency.value = 3000;
        this.presenceFilter.gain.value = this.config.eq.presence;
        this.presenceFilter.Q.value = 1.2;

        this.airFilter = ctx.createBiquadFilter();
        this.airFilter.type = 'highshelf';
        this.airFilter.frequency.value = 8000;
        this.airFilter.gain.value = this.config.eq.air;
        this.airFilter.Q.value = 0.7;

        // Chain them together: input → sub → lowmid → presence → air → output
        this.subBassFilter.connect(this.lowMidFilter);
        this.lowMidFilter.connect(this.presenceFilter);
        this.presenceFilter.connect(this.airFilter);

        // Expose output node for connection to audio chain
        this.presenceEQOutput = this.airFilter;
        this.presenceEQInput = this.subBassFilter;
    },

    /**
     * Get the EQ input node (connect your master bus here)
     */
    getEQInput() {
        return this.presenceEQInput;
    },

    /**
     * Get the EQ output node (connect to destination after this)
     */
    getEQOutput() {
        return this.presenceEQOutput;
    },

    // ═══════════════════════════════════════════════════════════════
    // HUMANIZER UTILITIES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Add human timing variation to a note start time
     * Call this when scheduling notes for natural feel
     * @param {number} baseTime - The original note time
     * @returns {number} - Time with ±8ms random variation
     */
    humanizeTime(baseTime) {
        const variation = (Math.random() - 0.5) * 2 * (this.config.timeVariationMs / 1000);
        return baseTime + variation;
    },

    /**
     * Add human velocity variation to a note velocity
     * @param {number} baseVelocity - The original velocity (0-1)
     * @returns {number} - Velocity with ±10% random variation
     */
    humanizeVelocity(baseVelocity) {
        const variation = (Math.random() - 0.5) * 2 * this.config.velocityVariation;
        return Math.max(0, Math.min(1, baseVelocity + variation));
    },

    /**
     * Humanize a note object with time and velocity variation
     * @param {object} note - Note object with time and velocity properties
     * @returns {object} - Humanized note
     */
    humanizeNote(note) {
        return {
            ...note,
            time: this.humanizeTime(note.time),
            velocity: this.humanizeVelocity(note.velocity || 0.8)
        };
    },

    // ═══════════════════════════════════════════════════════════════
    // STAGING PRESETS - Instrument positioning
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get the correct pan value for an instrument
     * @param {string} instrument - Instrument name: 'kick', 'snare', 'hihat', 'bass', 'pad', 'lead', 'harmony', 'fx'
     * @returns {number} - Pan value (-1 to 1)
     */
    getPanPreset(instrument) {
        const presets = {
            kick:    0,      // Center
            snare:   0,      // Center
            bass:    0,      // Center (bass should always be centered!)
            tom:     0,      // Center
            hihat:   0.4,   // Slightly right
            openhat: 0.4,   // Slightly right
            clap:    0,      // Center
            ride:    0.3,   // Right
            pad:     0,      // Center
            lead:    -0.1,   // Slightly left
            harmony: -0.3,  // Left
            arp:     0.1,    // Slightly right
            fx:      0.2,    // Right
            pluck:   0,      // Center
            bell:    0.2,    // Right
            sub:     0       // Center
        };
        return presets[instrument?.toLowerCase()] ?? 0;
    },

    /**
     * Get the correct reverb send amount for an instrument
     * @param {string} instrument - Instrument name
     * @returns {number} - Reverb send (0-1)
     */
    getReverbSend(instrument) {
        const presets = {
            kick:    0.03,   // Very dry - punchy
            snare:   0.15,   // Slight reverb for body
            bass:    0.05,   // Keep tight
            tom:     0.2,    // Some ring
            hihat:   0.1,    // Slight shimmer
            openhat: 0.35,   // Long tail
            clap:    0.25,   // Some space
            ride:    0.2,    // Slight shimmer
            pad:     0.45,   // Wet - ambient
            lead:    0.2,    // Moderate
            harmony: 0.35,    // Airy
            arp:     0.15,   // Slight
            fx:      0.4,    // Lots of space
            pluck:   0.1,    // Tight
            bell:    0.5,    // Ring out
            sub:     0.02    // Very dry
        };
        return presets[instrument?.toLowerCase()] ?? 0.2;
    },

    /**
     * Get the correct delay send amount for an instrument
     * @param {string} instrument - Instrument name
     * @returns {number} - Delay send (0-1)
     */
    getDelaySend(instrument) {
        const presets = {
            kick:    0,
            snare:   0,
            bass:    0,
            tom:     0.05,
            hihat:   0,
            openhat: 0.1,
            clap:    0,
            ride:    0.05,
            pad:     0.1,
            lead:    0.15,
            harmony: 0.1,
            arp:     0.2,
            fx:      0.25,
            pluck:   0.05,
            bell:    0.15,
            sub:     0
        };
        return presets[instrument?.toLowerCase()] ?? 0.05;
    },

    /**
     * Get recommended filter cutoff for an instrument
     * @param {string} instrument - Instrument name
     * @returns {number} - Filter cutoff in Hz
     */
    getFilterCutoff(instrument) {
        const presets = {
            kick:    20000,  // Full range
            snare:   15000,  // Bright
            bass:    500,    // Sub - roll off highs
            tom:     8000,   // Mid
            hihat:   18000,  // Very bright
            openhat: 12000,  // Bright but not harsh
            clap:    10000,
            ride:    12000,
            pad:     16000,  // Open
            lead:    14000,  // Present
            harmony: 12000,
            arp:     14000,
            fx:      18000,
            pluck:   8000,   // Pluck character
            bell:    18000,  // Ring
            sub:     200     // Deep sub
        };
        return presets[instrument?.toLowerCase()] ?? 18000;
    },

    /**
     * Get recommended stereo width for an instrument
     * @param {string} instrument - Instrument name
     * @returns {number} - Width (0 = mono, 1 = wide)
     */
    getStereoWidth(instrument) {
        const presets = {
            kick:    0,      // Mono - punchy
            snare:   0.2,    // Slight width
            bass:    0,      // Mono - tight
            tom:     0.3,    // Some width
            hihat:   0.5,    // Wide
            openhat: 0.6,    // Wide
            clap:    0.4,
            ride:    0.4,
            pad:     0.7,    // Very wide
            lead:    0.3,    // Moderate
            harmony: 0.6,    // Wide
            arp:     0.5,
            fx:      0.7,
            pluck:   0.2,
            bell:    0.5,
            sub:     0       // Mono
        };
        return presets[instrument?.toLowerCase()] ?? 0.3;
    },

    // ═══════════════════════════════════════════════════════════════
    // STEREO WIDENER (Simplified version using gain staging)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Calculate stereo panning based on position and width
     * @param {number} pan - Original pan (-1 to 1)
     * @param {number} width - Stereo width (0 to 1)
     * @returns {object} - { left, right } gains
     */
    calculateStereoGain(pan, width = 0.5) {
        // Convert pan (-1 to 1) to angle (0 to 2π)
        const angle = (pan + 1) * Math.PI / 2;
        
        // Apply width - wider = more extreme panning
        const leftGain = Math.cos(angle) * (1 - width * 0.5);
        const rightGain = Math.sin(angle) * (1 + width * 0.5);
        
        // Normalize
        const maxGain = Math.max(leftGain, rightGain, 1);
        return {
            left: leftGain / maxGain,
            right: rightGain / maxGain
        };
    },

    /**
     * Apply bass containment - keep low frequencies centered
     * @param {number} frequency - Frequency of the sound
     * @param {number} pan - Original pan
     * @returns {number} - Adjusted pan (bass gets pulled toward center)
     */
    applyBassContainment(frequency, pan) {
        // Frequencies below bassCenterFreq get progressively centered
        const bassThreshold = this.config.bassCenterFreq;
        
        if (frequency < bassThreshold) {
            // How much to reduce the pan
            const containmentFactor = frequency / bassThreshold;
            return pan * containmentFactor;
        }
        return pan;
    },

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * Update configuration
     * @param {object} options - Options to update
     */
    configure(options) {
        if (options.timeVariationMs !== undefined) {
            this.config.timeVariationMs = options.timeVariationMs;
        }
        if (options.velocityVariation !== undefined) {
            this.config.velocityVariation = options.velocityVariation;
        }
        if (options.stereoWidth !== undefined) {
            this.config.stereoWidth = options.stereoWidth;
        }
        if (options.eq !== undefined) {
            this.config.eq = { ...this.config.eq, ...options.eq };
            // Update EQ if already initialized
            if (this.isInitialized) {
                this._updateEQGains();
            }
        }
    },

    /**
     * Update EQ gains from config
     */
    _updateEQGains() {
        if (this.subBassFilter) {
            this.subBassFilter.gain.value = this.config.eq.subBass;
        }
        if (this.lowMidFilter) {
            this.lowMidFilter.gain.value = this.config.eq.lowMid;
        }
        if (this.presenceFilter) {
            this.presenceFilter.gain.value = this.config.eq.presence;
        }
        if (this.airFilter) {
            this.airFilter.gain.value = this.config.eq.air;
        }
    },

    /**
     * Reset to default configuration
     */
    resetConfig() {
        this.config = {
            timeVariationMs: 8,
            velocityVariation: 0.1,
            stereoWidth: 0.6,
            bassCenterFreq: 200,
            eq: {
                subBass: 2,
                lowMid: -1.5,
                presence: 1,
                air: 1.5
            }
        };
        this._updateEQGains();
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.MixEnhancer = MixEnhancer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MixEnhancer;
}
