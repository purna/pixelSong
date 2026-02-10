/**
 * Advanced Automation Module
 * Handles curve editors for velocity, pan, filter, and effect automation
 */

const AutomationManager = {
    // Curve data storage
    curves: {
        velocity: {},
        pan: {},
        filter: {},
        effect: {}
    },
    
    // Canvas contexts
    canvases: {},
    
    // Current editing state
    isDrawing: false,
    currentCurve: null,
    
    /**
     * Initialize Automation Manager
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.initializeCurves();
        this.renderAllCurves();
    },
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.advancedToggle = document.getElementById('enableAdvancedAutomation');
        this.advancedSection = document.getElementById('advancedAutomation');
        
        // Canvas elements
        this.canvases = {
            velocity: document.getElementById('velocityCurveCanvas'),
            pan: document.getElementById('panCurveCanvas'),
            filter: document.getElementById('filterCurveCanvas'),
            effect: document.getElementById('effectCurveCanvas')
        };
        
        // Instrument selectors
        this.instrumentSelects = {
            velocity: document.getElementById('velocityCurveInstrument'),
            pan: document.getElementById('panCurveInstrument')
        };
        
        // Control buttons
        this.controlButtons = {
            velocityClear: document.getElementById('velocityClearBtn'),
            velocitySmooth: document.getElementById('velocitySmoothBtn'),
            velocityRampUp: document.getElementById('velocityRampUpBtn'),
            velocityRampDown: document.getElementById('velocityRampDownBtn'),
            panClear: document.getElementById('panClearBtn'),
            panSine: document.getElementById('panSineBtn'),
            panAlternating: document.getElementById('panAlternatingBtn'),
            filterClear: document.getElementById('filterClearBtn'),
            filterSweepUp: document.getElementById('filterSweepUpBtn'),
            filterSweepDown: document.getElementById('filterSweepDownBtn'),
            filterWobble: document.getElementById('filterWobbleBtn'),
            effectClear: document.getElementById('effectClearBtn'),
            effectFadeIn: document.getElementById('effectFadeInBtn'),
            effectFadeOut: document.getElementById('effectFadeOutBtn'),
            effectPulse: document.getElementById('effectPulseBtn')
        };
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Toggle advanced mode
        if (this.advancedToggle) {
            this.advancedToggle.addEventListener('change', () => {
                if (this.advancedSection) {
                    this.advancedSection.style.display = this.advancedToggle.checked ? 'block' : 'none';
                }
            });
        }
        
        // Initialize canvas drawing for each curve
        Object.keys(this.canvases).forEach(curveType => {
            const canvas = this.canvases[curveType];
            if (canvas) {
                this.initCanvasDrawing(canvas, curveType);
            }
        });
        
        // Control buttons
        this.bindControlButtons();
        
        // Instrument select changes
        if (this.instrumentSelects.velocity) {
            this.instrumentSelects.velocity.addEventListener('change', () => {
                this.renderCurve('velocity');
            });
        }
        if (this.instrumentSelects.pan) {
            this.instrumentSelects.pan.addEventListener('change', () => {
                this.renderCurve('pan');
            });
        }
    },
    
    /**
     * Initialize canvas drawing
     */
    initCanvasDrawing(canvas, curveType) {
        const ctx = canvas.getContext('2d');
        
        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e, canvas, curveType));
        canvas.addEventListener('mousemove', (e) => this.draw(e, canvas, curveType));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e, canvas, curveType);
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e, canvas, curveType);
        }, { passive: false });
        canvas.addEventListener('touchend', () => this.stopDrawing());
    },
    
    /**
     * Start drawing a curve point
     */
    startDrawing(e, canvas, curveType) {
        this.isDrawing = true;
        this.currentCurve = curveType;
        this.addPoint(e, canvas, curveType);
    },
    
    /**
     * Continue drawing
     */
    draw(e, canvas, curveType) {
        if (!this.isDrawing || this.currentCurve !== curveType) return;
        this.addPoint(e, canvas, curveType);
    },
    
    /**
     * Stop drawing
     */
    stopDrawing() {
        this.isDrawing = false;
        this.currentCurve = null;
        this.saveCurves();
    },
    
    /**
     * Add a point to the curve
     */
    addPoint(e, canvas, curveType) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const x = (clientX - rect.left) / rect.width;
        const y = 1 - (clientY - rect.top) / rect.height;
        
        const instrument = this.getInstrumentForCurve(curveType);
        const key = `${curveType}_${instrument}`;
        
        if (!this.curves[curveType][instrument]) {
            this.curves[curveType][instrument] = [];
        }
        
        // Add point and sort by x position
        this.curves[curveType][instrument].push({ x, y });
        this.curves[curveType][instrument].sort((a, b) => a.x - b.x);
        
        this.renderCurve(curveType);
    },
    
    /**
     * Get instrument for current curve
     */
    getInstrumentForCurve(curveType) {
        if (curveType === 'velocity' && this.instrumentSelects.velocity) {
            return this.instrumentSelects.velocity.value;
        }
        if (curveType === 'pan' && this.instrumentSelects.pan) {
            return this.instrumentSelects.pan.value;
        }
        return 'melody';
    },
    
    /**
     * Bind control buttons
     */
    bindControlButtons() {
        // Velocity controls
        if (this.controlButtons.velocityClear) {
            this.controlButtons.velocityClear.addEventListener('click', () => {
                this.clearCurve('velocity');
            });
        }
        if (this.controlButtons.velocitySmooth) {
            this.controlButtons.velocitySmooth.addEventListener('click', () => {
                this.applyPreset('velocity', 'smooth');
            });
        }
        if (this.controlButtons.velocityRampUp) {
            this.controlButtons.velocityRampUp.addEventListener('click', () => {
                this.applyPreset('velocity', 'rampUp');
            });
        }
        if (this.controlButtons.velocityRampDown) {
            this.controlButtons.velocityRampDown.addEventListener('click', () => {
                this.applyPreset('velocity', 'rampDown');
            });
        }
        
        // Pan controls
        if (this.controlButtons.panClear) {
            this.controlButtons.panClear.addEventListener('click', () => {
                this.clearCurve('pan');
            });
        }
        if (this.controlButtons.panSine) {
            this.controlButtons.panSine.addEventListener('click', () => {
                this.applyPreset('pan', 'sine');
            });
        }
        if (this.controlButtons.panAlternating) {
            this.controlButtons.panAlternating.addEventListener('click', () => {
                this.applyPreset('pan', 'alternating');
            });
        }
        
        // Filter controls
        if (this.controlButtons.filterClear) {
            this.controlButtons.filterClear.addEventListener('click', () => {
                this.clearCurve('filter');
            });
        }
        if (this.controlButtons.filterSweepUp) {
            this.controlButtons.filterSweepUp.addEventListener('click', () => {
                this.applyPreset('filter', 'sweepUp');
            });
        }
        if (this.controlButtons.filterSweepDown) {
            this.controlButtons.filterSweepDown.addEventListener('click', () => {
                this.applyPreset('filter', 'sweepDown');
            });
        }
        if (this.controlButtons.filterWobble) {
            this.controlButtons.filterWobble.addEventListener('click', () => {
                this.applyPreset('filter', 'wobble');
            });
        }
        
        // Effect controls
        if (this.controlButtons.effectClear) {
            this.controlButtons.effectClear.addEventListener('click', () => {
                this.clearCurve('effect');
            });
        }
        if (this.controlButtons.effectFadeIn) {
            this.controlButtons.effectFadeIn.addEventListener('click', () => {
                this.applyPreset('effect', 'fadeIn');
            });
        }
        if (this.controlButtons.effectFadeOut) {
            this.controlButtons.effectFadeOut.addEventListener('click', () => {
                this.applyPreset('effect', 'fadeOut');
            });
        }
        if (this.controlButtons.effectPulse) {
            this.controlButtons.effectPulse.addEventListener('click', () => {
                this.applyPreset('effect', 'pulse');
            });
        }
        
        // Quick preset buttons
        document.querySelectorAll('[data-curve-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.curvePreset;
                this.applyQuickPreset(preset);
            });
        });
    },
    
    /**
     * Initialize curves with default data
     */
    initializeCurves() {
        const instruments = ['melody', 'bass', 'lead', 'harmony', 'drums'];
        
        instruments.forEach(inst => {
            this.curves.velocity[inst] = [];
            this.curves.pan[inst] = [];
            this.curves.filter[inst] = [];
            this.curves.effect[inst] = [];
        });
        
        this.loadFromStorage();
    },
    
    /**
     * Render all curves
     */
    renderAllCurves() {
        ['velocity', 'pan', 'filter', 'effect'].forEach(type => {
            this.renderCurve(type);
        });
    },
    
    /**
     * Render a specific curve
     */
    renderCurve(curveType) {
        const canvas = this.canvases[curveType];
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const instrument = this.getInstrumentForCurve(curveType);
        const points = this.curves[curveType][instrument] || [];
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        this.drawGrid(ctx, canvas.width, canvas.height);
        
        // Draw curve
        if (points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(points[0].x * canvas.width, (1 - points[0].y) * canvas.height);
            
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x * canvas.width, (1 - points[i].y) * canvas.height);
            }
            
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw points
            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x * canvas.width, (1 - point.y) * canvas.height, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#f472b6';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }
    },
    
    /**
     * Draw grid on canvas
     */
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= width; x += width / 8) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= height; y += height / 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    },
    
    /**
     * Clear a curve
     */
    clearCurve(curveType) {
        const instrument = this.getInstrumentForCurve(curveType);
        this.curves[curveType][instrument] = [];
        this.renderCurve(curveType);
        this.saveCurves();
    },
    
    /**
     * Apply preset to curve
     */
    applyPreset(curveType, preset) {
        const instrument = this.getInstrumentForCurve(curveType);
        const points = [];
        
        switch (preset) {
            case 'smooth':
                for (let x = 0; x <= 1; x += 0.1) {
                    points.push({ x, y: 0.5 + 0.2 * Math.sin(x * Math.PI * 4) });
                }
                break;
            case 'rampUp':
                for (let x = 0; x <= 1; x += 0.1) {
                    points.push({ x, y: x });
                }
                break;
            case 'rampDown':
                for (let x = 0; x <= 1; x += 0.1) {
                    points.push({ x, y: 1 - x });
                }
                break;
            case 'sine':
                for (let x = 0; x <= 1; x += 0.05) {
                    points.push({ x, y: 0.5 + 0.5 * Math.sin(x * Math.PI * 2) });
                }
                break;
            case 'alternating':
                for (let x = 0; x <= 1; x += 0.125) {
                    points.push({ x, y: x % 0.25 < 0.125 ? 0.2 : 0.8 });
                }
                break;
            case 'sweepUp':
                for (let x = 0; x <= 1; x += 0.1) {
                    points.push({ x, y: x * x });
                }
                break;
            case 'sweepDown':
                for (let x = 0; x <= 1; x += 0.1) {
                    points.push({ x, y: Math.pow(1 - x, 2) });
                }
                break;
            case 'wobble':
                for (let x = 0; x <= 1; x += 0.05) {
                    points.push({ x, y: 0.5 + 0.3 * Math.sin(x * Math.PI * 12) });
                }
                break;
            case 'fadeIn':
                for (let x = 0; x <= 1; x += 0.1) {
                    points.push({ x, y: x * x });
                }
                break;
            case 'fadeOut':
                for (let x = 0; x <= 1; x += 0.1) {
                    points.push({ x, y: Math.pow(1 - x, 2) });
                }
                break;
            case 'pulse':
                for (let x = 0; x <= 1; x += 0.1) {
                    points.push({ x, y: 0.3 + 0.4 * Math.sin(x * Math.PI * 6) });
                }
                break;
        }
        
        this.curves[curveType][instrument] = points;
        this.renderCurve(curveType);
        this.saveCurves();
    },
    
    /**
     * Apply quick preset
     */
    applyQuickPreset(preset) {
        const curveTypes = ['velocity', 'pan', 'filter', 'effect'];
        
        switch (preset) {
            case 'fade-in':
                this.applyPreset('velocity', 'rampUp');
                break;
            case 'fade-out':
                this.applyPreset('velocity', 'rampDown');
                break;
            case 'tremolo':
                this.applyPreset('velocity', 'smooth');
                break;
            case 'filter-sweep':
                this.applyPreset('filter', 'sweepUp');
                break;
            case 'auto-pan':
                this.applyPreset('pan', 'sine');
                break;
            case 'build-up':
                this.applyPreset('velocity', 'rampUp');
                this.applyPreset('filter', 'sweepUp');
                break;
            case 'release':
                this.applyPreset('velocity', 'rampDown');
                break;
        }
    },
    
    /**
     * Get curve data for audio processing
     */
    getCurveData() {
        return this.curves;
    },
    
    /**
     * Save curves to localStorage
     */
    saveCurves() {
        try {
            localStorage.setItem('automationCurves', JSON.stringify(this.curves));
        } catch (e) {
            console.warn('Could not save automation curves:', e);
        }
    },
    
    /**
     * Load curves from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('automationCurves');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.keys(parsed).forEach(type => {
                    Object.keys(parsed[type]).forEach(inst => {
                        this.curves[type][inst] = parsed[type][inst];
                    });
                });
            }
        } catch (e) {
            console.warn('Could not load automation curves:', e);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        AutomationManager.init();
    }, 100);
});

// Export for use in other modules
window.AutomationManager = AutomationManager;
