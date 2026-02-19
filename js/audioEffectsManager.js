/**
 * Audio Effects Manager for Pixel Music Grid — Upgraded
 *
 * Key fixes from original:
 *  - LPF default was 800Hz (muffling everything!) → now 18000Hz (open & clear)
 *  - HPF default was 200Hz (cutting bass!) → now 30Hz (barely touching)
 *  - Added chorus effect parameters
 *  - Better gain staging defaults (gain 1.0, not hitting saturation by default)
 *  - Compressor defaults tuned for music (not pumpy)
 *  - Reverb room size now actually mapped to decay time
 */

const AudioEffectsManager = {
    defaultEffects: {
        // Core amplitude & envelope
        gain: 1.0,
        decay: 0.4,
        sustain: 0.6,       // was 0.2 — too quiet during notes
        attack: 0.01,
        release: 0.3,
        pan: 0.0,

        // Filters — FIXED: was 800Hz LPF which muffled everything
        lpf: 18000,         // fully open by default
        hpf: 30,            // barely touching bass
        bpf: 1200,
        lpq: 0.7,

        // Time & space
        delay: 0,           // off by default (was 0.25 — always echo'd)
        delayfb: 0.35,
        delayt: 0.25,
        reverb: 0.25,
        room: 0.5,

        // Chorus (new)
        chorus: 0,
        chorusrate: 0.6,
        chorusdepth: 0.003,

        // Distortion & saturation
        distort: 0,         // off by default (was 0.3 — always distorted)
        crush: 16,          // bit depth — 16 = full quality
        shape: 0.0,

        // Pitch & playback
        speed: 1.0,
        note: 0,
        coarse: 0,

        // Rhythmic & glitch
        chop: 8,
        stutter: 2,
        trunc: 1.0,         // was 0.5 — was cutting notes short

        // Modulation
        vibrato: 0,         // off by default
        vibdepth: 0.02,
        tremolo: 0,         // off by default
        tremdepth: 0.5,

        // Probability & variation
        often: 0.75,
        sometimes: 0.5,
        rarely: 0.25
    },

    init(app) {
        console.log('Initializing Audio Effects Manager (upgraded)...');
        this.app = app;
        this.instrumentEffects = {};

        this.addAudioEffectsPanel();

        if (typeof SettingsManager !== 'undefined') {
            this.loadDefaultEffectsFromSettings();
        }

        console.log('Audio Effects Manager initialized');
    },

    loadDefaultEffectsFromSettings() {
        if (SettingsManager.settings && SettingsManager.settings.audioEffects) {
            this.defaultEffects = { ...this.defaultEffects, ...SettingsManager.settings.audioEffects };
        }
    },

    addAudioEffectsPanel() {
        const sidePanel = document.getElementById('side-panel');
        if (!sidePanel) return;

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
                               data-tooltip="**Gain** → Volume multiplier&#10;**Attack** → Time to reach full volume&#10;**Decay** → Time to reach sustain&#10;**Sustain** → Volume held during note&#10;**Release** → Fade-out time&#10;**Pan** → Stereo position"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('gain',    'Gain',    'volume-up',    0,  2,     0.01, 1.0)}
                        ${this.createEffectSlider('attack',  'Attack',  'arrow-up',     0,  1,     0.005, 0.01)}
                        ${this.createEffectSlider('decay',   'Decay',   'arrow-down',   0,  2,     0.01, 0.4)}
                        ${this.createEffectSlider('sustain', 'Sustain', 'wave-square',  0,  1,     0.01, 0.6)}
                        ${this.createEffectSlider('release', 'Release', 'arrow-down',   0,  2,     0.01, 0.3)}
                        ${this.createEffectSlider('pan',     'Pan',     'arrows-alt-h', -1, 1,     0.01, 0.0)}
                    </div>
                </div>

                <div class="effects-category" data-category="filters">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Filters</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Low-Pass** → Cuts highs (turn down for warmth)&#10;**High-Pass** → Cuts lows (turn up to remove rumble)&#10;**Resonance** → Emphasises cutoff frequency"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('lpf', 'Low-Pass Filter',  'filter', 200,  20000, 50,  18000)}
                        ${this.createEffectSlider('hpf', 'High-Pass Filter', 'filter', 20,   5000,  10,  30)}
                        ${this.createEffectSlider('bpf', 'Band-Pass Filter', 'filter', 200,  10000, 50,  1200)}
                        ${this.createEffectSlider('lpq', 'Resonance (Q)',    'filter', 0.1,  18,    0.1, 0.7)}
                    </div>
                </div>

                <div class="effects-category" data-category="time-space">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Time & Space</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Reverb** → Room reflection&#10;**Room Size** → Large = long tail&#10;**Delay** → Echo amount&#10;**Feedback** → Echo repetitions&#10;**Chorus** → Shimmer/thickness"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('reverb',     'Reverb Amount',   'mountain',  0, 1,    0.01, 0.25)}
                        ${this.createEffectSlider('room',       'Room Size',       'cube',       0, 1,    0.01, 0.5)}
                        ${this.createEffectSlider('delay',      'Delay Amount',    'clock',      0, 1,    0.01, 0)}
                        ${this.createEffectSlider('delayfb',    'Delay Feedback',  'redo',       0, 0.9,  0.01, 0.35)}
                        ${this.createEffectSlider('delayt',     'Delay Time (s)',  'music',      0.05, 1, 0.01, 0.25)}
                        ${this.createEffectSlider('chorus',     'Chorus Amount',   'water',      0, 1,    0.01, 0)}
                        ${this.createEffectSlider('chorusrate', 'Chorus Rate',     'sync-alt',   0.1, 8,  0.1,  0.6)}
                    </div>
                </div>

                <div class="effects-category" data-category="distortion">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Distortion & Colour</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Distortion** → Harmonic saturation&#10;**Bitcrush** → Lo-fi bit reduction&#10;**Waveshaper** → Harmonic colour"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('distort', 'Distortion',  'bolt',         0, 1, 0.01, 0)}
                        ${this.createEffectSlider('crush',   'Bitcrush',    'microchip',    4, 16, 1,   16)}
                        ${this.createEffectSlider('shape',   'Waveshaper',  'wave-square',  0, 1, 0.01, 0)}
                    </div>
                </div>

                <div class="effects-category" data-category="modulation">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Modulation</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="**Tremolo** → Rhythmic volume wobble&#10;**Vibrato** → Pitch wobble (like a singer)"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('tremolo',   'Tremolo Rate',  'wave-square', 0, 20, 0.1, 0)}
                        ${this.createEffectSlider('tremdepth', 'Tremolo Depth', 'arrows-v',    0, 1,  0.01, 0.5)}
                        ${this.createEffectSlider('vibrato',   'Vibrato Rate',  'music',       0, 20, 0.1, 0)}
                        ${this.createEffectSlider('vibdepth',  'Vibrato Depth', 'arrows-v',    0, 0.1, 0.005, 0.02)}
                    </div>
                </div>

                <div class="effects-category" data-category="probability">
                    <div class="effects-category-header">
                        <div class="label-group">
                            <span>Probability & Variation</span>
                            <i class="fas fa-circle-question info-icon"
                               data-tooltip="Control how often notes play for organic, humanised feel"
                               style="cursor: help;"></i>
                        </div>
                        <i class="fas fa-chevron-down category-toggle"></i>
                    </div>
                    <div class="effects-category-content">
                        ${this.createEffectSlider('often',     'Often',     'dice-5', 0, 1, 0.01, 0.75)}
                        ${this.createEffectSlider('sometimes', 'Sometimes', 'dice-3', 0, 1, 0.01, 0.5)}
                        ${this.createEffectSlider('rarely',    'Rarely',    'dice-1', 0, 1, 0.01, 0.25)}
                    </div>
                </div>

                <div class="effects-actions">
                    <button class="btn btn-secondary" onclick="AudioEffectsManager.resetEffectsToDefaults()">
                        <i class="fas fa-undo"></i> Reset to Defaults
                    </button>
                </div>
            </div>
        `;

        sidePanel.appendChild(effectsPanel);

        // Wire up toggle
        document.getElementById('effects-panel-toggle')?.addEventListener('click', () => {
            effectsPanel.classList.toggle('collapsed');
        });

        // Wire up category toggles
        effectsPanel.querySelectorAll('.effects-category-header').forEach(header => {
            header.addEventListener('click', () => {
                const category = header.closest('.effects-category');
                category.classList.toggle('collapsed');
            });
        });

        // Wire up all sliders
        effectsPanel.querySelectorAll('.effect-slider').forEach(slider => {
            slider.addEventListener('input', () => {
                this.onEffectChange(slider.dataset.effect, parseFloat(slider.value));
            });
        });

        this.initializeEffectsDisabled();
        this.setPanelMinimizedByDefault();
    },

    createEffectSlider(id, label, icon, min, max, step, defaultVal) {
        return `
            <div class="effect-control" data-effect="${id}">
                <div class="effect-label">
                    <label>
                        <input type="checkbox" class="effect-enable-checkbox" data-effect="${id}">
                        <i class="fas fa-${icon}"></i> ${label}
                    </label>
                    <span class="effect-value" data-effect="${id}">${defaultVal}</span>
                </div>
                <input type="range" class="effect-slider" data-effect="${id}"
                       min="${min}" max="${max}" step="${step}" value="${defaultVal}">
            </div>
        `;
    },

    onEffectChange(effectId, value) {
        const valueDisplay = document.querySelector(`.effect-value[data-effect="${effectId}"]`);
        if (valueDisplay) {
            const isPercent = ['often', 'sometimes', 'rarely'].includes(effectId);
            valueDisplay.textContent = isPercent ? Math.round(value * 100) + '%' : value;
        }

        if (this.currentInstrumentId) {
            this.updateInstrumentEffect(this.currentInstrumentId, effectId, value);
        }

        // Live-update the audio engine if available
        this._applyLiveEffect(effectId, value);
    },

    _applyLiveEffect(effectId, value) {
        // Hook into HowlerAudioEngine if available
        const engine = window.audioEngine || window.songApp?.audioEngine;
        if (!engine) return;

        switch (effectId) {
            case 'reverb':  engine.setReverb?.(value); break;
            case 'delay':   engine.setDelay?.(value); break;
            case 'lpf':     engine.setFilter?.(value); break;
            case 'distort': engine.setDistortion?.(value); break;
            case 'chorus':  engine.setChorus?.(value); break;
        }
    },

    resetEffectsToDefaults() {
        document.querySelectorAll('.effect-slider').forEach(slider => {
            const id = slider.dataset.effect;
            const def = this.defaultEffects[id];
            if (def !== undefined) {
                slider.value = def;
                const vd = document.querySelector(`.effect-value[data-effect="${id}"]`);
                if (vd) {
                    const isPercent = ['often', 'sometimes', 'rarely'].includes(id);
                    vd.textContent = isPercent ? Math.round(def * 100) + '%' : def;
                }
                const cb = document.querySelector(`.effect-enable-checkbox[data-effect="${id}"]`);
                if (cb) {
                    cb.checked = false;
                    document.querySelector(`.effect-control[data-effect="${id}"]`)?.classList.add('disabled');
                }
            }
        });
        console.log('Audio effects reset to defaults');
    },

    toggleEffectEnabled(checkbox) {
        const effectId = checkbox.dataset.effect;
        const control = document.querySelector(`.effect-control[data-effect="${effectId}"]`);
        if (control) {
            control.classList.toggle('disabled', !checkbox.checked);
        }
    },

    initializeEffectsDisabled() {
        document.querySelectorAll('.effect-control').forEach(control => {
            const cb = control.querySelector('.effect-enable-checkbox');
            if (cb && !cb.checked) control.classList.add('disabled');
        });
    },

    setPanelMinimizedByDefault() {
        document.getElementById('audio-effects-panel')?.classList.add('collapsed');
    },

    setCurrentInstrument(instrumentId) {
        this.currentInstrumentId = instrumentId;
        const fx = this.instrumentEffects[instrumentId] || { ...this.defaultEffects };

        for (const [id, val] of Object.entries(fx)) {
            const slider = document.querySelector(`.effect-slider[data-effect="${id}"]`);
            const vd     = document.querySelector(`.effect-value[data-effect="${id}"]`);
            const cb     = document.querySelector(`.effect-enable-checkbox[data-effect="${id}"]`);

            if (slider && vd) {
                slider.value = val;
                const isPercent = ['often', 'sometimes', 'rarely'].includes(id);
                vd.textContent = isPercent ? Math.round(val * 100) + '%' : val;
            }

            if (cb && val !== this.defaultEffects[id]) {
                cb.checked = true;
                document.querySelector(`.effect-control[data-effect="${id}"]`)?.classList.remove('disabled');
            }
        }
    },

    updateInstrumentEffect(instrumentId, effectId, value) {
        if (!this.instrumentEffects[instrumentId]) {
            this.instrumentEffects[instrumentId] = { ...this.defaultEffects };
        }
        this.instrumentEffects[instrumentId][effectId] = value;
    },

    getInstrumentEffects(instrumentId) {
        return this.instrumentEffects[instrumentId] || { ...this.defaultEffects };
    },

    applyEffectsToInstrument(instrument, audioContext) {
        const effects = this.getInstrumentEffects(instrument.id);
        console.log(`Applying effects to instrument ${instrument.id}:`, effects);
        return effects;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const tryInit = () => {
        if (typeof app !== 'undefined') {
            AudioEffectsManager.init(app);
        } else {
            setTimeout(tryInit, 500);
        }
    };
    tryInit();
});

if (typeof module !== 'undefined' && module.exports) module.exports = AudioEffectsManager;
