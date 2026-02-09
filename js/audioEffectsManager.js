/**
 * Audio Effects Manager for Pixel Music Grid
 * Manages individual sound effects and UI panels
 */

const AudioEffectsManager = {
    // Default audio effects (same as settings manager defaults)
    defaultEffects: {
        // Core amplitude & envelope
        gain: 1.0,
        decay: 0.4,
        sustain: 0.2,
        attack: 0.01,
        release: 0.2,
        pan: 0.0,
        
        // Filters
        lpf: 800,
        hpf: 200,
        bpf: 1200,
        lpq: 0.7,
        
        // Time & space
        delay: 0.25,
        delayfb: 0.4,
        delayt: 0.33,
        reverb: 0.3,
        room: 0.5,
        
        // Distortion & saturation
        distort: 0.3,
        crush: 4,
        shape: 0.5,
        
        // Pitch & playback
        speed: 1.0,
        note: 0,
        coarse: 0,
        
        // Rhythmic & glitch
        chop: 8,
        stutter: 2,
        trunc: 0.5,
        
        // Modulation
        vibrato: 4,
        vibdepth: 0.02,
        tremolo: 8,
        tremdepth: 0.5,
        
        // Probability & variation
        often: 0.75,
        sometimes: 0.5,
        rarely: 0.25
    },
    
    // Initialize the audio effects manager
    init(app) {
        console.log('Initializing Audio Effects Manager...');
        this.app = app;
        this.instrumentEffects = {}; // Store effects per instrument
        
        // Add audio effects panel to the side panel
        this.addAudioEffectsPanel();
        
        // Load effects from settings manager if available
        if (typeof SettingsManager !== 'undefined') {
            this.loadDefaultEffectsFromSettings();
        }
        
        console.log('Audio Effects Manager initialized');
    },
    
    // Load default effects from settings manager
    loadDefaultEffectsFromSettings() {
        if (SettingsManager.settings && SettingsManager.settings.audioEffects) {
            this.defaultEffects = { ...this.defaultEffects, ...SettingsManager.settings.audioEffects };
            console.log('Loaded default effects from settings manager');
        }
    },
    
    // Add audio effects panel to the side panel
    addAudioEffectsPanel() {
        const sidePanel = document.getElementById('side-panel');
        if (!sidePanel) {
            console.error('Side panel not found, cannot add audio effects panel');
            return;
        }
        
        // Create audio effects panel container
        const effectsPanel = document.createElement('div');
        effectsPanel.id = 'audio-effects-panel';
        effectsPanel.className = 'effects-panel';
        
        effectsPanel.innerHTML = `
            <div class="effects-panel-header">
                <h3>Audio Effects</h3>
                <button class="effects-panel-toggle" id="effects-panel-toggle">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="effects-panel-content" id="effects-panel-content">
                <div class="effects-category" data-category="core">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Core Amplitude & Envelope</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Core Amplitude & Envelope**

**Gain** → Volume multiplier (1.0 = normal)
**Attack** → Time to reach full volume
**Decay** → Time to reach sustain level
**Sustain** → Volume level during note
**Release** → Time to fade out after note
**Pan** → Stereo positioning (-1=left, 0=center, 1=right)"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('gain', 'Gain', 'volume-up', 0, 2, 0.01, 1.0)}
                        ${this.createEffectSlider('attack', 'Attack', 'arrow-up', 0, 1, 0.01, 0.01)}
                        ${this.createEffectSlider('decay', 'Decay', 'arrow-down', 0, 2, 0.01, 0.4)}
                        ${this.createEffectSlider('sustain', 'Sustain', 'wave-square', 0, 1, 0.01, 0.2)}
                        ${this.createEffectSlider('release', 'Release', 'arrow-down', 0, 2, 0.01, 0.2)}
                        ${this.createEffectSlider('pan', 'Pan', 'arrows-alt-h', -1, 1, 0.01, 0.0)}
                    </div>
                </div>
                
                <div class="effects-category" data-category="filters">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Filters</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Filters**

**Low-Pass Filter** → Cuts high frequencies
**High-Pass Filter** → Cuts low frequencies
**Band-Pass Filter** → Allows mid frequencies
**Filter Resonance** → Emphasizes cutoff frequency"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('lpf', 'Low-Pass Filter', 'filter', 20, 20000, 10, 800)}
                        ${this.createEffectSlider('hpf', 'High-Pass Filter', 'filter', 20, 20000, 10, 200)}
                        ${this.createEffectSlider('bpf', 'Band-Pass Filter', 'filter', 20, 20000, 10, 1200)}
                        ${this.createEffectSlider('lpq', 'Filter Resonance', 'filter', 0, 10, 0.1, 0.7)}
                    </div>
                </div>
                
                <div class="effects-category" data-category="time-space">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Time & Space Effects</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Time & Space Effects**

**Delay Time** → Echo timing in cycles
**Delay Feedback** → Echo repetition amount
**Delay Triplet** → Swing/triplet feel
**Reverb Amount** → Room reflection intensity
**Room Size** → Simulated space size"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('delay', 'Delay Time', 'clock', 0, 1, 0.01, 0.25)}
                        ${this.createEffectSlider('delayfb', 'Delay Feedback', 'redo', 0, 1, 0.01, 0.4)}
                        ${this.createEffectSlider('delayt', 'Delay Triplet', 'music', 0, 1, 0.01, 0.33)}
                        ${this.createEffectSlider('reverb', 'Reverb Amount', 'mountain', 0, 1, 0.01, 0.3)}
                        ${this.createEffectSlider('room', 'Room Size', 'cube', 0, 1, 0.01, 0.5)}
                    </div>
                </div>
                
                <div class="effects-category" data-category="distortion">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Distortion & Saturation</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Distortion & Saturation**

**Distortion** → Adds harmonic overtones
**Bitcrush** → Reduces audio bit depth
**Waveshaper** → Non-linear waveform shaping"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('distort', 'Distortion', 'fire', 0, 1, 0.01, 0.3)}
                        ${this.createEffectSlider('crush', 'Bitcrush', 'compress', 1, 16, 1, 4)}
                        ${this.createEffectSlider('shape', 'Waveshaper', 'wave-square', 0, 1, 0.01, 0.5)}
                    </div>
                </div>
                
                <div class="effects-category" data-category="pitch-playback">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Pitch & Playback</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Pitch & Playback**

**Playback Speed** → Audio speed (0.5=half, 2=double)
**Pitch** → Note pitch in semitones
**Octave Shift** → Coarse pitch adjustment"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('speed', 'Playback Speed', 'tachometer-alt', 0.1, 2, 0.01, 1.0)}
                        ${this.createEffectSlider('note', 'Pitch', 'music', -24, 24, 1, 0)}
                        ${this.createEffectSlider('coarse', 'Octave Shift', 'arrows-alt-v', -2, 2, 1, 0)}
                    </div>
                </div>
                
                <div class="effects-category" data-category="rhythmic">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Rhythmic & Glitch</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Rhythmic & Glitch**

**Chop** → Sample slicing/division
**Stutter** → Rapid repetition effect
**Truncate** → Cuts audio tail"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('chop', 'Chop', 'cut', 1, 16, 1, 8)}
                        ${this.createEffectSlider('stutter', 'Stutter', 'redo', 1, 8, 1, 2)}
                        ${this.createEffectSlider('trunc', 'Truncate', 'scissors', 0, 1, 0.01, 0.5)}
                    </div>
                </div>
                
                <div class="effects-category" data-category="modulation">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Modulation & Movement</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Modulation & Movement**

**Vibrato** → Pitch oscillation rate
**Vibrato Depth** → Pitch oscillation amount
**Tremolo** → Volume oscillation rate
**Tremolo Depth** → Volume oscillation amount"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('vibrato', 'Vibrato', 'wave-sine', 1, 20, 1, 4)}
                        ${this.createEffectSlider('vibdepth', 'Vibrato Depth', 'arrows-alt-v', 0, 0.1, 0.001, 0.02)}
                        ${this.createEffectSlider('tremolo', 'Tremolo', 'wave-square', 1, 20, 1, 8)}
                        ${this.createEffectSlider('tremdepth', 'Tremolo Depth', 'arrows-alt-v', 0, 1, 0.01, 0.5)}
                    </div>
                </div>
                
                <div class="effects-category" data-category="probability">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Probability & Variation</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Probability & Variation**

**Often Probability** → High chance (75%)
**Sometimes Probability** → Medium chance (50%)
**Rarely Probability** → Low chance (25%)"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('often', 'Often Probability', 'percentage', 0, 1, 0.01, 0.75, true)}
                        ${this.createEffectSlider('sometimes', 'Sometimes Probability', 'percentage', 0, 1, 0.01, 0.5, true)}
                        ${this.createEffectSlider('rarely', 'Rarely Probability', 'percentage', 0, 1, 0.01, 0.25, true)}
                    </div>
                </div>
                
                <div class="effects-actions">
                    <button class="effects-reset" id="effects-reset">Reset to Defaults</button>
                    <button class="effects-enable" id="effects-enable">
                        <i class="fas fa-toggle-off"></i> Enable Effects
                    </button>
                </div>
            </div>
        `;
        
        // Insert the effects panel after the sound properties
        const soundProperties = document.getElementById('sound-properties');
        if (soundProperties) {
            sidePanel.insertBefore(effectsPanel, soundProperties.nextSibling);
        } else {
            sidePanel.appendChild(effectsPanel);
        }
        
        // Add CSS for the effects panel
        this.addEffectsPanelCSS();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Audio effects panel added to side panel');
    },
    
    // Create an effect control HTML with enable/disable checkbox and tooltip
    createEffectSlider(effectId, label, icon, min, max, step, defaultValue, isPercentage = false) {
        const tooltip = this.getEffectTooltip(effectId, label);
        return `
            <div class="effect-control" data-effect="${effectId}">
                <div class="effect-header">
                    <label class="effect-enable-label">
                        <input type="checkbox"
                               class="effect-enable-checkbox"
                               data-effect="${effectId}"
                               ${defaultValue !== this.defaultEffects[effectId] ? 'checked' : ''}>
                        <span class="effect-enable-checkmark"></span>
                        <span class="effect-label-text">
                            <i class="fas fa-${icon}"></i>
                            <span>${label}</span>
                            <i class="fas fa-circle-question effect-info-icon"
                               data-tooltip="${tooltip}"
                               style="cursor: help; font-size: 12px; margin-left: 6px;"></i>
                        </span>
                    </label>
                </div>
                <div class="effect-slider-container">
                    <input type="range"
                           class="effect-slider"
                           data-effect="${effectId}"
                           min="${min}"
                           max="${max}"
                           step="${step}"
                           value="${defaultValue}">
                    <span class="effect-value" data-effect="${effectId}">${isPercentage ? Math.round(defaultValue * 100) + '%' : defaultValue}</span>
                </div>
            </div>
        `;
    },
    
    // Get tooltip text for each effect
    getEffectTooltip(effectId, label) {
        const tooltips = {
            // Core Amplitude & Envelope
            'gain': '**Gain - Volume Control**\n\nAdjusts the overall volume of the sound.\n**1.0** = Normal volume\n**0.5** = Half volume\n**2.0** = Double volume\nUseful for balancing sounds in your mix.',
            
            'attack': '**Attack - Sound Start**\n\nControls how quickly the sound reaches full volume.\n**0.01s** = Instant attack (sharp start)\n**0.5s** = Slow attack (gradual fade-in)\n**0-1s** range\nAffects the "punch" of percussive sounds.',
            
            'decay': '**Decay - Initial Fade**\n\nDetermines how quickly the sound fades after attack.\n**0.4s** = Quick decay\n**2.0s** = Long decay\n**0-2s** range\nShapes the character of the sound envelope.',
            
            'sustain': '**Sustain - Volume Level**\n\nSets the volume level during the main part of the sound.\n**0.2** = Lower sustain (20% volume)\n**1.0** = Full sustain (100% volume)\n**0-1** range\nAffects how "held" the sound feels.',
            
            'release': '**Release - Sound End**\n\nControls how quickly the sound fades out after note ends.\n**0.2s** = Quick release\n**2.0s** = Long release (gradual fade-out)\n**0-2s** range\nLonger releases create smoother endings.',
            
            'pan': '**Pan - Stereo Position**\n\nPositions the sound in the stereo field.\n**-1.0** = Full left\n**0.0** = Center\n**1.0** = Full right\n**-1 to 1** range\nCreate spatial effects and width in your mix.',
            
            // Filters
            'lpf': '**Low-Pass Filter**\n\nCuts high frequencies, allowing only low frequencies to pass.\n**800Hz** = Muted, bass-heavy sound\n**20000Hz** = Full frequency range\n**20-20000Hz** range\nLower values = darker, bassier sound.',
            
            'hpf': '**High-Pass Filter**\n\nCuts low frequencies, allowing only high frequencies to pass.\n**20Hz** = Full frequency range\n**200Hz** = Thin, treble-heavy sound\n**20-20000Hz** range\nHigher values = brighter, thinner sound.',
            
            'bpf': '**Band-Pass Filter**\n\nAllows only mid-range frequencies to pass.\n**1200Hz** = Telephone-like sound\n**20-20000Hz** range\nCreates nasal, focused sound characteristics.',
            
            'lpq': '**Filter Resonance**\n\nEmphasizes frequencies around the cutoff point.\n**0.7** = Moderate resonance\n**10.0** = Strong resonance (peaking)\n**0-10** range\nHigher values create more pronounced filtering effects.',
            
            // Time & Space Effects
            'delay': '**Delay Time**\n\nSets the timing between delay repetitions.\n**0.25** = Quarter-note delay\n**0.5** = Half-note delay\n**0-1** cycles range\nSyncs with musical timing for rhythmic effects.',
            
            'delayfb': '**Delay Feedback**\n\nControls how much delay signal is fed back.\n**0.4** = Moderate feedback\n**0.9** = Long feedback trails\n**0-1** range\nHigher values create more repetitions.',
            
            'delayt': '**Delay Triplet**\n\nAdds swing/triplet feel to delay timing.\n**0.33** = Triplet timing\n**0.5** = Dotted timing\n**0-1** range\nCreates more natural, musical delay patterns.',
            
            'reverb': '**Reverb Amount**\n\nControls the intensity of reverb effect.\n**0.3** = Subtle room ambiance\n**1.0** = Full wet reverb\n**0-1** range\nAdds spatial depth to sounds.',
            
            'room': '**Room Size**\n\nSimulates different physical spaces.\n**0.5** = Medium room\n**1.0** = Large hall\n**0-1** range\nLarger values = more diffuse reverb.',
            
            // Distortion & Saturation
            'distort': '**Distortion**\n\nAdds harmonic distortion to the sound.\n**0.3** = Subtle warmth\n**1.0** = Heavy distortion\n**0-1** range\nCreates gritty, aggressive textures.',
            
            'crush': '**Bitcrush**\n\nReduces audio bit depth for lo-fi effects.\n**4 bits** = Heavy digital distortion\n**16 bits** = Full quality\n**1-16 bits** range\nLower values = more digital artifacts.',
            
            'shape': '**Waveshaper**\n\nApplies non-linear distortion.\n**0.5** = Moderate shaping\n**1.0** = Extreme shaping\n**0-1** range\nAdds harmonic richness and saturation.',
            
            // Pitch & Playback
            'speed': '**Playback Speed**\n\nChanges the speed of audio playback.\n**0.5** = Half speed (lower pitch)\n**1.0** = Normal speed\n**2.0** = Double speed (higher pitch)\n**0.1-2x** range\nAffects both speed and pitch simultaneously.',
            
            'note': '**Pitch - Semitones**\n\nShifts pitch in semitone increments.\n**-12** = One octave down\n**0** = Original pitch\n**12** = One octave up\n**-24 to 24** semitones range\nPrecise pitch adjustments for melody.',
            
            'coarse': '**Octave Shift**\n\nShifts pitch by full octaves.\n**-2** = Two octaves down\n**0** = Original octave\n**2** = Two octaves up\n**-2 to 2** octaves range\nDramatic pitch changes.',
            
            // Rhythmic & Glitch
            'chop': '**Chop - Sample Slices**\n\nDivides the sound into slices.\n**8 slices** = Moderate chopping\n**16 slices** = Fine granular slicing\n**1-16** slices range\nHigher values create more stuttering effects.',
            
            'stutter': '**Stutter - Repeats**\n\nCreates rapid repetition effects.\n**2 repeats** = Double hits\n**8 repeats** = Machine-gun effect\n**1-8** repeats range\nAdds rhythmic complexity and glitch effects.',
            
            'trunc': '**Truncate - Tail Cut**\n\nCuts the end of the sound.\n**0.5** = Cut sound in half\n**1.0** = Full sound length\n**0-1** range\nCreates abrupt endings and glitch effects.',
            
            // Modulation
            'vibrato': '**Vibrato - Rate**\n\nSets the speed of pitch oscillation.\n**4Hz** = Slow vibrato\n**20Hz** = Fast vibrato\n**1-20Hz** range\nFaster rates create more intense modulation.',
            
            'vibdepth': '**Vibrato Depth**\n\nControls the amount of pitch oscillation.\n**0.02** = Subtle pitch variation\n**0.1** = Strong pitch wobble\n**0-0.1** range\nHigher values = more dramatic pitch changes.',
            
            'tremolo': '**Tremolo - Rate**\n\nSets the speed of volume oscillation.\n**8Hz** = Moderate tremolo\n**20Hz** = Fast tremolo\n**1-20Hz** range\nFaster rates create more intense volume modulation.',
            
            'tremdepth': '**Tremolo Depth**\n\nControls the amount of volume oscillation.\n**0.5** = Moderate volume variation\n**1.0** = Full volume oscillation\n**0-1** range\nHigher values = more dramatic volume changes.',
            
            // Probability
            'often': '**Often Probability**\n\nHigh chance (75%) that effect will apply.\n**0.75** = 75% probability\n**1.0** = Always applies\n**0-1** range\nUseful for occasional variations.',
            
            'sometimes': '**Sometimes Probability**\n\nMedium chance (50%) that effect will apply.\n**0.5** = 50% probability\n**1.0** = Always applies\n**0-1** range\nCreates balanced randomness.',
            
            'rarely': '**Rarely Probability**\n\nLow chance (25%) that effect will apply.\n**0.25** = 25% probability\n**1.0** = Always applies\n**0-1** range\nAdds subtle, occasional variations.'
        };
        
        return tooltips[effectId] || `**${label}**\n\nAdjust this parameter to modify the sound.`;
    },
    
    // Add CSS for the effects panel
    addEffectsPanelCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Audio Effects Panel Styles */
            .effects-panel {
                margin-top: 20px;
                border-top: 1px solid var(--border-color);
                padding-top: 15px;
                flex: 1;
                overflow-y: auto;
                max-height: calc(100vh - var(--header-height) - 2rem - 100px);
            }
            
            .effects-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .effects-panel-header h3 {
                color: var(--accent-primary);
                font-size: 1rem;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .effects-panel-toggle {
                background: var(--bg-medium);
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .effects-panel-toggle:hover {
                background: var(--bg-light);
                color: var(--text-primary);
            }
            
            .effects-panel-content {
                transition: max-height 0.3s ease-out;
                overflow-y: auto;
                max-height: calc(100vh - var(--header-height) - 2rem - 150px);
            }
            
            .effects-panel.collapsed .effects-panel-content {
                max-height: 0;
            }
            
            .effects-panel:not(.collapsed) .effects-panel-content {
                max-height: 1000px;
            }
            
            .effects-category {
                margin-bottom: 15px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                overflow: hidden;
            }
            
            .effects-category-header {
                background: var(--bg-medium);
                padding: 10px 15px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s;
            }
            
            .effects-category-header:hover {
                background: var(--bg-light);
            }
            
            .effects-category-header span {
                color: var(--text-primary);
                font-size: 0.9rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .label-group {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 11px;
                font-weight: 700;
                color: var(--text-secondary);
                text-transform: uppercase;
            }
            
            .info-icon {
                font-size: 12px;
                color: var(--accent-primary);
                cursor: help;
            }
            
            .category-toggle {
                transition: transform 0.2s;
            }
            
            .effects-category.collapsed .category-toggle {
                transform: rotate(-90deg);
            }
            
            .effects-category-content {
                padding: 15px;
                background: var(--bg-dark);
                transition: max-height 0.3s ease-out;
                overflow: hidden;
            }
            
            .effects-category.collapsed .effects-category-content {
                max-height: 0;
                padding: 0 15px;
            }
            
            .effects-category:not(.collapsed) .effects-category-content {
                max-height: 1000px;
            }
            
            .effect-control {
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .effect-control:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            
            .effect-header {
                margin-bottom: 6px;
            }
            
            .effect-enable-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 0.8rem;
                color: var(--text-secondary);
                user-select: none;
            }
            
            .effect-enable-checkbox {
                display: none;
            }
            
            .effect-enable-checkmark {
                position: relative;
                width: 20px;
                height: 20px;
                border: 2px solid var(--accent-primary);
                border-radius: 4px;
                background: var(--bg-dark);
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .effect-enable-checkbox:checked + .effect-enable-checkmark {
                background: var(--accent-primary);
                border-color: var(--accent-primary);
                box-shadow: 0 0 6px rgba(0, 255, 65, 0.4);
            }
            
            .effect-enable-checkbox:checked + .effect-enable-checkmark::after {
                content: '\f00c';
                font-family: 'Font Awesome 6 Free';
                font-weight: 900;
                font-size: 12px;
                color: var(--bg-dark);
            }
            
            .effect-enable-checkbox:not(:checked) + .effect-enable-checkmark::after {
                content: '';
                position: absolute;
                width: 8px;
                height: 8px;
                background: transparent;
                border: 1px solid var(--border-color);
                border-radius: 1px;
            }
            
            .effect-enable-label:hover .effect-enable-checkmark {
                border-color: var(--accent-primary);
                background: var(--bg-light);
            }
            
            .effect-enable-label:hover .effect-enable-checkmark::before {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                border: 1px dashed var(--accent-primary);
                border-radius: 3px;
            }
            
            .effect-label-text {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .effect-label-text i {
                font-size: 0.9rem;
                color: var(--accent-primary);
            }
            
            .effect-info-icon {
                font-size: 12px;
                color: var(--accent-primary);
                margin-left: 6px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .effect-info-icon:hover {
                opacity: 1;
                color: var(--accent-secondary);
            }
            
            .effect-slider-container {
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.2s;
            }
            
            .effect-control.disabled .effect-slider-container {
                opacity: 0.3;
                pointer-events: none;
            }
            
            .effect-control.disabled .effect-enable-checkmark {
                opacity: 0.5;
            }
            
            .effect-control.disabled .effect-label-text {
                color: var(--text-secondary);
                opacity: 0.6;
            }
            
            .effect-slider {
                flex: 1;
                cursor: pointer;
            }
            
            .effect-value {
                min-width: 40px;
                text-align: right;
                font-size: 0.8rem;
                font-weight: bold;
                color: var(--accent-tertiary);
            }
            
            .effects-actions {
                display: flex;
                gap: 10px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid var(--border-color);
            }
            
            .effects-reset, .effects-enable {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .effects-reset {
                background: var(--bg-medium);
                color: var(--text-primary);
            }
            
            .effects-reset:hover {
                background: var(--bg-light);
            }
            
            .effects-enable {
                background: var(--bg-medium);
                color: var(--text-secondary);
            }
            
            .effects-enable.active {
                background: var(--accent-primary);
                color: #000;
            }
            
            .effects-enable:hover:not(.active) {
                background: var(--bg-light);
                color: var(--text-primary);
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // Initialize tooltips for dynamically created elements
    initializeTooltips() {
        // Check if tooltip system is available
        if (typeof tooltip !== 'undefined' && tooltip) {
            // Find all elements with data-tooltip attributes in the effects panel
            const effectsPanel = document.getElementById('audio-effects-panel');
            if (effectsPanel) {
                const tooltipElements = effectsPanel.querySelectorAll('[data-tooltip]');
                
                tooltipElements.forEach(el => {
                    el.style.cursor = 'help';
                    el.addEventListener('mouseenter', () => {
                        const text = el.getAttribute('data-tooltip');
                        if (text) tooltip.show(text, el);
                    });
                    el.addEventListener('mouseleave', () => {
                        if (!tooltip.tooltip.matches(':hover')) {
                            tooltip.hide();
                        }
                    });
                });
            }
        }
    },

    // Set up event listeners for the effects panel
    setupEventListeners() {
        // Panel toggle button
        const panelToggle = document.getElementById('effects-panel-toggle');
        if (panelToggle) {
            panelToggle.addEventListener('click', () => {
                this.toggleEffectsPanel();
            });
        }
        
        // Initialize tooltips for dynamically created elements
        this.initializeTooltips();
        
        // Category toggle buttons
        const categoryHeaders = document.querySelectorAll('.effects-category-header');
        categoryHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const category = header.parentElement;
                category.classList.toggle('collapsed');
            });
        });
        
        // Effect enable/disable checkboxes
        const effectCheckboxes = document.querySelectorAll('.effect-enable-checkbox');
        effectCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleEffectEnabled(e.target);
            });
        });
        
        // Effect sliders
        const effectSliders = document.querySelectorAll('.effect-slider');
        effectSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.updateEffectValue(e.target);
            });
        });
        
        // Reset button
        const resetBtn = document.getElementById('effects-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetEffectsToDefaults();
            });
        }
        
        // Enable/disable effects button
        const enableBtn = document.getElementById('effects-enable');
        if (enableBtn) {
            enableBtn.addEventListener('click', () => {
                this.toggleEffectsEnabled();
            });
        }
        
        // Initialize all effects as disabled by default
        this.initializeEffectsDisabled();
        
        // Set panel to be minimized by default
        this.setPanelMinimizedByDefault();
    },
    
    // Toggle the entire effects panel
    toggleEffectsPanel() {
        const effectsPanel = document.getElementById('audio-effects-panel');
        if (effectsPanel) {
            effectsPanel.classList.toggle('collapsed');
            const icon = document.querySelector('#effects-panel-toggle i');
            if (icon) {
                if (effectsPanel.classList.contains('collapsed')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                } else {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                }
            }
        }
    },
    
    // Update effect value display when slider changes
    updateEffectValue(slider) {
        const effectId = slider.dataset.effect;
        const valueDisplay = document.querySelector(`.effect-value[data-effect="${effectId}"]`);
        const value = parseFloat(slider.value);
        
        if (valueDisplay) {
            // Check if this is a percentage effect
            const isPercentage = effectId === 'often' || effectId === 'sometimes' || effectId === 'rarely';
            valueDisplay.textContent = isPercentage ? Math.round(value * 100) + '%' : value;
        }
        
        // Update the current instrument's effects
        if (this.currentInstrumentId) {
            this.updateInstrumentEffect(this.currentInstrumentId, effectId, value);
        }
    },
    
    // Reset all effects to defaults
    resetEffectsToDefaults() {
        const effectSliders = document.querySelectorAll('.effect-slider');
        effectSliders.forEach(slider => {
            const effectId = slider.dataset.effect;
            const defaultValue = this.defaultEffects[effectId];
            
            if (defaultValue !== undefined) {
                slider.value = defaultValue;
                const valueDisplay = document.querySelector(`.effect-value[data-effect="${effectId}"]`);
                if (valueDisplay) {
                    const isPercentage = effectId === 'often' || effectId === 'sometimes' || effectId === 'rarely';
                    valueDisplay.textContent = isPercentage ? Math.round(defaultValue * 100) + '%' : defaultValue;
                }
                
                // Disable the effect since it's back to default
                const checkbox = document.querySelector(`.effect-enable-checkbox[data-effect="${effectId}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                    const effectControl = document.querySelector(`.effect-control[data-effect="${effectId}"]`);
                    if (effectControl) {
                        effectControl.classList.add('disabled');
                    }
                }
            }
        });
        
        console.log('Audio effects reset to defaults');
    },
    
    // Toggle individual effect enabled/disabled
    toggleEffectEnabled(checkbox) {
        const effectId = checkbox.dataset.effect;
        const effectControl = document.querySelector(`.effect-control[data-effect="${effectId}"]`);
        
        if (effectControl) {
            if (checkbox.checked) {
                effectControl.classList.remove('disabled');
                console.log(`Enabled effect: ${effectId}`);
            } else {
                effectControl.classList.add('disabled');
                console.log(`Disabled effect: ${effectId}`);
            }
        }
    },
    
    // Initialize all effects as disabled by default
    initializeEffectsDisabled() {
        const effectControls = document.querySelectorAll('.effect-control');
        effectControls.forEach(control => {
            const checkbox = control.querySelector('.effect-enable-checkbox');
            if (checkbox && !checkbox.checked) {
                control.classList.add('disabled');
            }
        });
        console.log('Initialized all effects as disabled by default');
    },
    
    // Set panel to be minimized by default
    setPanelMinimizedByDefault() {
        const effectsPanel = document.getElementById('audio-effects-panel');
        if (effectsPanel) {
            effectsPanel.classList.add('collapsed');
            const icon = document.querySelector('#effects-panel-toggle i');
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
            console.log('Set audio effects panel to minimized by default');
        }
    },
    
    // Toggle effects enabled/disabled
    toggleEffectsEnabled() {
        const enableBtn = document.getElementById('effects-enable');
        if (enableBtn) {
            enableBtn.classList.toggle('active');
            const icon = enableBtn.querySelector('i');
            if (icon) {
                if (enableBtn.classList.contains('active')) {
                    icon.classList.remove('fa-toggle-off');
                    icon.classList.add('fa-toggle-on');
                    enableBtn.querySelector('span').textContent = 'Effects Enabled';
                } else {
                    icon.classList.remove('fa-toggle-on');
                    icon.classList.add('fa-toggle-off');
                    enableBtn.querySelector('span').textContent = 'Enable Effects';
                }
            }
        }
    },
    
    // Set the current instrument for effects editing
    setCurrentInstrument(instrumentId) {
        this.currentInstrumentId = instrumentId;
        
        // Load the instrument's effects or use defaults
        const instrumentEffects = this.instrumentEffects[instrumentId] || { ...this.defaultEffects };
        
        // Update all sliders to show the instrument's effects
        for (const effectId in instrumentEffects) {
            const slider = document.querySelector(`.effect-slider[data-effect="${effectId}"]`);
            const valueDisplay = document.querySelector(`.effect-value[data-effect="${effectId}"]`);
            const checkbox = document.querySelector(`.effect-enable-checkbox[data-effect="${effectId}"]`);
            
            if (slider && valueDisplay) {
                slider.value = instrumentEffects[effectId];
                const isPercentage = effectId === 'often' || effectId === 'sometimes' || effectId === 'rarely';
                valueDisplay.textContent = isPercentage ? Math.round(instrumentEffects[effectId] * 100) + '%' : instrumentEffects[effectId];
            }
            
            // Check if this effect is different from default (enable it)
            if (checkbox && instrumentEffects[effectId] !== this.defaultEffects[effectId]) {
                checkbox.checked = true;
                const effectControl = document.querySelector(`.effect-control[data-effect="${effectId}"]`);
                if (effectControl) {
                    effectControl.classList.remove('disabled');
                }
            }
        }
        
        console.log(`Set current instrument for effects: ${instrumentId}`);
    },
    
    // Update an effect for a specific instrument
    updateInstrumentEffect(instrumentId, effectId, value) {
        if (!this.instrumentEffects[instrumentId]) {
            this.instrumentEffects[instrumentId] = { ...this.defaultEffects };
        }
        
        this.instrumentEffects[instrumentId][effectId] = value;
        console.log(`Updated effect ${effectId} for instrument ${instrumentId}: ${value}`);
    },
    
    // Get all effects for an instrument
    getInstrumentEffects(instrumentId) {
        return this.instrumentEffects[instrumentId] || { ...this.defaultEffects };
    },
    
    // Apply effects to an instrument during playback
    applyEffectsToInstrument(instrument, audioContext) {
        const effects = this.getInstrumentEffects(instrument.id);
        
        // Here you would apply the effects using Tone.js or Web Audio API
        // This is a placeholder for the actual implementation
        console.log(`Applying effects to instrument ${instrument.id}:`, effects);
        
        // Example: Apply gain
        // const gainNode = audioContext.createGain();
        // gainNode.gain.value = effects.gain;
        
        // Example: Apply pan
        // const panner = audioContext.createStereoPanner();
        // panner.pan.value = effects.pan;
        
        return null; // Return the effects chain
    }
};

// Initialize the audio effects manager when the app is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if app is available globally
    if (typeof app !== 'undefined') {
        AudioEffectsManager.init(app);
    } else {
        // If app is not available yet, try to initialize later
        setTimeout(() => {
            if (typeof app !== 'undefined') {
                AudioEffectsManager.init(app);
            }
        }, 1000);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioEffectsManager;
}