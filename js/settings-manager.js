/**
 * Pixel Audio Settings Manager
 * Modal-based settings management system
 */

const SettingsManager = {
    isOpen: false,
    modalListenersSetup: false,
    settings: {
        masterVolume: 100,
        defaultLength: 1.0,
        showTooltips: true,
        theme: 'dark',
        autoSave: true,
        exportQuality: 1.0,
        exportFormat: 'wav', // Default to WAV, but supports: wav, mp3, ogg, midi
        enableTutorials: true,
        showHints: true,
        autoPlay: true,
        // Audio Effects Settings
        audioEffects: {
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
        }
    },

    init(app) {
        console.log('Initializing Pixel Audio Settings Manager...');
        this.app = app;

        // Ensure DOM is ready before setting up event listeners
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.loadSettings();
                console.log('Settings Manager initialized (DOM ready)');
            });
        } else {
            this.setupEventListeners();
            this.loadSettings();
            console.log('Settings Manager initialized');
        }
    },

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Settings button click - use the existing settings icon button
        const settingsBtn = document.querySelector('.icon-tab-btn[data-panel="settings"]');
        if (settingsBtn) {
            console.log('Settings button found, attaching event listener');

            // Remove any existing click handlers first
            const clone = settingsBtn.cloneNode(true);
            settingsBtn.parentNode.replaceChild(clone, settingsBtn);

            clone.addEventListener('click', (e) => {
                console.log('Settings button clicked');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // Prevent the right panel from opening
                this.toggleSettings();
                return false;
            });
        } else {
            console.error('Settings button not found!');
        }

        // Set up modal event listeners immediately since HTML is in the page
        console.log('About to set up modal event listeners...');
        console.log('Modal listeners already setup:', this.modalListenersSetup);
        
        if (!this.modalListenersSetup) {
            this.setupModalEventListeners();
            this.modalListenersSetup = true;
            console.log('Modal event listeners setup completed');
        } else {
            console.log('Modal event listeners already setup, skipping');
        }
    },

    toggleSettings() {
        if (this.isOpen) {
            this.closeSettings();
        } else {
            this.openSettings();
        }
    },

    openSettings() {
        console.log('Opening settings modal...');
        
        // Get the modal that's already in the HTML
        const modal = document.getElementById('settings-modal');
        if (!modal) {
            console.error('Settings modal not found in HTML');
            return;
        }
        console.log('Settings modal found:', modal);

        this.isOpen = true;
        modal.classList.add('open');
        console.log('Added open class to modal');

        // Update form values from current settings
        console.log('Updating form from settings...');
        this.updateFormFromSettings();

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                console.log('Escape key pressed, closing settings');
                this.closeSettings();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        console.log('Added escape key handler');

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('Backdrop clicked, closing settings');
                this.closeSettings();
            }
        });
        console.log('Added backdrop click handler');
        
        // Debug: Check if modal listeners are set up
        console.log('Modal listeners setup:', this.modalListenersSetup);
        if (!this.modalListenersSetup) {
            console.log('Modal listeners not setup yet, setting up now...');
            this.setupModalEventListeners();
            this.modalListenersSetup = true;
        }
    },

    updateFormFromSettings() {
        // Update HTML form values from current settings
        // Note: Many of these elements don't exist in the current index.html
        // They are kept for compatibility with template.html
        
        const masterVolumeSlider = document.getElementById('settings-master-volume');
        const masterVolumeDisplay = document.getElementById('master-volume-value');
        const defaultLengthInput = document.getElementById('settings-default-length');
        const showTooltipsCheckbox = document.getElementById('settings-show-tooltips');
        const themeSelect = document.getElementById('settings-theme');
        const autoSaveCheckbox = document.getElementById('settings-auto-save');
        const exportQualitySlider = document.getElementById('settings-export-quality');
        const exportQualityDisplay = document.getElementById('export-quality-value');
        const exportFormatSelect = document.getElementById('settings-export-format');
        const enableTutorialsCheckbox = document.getElementById('settings-enable-tutorials');
        const showHintsCheckbox = document.getElementById('settings-show-hints');
        const autoPlayCheckbox = document.getElementById('settings-auto-play');

        // Only update elements that actually exist in the DOM
        if (masterVolumeSlider && masterVolumeDisplay) {
            masterVolumeSlider.value = this.settings.masterVolume || 100;
            masterVolumeDisplay.textContent = (this.settings.masterVolume || 100) + '%';
        }

        if (defaultLengthInput) {
            defaultLengthInput.value = this.settings.defaultLength || 1.0;
        }

        if (showTooltipsCheckbox) {
            showTooltipsCheckbox.checked = this.settings.showTooltips !== false;
        }

        if (themeSelect) {
            themeSelect.value = this.settings.theme || 'dark';
        }

        if (autoSaveCheckbox) {
            autoSaveCheckbox.checked = this.settings.autoSave !== false;
        }

        if (exportQualitySlider && exportQualityDisplay) {
            exportQualitySlider.value = this.settings.exportQuality || 1.0;
            exportQualityDisplay.textContent = Math.round((this.settings.exportQuality || 1.0) * 100) + '%';
        }

        if (exportFormatSelect) {
            exportFormatSelect.value = this.settings.exportFormat || 'wav';
        }

        if (enableTutorialsCheckbox) {
            enableTutorialsCheckbox.checked = this.settings.enableTutorials !== false;
        }

        if (showHintsCheckbox) {
            showHintsCheckbox.checked = this.settings.showHints !== false;
        }

        if (autoPlayCheckbox) {
            autoPlayCheckbox.checked = this.settings.autoPlay !== false;
        }

        // Update audio effects settings (these DO exist in index.html)
        this.updateAudioEffectsForm();
    },

    updateAudioEffectsForm() {
        const effects = this.settings.audioEffects || {};
        
        // Core amplitude & envelope
        this.updateSliderValue('settings-gain', 'gain-value', effects.gain || 1.0);
        this.updateSliderValue('settings-decay', 'decay-value', effects.decay || 0.4);
        this.updateSliderValue('settings-sustain', 'sustain-value', effects.sustain || 0.2);
        this.updateSliderValue('settings-attack', 'attack-value', effects.attack || 0.01);
        this.updateSliderValue('settings-release', 'release-value', effects.release || 0.2);
        this.updateSliderValue('settings-pan', 'pan-value', effects.pan || 0.0);
        
        // Filters
        this.updateSliderValue('settings-lpf', 'lpf-value', effects.lpf || 800);
        this.updateSliderValue('settings-hpf', 'hpf-value', effects.hpf || 200);
        this.updateSliderValue('settings-bpf', 'bpf-value', effects.bpf || 1200);
        this.updateSliderValue('settings-lpq', 'lpq-value', effects.lpq || 0.7);
        
        // Time & space
        this.updateSliderValue('settings-delay', 'delay-value', effects.delay || 0.25);
        this.updateSliderValue('settings-delayfb', 'delayfb-value', effects.delayfb || 0.4);
        this.updateSliderValue('settings-delayt', 'delayt-value', effects.delayt || 0.33);
        this.updateSliderValue('settings-reverb', 'reverb-value', effects.reverb || 0.3);
        this.updateSliderValue('settings-room', 'room-value', effects.room || 0.5);
        
        // Distortion & saturation
        this.updateSliderValue('settings-distort', 'distort-value', effects.distort || 0.3);
        this.updateSliderValue('settings-crush', 'crush-value', effects.crush || 4);
        this.updateSliderValue('settings-shape', 'shape-value', effects.shape || 0.5);
        
        // Pitch & playback
        this.updateSliderValue('settings-speed', 'speed-value', effects.speed || 1.0);
        this.updateSliderValue('settings-note', 'note-value', effects.note || 0);
        this.updateSliderValue('settings-coarse', 'coarse-value', effects.coarse || 0);
        
        // Rhythmic & glitch
        this.updateSliderValue('settings-chop', 'chop-value', effects.chop || 8);
        this.updateSliderValue('settings-stutter', 'stutter-value', effects.stutter || 2);
        this.updateSliderValue('settings-trunc', 'trunc-value', effects.trunc || 0.5);
        
        // Modulation
        this.updateSliderValue('settings-vibrato', 'vibrato-value', effects.vibrato || 4);
        this.updateSliderValue('settings-vibdepth', 'vibdepth-value', effects.vibdepth || 0.02);
        this.updateSliderValue('settings-tremolo', 'tremolo-value', effects.tremolo || 8);
        this.updateSliderValue('settings-tremdepth', 'tremdepth-value', effects.tremdepth || 0.5);
        
        // Probability & variation
        this.updateSliderValue('settings-often', 'often-value', effects.often || 0.75, true);
        this.updateSliderValue('settings-sometimes', 'sometimes-value', effects.sometimes || 0.5, true);
        this.updateSliderValue('settings-rarely', 'rarely-value', effects.rarely || 0.25, true);
    },

    updateSliderValue(sliderId, displayId, value, isPercentage = false) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        
        if (slider && display) {
            slider.value = value;
            if (isPercentage) {
                display.textContent = Math.round(value * 100) + '%';
            } else {
                display.textContent = value;
            }
        }
    },

    closeSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('open');
        }
        this.isOpen = false;
    },

    setupModalEventListeners() {
        const modal = document.getElementById('settings-modal');
        if (!modal) {
            console.error('Settings modal not found!');
            return;
        }
        console.log('Settings modal found, setting up event listeners');

        // Header close button (X icon)
        const headerCloseBtn = document.getElementById('modal-close');
        if (headerCloseBtn) {
            console.log('Header close button found, attaching event listener');
            headerCloseBtn.addEventListener('click', () => {
                console.log('Header close button clicked');
                this.closeSettings();
            });
        } else {
            console.warn('Header close button not found!');
        }

        // Footer close button (Cancel) - look for any button with modal-close class in modal-actions
        const closeBtn = document.querySelector('.modal-actions .modal-close') || document.querySelector('.modal-actions button:first-child');
        if (closeBtn) {
            console.log('Footer close button found, attaching event listener');
            closeBtn.addEventListener('click', () => {
                console.log('Footer close button clicked');
                this.closeSettings();
            });
        } else {
            console.warn('Footer close button not found!');
            // Debug: show all buttons in modal actions
            const allModalButtons = document.querySelectorAll('.modal-actions button');
            console.log('All modal action buttons:', allModalButtons);
            allModalButtons.forEach((btn, index) => {
                console.log(`Modal action button ${index}:`, btn);
                console.log(`Button text:`, btn.textContent);
                console.log(`Button classes:`, btn.className);
            });
        }

        // Save button - look for primary class or saveSettings ID
        const saveBtn = document.getElementById('saveSettings') || document.querySelector('.modal-actions .primary');
        if (saveBtn) {
            console.log('Save button found, attaching event listener');
            saveBtn.addEventListener('click', () => {
                console.log('Save button clicked');
                this.saveSettings();
                this.closeSettings();
            });
        } else {
            console.warn('Save button not found!');
            // Debug: show all buttons in modal actions
            const allModalButtons = document.querySelectorAll('.modal-actions button');
            console.log('All modal action buttons:', allModalButtons);
            allModalButtons.forEach((btn, index) => {
                console.log(`Modal action button ${index}:`, btn);
                console.log(`Button text:`, btn.textContent);
                console.log(`Button classes:`, btn.className);
            });
        }

        // Tab system - this is the critical section for debugging
        console.log('Looking for tab buttons with class .settings-tab...');
        const tabButtons = document.querySelectorAll('.settings-tab');
        console.log('Tab buttons query selector result:', tabButtons);
        
        console.log('Looking for tab contents with class .settings-tab-content...');
        const tabContents = document.querySelectorAll('.settings-tab-content');
        console.log('Tab contents query selector result:', tabContents);

        // Debug: Log found tabs and contents
        console.log('Found tab buttons:', tabButtons.length);
        console.log('Found tab contents:', tabContents.length);
        
        // Log all tab buttons found
        tabButtons.forEach((button, index) => {
            console.log(`Tab button ${index}:`, button);
            console.log(`Tab button ${index} data-tab:`, button.getAttribute('data-tab'));
            console.log(`Tab button ${index} id:`, button.id);
            console.log(`Tab button ${index} classes:`, button.className);
        });
        
        // Log all tab contents found
        tabContents.forEach((content, index) => {
            console.log(`Tab content ${index}:`, content);
            console.log(`Tab content ${index} data-tab-content:`, content.getAttribute('data-tab-content'));
            console.log(`Tab content ${index} id:`, content.id);
            console.log(`Tab content ${index} classes:`, content.className);
        });
         
        if (tabButtons.length === 0) {
            console.error('NO TAB BUTTONS FOUND! This is the critical issue.');
            console.log('All elements with class .settings-tab in document:', document.querySelectorAll('.settings-tab'));
            
            // Let's also check if the modal content is actually in the DOM
            console.log('Modal inner HTML:', modal.innerHTML);
            console.log('Modal content query:', modal.querySelector('.modal-content'));
            
            // Check if settings-tabs div exists
            const settingsTabs = document.querySelector('.settings-tabs');
            console.log('Settings tabs container:', settingsTabs);
            if (settingsTabs) {
                console.log('Settings tabs container HTML:', settingsTabs.innerHTML);
            }
        }
         
        tabButtons.forEach(button => {
            console.log(`Attaching click listener to tab button: ${button.getAttribute('data-tab')}`);
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                console.log(`Tab clicked: ${tabName}`);
                console.log('Event listener fired successfully!');

                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                const targetContent = document.querySelector(`.settings-tab-content[data-tab-content="${tabName}"]`);
                if (targetContent) {
                    // Remove active class from all contents first
                    tabContents.forEach(content => {
                        content.classList.remove('active');
                        content.style.display = 'none'; // Explicitly hide all tabs
                    });
                     
                    // Add active class and show the target content
                    targetContent.classList.add('active');
                    targetContent.style.display = 'block'; // Explicitly set display to block
                    
                    console.log(`Switched to ${tabName} tab, content found and activated`);
                    console.log('Content display style:', window.getComputedStyle(targetContent).display);
                    console.log('Content classes:', targetContent.className);
                    
                    // Specific fix for audio-effects tab
                    if (tabName === 'audio-effects') {
                        console.log('Audio Effects tab activated - ensuring content is visible');
                         
                        // Also ensure the settings-content inside is visible
                        const settingsContent = targetContent.querySelector('.settings-content');
                        if (settingsContent) {
                            settingsContent.style.display = 'block';
                            settingsContent.style.opacity = '1';
                            settingsContent.style.visibility = 'visible';
                            console.log('Audio Effects settings content made visible');
                        } else {
                            console.warn('Settings content not found inside audio effects tab');
                        }
                    }
                } else {
                    console.warn(`No content found for tab: ${tabName}`);
                    // List all available tab contents for debugging
                    tabContents.forEach(content => {
                        console.log('Available content:', content.getAttribute('data-tab-content'));
                    });
                }
            });
        });

        // Initialize first tab as active by default
        if (tabButtons.length > 0 && tabContents.length > 0) {
            const firstTab = tabButtons[0];
            const firstTabName = firstTab.getAttribute('data-tab');
            firstTab.classList.add('active');
             
            const firstContent = document.querySelector(`.settings-tab-content[data-tab-content="${firstTabName}"]`);
            if (firstContent) {
                firstContent.classList.add('active');
                firstContent.style.display = 'block'; // Explicitly show the first tab
                console.log(`Initialized first tab: ${firstTabName}`);
                console.log('First content display style:', window.getComputedStyle(firstContent).display);
            } else {
                console.error(`First content not found for tab: ${firstTabName}`);
            }
        } else {
            console.warn('No tabs or tab contents found for initialization');
        }

        // Audio effects sliders
        console.log('Setting up audio effects sliders...');
        this.setupAudioEffectsSliders();
    },

    setupAudioEffectsSliders() {
        // Core amplitude & envelope
        this.setupSliderWithDisplay('settings-gain', 'gain-value');
        this.setupSliderWithDisplay('settings-decay', 'decay-value');
        this.setupSliderWithDisplay('settings-sustain', 'sustain-value');
        this.setupSliderWithDisplay('settings-attack', 'attack-value');
        this.setupSliderWithDisplay('settings-release', 'release-value');
        this.setupSliderWithDisplay('settings-pan', 'pan-value');
        
        // Filters
        this.setupSliderWithDisplay('settings-lpf', 'lpf-value');
        this.setupSliderWithDisplay('settings-hpf', 'hpf-value');
        this.setupSliderWithDisplay('settings-bpf', 'bpf-value');
        this.setupSliderWithDisplay('settings-lpq', 'lpq-value');
        
        // Time & space
        this.setupSliderWithDisplay('settings-delay', 'delay-value');
        this.setupSliderWithDisplay('settings-delayfb', 'delayfb-value');
        this.setupSliderWithDisplay('settings-delayt', 'delayt-value');
        this.setupSliderWithDisplay('settings-reverb', 'reverb-value');
        this.setupSliderWithDisplay('settings-room', 'room-value');
        
        // Distortion & saturation
        this.setupSliderWithDisplay('settings-distort', 'distort-value');
        this.setupSliderWithDisplay('settings-crush', 'crush-value');
        this.setupSliderWithDisplay('settings-shape', 'shape-value');
        
        // Pitch & playback
        this.setupSliderWithDisplay('settings-speed', 'speed-value');
        this.setupSliderWithDisplay('settings-note', 'note-value');
        this.setupSliderWithDisplay('settings-coarse', 'coarse-value');
        
        // Rhythmic & glitch
        this.setupSliderWithDisplay('settings-chop', 'chop-value');
        this.setupSliderWithDisplay('settings-stutter', 'stutter-value');
        this.setupSliderWithDisplay('settings-trunc', 'trunc-value');
        
        // Modulation
        this.setupSliderWithDisplay('settings-vibrato', 'vibrato-value');
        this.setupSliderWithDisplay('settings-vibdepth', 'vibdepth-value');
        this.setupSliderWithDisplay('settings-tremolo', 'tremolo-value');
        this.setupSliderWithDisplay('settings-tremdepth', 'tremdepth-value');
        
        // Probability & variation
        this.setupSliderWithDisplay('settings-often', 'often-value', true);
        this.setupSliderWithDisplay('settings-sometimes', 'sometimes-value', true);
        this.setupSliderWithDisplay('settings-rarely', 'rarely-value', true);
    },

    setupSliderWithDisplay(sliderId, displayId, isPercentage = false) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        
        if (slider && display) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (isPercentage) {
                    display.textContent = Math.round(value * 100) + '%';
                } else {
                    display.textContent = value;
                }
            });
        }
    },

    saveSettings() {
        // Read settings from HTML form
        // Note: Many of these elements don't exist in the current index.html
        // They are kept for compatibility with template.html
        
        const masterVolumeSlider = document.getElementById('settings-master-volume');
        const defaultLengthInput = document.getElementById('settings-default-length');
        const showTooltipsCheckbox = document.getElementById('settings-show-tooltips');
        const themeSelect = document.getElementById('settings-theme');
        const autoSaveCheckbox = document.getElementById('settings-auto-save');
        const exportQualitySlider = document.getElementById('settings-export-quality');
        const exportFormatSelect = document.getElementById('settings-export-format');
        const enableTutorialsCheckbox = document.getElementById('settings-enable-tutorials');
        const showHintsCheckbox = document.getElementById('settings-show-hints');
        const autoPlayCheckbox = document.getElementById('settings-auto-play');

        // Only update settings from elements that actually exist
        if (masterVolumeSlider) {
            this.settings.masterVolume = parseInt(masterVolumeSlider.value);
        }
        if (defaultLengthInput) {
            this.settings.defaultLength = parseFloat(defaultLengthInput.value);
        }
        if (showTooltipsCheckbox) {
            this.settings.showTooltips = showTooltipsCheckbox.checked;
        }
        if (themeSelect) {
            this.settings.theme = themeSelect.value;
        }
        if (autoSaveCheckbox) {
            this.settings.autoSave = autoSaveCheckbox.checked;
        }
        if (exportQualitySlider) {
            this.settings.exportQuality = parseFloat(exportQualitySlider.value);
        }
        if (exportFormatSelect) {
            this.settings.exportFormat = exportFormatSelect.value;
        }
        if (enableTutorialsCheckbox) {
            this.settings.enableTutorials = enableTutorialsCheckbox.checked;
        }
        if (showHintsCheckbox) {
            this.settings.showHints = showHintsCheckbox.checked;
        }
        if (autoPlayCheckbox) {
            this.settings.autoPlay = autoPlayCheckbox.checked;
        }

        // Save audio effects settings (these DO exist in index.html)
        this.saveAudioEffectsSettings();

        // Apply settings
        this.applySettings();

        // Save to localStorage
        this.saveSettingsToStorage();

        if (this.app && this.app.notifications) {
            this.app.notifications.showNotification('Settings saved successfully', 'success');
        }
    },

    saveAudioEffectsSettings() {
        if (!this.settings.audioEffects) {
            this.settings.audioEffects = {};
        }
        
        const effects = this.settings.audioEffects;
        
        // Core amplitude & envelope
        effects.gain = this.getSliderValue('settings-gain', 1.0);
        effects.decay = this.getSliderValue('settings-decay', 0.4);
        effects.sustain = this.getSliderValue('settings-sustain', 0.2);
        effects.attack = this.getSliderValue('settings-attack', 0.01);
        effects.release = this.getSliderValue('settings-release', 0.2);
        effects.pan = this.getSliderValue('settings-pan', 0.0);
        
        // Filters
        effects.lpf = this.getSliderValue('settings-lpf', 800);
        effects.hpf = this.getSliderValue('settings-hpf', 200);
        effects.bpf = this.getSliderValue('settings-bpf', 1200);
        effects.lpq = this.getSliderValue('settings-lpq', 0.7);
        
        // Time & space
        effects.delay = this.getSliderValue('settings-delay', 0.25);
        effects.delayfb = this.getSliderValue('settings-delayfb', 0.4);
        effects.delayt = this.getSliderValue('settings-delayt', 0.33);
        effects.reverb = this.getSliderValue('settings-reverb', 0.3);
        effects.room = this.getSliderValue('settings-room', 0.5);
        
        // Distortion & saturation
        effects.distort = this.getSliderValue('settings-distort', 0.3);
        effects.crush = this.getSliderValue('settings-crush', 4);
        effects.shape = this.getSliderValue('settings-shape', 0.5);
        
        // Pitch & playback
        effects.speed = this.getSliderValue('settings-speed', 1.0);
        effects.note = this.getSliderValue('settings-note', 0);
        effects.coarse = this.getSliderValue('settings-coarse', 0);
        
        // Rhythmic & glitch
        effects.chop = this.getSliderValue('settings-chop', 8);
        effects.stutter = this.getSliderValue('settings-stutter', 2);
        effects.trunc = this.getSliderValue('settings-trunc', 0.5);
        
        // Modulation
        effects.vibrato = this.getSliderValue('settings-vibrato', 4);
        effects.vibdepth = this.getSliderValue('settings-vibdepth', 0.02);
        effects.tremolo = this.getSliderValue('settings-tremolo', 8);
        effects.tremdepth = this.getSliderValue('settings-tremdepth', 0.5);
        
        // Probability & variation
        effects.often = this.getSliderValue('settings-often', 0.75);
        effects.sometimes = this.getSliderValue('settings-sometimes', 0.5);
        effects.rarely = this.getSliderValue('settings-rarely', 0.25);
    },

    getSliderValue(sliderId, defaultValue) {
        const slider = document.getElementById(sliderId);
        return slider ? parseFloat(slider.value) : defaultValue;
    },

    applySettings() {
        // Apply master volume
        if (this.app && this.app.audioEngine && this.app.audioEngine.setMasterVolume) {
            this.app.audioEngine.setMasterVolume(this.settings.masterVolume / 100);
        }

        // Apply default length to app if available
        if (this.app && this.app.settings) {
            this.app.settings.defaultDuration = this.settings.defaultLength;
        }

        // Apply tooltips setting
        if (this.settings.showTooltips) {
            document.body.classList.remove('tooltips-hidden');
        } else {
            document.body.classList.add('tooltips-hidden');
        }

        // Apply theme
        if (this.settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }

        // Apply auto-save setting
        if (this.settings.autoSave && this.app && this.app.fileManager) {
            // Start auto-save if enabled
            if (this.app.fileManager.startAutoSave) {
                this.app.fileManager.startAutoSave();
            }
        } else if (this.app && this.app.fileManager && this.app.fileManager.stopAutoSave) {
            this.app.fileManager.stopAutoSave();
        }

        // Apply auto-play setting
        if (this.app) {
            this.app.autoPlayEnabled = this.settings.autoPlay;
        }
    },

    resetSettings() {
        if (confirm('Reset all settings to default values?')) {
            // Reset to defaults
            this.settings = {
                masterVolume: 100,
                defaultLength: 1.0,
                showTooltips: true,
                theme: 'dark',
                autoSave: true,
                exportQuality: 1.0,
                exportFormat: 'wav', // Default to WAV, but MIDI is available as option
                enableTutorials: true,
                showHints: true,
                autoPlay: true,
                // Audio Effects Settings
                audioEffects: {
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
                }
            };

            // Update HTML form
            this.updateFormFromSettings();

            // Apply settings
            this.applySettings();

            // Save to localStorage
            this.saveSettingsToStorage();

            if (this.app && this.app.notifications) {
                this.app.notifications.showNotification('Settings reset to defaults', 'info');
            }
        }
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem('pixelAudio-settings');
            if (saved) {
                const loadedSettings = JSON.parse(saved);
                this.settings = { ...this.settings, ...loadedSettings };

                // Update the UI form
                this.updateFormFromSettings();

                // Apply the loaded settings
                this.applySettings();

                if (this.app && this.app.notifications) {
                    this.app.notifications.showNotification('Settings loaded successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            if (this.app && this.app.notifications) {
                this.app.notifications.showNotification('Failed to load settings', 'error');
            }
        }
    },

    saveSettingsToStorage() {
        try {
            localStorage.setItem('pixelAudio-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
            if (this.app && this.app.notifications) {
                this.app.notifications.showNotification('Failed to save settings', 'error');
            }
        }
    },

    // Load complete project from browser storage
    loadCompleteProject() {
        try {
            const projectData = localStorage.getItem('pixelAudioCompleteProject');
            if (projectData) {
                const parsed = JSON.parse(projectData);

                // Handle both old and new formats
                if (parsed.state) {
                    // New format with version 2.0
                    this.app.setState(parsed.state);
                } else if (parsed.collections) {
                    // Handle direct collections data
                    this.app.collectionManager.setState(parsed.collections);
                } else {
                    // Very old format - try to handle gracefully
                    this.app.setState(parsed);
                }

                if (this.app && this.app.notifications) {
                    this.app.notifications.showNotification('Complete project loaded from browser!', 'success');
                }
                return true;
            } else {
                if (this.app && this.app.notifications) {
                    this.app.notifications.showNotification('No complete project found in browser storage', 'info');
                }
                return false;
            }
        } catch (error) {
            console.error('Error loading complete project:', error);
            if (this.app && this.app.notifications) {
                this.app.notifications.showNotification('Error loading project: ' + error.message, 'error');
            }
            return false;
        }
    },

    getSettings() {
        return { ...this.settings };
    }
};

// Initialize the settings manager when the app is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if app is available globally
    if (typeof app !== 'undefined') {
        SettingsManager.init(app);
    } else {
        // If app is not available yet, try to initialize later
        setTimeout(() => {
            if (typeof app !== 'undefined') {
                SettingsManager.init(app);
            }
        }, 1000);
    }
});

// Add database UI when settings manager is initialized
if (typeof app !== 'undefined' && app.databaseManager) {
    // Database UI will be added by the DatabaseManager itself
}