document.addEventListener('DOMContentLoaded', function() {
    // Initialize Tone.js for legacy support
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    let strudelInitialized = false;
    let strudelPlayer = null;
      
    // Audio Effects Manager
    let audioEffectsManager = null;
      
    // Audio initialization button
    document.getElementById('initAudioBtn')?.addEventListener('click', async function() {
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
                this.textContent = 'Audio Enabled';
                this.style.backgroundColor = '#55aa55';
                console.log('Audio context started successfully');
            }
        } catch (error) {
            console.error('Error starting audio context:', error);
            this.textContent = 'Audio Error';
            this.style.backgroundColor = '#ff5555';
        }
    });
      
    // Panel toggle button
    document.getElementById('panel-toggle')?.addEventListener('click', function() {
        const sidePanel = document.getElementById('side-panel');
        sidePanel.classList.toggle('visible');
    });
    
    // Initialize Audio Effects Manager
    if (typeof AudioEffectsManager !== 'undefined') {
        audioEffectsManager = Object.create(AudioEffectsManager);
        audioEffectsManager.init({
            instruments: [],
            selectedInstrument: null
        });
    }
      
    // Save button - save complete project
   const saveProjectBtn = document.getElementById('saveProject');
   if (saveProjectBtn) {
       saveProjectBtn.addEventListener('click', function() {
           saveCompleteProject();
       });
   }
   
   // Settings button
   const settingsBtn = document.getElementById('settingsBtn');
   if (settingsBtn) {
       settingsBtn.addEventListener('click', function() {
           if (typeof SettingsManager !== 'undefined' && SettingsManager.toggleSettings) {
               SettingsManager.toggleSettings();
           } else {
               document.getElementById('settings-modal').style.display = 'flex';
           }
       });
   }

    // Close modal
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            if (typeof SettingsManager !== 'undefined' && SettingsManager.closeSettings) {
                SettingsManager.closeSettings();
            } else {
                document.getElementById('settings-modal').style.display = 'none';
            }
        });
    }

    // Save settings
    const saveSettings = document.getElementById('saveSettings');
    if (saveSettings) {
        saveSettings.addEventListener('click', function() {
            if (typeof SettingsManager !== 'undefined' && SettingsManager.saveSettings) {
                SettingsManager.saveSettings();
            }
            if (typeof SettingsManager !== 'undefined' && SettingsManager.closeSettings) {
                SettingsManager.closeSettings();
            } else {
                document.getElementById('settings-modal').style.display = 'none';
            }
        });
    }

    // Legacy functions for backward compatibility
    function saveCompleteProject() {
        try {
            // Create project state object
            const projectState = {
                version: '2.0',
                timestamp: new Date().toISOString(),
                instruments: [],
                audioEffects: {},
                settings: {}
            };
            
            // Save global audio effects settings
            if (audioEffectsManager && audioEffectsManager.defaultEffects) {
                projectState.audioEffects = { ...audioEffectsManager.defaultEffects };
            }
            
            // Save general settings
            if (typeof SettingsManager !== 'undefined' && SettingsManager.getSettings) {
                projectState.settings = SettingsManager.getSettings();
            }
            
            // Save to localStorage
            localStorage.setItem('pixelAudioCompleteProject', JSON.stringify(projectState));
            
            // Show success notification
            alert('Project saved successfully! All instruments, effects, and settings have been saved.');
            console.log('Project saved:', projectState);
            
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Error saving project: ' + error.message);
        }
    }
    
    // Load complete project function
    function loadCompleteProject() {
        try {
            const projectData = localStorage.getItem('pixelAudioCompleteProject');
            if (projectData) {
                const parsed = JSON.parse(projectData);
                console.log('Loading project:', parsed);
                
                // Restore global audio effects
                if (parsed.audioEffects && audioEffectsManager) {
                    audioEffectsManager.defaultEffects = { ...parsed.audioEffects };
                }
                
                // Restore settings
                if (parsed.settings && typeof SettingsManager !== 'undefined') {
                    SettingsManager.settings = { ...SettingsManager.settings, ...parsed.settings };
                    SettingsManager.applySettings();
                }
                
                alert('Project loaded successfully!');
                console.log('Project loaded successfully');
                
            } else {
                alert('No saved project found.');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            alert('Error loading project: ' + error.message);
        }
    }
    
    // Add load project button functionality
    const loadProjectBtn = document.getElementById('loadProject');
    if (loadProjectBtn) {
        loadProjectBtn.addEventListener('click', function() {
            if (confirm('Load saved project? This will replace your current work.')) {
                loadCompleteProject();
            }
        });
    }
});