/**
 * Stage Positioning Module
 * Handles draggable instrument markers on stage, movement controls, and formation presets
 */

const StageManager = {
    // State
    selectedInstrument: null,
    instruments: {
        melody: { 
            x: 50, 
            y: 50, 
            startPos: 0, 
            endPos: 0, 
            depth: 50, 
            volume: 80,
            cutoff: 80,
            movement: 'static',
            icon: '🎻',
            label: 'Melody Strings'
        },
        rhythm: { 
            x: 50, 
            y: 80, 
            startPos: 0, 
            endPos: 0, 
            depth: 30, 
            volume: 80,
            cutoff: 80,
            movement: 'static',
            icon: '🥁',
            label: 'Rhythm & Drums'
        },
        bass: { 
            x: 35, 
            y: 80, 
            startPos: -30, 
            endPos: 0, 
            depth: 25, 
            volume: 70,
            cutoff: 75,
            movement: 'static',
            icon: '🎸',
            label: 'Bass'
        },
        lead: { 
            x: 65, 
            y: 40, 
            startPos: 30, 
            endPos: 0, 
            depth: 50, 
            volume: 70,
            cutoff: 75,
            movement: 'static',
            icon: '🎤',
            label: 'Lead'
        },
        percussion: { 
            x: 50, 
            y: 20, 
            startPos: 0, 
            endPos: 0, 
            depth: 70, 
            volume: 70,
            cutoff: 75,
            movement: 'static',
            icon: '🎶',
            label: 'Percussion'
        }
    },
    
    // Drag state
    isDragging: false,
    dragTarget: null,
    
    /**
     * Initialize Stage Manager
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.renderMarkers();
        this.updatePositionDisplays();
        this.loadFromStorage();
    },
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.stageArea = document.getElementById('stageArea');
        this.selectedInstrumentEl = document.getElementById('selectedInstrument');
        this.startPositionSlider = document.getElementById('startPosition');
        this.endPositionSlider = document.getElementById('endPosition');
        this.depthPositionSlider = document.getElementById('depthPosition');
        this.staticPanPositionSlider = document.getElementById('staticPanPosition');
        this.startPosValue = document.getElementById('startPosValue');
        this.endPosValue = document.getElementById('endPosValue');
        this.depthPosValue = document.getElementById('depthPosValue');
        this.staticPanValue = document.getElementById('staticPanValue');
        this.stageToggle = document.getElementById('stageToggle');
        this.movementButtons = document.querySelectorAll('.movement-btn');
        this.formationButtons = document.querySelectorAll('.stage-preset-btn[data-formation]');
        
        // Position control containers
        this.staticPositionControl = document.getElementById('staticPositionControl');
        this.animatedPositionControls = document.getElementById('animatedPositionControls');
        
        // Volume and Cutoff controls
        this.stageVolumeSlider = document.getElementById('stageVolume');
        this.stageCutoffSlider = document.getElementById('stageCutoff');
        this.stageVolumeValue = document.getElementById('stageVolumeValue');
        this.stageCutoffValue = document.getElementById('stageCutoffValue');
        
        // Section controls for syncing
        this.sectionControls = {
            strings: {
                volume: document.getElementById('stringsVolume'),
                cutoff: document.getElementById('stringsCutoff'),
                pan: document.getElementById('stringsPan')
            },
            rhythm: {
                volume: document.getElementById('drumVolume'),
                cutoff: document.getElementById('drumCutoff'),
                pan: document.getElementById('drumPan')
            },
            bass: {
                volume: document.getElementById('bassVolume'),
                cutoff: document.getElementById('bassCutoff'),
                pan: document.getElementById('bassPan')
            },
            lead: {
                volume: document.getElementById('leadVolume'),
                cutoff: document.getElementById('leadCutoff'),
                pan: document.getElementById('leadPan')
            },
            percussion: {
                volume: document.getElementById('percussionVolume'),
                cutoff: document.getElementById('percussionCutoff'),
                pan: document.getElementById('percussionPan')
            }
        };
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Stage marker drag events
        if (this.stageArea) {
            this.stageArea.addEventListener('mousedown', this.handleDragStart.bind(this));
            this.stageArea.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: false });
        }
        
        // Global mouse events for dragging
        document.addEventListener('mousemove', this.handleDragMove.bind(this));
        document.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        document.addEventListener('touchend', this.handleDragEnd.bind(this));
        
        // Static position slider (for "Stay Put" mode)
        if (this.staticPanPositionSlider) {
            this.staticPanPositionSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].startPos = val;
                    this.instruments[this.selectedInstrument].x = 50 + val * 0.5;
                    this.updateMarkerPosition(this.selectedInstrument);
                    this.updatePositionDisplays();
                    this.updateSectionControls();
                    this.saveToStorage();
                }
            });
        }
        
        // Start Position slider
        if (this.startPositionSlider) {
            this.startPositionSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].startPos = val;
                    this.instruments[this.selectedInstrument].x = 50 + val * 0.5;
                    this.updateMarkerPosition(this.selectedInstrument);
                    this.updatePositionDisplays();
                    this.updateSectionControls();
                    this.saveToStorage();
                }
            });
        }
        
        // End Position slider
        if (this.endPositionSlider) {
            this.endPositionSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].endPos = val;
                    this.updatePositionDisplays();
                    this.saveToStorage();
                }
            });
        }
        
        // Depth Position slider
        if (this.depthPositionSlider) {
            this.depthPositionSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].depth = val;
                    this.instruments[this.selectedInstrument].y = 90 - (val * 0.8);
                    this.updateMarkerPosition(this.selectedInstrument);
                    this.updatePositionDisplays();
                    this.saveToStorage();
                }
            });
        }
        
        // Movement type buttons
        this.movementButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.movementButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const movement = btn.dataset.movement;
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].movement = movement;
                    this.updatePositionControlsVisibility(movement);
                    this.saveToStorage();
                }
            });
        });
        
        // Formation preset buttons
        this.formationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyFormation(btn.dataset.formation);
            });
        });
        
        // Stage toggle
        if (this.stageToggle) {
            this.stageToggle.addEventListener('click', () => {
                this.toggleStage();
            });
        }
        
        // Volume and Cutoff controls for stage
        if (this.stageVolumeSlider) {
            this.stageVolumeSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].volume = val;
                    this.stageVolumeValue.textContent = val + '%';
                    this.updateSectionControls();
                    this.saveToStorage();
                }
            });
        }
        
        if (this.stageCutoffSlider) {
            this.stageCutoffSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].cutoff = val;
                    this.stageCutoffValue.textContent = val + '%';
                    this.updateSectionControls();
                    this.saveToStorage();
                }
            });
        }
    },
    
    /**
     * Update position controls visibility based on movement type
     */
    updatePositionControlsVisibility(movement) {
        if (movement === 'static') {
            // Show static pan control, hide animated controls
            if (this.staticPositionControl) {
                this.staticPositionControl.style.display = 'flex';
            }
            if (this.animatedPositionControls) {
                this.animatedPositionControls.style.display = 'none';
            }
        } else {
            // Hide static pan control, show animated controls
            if (this.staticPositionControl) {
                this.staticPositionControl.style.display = 'none';
            }
            if (this.animatedPositionControls) {
                this.animatedPositionControls.style.display = 'flex';
            }
        }
    },
    
    /**
     * Render instrument markers on stage
     */
    renderMarkers() {
        if (!this.stageArea) return;
        
        // Clear existing markers (keep stage labels)
        const labels = this.stageArea.querySelectorAll('.stage-back, .stage-front');
        this.stageArea.innerHTML = '';
        labels.forEach(label => this.stageArea.appendChild(label));
        
        // Create markers for each instrument
        Object.keys(this.instruments).forEach(instKey => {
            const inst = this.instruments[instKey];
            const marker = document.createElement('div');
            marker.className = 'instrument-marker';
            marker.dataset.instrument = instKey;
            marker.style.left = inst.x + '%';
            marker.style.bottom = (100 - inst.y) + '%';
            
            marker.innerHTML = `
                <span class="marker-icon">${inst.icon}</span>
                <span class="marker-label">${inst.label}</span>
            `;
            
            this.stageArea.appendChild(marker);
        });
    },
    
    /**
     * Handle drag start
     */
    handleDragStart(e) {
        const marker = e.target.closest('.instrument-marker');
        if (!marker) return;
        
        e.preventDefault();
        this.isDragging = true;
        this.dragTarget = marker.dataset.instrument;
        
        // Select the instrument
        this.selectInstrument(this.dragTarget);
        
        // Add visual feedback
        marker.classList.add('dragging');
    },
    
    /**
     * Handle drag move
     */
    handleDragMove(e) {
        if (!this.isDragging || !this.dragTarget) return;
        
        e.preventDefault();
        
        const stageRect = this.stageArea.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Calculate position within stage (0-100%)
        let x = ((clientX - stageRect.left) / stageRect.width) * 100;
        let y = ((clientY - stageRect.top) / stageRect.height) * 100;
        
        // Allow full range but keep marker center within stage
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        
        // Update instrument position
        this.instruments[this.dragTarget].x = x;
        this.instruments[this.dragTarget].y = y;
        
        // Update marker position
        const marker = this.stageArea.querySelector(`[data-instrument="${this.dragTarget}"]`);
        if (marker) {
            marker.style.left = x + '%';
            marker.style.bottom = (100 - y) + '%';
        }
        
        // Update position displays live during drag
        this.updatePositionDisplays();
        this.updateSectionControls();
        
        // Save to storage
        this.saveToStorage();
    },
    
    /**
     * Handle drag end
     */
    handleDragEnd() {
        if (this.isDragging && this.dragTarget) {
            const marker = this.stageArea.querySelector(`[data-instrument="${this.dragTarget}"]`);
            if (marker) {
                marker.classList.remove('dragging');
            }
        }
        
        this.isDragging = false;
        this.dragTarget = null;
    },
    
    /**
     * Select an instrument
     */
    selectInstrument(instKey) {
        // Remove previous selection
        document.querySelectorAll('.instrument-marker').forEach(m => {
            m.classList.remove('selected');
        });
        
        this.selectedInstrument = instKey;
        const inst = this.instruments[instKey];
        
        // Update selected display
        if (this.selectedInstrumentEl) {
            const displayNames = {
                melody: '🎻 Melody Strings',
                rhythm: '🥁 Rhythm & Drums',
                bass: '🎸 Bass',
                lead: '🎤 Lead',
                percussion: '🎶 Percussion'
            };
            this.selectedInstrumentEl.textContent = displayNames[instKey] || instKey;
        }
        
        // Highlight marker
        const marker = this.stageArea?.querySelector(`[data-instrument="${instKey}"]`);
        if (marker) {
            marker.classList.add('selected');
        }
        
        // Update position controls based on movement type
        this.updatePositionControlsVisibility(inst.movement);
        
        // Update sliders based on movement type
        if (inst.movement === 'static') {
            if (this.staticPanPositionSlider) {
                this.staticPanPositionSlider.value = inst.startPos;
            }
        } else {
            if (this.startPositionSlider) {
                this.startPositionSlider.value = inst.startPos;
            }
            if (this.endPositionSlider) {
                this.endPositionSlider.value = inst.endPos;
            }
        }
        
        if (this.depthPositionSlider) {
            this.depthPositionSlider.value = inst.depth;
        }
        
        // Update volume and cutoff sliders
        if (this.stageVolumeSlider) {
            this.stageVolumeSlider.value = inst.volume;
            this.stageVolumeValue.textContent = inst.volume + '%';
        }
        if (this.stageCutoffSlider) {
            this.stageCutoffSlider.value = inst.cutoff;
            this.stageCutoffValue.textContent = inst.cutoff + '%';
        }
        
        // Update movement button
        this.movementButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.movement === inst.movement);
        });
        
        this.updatePositionDisplays();
        this.updateSectionControls();
    },
    
    /**
     * Update position displays
     */
    updatePositionDisplays() {
        const formatPosition = (val) => {
            if (val === 0) return 'Center';
            return val < 0 ? `${Math.abs(val)}% Left` : `${val}% Right`;
        };
        
        if (!this.selectedInstrument) return;
        
        const inst = this.instruments[this.selectedInstrument];
        
        // Update static pan value
        if (this.staticPanValue) {
            this.staticPanValue.textContent = formatPosition(inst.startPos);
        }
        
        if (this.startPosValue) {
            this.startPosValue.textContent = formatPosition(inst.startPos);
        }
        
        if (this.endPosValue) {
            this.endPosValue.textContent = formatPosition(inst.endPos);
        }
        
        if (this.depthPosValue) {
            this.depthPosValue.textContent = inst.depth + '%';
        }
        
        // Update slider backgrounds
        if (this.staticPanPositionSlider) {
            const pct = (inst.startPos + 100) / 2;
            this.staticPanPositionSlider.style.setProperty('--pos-pct', pct + '%');
        }
        
        if (this.startPositionSlider) {
            const pct = (inst.startPos + 100) / 2;
            this.startPositionSlider.style.setProperty('--pos-pct', pct + '%');
        }
        
        if (this.endPositionSlider) {
            const pct = (inst.endPos + 100) / 2;
            this.endPositionSlider.style.setProperty('--pos-pct', pct + '%');
        }
        
        if (this.depthPositionSlider) {
            this.depthPositionSlider.style.setProperty('--depth-pct', inst.depth + '%');
        }
        
        // Update volume and cutoff displays
        if (this.stageVolumeSlider) {
            const vol = inst.volume;
            this.stageVolumeSlider.value = vol;
            this.stageVolumeValue.textContent = vol + '%';
        }
        
        if (this.stageCutoffSlider) {
            const cut = inst.cutoff;
            this.stageCutoffSlider.value = cut;
            this.stageCutoffValue.textContent = cut + '%';
        }
    },
    
    /**
     * Update section controls to match stage controls
     */
    updateSectionControls() {
        if (!this.selectedInstrument) return;
        
        const inst = this.instruments[this.selectedInstrument];
        const mapping = {
            'melody': 'strings',
            'rhythm': 'rhythm',
            'bass': 'bass',
            'lead': 'lead',
            'percussion': 'percussion'
        };
        
        const sectionKey = mapping[this.selectedInstrument];
        const controls = this.sectionControls[sectionKey];
        
        if (controls) {
            if (controls.volume) {
                controls.volume.value = inst.volume;
                const volDisplay = controls.volume.nextElementSibling;
                if (volDisplay) volDisplay.textContent = inst.volume + '%';
            }
            if (controls.cutoff) {
                controls.cutoff.value = inst.cutoff;
                const cutDisplay = controls.cutoff.nextElementSibling;
                if (cutDisplay) cutDisplay.textContent = inst.cutoff + '%';
            }
            // Update pan from stage position
            if (controls.pan) {
                const panVal = inst.x;
                controls.pan.value = panVal;
                const panDisplay = controls.pan.nextElementSibling;
                if (panDisplay) {
                    if (panVal === 0) panDisplay.textContent = 'C';
                    else if (panVal < 0) panDisplay.textContent = Math.abs(Math.round(panVal)) + '%L';
                    else panDisplay.textContent = Math.round(panVal) + '%R';
                }
            }
        }
    },
    
    /**
     * Update stage controls from section controls
     */
    updateFromSectionControls(sectionKey) {
        if (!this.selectedInstrument) return;
        
        const mapping = {
            'strings': 'melody',
            'rhythm': 'rhythm',
            'bass': 'bass',
            'lead': 'lead',
            'percussion': 'percussion'
        };
        
        if (this.selectedInstrument !== mapping[sectionKey]) return;
        
        const controls = this.sectionControls[sectionKey];
        const inst = this.instruments[this.selectedInstrument];
        
        if (controls && controls.volume) {
            inst.volume = parseInt(controls.volume.value);
            this.stageVolumeSlider.value = inst.volume;
            this.stageVolumeValue.textContent = inst.volume + '%';
        }
        
        if (controls && controls.cutoff) {
            inst.cutoff = parseInt(controls.cutoff.value);
            this.stageCutoffSlider.value = inst.cutoff;
            this.stageCutoffValue.textContent = inst.cutoff + '%';
        }
        
        this.saveToStorage();
    },
    
    /**
     * Update marker position on stage
     */
    updateMarkerPosition(instKey) {
        const marker = this.stageArea?.querySelector(`[data-instrument="${instKey}"]`);
        if (marker && this.instruments[instKey]) {
            const inst = this.instruments[instKey];
            marker.style.left = inst.x + '%';
            marker.style.bottom = (100 - inst.y) + '%';
        }
    },
    
    /**
     * Apply formation preset
     */
    applyFormation(formation) {
        const formations = {
            'center': {
                melody: { x: 50, y: 50 },
                rhythm: { x: 50, y: 80 },
                bass: { x: 35, y: 80 },
                lead: { x: 65, y: 50 },
                percussion: { x: 50, y: 20 }
            },
            'spread': {
                melody: { x: 50, y: 40 },
                rhythm: { x: 30, y: 80 },
                bass: { x: 70, y: 80 },
                lead: { x: 50, y: 25 },
                percussion: { x: 50, y: 60 }
            },
            'rock-band': {
                melody: { x: 40, y: 45 },
                rhythm: { x: 30, y: 80 },
                bass: { x: 70, y: 80 },
                lead: { x: 60, y: 35 },
                percussion: { x: 50, y: 20 }
            },
            'orchestra': {
                melody: { x: 40, y: 35 },
                rhythm: { x: 25, y: 85 },
                bass: { x: 75, y: 85 },
                lead: { x: 50, y: 25 },
                percussion: { x: 50, y: 55 }
            },
            'swirl': {
                melody: { x: 25, y: 50 },
                rhythm: { x: 75, y: 70 },
                bass: { x: 40, y: 80 },
                lead: { x: 60, y: 40 },
                percussion: { x: 50, y: 25 }
            },
            'call-response': {
                melody: { x: 25, y: 45 },
                rhythm: { x: 75, y: 70 },
                bass: { x: 50, y: 80 },
                lead: { x: 75, y: 35 },
                percussion: { x: 25, y: 25 }
            }
        };
        
        const preset = formations[formation];
        if (!preset) return;
        
        // Apply positions
        Object.keys(preset).forEach(inst => {
            if (this.instruments[inst]) {
                this.instruments[inst].x = preset[inst].x;
                this.instruments[inst].y = preset[inst].y;
                // Also update startPos to match new x position
                this.instruments[inst].startPos = (preset[inst].x - 50) * 2;
            }
        });
        
        // Re-render markers
        this.renderMarkers();
        
        // Update displays
        this.updatePositionDisplays();
        this.updateSectionControls();
        
        // Save to storage
        this.saveToStorage();
        
        // Show notification
        if (typeof app !== 'undefined' && app.showNotification) {
            const names = {
                'center': 'All Center',
                'spread': 'Spread Out',
                'rock-band': 'Rock Band',
                'orchestra': 'Orchestra',
                'swirl': 'Swirling',
                'call-response': 'Call & Response'
            };
            app.showNotification(`Formation: ${names[formation]}`, 'success');
        }
    },
    
    /**
     * Toggle stage section
     */
    toggleStage() {
        const section = document.getElementById('mainStageSection');
        const content = section?.querySelector('.section-content');
        const btn = this.stageToggle;
        
        if (!section || !btn) return;
        
        const isActive = btn.classList.toggle('active');
        btn.textContent = isActive ? 'ON' : 'OFF';
        
        if (content) {
            content.style.display = isActive ? 'block' : 'none';
        }
    },
    
    /**
     * Get stage positions for audio processing
     */
    getPositions() {
        return Object.keys(this.instruments).reduce((acc, key) => {
            acc[key] = {
                pan: this.instruments[key].x,
                depth: this.instruments[key].y,
                startPos: this.instruments[key].startPos,
                endPos: this.instruments[key].endPos,
                depthValue: this.instruments[key].depth,
                volume: this.instruments[key].volume,
                cutoff: this.instruments[key].cutoff,
                movement: this.instruments[key].movement
            };
            return acc;
        }, {});
    },
    
    /**
     * Save to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('stagePositions', JSON.stringify(this.instruments));
        } catch (e) {
            console.warn('Could not save stage positions:', e);
        }
    },
    
    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('stagePositions');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.keys(parsed).forEach(key => {
                    if (this.instruments[key]) {
                        this.instruments[key] = { ...this.instruments[key], ...parsed[key] };
                    }
                });
                this.renderMarkers();
            }
        } catch (e) {
            console.warn('Could not load stage positions:', e);
        }
    },
    
    /**
     * Reset all positions to default
     */
    resetPositions() {
        Object.keys(this.instruments).forEach(key => {
            this.instruments[key] = {
                ...this.instruments[key],
                x: key === 'melody' ? 50 : 50,
                y: key === 'melody' ? 40 : (key === 'harmony' ? 70 : 80),
                startPos: 0,
                endPos: 0,
                depth: 50,
                volume: 70,
                cutoff: 75,
                movement: 'static'
            };
        });
        
        this.renderMarkers();
        this.updatePositionDisplays();
        this.saveToStorage();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure other modules are loaded
    setTimeout(() => {
        StageManager.init();
    }, 100);
});

// Export for use in other modules
window.StageManager = StageManager;
