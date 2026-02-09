// main.js - Application initialization and global state management

class SFXGeneratorApp {
    constructor() {
        this.audioEngine = null;
        this.soundGenerator = null;
        this.presets = null;
        this.ui = null;
        this.notifications = null;
        this.layerManager = null;
        this.timeline = null;
        this.fileManager = null;
        this.collectionManager = null;
        this.tutorialConfig = null;
        this.tutorialSystem = null;
        this.musicManager = null;

        this.currentSettings = this.getDefaultSettings();

        // Undo/Redo stacks
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;

        // Copy/paste layer clipboard
        this.copiedLayer = null;
    }

    setupAudioInitialization() {
        // Set up the "Enable Audio" button to initialize audio context
        const initAudioBtn = document.getElementById('initAudioBtn');
        if (initAudioBtn) {
            initAudioBtn.addEventListener('click', async () => {
                try {
                    await this.audioEngine.initAudioContext();
                    initAudioBtn.textContent = '✓ Audio Enabled';
                    initAudioBtn.disabled = true;
                    
                    // Initialize music manager with the new context
                    if (this.musicManager && this.audioEngine.context) {
                        this.musicManager.init(this.audioEngine.context);
                    }
                    
                    console.log('Audio system initialized after user gesture');
                } catch (error) {
                    console.error('Failed to initialize audio:', error);
                    this.notifications.showNotification('Failed to enable audio', 'error');
                }
            });
        }
    }

    async init() {
        // Initialize all modules
        this.audioEngine = new AudioEngine();
        this.soundGenerator = new SoundGenerator();
        
        // Initialize audio context after user gesture
        this.setupAudioInitialization();
        this.presets = new Presets();
        this.layerManager = new LayerManager(this);
        this.timeline = new Timeline(this);
        this.fileManager = new FileManager(this);
        this.collectionManager = new CollectionManager(this);
        this.collectionUI = new CollectionUI(this);
        this.databaseManager = new DatabaseManager(this);

        // Initialize tutorial system if available
        if (typeof TutorialConfig !== 'undefined') {
            this.tutorialConfig = new TutorialConfig();
        }
        if (typeof TutorialSystem !== 'undefined') {
            this.tutorialSystem = new TutorialSystem(this);
        }

        this.ui = new UI(this);
        this.notifications = new Notifications();

        // Initialize settings manager
        if (typeof SettingsManager !== 'undefined') {
            SettingsManager.init(this);
        }

        // Initialize music manager
        this.musicManager = new MusicManager();
        if (this.audioEngine && this.audioEngine.context) {
            this.musicManager.init(this.audioEngine.context);
        }

        // Connect soundGenerator to audioEngine
        this.soundGenerator.setAudioEngine(this.audioEngine);

        // Setup audio initialization
        this.setupAudioInitialization();

        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI first, then layers
        this.ui.init();

        // Initialize tutorial system if available (after UI is ready)
        if (this.tutorialSystem) {
            this.tutorialSystem.init();
        }

        this.layerManager.init(); // This will select the first layer and update UI
        this.timeline.init();
        this.collectionManager.init(); // Initialize collection manager
        this.collectionUI.init(); // Initialize collection UI

        // Initialize database manager and UI
        if (this.databaseManager) {
            // Database UI will be added automatically when settings are opened
        }

        // Auto-start tutorial if enabled (default: enabled)
        if (this.tutorialSystem && this.tutorialConfig) {
            // Wait for UI to be fully ready before checking tutorial settings
            setTimeout(() => {
                const enableTutorialsCheckbox = document.getElementById('enableTutorialsSettings');
                const tutorialsEnabled = enableTutorialsCheckbox ? enableTutorialsCheckbox.checked : true;

                if (tutorialsEnabled) {
                    this.tutorialSystem.startTutorial('main');
                }
            }, 1000); // Increased delay to ensure settings panel is fully initialized
        }

        console.log('SFX Generator initialized');

        // Force update the display with the first layer's settings
        const firstLayer = this.layerManager.getSelectedLayer();
        if (firstLayer) {
            this.updateSettings(firstLayer.settings);
            this.ui.updateDisplay(firstLayer.settings);
        }

        // ✅ Add automatic loading of saved data
        // Try to load auto-save data first
        if (this.fileManager) {
            const autoSaveLoaded = this.fileManager.loadFromLocalStorage();
            if (!autoSaveLoaded) {
                // If no auto-save, try to load complete project
                if (this.settingsManager && this.settingsManager.loadCompleteProject) {
                    this.settingsManager.loadCompleteProject();
                }
            }
        }

        // Mark as initialized
        this.initialized = true;
    }

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Space bar to play
            if (e.code === 'Space' && !this.isTyping()) {
                e.preventDefault();
                this.playCurrentSound();
            }
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.fileManager.exportProject();
            }
            // Ctrl/Cmd + O to open
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.fileManager.importProject();
            }
            // Ctrl/Cmd + Z to undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl/Cmd + Shift + Z to redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redo();
            }
            // Ctrl/Cmd + Y to redo (alternative)
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
            // Ctrl/Cmd + C to copy layer
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !this.isTyping()) {
                e.preventDefault();
                this.copyLayer();
            }
            // Ctrl/Cmd + V to paste layer
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !this.isTyping()) {
                e.preventDefault();
                this.pasteLayer();
            }
            // Ctrl/Cmd + D to duplicate layer
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !this.isTyping()) {
                e.preventDefault();
                this.duplicateLayer();
            }
        });

        // --- BUTTON LISTENERS (Wrapper Removed) ---
        // Since init() is called on DOMContentLoaded, these elements exist now.

        // Play Selected button (footer)
        const playSelectedBtn = document.getElementById('playSelectedBtn');
        if (playSelectedBtn) {
            playSelectedBtn.addEventListener('click', async () => {
                console.log('Play Selected clicked');
                // Start timeline playback and play sound
                this.timeline.playheadPosition = 0;
                this.timeline.startPlayback();
                await this.playCurrentSound();
            });
        }

        // Play Selected button (timeline header)
        const playSelected = document.getElementById('playSelected');
        if (playSelected) {
            playSelected.addEventListener('click', async () => {
                console.log('Play Selected (timeline) clicked');
                // Start timeline playback and play sound
                this.timeline.playheadPosition = 0;
                this.timeline.startPlayback();
                await this.playCurrentSound();
            });
        }

        // Play All Timeline button
        const playTimelineBtn = document.getElementById('playTimeline');
        if (playTimelineBtn) {
            playTimelineBtn.addEventListener('click', async () => {
                console.log('Play Timeline clicked');
                // Start timeline playback and play all layers
                this.timeline.playheadPosition = 0;
                this.timeline.startPlayback();
                await this.layerManager.playAllLayers();
            });
        }

        // Stop Timeline button
        const stopTimelineBtn = document.getElementById('stopTimeline');
        if (stopTimelineBtn) {
            stopTimelineBtn.addEventListener('click', () => {
                console.log('Stop clicked');
                // Stop both audio and timeline
                this.timeline.stopPlayback();
                this.audioEngine.stopAll();
            });
        }

        // Undo/Redo buttons
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }

        const redoBtn = document.getElementById('redoBtn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }

        // Export buttons (now in sidebar)
        const exportLayerBtn = document.getElementById('exportLayerBtn');
        if (exportLayerBtn) {
            exportLayerBtn.addEventListener('click', () => {
                console.log('Export Layer clicked');
                const selectedLayer = this.layerManager.getSelectedLayer();
                if (selectedLayer) {
                    this.fileManager.exportLayer(selectedLayer.id);
                } else {
                    this.notifications.showNotification('No layer selected', 'error');
                }
            });
        }

        const exportMixBtn = document.getElementById('exportMixBtn');
        if (exportMixBtn) {
            exportMixBtn.addEventListener('click', () => {
                console.log('Export Mix clicked');
                this.fileManager.exportMixedOutput();
            });
        }

        // Save/Load Project buttons
        const saveProjectBtn = document.getElementById('saveProject');
        if (saveProjectBtn) {
            saveProjectBtn.addEventListener('click', () => {
                this.fileManager.exportProject();
            });
        }

        // Save to Browser button
        const saveToBrowserBtn = document.getElementById('saveToBrowserBtn');
        if (saveToBrowserBtn) {
            saveToBrowserBtn.addEventListener('click', () => {
                this.saveAllToBrowser();
            });
        }

        const loadProjectBtn = document.getElementById('loadProject');
        if (loadProjectBtn) {
            loadProjectBtn.addEventListener('click', () => {
                this.fileManager.importProject();
            });
        }

        // Add Layer button (makes it consistent with other buttons)
        const addLayerBtn = document.querySelector('button[onclick="app.layerManager.addLayer()"]');
        if (addLayerBtn) {
            addLayerBtn.removeAttribute('onclick'); // Remove inline handler
            addLayerBtn.addEventListener('click', () => {
                this.layerManager.addLayer();
            });
        }
    }

    copyLayer() {
        const layer = this.layerManager.getSelectedLayer();
        if (layer) {
            this.copiedLayer = JSON.parse(JSON.stringify(layer));
            this.notifications.showNotification('Layer copied', 'success');
        }
    }

    pasteLayer() {
        if (!this.copiedLayer) {
            this.notifications.showNotification('No layer to paste', 'error');
            return;
        }
        this.saveUndoState();
        const newLayer = this.layerManager.duplicateLayer(this.copiedLayer);
        if (newLayer) {
            this.notifications.showNotification('Layer pasted', 'success');
        }
    }

    duplicateLayer() {
        const layer = this.layerManager.getSelectedLayer();
        if (layer) {
            this.saveUndoState();
            const newLayer = this.layerManager.duplicateLayer(layer);
            if (newLayer) {
                this.notifications.showNotification('Layer duplicated', 'success');
            }
        }
    }

    isTyping() {
        const activeElement = document.activeElement;
        return activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    }

    getDefaultSettings() {
        return {
            attack: 0,
            sustain: 0.1,
            punch: 0,
            decay: 0.2,
            frequency: 440,
            minFreq: 0,
            slide: 0,
            deltaSlide: 0,
            vibratoEnable: false,
            vibratoDepth: 0,
            vibratoSpeed: 0,
            arpEnable: false,
            arpMult: 1,
            arpSpeed: 0,
            duty: 50,
            dutySweep: 0,
            waveform: 'square', // New: waveform type
            lpfEnable: false,
            lpf: 22050,
            hpfEnable: false,
            hpf: 0,
            gain: -10
        };
    }

    updateSettings(newSettings) {
        this.currentSettings = { ...this.currentSettings, ...newSettings };
        this.ui.updateDisplay(this.currentSettings);
    }

    async playCurrentSound() {
        console.log('playCurrentSound called');
        try {
            // Get the selected layer's settings instead of using currentSettings
            const selectedLayer = this.layerManager.getSelectedLayer();
            if (!selectedLayer) {
                console.warn('No layer selected');
                this.notifications.showNotification('No layer selected', 'error');
                return;
            }
             
            const settings = selectedLayer.settings;
            console.log('Generating sound with settings:', settings);
            
            const buffer = this.soundGenerator.generate(
                settings,
                this.audioEngine.sampleRate
            );
            console.log('Buffer generated:', buffer);
            
            // Calculate duration for timeline synchronization
            const duration = this.soundGenerator.calculateDuration(settings);
            console.log('Sound duration:', duration, 'seconds');
            
            // Create audio source and apply effects using music manager
            const source = this.audioEngine.context.createBufferSource();
            source.buffer = buffer;
            
            // Apply audio effects if music manager is available
            if (this.musicManager && this.musicManager.initialized) {
                // Get current audio effects settings from settings manager
                const audioEffectsSettings = SettingsManager.settings.audioEffects || {};
                
                // Apply effects to the source
                this.musicManager.applyEffects(source, { audioEffects: audioEffectsSettings });
            } else {
                // Fallback: connect directly to destination
                source.connect(this.audioEngine.context.destination);
            }
            
            // Play with callback to stop timeline when done
            source.start();
            
            source.onended = () => {
                console.log('Sound playback ended');
                // Stop timeline playback when sound ends
                if (this.timeline.isPlaying) {
                    this.timeline.stopPlayback();
                }
            };
            
            console.log('Sound played successfully with effects');
        } catch (error) {
            console.error('Error playing sound:', error);
            this.notifications.showNotification('Error playing sound: ' + error.message, 'error');
            // Stop timeline if playback fails
            if (this.timeline.isPlaying) {
                this.timeline.stopPlayback();
            }
        }
    }

    downloadCurrentSound() {
        const buffer = this.soundGenerator.generate(
            this.currentSettings,
            this.audioEngine.sampleRate
        );
        this.audioEngine.downloadWAV(buffer, `sfx_${Date.now()}.wav`);
    }

    async loadPreset(presetName) {
        const preset = this.presets.get(presetName);
        if (!preset) {
            console.error('Preset not found:', presetName);
            return;
        }

        // Save state for undo
        this.saveUndoState();

        const selectedLayer = this.layerManager.getSelectedLayer();

        if (selectedLayer) {
            // Apply preset to selected layer
            this.layerManager.updateLayerSettings(selectedLayer.id, preset);
            
            // Force sync app's currentSettings
            this.currentSettings = { ...preset };
            
            // Update UI to show new values
            this.ui.updateDisplay(preset);
            
            // Redraw timeline to show updated waveform
            this.timeline.render();
            
            // Play the updated layer
            await this.playCurrentSound();
        } else {
            // No layer selected - this shouldn't happen, but handle it
            console.warn('No layer selected when loading preset');
            this.currentSettings = { ...preset };
            this.ui.updateDisplay(preset);
            await this.playCurrentSound();
        }
    }

    async randomize() {
        const randomSettings = this.presets.generateRandom();
        
        // Save state for undo
        this.saveUndoState();
        
        const selectedLayer = this.layerManager.getSelectedLayer();
        
        if (selectedLayer) {
            // Apply to selected layer
            this.layerManager.updateLayerSettings(selectedLayer.id, randomSettings);
            
            // Force sync app's currentSettings
            this.currentSettings = { ...randomSettings };
            
            // Update UI
            this.ui.updateDisplay(randomSettings);
            
            // Redraw timeline
            this.timeline.render();
        } else {
            // Fallback
            this.currentSettings = { ...randomSettings };
            this.ui.updateDisplay(randomSettings);
        }
        
        await this.playCurrentSound();
    }

    saveUndoState() {
        const state = this.getState();
        this.undoStack.push(JSON.parse(JSON.stringify(state)));
        
        // Limit undo stack size
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) {
            this.notifications.showNotification('Nothing to undo', 'info');
            return;
        }
        
        // Save current state to redo stack
        const currentState = this.getState();
        this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
        
        // Restore previous state
        const previousState = this.undoStack.pop();
        this.setState(previousState);
        
        this.notifications.showNotification('Undo', 'info');
    }

    redo() {
        if (this.redoStack.length === 0) {
            this.notifications.showNotification('Nothing to redo', 'info');
            return;
        }
        
        // Save current state to undo stack
        const currentState = this.getState();
        this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
        
        // Restore next state
        const nextState = this.redoStack.pop();
        this.setState(nextState);
        
        this.notifications.showNotification('Redo', 'info');
    }

    getState() {
        return {
            version: '1.1', // Updated version for collections support
            currentSettings: this.currentSettings,
            sampleRate: this.audioEngine.sampleRate,
            layers: this.layerManager.getState(),
            timeline: this.timeline.getState(),
            collections: this.collectionManager.getState()
        };
    }

    setState(state) {
        if (state.currentSettings) {
            this.updateSettings(state.currentSettings);
        }
        if (state.sampleRate) {
            this.audioEngine.setSampleRate(state.sampleRate);
        }
        if (state.layers) {
            this.layerManager.setState(state.layers);
        }
        if (state.timeline) {
            this.timeline.setState(state.timeline);
        }
        if (state.collections) {
            this.collectionManager.setState(state.collections);
        }
    }

    // Save all content to browser (collections, groups, layers, clip values)
    saveAllToBrowser() {
        try {
            // Get complete state including all content
            const completeState = this.getState();

            // Add folders to the state
            completeState.folders = this.layerManager.folders;

            // Add timeline clip values
            completeState.timelineClips = [];
            if (this.layerManager.layers) {
                this.layerManager.layers.forEach(layer => {
                    completeState.timelineClips.push({
                        layerId: layer.id,
                        startTime: layer.startTime,
                        duration: this.soundGenerator.calculateDuration(layer.settings),
                        settings: layer.settings
                    });
                });
            }

            // Convert to JSON string with version info
            const projectData = {
                version: '2.0', // Updated version for collections support
                timestamp: Date.now(),
                name: 'Complete Project Backup',
                state: completeState
            };

            const jsonData = JSON.stringify(projectData, null, 2);

            // Save to localStorage
            localStorage.setItem('pixelAudioCompleteProject', jsonData);

            // Show success notification
            this.notifications.showNotification('All content saved to browser!', 'success');

            console.log('Saved complete project to browser with',
                       completeState.collections.collections.length, 'collections and',
                       completeState.layers.layers.length, 'layers');

            return true;
        } catch (error) {
            console.error('Error saving to browser:', error);
            this.notifications.showNotification('Error saving: ' + error.message, 'error');
            return false;
        }
    }
}

// Initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SFXGeneratorApp();
    app.init();
    
    // Mark as initialized after everything is set up
    app.initialized = true;
});

// Global function for preset buttons
function loadPreset(presetName) {
    if (app && app.initialized) {
        app.loadPreset(presetName);
    } else {
        // Wait a bit and try again
        setTimeout(() => loadPreset(presetName), 100);
    }
}

// Global function for randomize button  
function randomize() {
    if (app && app.initialized) {
        app.randomize();
    } else {
        setTimeout(() => randomize(), 100);
    }
}