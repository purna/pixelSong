// RhythmVisualizer.js - Beat-pulsing visual effects using Rythm.js concepts
// Creates subtle pulsing effects synchronized to the music

class RhythmVisualizer {
    constructor(app) {
        this.app = app;
        this.enabled = true;
        this.pulseElements = [];
        this.bassPulseElements = [];
        this.melodyPulseElements = [];
        this.lastBeatTime = 0;
        this.beatInterval = 500; // ms (120 BPM = 500ms per beat)
        this.intensity = 0.5; // 0-1 scale
        this.animationFrame = null;
        
        // DOM elements to pulse
        this.targetSelectors = [
            '.string-cell.active',
            '.bass-cell.active',
            '.lead-cell.active',
            '.harmonic-cell.active',
            '.rhythm-cell.playing'
        ];
    }

    init() {
        // Create CSS for pulsing effects
        this.createPulseStyles();
        
        // Find elements to pulse
        this.scanForElements();
        
        console.log('Rhythm Visualizer initialized');
    }

    createPulseStyles() {
        const style = document.createElement('style');
        style.id = 'rhythm-pulse-styles';
        style.textContent = `
            /* Subtle background pulse on beat */
            @keyframes rhythmPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.002); }
                100% { transform: scale(1); }
            }
            
            @keyframes bassPump {
                0% { transform: scale(1); }
                50% { transform: scale(1.005); }
                100% { transform: scale(1); }
            }
            
            @keyframes colorShift {
                0% { filter: hue-rotate(0deg); }
                25% { filter: hue-rotate(2deg); }
                50% { filter: hue-rotate(0deg); }
                75% { filter: hue-rotate(-2deg); }
                100% { filter: hue-rotate(0deg); }
            }
            
            @keyframes glowPulse {
                0% { box-shadow: 0 0 5px rgba(244, 114, 182, 0.3); }
                50% { box-shadow: 0 0 15px rgba(244, 114, 182, 0.6); }
                100% { box-shadow: 0 0 5px rgba(244, 114, 182, 0.3); }
            }
            
            .rhythm-pulse {
                animation: rhythmPulse 0.5s ease-out;
            }
            
            .bass-pump {
                animation: bassPump 0.3s ease-out;
            }
            
            .melody-pulse {
                animation: colorShift 0.25s ease-out;
            }
            
            .play-btn.pulsing {
                animation: glowPulse 0.25s ease-out;
            }
            
  
            .string-cell.melody-pulse,
            .bass-cell.melody-pulse,
            .lead-cell.melody-pulse,
            .harmonic-cell.melody-pulse {
                animation: colorShift 0.15s ease-out;
            }
            
            .rhythm-cell.rhythm-pulse {
                animation: bassPump 0.2s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    scanForElements() {
        // Find play button
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            this.pulseElements.push({
                element: playBtn,
                type: 'play-btn',
                priority: 'high'
            });
        }
        
        // Find section headers
        document.querySelectorAll('.section-header').forEach(header => {
            this.pulseElements.push({
                element: header,
                type: 'header',
                priority: 'medium'
            });
        });
        
        // Find active melody cells
        document.querySelectorAll('.string-cell.active').forEach(cell => {
            this.melodyPulseElements.push({
                element: cell,
                type: 'cell'
            });
        });
        
        // Find active bass cells
        document.querySelectorAll('.bass-cell.active').forEach(cell => {
            this.melodyPulseElements.push({
                element: cell,
                type: 'cell'
            });
        });
        
        // Find active lead cells
        document.querySelectorAll('.lead-cell.active').forEach(cell => {
            this.melodyPulseElements.push({
                element: cell,
                type: 'cell'
            });
        });
        
        // Find active harmonic cells
        document.querySelectorAll('.harmonic-cell.active').forEach(cell => {
            this.melodyPulseElements.push({
                element: cell,
                type: 'cell'
            });
        });
        
        // Container for background pulse
        this.containerElement = document.querySelector('.container');
    }

    enable() {
        this.enabled = true;
        document.body.classList.add('rhythm-enabled');
        
        // Start beat detection loop
        this.startBeatDetection();
        
        console.log('Rhythm Visualizer enabled');
    }

    disable() {
        this.enabled = false;
        document.body.classList.remove('rhythm-enabled');
        
        // Stop beat detection
        this.stopBeatDetection();
        
        // Remove all pulse classes
        this.pulseElements.forEach(item => {
            item.element.classList.remove('pulsing', 'rhythm-pulse', 'bass-pump', 'melody-pulse');
        });
        
        console.log('Rhythm Visualizer disabled');
    }

    startBeatDetection() {
        // Listen for play events from the app
        this.appPlayHandler = () => this.onBeat('quarter');
        this.appStepHandler = () => this.onBeat('step');
        
        document.addEventListener('songPlay', this.appPlayHandler);
        document.addEventListener('songStep', this.appStepHandler);
        
        // Also use time-based detection if no events
        this.startTimeBasedBeat();
    }

    stopBeatDetection() {
        document.removeEventListener('songPlay', this.appPlayHandler);
        document.removeEventListener('songStep', this.appStepHandler);
        
        this.stopTimeBasedBeat();
    }

    startTimeBasedBeat() {
        const update = () => {
            if (!this.enabled) return;
            
            const now = Date.now();
            const elapsed = now - this.lastBeatTime;
            
            if (elapsed >= this.beatInterval * 0.5) {
                // Trigger quarter note pulse
                this.pulseAll('quarter');
                this.lastBeatTime = now;
            }
            
            this.animationFrame = requestAnimationFrame(update);
        };
        
        this.animationFrame = requestAnimationFrame(update);
    }

    stopTimeBasedBeat() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    onBeat(type) {
        if (!this.enabled) return;
        
        switch(type) {
            case 'quarter':
                this.pulseAll('quarter');
                break;
            case 'step':
                this.pulseBass();
                break;
            case 'hit':
                this.pulseAll('strong');
                break;
        }
    }

    pulseAll(type) {
        const intensity = type === 'strong' ? 1 : this.intensity;
        
        // Subtle background pulse
        if (this.containerElement && intensity > 0.5) {
            this.containerElement.style.transition = 'background-color 0.1s ease';
            this.containerElement.style.backgroundColor = this.getPulseColor();
            
            setTimeout(() => {
                if (this.containerElement) {
                    this.containerElement.style.backgroundColor = '';
                }
            }, 100);
        }
        
        // Pulse play button
        this.pulseElements.filter(e => e.type === 'play-btn').forEach(item => {
            this.applyPulse(item.element, 'play-btn pulsing', 100);
        });
        
        // Pulse headers (subtle)
        this.pulseElements.filter(e => e.type === 'header').forEach(item => {
            this.applyPulse(item.element, 'pulsing', 200);
        });
        
        // Also pulse playing rhythm cells
        document.querySelectorAll('.rhythm-cell.playing').forEach(cell => {
            this.applyPulse(cell, 'rhythm-pulse', 150);
        });
        
        // Pulse currently active melodic cells
        document.querySelectorAll('.string-cell.active, .bass-cell.active, .lead-cell.active').forEach(cell => {
            this.applyPulse(cell, 'melody-pulse', 100);
        });
    }

    pulseBass() {
        // Bass pump on steps - dynamically find headers
        document.querySelectorAll('.section-header').forEach(header => {
            this.applyPulse(header, 'bass-pump', 150);
        });
    }

    pulseMelody() {
        // Color shift on melody notes - dynamically find all active cells
        const activeCells = document.querySelectorAll('.string-cell.active, .bass-cell.active, .lead-cell.active, .harmonic-cell.active');
        activeCells.forEach(cell => {
            this.applyPulse(cell, 'melody-pulse', 100);
        });
    }
    
    pulseHarmonics() {
        // Color shift on harmonic cells
        document.querySelectorAll('.harmonic-cell.active').forEach(cell => {
            this.applyPulse(cell, 'melody-pulse', 100);
        });
    }
    
    pulseLead() {
        // Color shift on lead cells
        document.querySelectorAll('.lead-cell.active').forEach(cell => {
            this.applyPulse(cell, 'melody-pulse', 100);
        });
    }
    
    pulseDrums() {
        // Pulse rhythm cells on drum hits
        document.querySelectorAll('.rhythm-cell.active').forEach(cell => {
            this.applyPulse(cell, 'rhythm-pulse', 100);
        });
    }

    applyPulse(element, classNames, duration) {
        if (!element) return;
        
        // Handle space-separated class names
        const classes = classNames.split(' ');
        element.classList.add(...classes);
        setTimeout(() => {
            element.classList.remove(...classes);
        }, duration);
    }

    getPulseColor() {
        // Very subtle pink tint on pulse
        const colors = [
            'rgba(244, 114, 182, 0.02)',
            'rgba(96, 165, 250, 0.02)',
            'rgba(52, 211, 153, 0.02)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    setIntensity(value) {
        this.intensity = Math.max(0.1, Math.min(1, value));
    }

    setTempo(tempo) {
        // Calculate beat interval from BPM
        this.beatInterval = 60000 / tempo;
    }

    // Call this from songDesigner when a step plays
    onStepPlay(step) {
        if (!this.enabled) return;
        
        // Pulse elements on each step
        this.pulseAll(step % 4 === 0 ? 'quarter' : 'step');
        
        // Color shift on melody notes
        if (step % 2 === 0) {
            this.pulseMelody();
        }
    }
}

// Export
window.RhythmVisualizer = RhythmVisualizer;
