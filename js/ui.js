// js/ui.js

class UI {
    constructor(app) {
        this.app = app;
        this.elements = {};
        this.displays = {};
        this.waveformCanvas = null;
        this.waveformCtx = null;
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        setTimeout(() => {
            this.handleResize();
            this.updateDisplay(this.app.currentSettings);
            this.drawWaveformPreview(this.app.currentSettings);
        }, 100);
    }

    cacheElements() {
        this.elements = {
            // Synth Inputs
            attack: document.getElementById('attack'),
            sustain: document.getElementById('sustain'),
            punch: document.getElementById('punch'),
            decay: document.getElementById('decay'),
            frequency: document.getElementById('frequency'),
            slide: document.getElementById('slide'),
            deltaSlide: document.getElementById('deltaSlide'),
            vibratoEnable: document.getElementById('vibratoEnable'),
            vibratoDepth: document.getElementById('vibratoDepth'),
            vibratoSpeed: document.getElementById('vibratoSpeed'),
            arpEnable: document.getElementById('arpEnable'),
            arpMult: document.getElementById('arpMult'),
            arpSpeed: document.getElementById('arpSpeed'),
            
            // Duty Cycle
            duty: document.getElementById('duty'),
            dutySection: document.getElementById('duty-section'), 

            waveform: document.getElementById('waveform'),
            
            // Layer Volume
            volume: document.getElementById('layerVolume'),
            
            // Settings Panel Controls (now handled by SettingsManager modal)
            masterVolume: document.getElementById('masterVolume'),
            defaultLengthSettings: document.getElementById('defaultLengthSettings'),
            showTooltipsSettings: document.getElementById('showTooltipsSettings'),
            saveToBrowserBtn: document.getElementById('saveToBrowserBtn'),
            loadFromBrowserBtn: document.getElementById('loadFromBrowserBtn'),
            
            // Layout
            totalLength: document.getElementById('totalLength'),
            sidePanel: document.getElementById('side-panel'),
            iconTabBtns: document.querySelectorAll('.icon-tab-btn'),
            panelContents: document.querySelectorAll('.panel-content'),
            toggleSectBtns: document.querySelectorAll('.toggle-sect-btn'),
            
            // Canvas
            timelineCanvas: document.getElementById('timeline-canvas'),
            timelineWrapper: document.querySelector('.timeline-canvas-wrapper')
        };

        this.displays = {
            freqVal: document.getElementById('freqVal'),
            slideVal: document.getElementById('slideVal'),
            deltaSlideVal: document.getElementById('deltaSlideVal'),
            dutyVal: document.getElementById('dutyVal'),
            
            attackVal: document.getElementById('attackVal'),
            sustainVal: document.getElementById('sustainVal'),
            decayVal: document.getElementById('decayVal'),
            punchVal: document.getElementById('punchVal'),
            vibratoDepthVal: document.getElementById('vibratoDepthVal'),
            vibratoSpeedVal: document.getElementById('vibratoSpeedVal'),
            arpMultVal: document.getElementById('arpMultVal'),
            arpSpeedVal: document.getElementById('arpSpeedVal'),
            
            layerVolumeVal: document.getElementById('layerVolumeVal'),
            masterVolumeVal: document.getElementById('masterVolumeVal')
        };

        this.waveformCanvas = document.getElementById('waveform-preview');
        this.waveformCtx = this.waveformCanvas?.getContext('2d');
    }

    setupEventListeners() {
        const inputs = [
            'attack', 'sustain', 'punch', 'decay', 'frequency', 'slide', 'deltaSlide',
            'vibratoDepth', 'vibratoSpeed', 'arpMult', 'arpSpeed', 'duty', 'volume'
        ];
        
        inputs.forEach(key => {
            if(this.elements[key]) {
                this.elements[key].addEventListener('input', () => this.handleInput(key, this.elements[key]));
            }
        });

        ['vibratoEnable', 'arpEnable'].forEach(key => {
             if(this.elements[key]) {
                this.elements[key].addEventListener('change', () => this.handleInput(key, this.elements[key]));
             }
        });
        
        if (this.elements.waveform) {
            this.elements.waveform.addEventListener('change', () => this.handleInput('waveform', this.elements.waveform));
        }

        // Settings Handlers
        if (this.elements.masterVolume) {
            this.elements.masterVolume.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.displays.masterVolumeVal) this.displays.masterVolumeVal.textContent = val + '%';
                if (this.app.audioEngine && this.app.audioEngine.setMasterVolume) {
                    this.app.audioEngine.setMasterVolume(val / 100);
                }
            });
        }

        if (this.elements.defaultLengthSettings) {
            this.elements.defaultLengthSettings.addEventListener('change', (e) => {
                const val = parseFloat(e.target.value);
                if (this.app.settings) this.app.settings.defaultDuration = val;
                this.app.notifications.showNotification(`Default length set to ${val}s`, 'success');
            });
        }
        
        // NEW: Show/Hide Tooltips
        if (this.elements.showTooltipsSettings) {
            this.elements.showTooltipsSettings.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.remove('tooltips-hidden');
                } else {
                    document.body.classList.add('tooltips-hidden');
                }
            });
        }

        if (this.elements.saveToBrowserBtn) {
            this.elements.saveToBrowserBtn.addEventListener('click', () => {
                if (this.app.getState) {
                    const state = this.app.getState();
                    localStorage.setItem('pixelAudioProject', JSON.stringify(state));
                    this.app.notifications.showNotification('Project saved to browser!', 'success');
                }
            });
        }

        if (this.elements.loadFromBrowserBtn) {
            this.elements.loadFromBrowserBtn.addEventListener('click', () => {
                const saved = localStorage.getItem('pixelAudioProject');
                if (saved) {
                    try {
                        const state = JSON.parse(saved);
                        if (this.app.setState) this.app.setState(state);
                        this.app.notifications.showNotification('Project loaded!', 'success');
                    } catch(e) {
                        this.app.notifications.showNotification('Failed to load project', 'error');
                    }
                } else {
                    this.app.notifications.showNotification('No saved project found', 'info');
                }
            });
        }

        if (this.elements.totalLength) {
            this.elements.totalLength.addEventListener('change', (e) => {
                if (this.app.timeline) {
                    this.app.timeline.totalLength = parseFloat(e.target.value);
                    this.app.timeline.render();
                }
            });
        }

        if (this.elements.iconTabBtns) {
            this.elements.iconTabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const panelName = btn.getAttribute('data-panel');

                    // Skip settings panel - it's now handled by SettingsManager modal
                    if (panelName === 'settings') {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }

                    const targetContent = document.getElementById(`panel-${panelName}`);

                    if (btn.classList.contains('active')) {
                        btn.classList.remove('active');
                        this.elements.sidePanel.classList.remove('open');
                        if (targetContent) targetContent.classList.remove('active');
                    } else {
                        this.elements.iconTabBtns.forEach(b => b.classList.remove('active'));
                        this.elements.panelContents.forEach(p => p.classList.remove('active'));
                        btn.classList.add('active');
                        this.elements.sidePanel.classList.add('open');
                        if (targetContent) targetContent.classList.add('active');
                    }
                });
            });
        }

        if (this.elements.toggleSectBtns) {
            this.elements.toggleSectBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const section = btn.closest('.control-section');
                    const icon = btn.querySelector('i');
                    if (section.classList.contains('minimized')) {
                        section.classList.remove('minimized');
                        icon.classList.remove('fa-plus');
                        icon.classList.add('fa-minus');
                    } else {
                        section.classList.add('minimized');
                        icon.classList.remove('fa-minus');
                        icon.classList.add('fa-plus');
                    }
                });
            });
        }

        // Add click handler to close side panel when clicking center stack
        const centerStack = document.getElementById('center-stack');
        if (centerStack) {
            centerStack.addEventListener('click', (e) => {
                // Only close if side panel is open and click is not on timeline controls
                if (this.elements.sidePanel.classList.contains('open') &&
                    !e.target.closest('.timeline-controls')) {

                    // Add closing class for animation
                    this.elements.sidePanel.classList.add('closing');
                    this.elements.sidePanel.classList.remove('open');

                    // Remove closing class after animation completes
                    setTimeout(() => {
                        this.elements.sidePanel.classList.remove('closing');
                    }, 300);

                    // Deactivate all tab buttons
                    this.elements.iconTabBtns.forEach(b => b.classList.remove('active'));
                    this.elements.panelContents.forEach(p => p.classList.remove('active'));
                }
            });
        }

        document.addEventListener('layersChanged', () => {
            const layer = this.app.layerManager.getSelectedLayer();
            if (layer) {
                this.updateDisplay(layer.settings);
                this.drawWaveformPreview(layer.settings);
            }
        });
    }

    handleInput(key, element) {
        let value;
        if (element.type === 'checkbox') value = element.checked;
        else if (key === 'waveform') value = element.value;
        else value = parseFloat(element.value);

        const updates = { [key]: value };
        if (key === 'volume') updates[key] = value / 100;

        const layer = this.app.layerManager.getSelectedLayer();
        if (layer && key === 'volume') {
            // ✅ Update only the selected layer's volume (true per-layer control)
            this.app.layerManager.updateLayer(layer.id, { volume: updates.volume });

            // ✅ Update UI to reflect the change
            if (this.displays.layerVolumeVal) {
                this.displays.layerVolumeVal.textContent = Math.round(updates.volume * 100) + '%';
            }
            if (this.elements.volume) {
                this.elements.volume.value = value; // Keep slider in sync
            }
        } else if (layer) {
            this.app.layerManager.updateLayerSettings(layer.id, updates);
        } else {
            this.app.updateSettings(updates);
        }

        this.updateDisplay(this.app.currentSettings);
        this.drawWaveformPreview(this.app.currentSettings);
    }

    updateDisplay(settings) {
        if (!settings) return;
        
        const updateText = (el, val) => { if(el) el.textContent = val; };

        // Pitch
        updateText(this.displays.freqVal, Math.round(settings.frequency));
        updateText(this.displays.slideVal, settings.slide?.toFixed(2));
        updateText(this.displays.deltaSlideVal, settings.deltaSlide?.toFixed(2));
        updateText(this.displays.dutyVal, settings.duty + '%');
        
        // Envelope
        updateText(this.displays.attackVal, settings.attack.toFixed(3) + 's');
        updateText(this.displays.sustainVal, settings.sustain.toFixed(3) + 's');
        updateText(this.displays.decayVal, settings.decay.toFixed(3) + 's');
        updateText(this.displays.punchVal, settings.punch.toFixed(0) + '%');

        // Vibrato & Arp
        updateText(this.displays.vibratoDepthVal, settings.vibratoDepth.toFixed(0));
        updateText(this.displays.vibratoSpeedVal, settings.vibratoSpeed.toFixed(1));
        updateText(this.displays.arpMultVal, settings.arpMult.toFixed(2));
        updateText(this.displays.arpSpeedVal, settings.arpSpeed.toFixed(3));
        
        // Volume - show selected layer's volume, not global settings
        const selectedLayer = this.app.layerManager.getSelectedLayer();
        if (this.displays.layerVolumeVal) {
            if (selectedLayer && selectedLayer.volume !== undefined) {
                updateText(this.displays.layerVolumeVal, Math.round(selectedLayer.volume * 100) + '%');
            } else if (settings.volume !== undefined) {
                updateText(this.displays.layerVolumeVal, Math.round(settings.volume * 100) + '%');
            }
        }

        // Logic to Disable Duty Cycle for Sine/Noise
        if (this.elements.dutySection) {
            if (settings.waveform === 'sine' || settings.waveform === 'noise') {
                this.elements.dutySection.classList.add('disabled');
                if (this.elements.duty) this.elements.duty.disabled = true;
            } else {
                this.elements.dutySection.classList.remove('disabled');
                if (this.elements.duty) this.elements.duty.disabled = false;
            }
        }

        // Sync inputs
        const setInput = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
        setInput('frequency', settings.frequency);
        setInput('slide', settings.slide);
        setInput('deltaSlide', settings.deltaSlide);
        setInput('duty', settings.duty);
        setInput('attack', settings.attack);
        setInput('sustain', settings.sustain);
        setInput('decay', settings.decay);
        setInput('punch', settings.punch);
        setInput('vibratoDepth', settings.vibratoDepth);
        setInput('vibratoSpeed', settings.vibratoSpeed);
        setInput('arpMult', settings.arpMult);
        setInput('arpSpeed', settings.arpSpeed);
        
        if(this.elements.waveform) this.elements.waveform.value = settings.waveform;

        if(this.elements.vibratoEnable) this.elements.vibratoEnable.checked = settings.vibratoEnable;
        if(this.elements.arpEnable) this.elements.arpEnable.checked = settings.arpEnable;
        
        // Volume slider - sync with selected layer's volume
        if(this.elements.volume) {
            if (selectedLayer && selectedLayer.volume !== undefined) {
                this.elements.volume.value = Math.round(selectedLayer.volume * 100);
            } else if (settings.volume !== undefined) {
                this.elements.volume.value = Math.round(settings.volume * 100);
            }
        }
    }

    drawWaveformPreview(settings) {
        if (!this.waveformCtx || !this.waveformCanvas || !this.app.soundGenerator) return;

        const ctx = this.waveformCtx;
        const canvas = this.waveformCanvas;
        
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#0f0f1b'; 
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
        ctx.stroke();

        try {
            const buffer = this.app.soundGenerator.generate(settings, 44100); 
            if (!buffer) return;
            const data = buffer.getChannelData(0);
            const step = Math.ceil(data.length / w);
            
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let x = 0; x < w; x++) {
                const i = Math.floor(x * step);
                if (i >= data.length) break;
                const val = data[i];
                const y = (h/2) - (val * (h/2 - 10)); 
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Envelope Overlay
            ctx.strokeStyle = 'rgba(255, 0, 110, 0.4)'; 
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let x = 0; x < w; x++) {
                const i = Math.floor(x * step);
                const t = i / 44100;
                
                if (this.app.soundGenerator.calculateEnvelope) {
                    const env = this.app.soundGenerator.calculateEnvelope(t, settings);
                    const y = (h/2) - (env * (h/2 - 10)); 
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);

        } catch (e) {
            console.warn("Preview error:", e);
        }
    }

    handleResize() {
        if (this.elements.timelineCanvas && this.elements.timelineWrapper) {
            const wrapper = this.elements.timelineWrapper;
            this.elements.timelineCanvas.width = wrapper.offsetWidth;
            this.elements.timelineCanvas.height = wrapper.offsetHeight;
            if (this.app.timeline) this.app.timeline.render();
        }
        
        if (this.elements.waveform && this.elements.waveform.parentElement) {
             const parent = this.elements.waveform.parentElement;
             this.elements.waveform.width = parent.offsetWidth;
             this.elements.waveform.height = parent.offsetHeight;
             this.drawWaveformPreview(this.app.currentSettings);
        }
    }
    
}