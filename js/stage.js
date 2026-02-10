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
        this.startPosValue = document.getElementById('startPosValue');
        this.endPosValue = document.getElementById('endPosValue');
        this.depthPosValue = document.getElementById('depthPosValue');
        this.stageToggle = document.getElementById('stageToggle');
        this.movementButtons = document.querySelectorAll('.movement-btn');
        this.formationButtons = document.querySelectorAll('.stage-preset-btn[data-formation]');
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
        
        // Position sliders
        if (this.startPositionSlider) {
            this.startPositionSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].startPos = val;
                    this.instruments[this.selectedInstrument].x = 50 + val * 0.5; // Convert -100/100 to 0-100 range
                    this.updateMarkerPosition(this.selectedInstrument);
                    this.updatePositionDisplays();
                    this.saveToStorage();
                }
            });
        }
        
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
        
        if (this.depthPositionSlider) {
            this.depthPositionSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].depth = val;
                    // Map depth (0-100) to Y position (90% = front, 10% = back)
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
                if (this.selectedInstrument) {
                    this.instruments[this.selectedInstrument].movement = btn.dataset.movement;
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
        
        // Update sliders
        if (this.startPositionSlider) {
            this.startPositionSlider.value = inst.startPos;
        }
        if (this.endPositionSlider) {
            this.endPositionSlider.value = inst.endPos;
        }
        if (this.depthPositionSlider) {
            this.depthPositionSlider.value = inst.depth;
        }
        
        // Update movement button
        this.movementButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.movement === inst.movement);
        });
        
        this.updatePositionDisplays();
    },
    
    /**
     * Update position displays
     */
    updatePositionDisplays() {
        const formatPosition = (val) => {
            if (val === 0) return 'Center';
            return val < 0 ? `${Math.abs(val)}% Left` : `${val}% Right`;
        };
        
        if (this.startPosValue && this.selectedInstrument) {
            this.startPosValue.textContent = formatPosition(this.instruments[this.selectedInstrument].startPos);
        }
        
        if (this.endPosValue && this.selectedInstrument) {
            this.endPosValue.textContent = formatPosition(this.instruments[this.selectedInstrument].endPos);
        }
        
        if (this.depthPosValue && this.selectedInstrument) {
            this.depthPosValue.textContent = this.instruments[this.selectedInstrument].depth + '%';
        }
        
        // Update slider backgrounds
        if (this.startPositionSlider && this.selectedInstrument) {
            const pct = (this.instruments[this.selectedInstrument].startPos + 100) / 2;
            this.startPositionSlider.style.setProperty('--pos-pct', pct + '%');
        }
        
        if (this.endPositionSlider && this.selectedInstrument) {
            const pct = (this.instruments[this.selectedInstrument].endPos + 100) / 2;
            this.endPositionSlider.style.setProperty('--pos-pct', pct + '%');
        }
        
        if (this.depthPositionSlider && this.selectedInstrument) {
            this.depthPositionSlider.style.setProperty('--depth-pct', this.instruments[this.selectedInstrument].depth + '%');
        }
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
            }
        });
        
        // Re-render markers
        this.renderMarkers();
        
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
