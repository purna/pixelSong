// Song Designer App - Main Initialization and Handlers
class SongApp {
    constructor() {
        this.songApp = null;
        this.currentCollectionId = null;
        this.editingCollectionId = null;
        this.addToCollectionId = null;
        this.confirmCallback = null;
        this.songPickerCallback = null;
        this.pendingSongName = null;
    }

    init() {
        this.setupThemeToggle();
        this.setupPlayStop();
        this.setupControls();
        this.setupModals();
        this.setupDatabaseFunctions();
        this.setupFileSystemFunctions();
        this.setupCollectionFunctions();
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            // Expose songApp globally for onclick handlers
            window.songApp = new SongDesignerApp();
            this.songApp = window.songApp;
            this.songApp.createHarmonicsGrid();
            this.songApp.createMelodyGrid();
            this.songApp.createBassGrid();
            this.songApp.createLeadGrid();
            this.songApp.createRhythmGrid();
            this.songApp.createPercussionGrid();
            this.songApp.createStepTimeline();
            this.songApp.createSectionTimelines();
            this.songApp.populateGenreSelect();
            this.songApp.populateChordProgressionSelect();
            this.songApp.drawFilterAutomation();
            this.songApp.setupEventListeners();
            this.songApp.updatePatternLengthUI();
            
            // Initialize new automation controls
            this.songApp.setupPanSliders();
            this.songApp.setupVelocitySlider();
            this.songApp.setupAdvancedAutomationToggle();
            this.songApp.updatePanDisplays();
            
            this.songApp.dbManager = new SongDatabaseManager(this.songApp);
            this.songApp.fileManager = new SongFileManager(this.songApp);
            this.songApp.collectionManager = new SongCollectionManager(this.songApp);
            this.songApp.midiManager = new MidiManager(this.songApp);
            
            // Initialize Google Drive UI (will check for gapi and initialize when ready)
            this.initGoogleDriveUI();
            
            window.updateDatabaseStatus();
            
            console.log('Song Designer ready!');
        });
    }

    setupThemeToggle() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            const body = document.body;
            if (body.getAttribute('data-theme') === 'dark') {
                body.removeAttribute('data-theme');
                document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                body.setAttribute('data-theme', 'dark');
                document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
            }
        });
    }

    setupPlayStop() {
        let isPlaying = false;
        
        document.getElementById('playBtn').addEventListener('click', async () => {
            if (!isPlaying) {
                // Initialize audio if not already done
                if (!this.songApp.audioEngine) {
                    await this.songApp.initAudio();
                }
                await Tone.start();
                this.songApp.play();
                isPlaying = true;
                document.getElementById('playText').textContent = 'Stop';
                document.getElementById('playBtn').classList.remove('btn-play');
                document.getElementById('playBtn').classList.add('btn-stop');
            } else {
                this.songApp.stop();
                isPlaying = false;
                document.getElementById('playText').textContent = 'Play';
                document.getElementById('playBtn').classList.remove('btn-stop');
                document.getElementById('playBtn').classList.add('btn-play');
            }
        });
    }

    setupControls() {
        document.getElementById('clearBtn').addEventListener('click', () => { 
            if (this.songApp) this.songApp.clearAll(); 
        });
        document.getElementById('saveBtn').addEventListener('click', () => { this.saveSong(); });
        document.getElementById('exportBtn').addEventListener('click', () => { this.handleExport(); });
        
        // Settings button handlers
        document.getElementById('settingsBtn').addEventListener('click', () => { 
            document.getElementById('settingsModal').classList.remove('hidden'); 
            this.updateDatabaseStatus();
        });
        document.getElementById('closeSettings').addEventListener('click', () => { 
            document.getElementById('settingsModal').classList.add('hidden'); 
        });
        document.getElementById('settingsModal').addEventListener('click', (e) => { 
            if (e.target === document.getElementById('settingsModal')) {
                document.getElementById('settingsModal').classList.add('hidden'); 
            }
        });
        
        // Settings tabs functionality
        this.setupSettingsTabs();
        
        // Settings modal buttons
        document.getElementById('openCollectionsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
            this.renderCollectionsList();
            document.getElementById('collectionsModal').classList.remove('hidden');
        });
        
        document.getElementById('saveToCollectionBtn').addEventListener('click', () => {
            this.showAddSongModal(null);
        });
        
        document.getElementById('saveToDatabaseBtn').addEventListener('click', () => {
            if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
            document.getElementById('databaseSongName').value = '';
            document.getElementById('saveToDatabaseModal').classList.remove('hidden');
            document.getElementById('databaseSongName').focus();
        });
        
        document.getElementById('loadFromDatabaseBtn').addEventListener('click', () => {
            if (!this.songApp) { this.showNotification('No song app!', 'error'); return; }
            const songs = this.songApp.dbManager.loadSongsFromDatabase();
            const songNames = Object.keys(songs);
            if (songNames.length === 0) {
                this.showNotification('No songs found in database!', 'error');
                return;
            }
            this.showSongPicker(songs, (name) => {
                if (songs[name]) {
                    this.songApp.loadSongData(songs[name]);
                    this.showNotification('Loaded: ' + name, 'success');
                }
            });
        });
        
        document.getElementById('exportSongFileBtn').addEventListener('click', () => {
            if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
            this.songApp.fileManager.exportSongToFile();
        });
        
        document.getElementById('importSongFileBtn').addEventListener('click', () => {
            if (!this.songApp) { this.showNotification('No song app!', 'error'); return; }
            this.songApp.fileManager.importSongFromFile();
        });
        
        document.getElementById('saveBrowserBtn').addEventListener('click', () => {
            if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
            const data = this.songApp.getSongData();
            localStorage.setItem('songDesignerSave', JSON.stringify(data));
            this.showNotification('Song saved to browser!', 'success');
        });
        
        document.getElementById('loadBrowserBtn').addEventListener('click', () => {
            const saved = localStorage.getItem('songDesignerSave');
            if (!saved) { this.showNotification('No saved song found!', 'error'); return; }
            try {
                const data = JSON.parse(saved);
                if (!this.songApp) this.songApp = new SongDesignerApp();
                this.songApp.loadSongData(data);
                this.showNotification('Song loaded!', 'success');
            } catch (e) {
                this.showNotification('Error loading song: ' + e.message, 'error');
            }
        });
        
        // Audio prompt button
        document.getElementById('audioPromptPlayBtn').addEventListener('click', () => {
            document.getElementById('audioPromptModal').classList.add('hidden');
            document.getElementById('playBtn')?.click();
        });
        
        // Tooltip toggle
        document.getElementById('tooltipToggle')?.addEventListener('change', (e) => {
            if (typeof tooltip !== 'undefined') {
                tooltip.toggle(e.target.checked);
            }
        });
        
        // Main Loop Controls toggle
        document.getElementById('mainLoopControlsToggle')?.addEventListener('change', (e) => {
            if (this.songApp && typeof this.songApp.updateMainLoopControlsVisibility === 'function') {
                this.songApp.updateMainLoopControlsVisibility();
            }
        });
        
        // Create collection button
        document.getElementById('createCollectionBtn').addEventListener('click', () => {
            this.editingCollectionId = null;
            document.getElementById('collectionFormTitle').innerHTML = '<i class="fas fa-plus"></i> Create Collection';
            document.getElementById('collectionName').value = '';
            document.getElementById('collectionDescription').value = '';
            document.getElementById('collectionFormSubmit').innerHTML = 'Create';
            document.getElementById('collectionFormModal').classList.remove('hidden');
        });
        
        // Collection form buttons
        document.getElementById('collectionFormCancel').addEventListener('click', () => {
            document.getElementById('collectionFormModal').classList.add('hidden');
            this.editingCollectionId = null;
        });
        
        document.getElementById('collectionFormSubmit').addEventListener('click', () => {
            this.submitCollectionForm();
        });
        
        // Save to database buttons
        document.getElementById('cancelSaveToDatabase').addEventListener('click', () => {
            document.getElementById('saveToDatabaseModal').classList.add('hidden');
        });
        
        document.getElementById('confirmSaveToDatabase').addEventListener('click', () => {
            const songName = document.getElementById('databaseSongName').value.trim();
            if (!songName) {
                this.showNotification('Please enter a song name', 'error');
                return;
            }
            
            if (this.songApp && this.songApp.dbManager) {
                this.songApp.dbManager.currentSongName = songName;
            }
            
            document.getElementById('saveToDatabaseModal').classList.add('hidden');
            
            if (this.songApp && this.songApp.dbManager) {
                this.songApp.dbManager.saveSongToDatabase(songName);
            } else {
                this.showNotification('No song app available!', 'error');
            }
        });
        
        // Add to collection buttons
        document.getElementById('cancelAddToCollection').addEventListener('click', () => {
            document.getElementById('addToCollectionModal').classList.add('hidden');
        });
        
        document.getElementById('submitAddToCollection').addEventListener('click', () => {
            this.submitAddToCollection();
        });
        
        document.getElementById('createNewCollectionFromAdd').addEventListener('click', () => {
            const songName = document.getElementById('newSongName').value.trim();
            if (!songName) {
                this.showNotification('Please enter a song name first', 'error');
                document.getElementById('newSongName').focus();
                return;
            }
            
            document.getElementById('addToCollectionModal').classList.add('hidden');
            
            this.editingCollectionId = null;
            document.getElementById('collectionFormTitle').innerHTML = '<i class="fas fa-plus"></i> Create Collection';
            document.getElementById('collectionName').value = '';
            document.getElementById('collectionDescription').value = '';
            document.getElementById('collectionFormSubmit').innerHTML = 'Create';
            document.getElementById('collectionFormModal').classList.remove('hidden');
            
            this.pendingSongName = songName;
            
            setTimeout(() => {
                document.getElementById('collectionName').focus();
            }, 100);
        });
    }
    
    // Settings tabs setup
    setupSettingsTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const contents = document.querySelectorAll('.settings-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Remove active from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Add active to clicked tab and corresponding content
                tab.classList.add('active');
                const targetContent = document.getElementById('tab-' + targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    setupModals() {
        // Collections modal
        document.getElementById('collectionsBtn').addEventListener('click', () => {
            this.renderCollectionsList();
            document.getElementById('collectionsModal').classList.remove('hidden');
        });
        document.getElementById('closeCollections').addEventListener('click', () => {
            document.getElementById('collectionsModal').classList.add('hidden');
        });
        document.getElementById('collectionsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('collectionsModal')) {
                document.getElementById('collectionsModal').classList.add('hidden');
            }
        });
        
        // Open Collections from Settings
        window.openCollectionsModal = () => {
            document.getElementById('settingsModal').classList.add('hidden');
            this.renderCollectionsList();
            document.getElementById('collectionsModal').classList.remove('hidden');
        };
        
        // Collection detail modal
        document.getElementById('closeCollectionDetail').addEventListener('click', () => {
            document.getElementById('collectionDetailModal').classList.add('hidden');
        });
        document.getElementById('collectionDetailModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('collectionDetailModal')) {
                document.getElementById('collectionDetailModal').classList.add('hidden');
            }
        });
        
        // Collection form modal
        document.getElementById('closeCollectionForm').addEventListener('click', () => {
            this.closeCollectionFormModal();
        });
        document.getElementById('collectionFormModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('collectionFormModal')) {
                this.closeCollectionFormModal();
            }
        });
        
        // Add to collection modal
        document.getElementById('closeAddToCollection').addEventListener('click', () => {
            document.getElementById('addToCollectionModal').classList.add('hidden');
        });
        document.getElementById('addToCollectionModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('addToCollectionModal')) {
                document.getElementById('addToCollectionModal').classList.add('hidden');
            }
        });
        
        // Song picker modal
        document.getElementById('closeSongPicker').addEventListener('click', () => {
            document.getElementById('songPickerModal').classList.add('hidden');
        });
        document.getElementById('songPickerModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('songPickerModal')) {
                document.getElementById('songPickerModal').classList.add('hidden');
            }
        });
        
        // Confirm modal
        document.getElementById('closeConfirm').addEventListener('click', () => {
            document.getElementById('confirmModal').classList.add('hidden');
        });
        document.getElementById('confirmCancel').addEventListener('click', () => {
            document.getElementById('confirmModal').classList.add('hidden');
        });
        document.getElementById('confirmOk').addEventListener('click', () => { 
            if (this.confirmCallback) this.confirmCallback();
            document.getElementById('confirmModal').classList.add('hidden');
        });
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('confirmModal')) {
                document.getElementById('confirmModal').classList.add('hidden');
            }
        });
        
        // Audio Prompt Modal
        const audioPromptModal = document.getElementById('audioPromptModal');
        document.getElementById('closeAudioPrompt')?.addEventListener('click', () => {
            audioPromptModal.classList.add('hidden');
        });
        audioPromptModal?.addEventListener('click', (e) => {
            if (e.target === audioPromptModal) audioPromptModal.classList.add('hidden');
        });
        
        window.handleAudioPromptPlay = () => {
            audioPromptModal.classList.add('hidden');
            document.getElementById('playBtn')?.click();
        };
        
        window.showAudioPrompt = () => {
            audioPromptModal.classList.remove('hidden');
        };
        
        // Help modal
        document.getElementById('helpBtn')?.addEventListener('click', () => {
            document.getElementById('helpModal')?.classList.remove('hidden');
        });
        document.getElementById('closeHelp').addEventListener('click', () => {
            document.getElementById('helpModal').classList.add('hidden');
        });
        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('helpModal')) {
                document.getElementById('helpModal').classList.add('hidden');
            }
        });
        
        // Save to Database Modal handlers
        const saveToDatabaseModal = document.getElementById('saveToDatabaseModal');
        document.getElementById('closeSaveToDatabase').addEventListener('click', () => {
            saveToDatabaseModal.classList.add('hidden');
        });
        saveToDatabaseModal.addEventListener('click', (e) => {
            if (e.target === saveToDatabaseModal) saveToDatabaseModal.classList.add('hidden');
        });
        
        window.openSaveToDatabaseModal = () => {
            document.getElementById('databaseSongName').value = '';
            saveToDatabaseModal.classList.remove('hidden');
            document.getElementById('databaseSongName').focus();
        };
        
        window.closeSaveToDatabaseModal = () => {
            saveToDatabaseModal.classList.add('hidden');
        };
        
        window.confirmSaveToDatabase = () => {
            const songName = document.getElementById('databaseSongName').value.trim();
            if (!songName) {
                this.showNotification('Please enter a song name', 'error');
                return;
            }
            
            // Update the databaseManager's current song name before saving
            if (this.songApp && this.songApp.dbManager) {
                this.songApp.dbManager.currentSongName = songName;
            }
            
            this.closeSaveToDatabaseModal();
            
            // Trigger the actual save
            if (this.songApp && this.songApp.dbManager) {
                this.songApp.dbManager.saveSongToDatabase(songName);
            } else {
                this.showNotification('No song app available!', 'error');
            }
        };
    }

    setupDatabaseFunctions() {
        // Override saveSongToDatabase to use modal
        window.saveSongToDatabase = () => {
            if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
            window.openSaveToDatabaseModal();
        };

        window.loadSongsFromDatabase = () => {
            if (!this.songApp) { this.showNotification('No song app!', 'error'); return; }
            const songs = this.songApp.dbManager.loadSongsFromDatabase();
            const songNames = Object.keys(songs);
            if (songNames.length === 0) {
                this.showNotification('No songs found in database!', 'error');
                return;
            }
            this.showSongPicker(songs, (name) => {
                if (songs[name]) {
                    this.songApp.loadSongData(songs[name]);
                    this.showNotification('Loaded: ' + name, 'success');
                }
            });
        };

        window.updateDatabaseStatus = () => {
            const status = this.songApp?.dbManager?.getDatabaseStatus();
            if (status && document.getElementById('databaseStatus')) {
                const statusEl = document.getElementById('databaseStatus');
                statusEl.innerHTML = `Local songs: ${status.localSongs} | GitHub: ${status.githubConnected ? 'Connected' : 'Not connected'}`;
            }
        };
    }

    setupFileSystemFunctions() {
        window.exportSongToFile = () => {
            if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
            this.songApp.fileManager.exportSongToFile();
        };

        window.importSongFromFile = () => {
            if (!this.songApp) { this.showNotification('No song app!', 'error'); return; }
            this.songApp.fileManager.importSongFromFile();
        };
    }

    setupCollectionFunctions() {
        // Collection functions are now class methods
        // Expose methods globally for onclick handlers
        window.renderCollectionsList = () => this.renderCollectionsList();
        window.openCollectionDetail = (id) => this.openCollectionDetail(id);
        window.showCreateCollectionModal = () => this.showCreateCollectionModal();
        window.editCollection = (id) => this.editCollection(id);
        window.closeCollectionFormModal = () => {
            document.getElementById('collectionFormModal').classList.add('hidden');
            this.editingCollectionId = null;
        };
        window.submitCollectionForm = () => this.submitCollectionForm();
        window.deleteCollection = (id, name) => this.deleteCollection(id, name);
        window.showAddSongModal = (id) => this.showAddSongModal(id);
        window.handleAddToCollectionCancel = () => {
            document.getElementById('addToCollectionModal').classList.add('hidden');
        };
        window.submitAddToCollection = () => this.submitAddToCollection();
        window.handleCreateNewCollectionFromAdd = () => this.handleCreateNewCollectionFromAdd();
        window.loadCollectionSong = (cid, sid) => this.loadCollectionSong(cid, sid);
        window.deleteCollectionSong = (cid, sid, name) => this.deleteCollectionSong(cid, sid, name);
        window.exportCollection = (id) => this.exportCollection(id);
        window.saveSongToCollectionUI = () => this.showAddSongModal(null);
    }

    // Song Picker Modal
    showSongPicker(songs, callback) {
        const songNames = Object.keys(songs);
        const container = document.getElementById('songPickerList');
        
        container.innerHTML = songNames.map(name => `
            <div class="song-item" onclick="songApp.handleSongPick('${this.escapeHtml(name)}')">
                <div class="song-info">
                    <i class="fas fa-music"></i>
                    <span>${this.escapeHtml(name)}</span>
                </div>
                <button class="icon-btn"><i class="fas fa-play"></i></button>
            </div>
        `).join('');
        
        this.songPickerCallback = callback;
        document.getElementById('songPickerModal').classList.remove('hidden');
    }

    handleSongPick(name) {
        if (this.songPickerCallback) {
            this.songPickerCallback(name);
        }
        document.getElementById('songPickerModal').classList.add('hidden');
    }

    // Confirm Modal
    showConfirm(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        this.confirmCallback = callback;
        document.getElementById('confirmModal').classList.remove('hidden');
    }

    // Export functions
    exportSong(format) {
        if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
        const data = this.songApp.getSongData();
        
        if (format === 'json') {
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'song-designer-export.json';
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('Song exported as JSON!', 'success');
        } else if (format === 'midi') {
            // Use MidiManager for proper MIDI export
            this.songApp.midiManager.exportToMidi(data, false);
        } else {
            // For audio formats (mp3, wav, ogg), we need to record the audio
            this.recordAudio(format);
        }
    }
    
    // MIDI Export (dedicated button handler)
    exportToMidi() {
        if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
        this.songApp.midiManager.exportToMidi(null, false);
    }
    
    // MIDI Import (dedicated button handler)
    importFromMidi() {
        if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
        this.songApp.midiManager.importFromMidi();
    }
    
    async recordAudio(format) {
        this.showNotification('Recording audio...', 'info');
        
        try {
            // Create a media recorder from the audio context destination
            const audioContext = Tone.context;
            const destination = audioContext.createMediaStreamDestination();
            
            // Ensure effects chain is properly connected for recording
            // Connect from the end of effects chain (after reverb) to the media stream
            if (this.songApp.compressor) {
                // Store original connection to restore later
                const originalConnections = this.songApp.compressor._internalNodes ? 
                    [] : [this.songApp.compressor._outputs];
                
                // Disconnect from destination and connect to media stream
                this.songApp.compressor.disconnect();
                this.songApp.compressor.connect(destination);
                this.songApp.compressor.connect(Tone.Destination); // Also keep playing to speakers
            } else {
                Tone.Destination.connect(destination);
            }
            
            const mimeType = this.getSupportedMimeType(format);
            if (!mimeType) {
                this.showNotification('Audio recording not supported in this browser', 'error');
                return;
            }
            
            const mediaRecorder = new MediaRecorder(destination.stream, {
                mimeType: mimeType
            });
            
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `song-designer-export.${format}`;
                a.click();
                URL.revokeObjectURL(url);
                
                // Reconnect to original destination only (not media stream)
                if (this.songApp.compressor) {
                    this.songApp.compressor.disconnect();
                    this.songApp.compressor.connect(Tone.Destination);
                }
                
                this.showNotification(`Song exported as ${format.toUpperCase()}!`, 'success');
            };
            
            // Request data every 100ms during recording
            mediaRecorder.start(100);
            
            // Play the song to record it
            if (!this.songApp.isPlaying) {
                await Tone.start();
                this.songApp.play();
            }
            
            // Calculate recording duration based on pattern length and section repeats
            let totalLoops = 1;
            if (this.songApp.groupLoopCounts) {
                totalLoops = this.songApp.groupLoopCounts.reduce((a, b) => a + b, 1);
            }
            const groupCount = this.songApp.patternLength / 16;
            const stepDuration = (60 / this.songApp.tempo) * 0.25; // 16th note duration in seconds
            const duration = (this.songApp.patternLength * stepDuration * totalLoops) + 1; // Add 1 second buffer
            
            setTimeout(() => {
                mediaRecorder.stop();
                if (this.songApp.isPlaying) {
                    this.songApp.stop();
                }
            }, duration * 1000);
            
        } catch (e) {
            this.showNotification('Audio recording not supported: ' + e.message, 'error');
            console.error('Recording error:', e);
        }
    }
    
    // Get supported MIME type for recording
    getSupportedMimeType(format) {
        const types = {
            'mp4': ['audio/mp4', 'audio/mpeg4', 'audio/aac'],
            'wav': ['audio/wav', 'audio/wave', 'audio/x-wav'],
            'ogg': ['audio/ogg', 'audio/vorbis']
        };
        
        const supported = types[format] || types['mp4'];
        for (const type of supported) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        // Fallback
        if (MediaRecorder.isTypeSupported('audio/webm')) {
            return 'audio/webm';
        }
        return null;
    }
    
    saveSong() {
        if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
        
        // Quick save with auto-numbering (no filename required)
        const songName = this.songApp.midiManager.generateNextSongName();
        const songData = this.songApp.getSongData();
        
        // Save to IndexedDB
        IndexedDBManager.saveSong(songName, songData).then(() => {
            this.showNotification(`${songName} saved! (Quick save)`, 'success');
        }).catch(err => {
            // Fallback to localStorage
            localStorage.setItem('pixelSongQuick_' + songName, JSON.stringify(songData));
            this.showNotification(`${songName} saved to browser!`, 'success');
        });
    }

    handleExport() {
        if (!this.songApp) { this.showNotification('Create a song first!', 'error'); return; }
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        this.exportSong(format);
    }

    loadSong() {
        const saved = localStorage.getItem('songDesignerSave');
        if (!saved) { this.showNotification('No saved song found!', 'error'); return; }
        try {
            const data = JSON.parse(saved);
            if (!this.songApp) this.songApp = new SongDesignerApp();
            this.songApp.loadSongData(data);
            this.showNotification('Song loaded!', 'success');
        } catch (e) {
            this.showNotification('Error loading song: ' + e.message, 'error');
        }
    }

    // Helper functions
    showNotification(message, type = 'info') {
        if (this.songApp && this.songApp.showNotification) {
            this.songApp.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    showAddSongModal(collectionId) {
        document.getElementById('newSongName').value = '';
        
        const select = document.getElementById('collectionSelect');
        select.innerHTML = '';
        
        const collections = this.songApp.collectionManager.getAllCollections();
        if (collections.length === 0) {
            this.showNotification('No collections exist. Create a collection first!', 'error');
            return;
        }
        
        collections.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            if (c.id === collectionId) option.selected = true;
            select.appendChild(option);
        });
        
        this.addToCollectionId = collectionId;
        document.getElementById('addToCollectionModal').classList.remove('hidden');
    }
    
    handleCreateNewCollectionFromAdd() {
        const songName = document.getElementById('newSongName').value.trim();
        if (!songName) {
            this.showNotification('Please enter a song name first', 'error');
            document.getElementById('newSongName').focus();
            return;
        }
        
        document.getElementById('addToCollectionModal').classList.add('hidden');
        this.showCreateCollectionModal();
        
        this.pendingSongName = songName;
        
        setTimeout(() => {
            document.getElementById('collectionName').focus();
        }, 100);
    }
    
    showCreateCollectionModal() {
        this.editingCollectionId = null;
        document.getElementById('collectionFormTitle').innerHTML = '<i class="fas fa-plus"></i> Create Collection';
        document.getElementById('collectionName').value = '';
        document.getElementById('collectionDescription').value = '';
        document.getElementById('collectionFormSubmit').innerHTML = 'Create';
        document.getElementById('collectionFormModal').classList.remove('hidden');
    }
    
    submitAddToCollection() {
        const songName = document.getElementById('newSongName').value.trim();
        if (!songName) {
            this.showNotification('Please enter a song name', 'error');
            return;
        }
        
        const collectionId = parseInt(document.getElementById('collectionSelect').value);
        if (isNaN(collectionId)) {
            this.showNotification('Please select a collection', 'error');
            return;
        }
        
        const songData = this.songApp.getSongData();
        
        if (this.songApp.collectionManager.addSongToCollection(collectionId, songData, songName)) {
            document.getElementById('addToCollectionModal').classList.add('hidden');
            this.openCollectionDetail(collectionId);
            this.showNotification('Song added to collection!', 'success');
        } else {
            this.showNotification('Failed to add song', 'error');
        }
    }
    
    openCollectionDetail(collectionId) {
        this.currentCollectionId = collectionId;
        const collections = this.songApp.collectionManager.getAllCollections();
        const collection = collections.find(c => c.id === collectionId);
        
        if (!collection) return;
        
        document.getElementById('collectionDetailTitle').innerHTML = `<i class="fas fa-folder"></i> ${this.escapeHtml(collection.name)}`;
        
        const content = document.getElementById('collectionDetailContent');
        content.innerHTML = `
            <div class="settings-section">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">${collection.description || 'No description'}</p>
                
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <button class="btn" onclick="songApp.showAddSongModal(${collectionId})" style="flex: 1;">
                        <i class="fas fa-plus"></i> Add Song
                    </button>
                    <button class="btn btn-secondary" onclick="songApp.editCollection(${collectionId})" style="flex: 1;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
            
            <div class="settings-section">
                <h3 style="margin-bottom: 1rem;"><i class="fas fa-music"></i> Songs (${collection.songs.length})</h3>
                ${collection.songs.length === 0 ? '<p style="color: var(--text-secondary);">No songs in this collection yet.</p>' : ''}
                <div class="songs-list">
                    ${collection.songs.map(song => `
                        <div class="song-item">
                            <div class="song-info" onclick="songApp.loadCollectionSong(${collectionId}, ${song.id})">
                                <i class="fas fa-music"></i>
                                <span>${this.escapeHtml(song.name)}</span>
                            </div>
                            <div class="song-actions">
                                <button class="icon-btn" onclick="songApp.loadCollectionSong(${collectionId}, ${song.id})" title="Load"><i class="fas fa-play"></i></button>
                                <button class="icon-btn delete" onclick="songApp.deleteCollectionSong(${collectionId}, ${song.id}, '${this.escapeHtml(song.name)}')" title="Delete"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin-top: 1rem;">
                <button class="btn btn-secondary" onclick="songApp.exportCollection(${collectionId})" style="width: 100%;">
                    <i class="fas fa-download"></i> Export Collection
                </button>
            </div>
        `;
        
        document.getElementById('collectionDetailModal').classList.remove('hidden');
    }
    
    editCollection(collectionId) {
        const collections = this.songApp.collectionManager.getAllCollections();
        const collection = collections.find(c => c.id === collectionId);
        
        if (!collection) return;
        
        this.editingCollectionId = collectionId;
        document.getElementById('collectionFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Collection';
        document.getElementById('collectionName').value = collection.name;
        document.getElementById('collectionDescription').value = collection.description || '';
        document.getElementById('collectionFormSubmit').innerHTML = 'Save';
        document.getElementById('collectionFormModal').classList.remove('hidden');
    }
    
    deleteCollection(collectionId, collectionName) {
        this.showConfirm(`Delete collection "${collectionName}" and all its songs?`, () => {
            if (this.songApp.collectionManager.deleteCollection(collectionId)) {
                this.renderCollectionsList();
                if (this.currentCollectionId === collectionId) {
                    document.getElementById('collectionDetailModal').classList.add('hidden');
                }
                this.showNotification('Collection deleted!', 'success');
            }
        });
    }
    
    loadCollectionSong(collectionId, songId) {
        const collections = this.songApp.collectionManager.getAllCollections();
        const collection = collections.find(c => c.id === collectionId);
        
        if (!collection) return;
        
        const song = collection.songs.find(s => s.id === songId);
        if (song) {
            this.songApp.loadSongData(song.data);
            document.getElementById('collectionDetailModal').classList.add('hidden');
            this.showNotification('Loaded: ' + song.name, 'success');
        }
    }
    
    deleteCollectionSong(collectionId, songId, songName) {
        this.showConfirm(`Delete "${songName}" from collection?`, () => {
            if (this.songApp.collectionManager.deleteSongFromCollection(collectionId, songId)) {
                this.openCollectionDetail(collectionId);
                this.showNotification('Song deleted!', 'success');
            }
        });
    }
    
    exportCollection(collectionId) {
        this.songApp.collectionManager.exportCollectionById(collectionId);
    }
    
    submitCollectionForm() {
        const name = document.getElementById('collectionName').value.trim();
        const description = document.getElementById('collectionDescription').value.trim();
        
        if (!name) {
            this.showNotification('Please enter a collection name', 'error');
            return;
        }
        
        let result;
        if (this.editingCollectionId) {
            result = this.songApp.collectionManager.updateCollection(this.editingCollectionId, name, description);
        } else {
            result = this.songApp.collectionManager.createCollection(name, description);
        }
        
        if (result) {
            // Check if we have a pending song to add
            if (this.pendingSongName && !this.editingCollectionId) {
                const newCollectionId = result;
                const songData = this.songApp.getSongData();
                this.songApp.collectionManager.addSongToCollection(newCollectionId, songData, this.pendingSongName);
                this.pendingSongName = null;
                
                document.getElementById('collectionFormModal').classList.add('hidden');
                this.renderCollectionsList();
                this.openCollectionDetail(newCollectionId);
                this.showNotification('Collection created and song added!', 'success');
            } else {
                document.getElementById('collectionFormModal').classList.add('hidden');
                this.renderCollectionsList();
                if (!this.editingCollectionId) {
                    this.showNotification('Collection created!', 'success');
                } else {
                    this.showNotification('Collection updated!', 'success');
                }
            }
            this.editingCollectionId = null;
        } else {
            this.showNotification('Failed to save collection', 'error');
        }
    }
    
    renderCollectionsList() {
        const container = document.getElementById('collectionsList');
        if (!this.songApp || !this.songApp.collectionManager) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No collections yet</p>';
            return;
        }
        
        const collections = this.songApp.collectionManager.getAllCollections();
        
        if (collections.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No collections yet. Create your first collection!</p>';
            return;
        }
        
        container.innerHTML = collections.map(collection => `
            <div class="collection-item" data-id="${collection.id}">
                <div class="collection-info" onclick="songApp.openCollectionDetail(${collection.id})">
                    <div class="collection-icon"><i class="fas fa-folder"></i></div>
                    <div class="collection-details">
                        <div class="collection-name">${this.escapeHtml(collection.name)}</div>
                        <div class="collection-meta">${collection.songs.length} song${collection.songs.length !== 1 ? 's' : ''}${collection.description ? ' • ' + this.escapeHtml(collection.description) : ''}</div>
                    </div>
                </div>
                <div class="collection-actions">
                    <button class="icon-btn" onclick="songApp.openCollectionDetail(${collection.id})" title="View"><i class="fas fa-eye"></i></button>
                    <button class="icon-btn" onclick="songApp.editCollection(${collection.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn delete" onclick="songApp.deleteCollection(${collection.id}, '${this.escapeHtml(collection.name)}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
    
    // Google Drive UI Initialization
    initGoogleDriveUI() {
        // Wait for gapi to load, then initialize
        const checkGapi = () => {
            if (typeof gapi !== 'undefined') {
                // Initialize Google Drive UI
                if (typeof GoogleDriveUI !== 'undefined') {
                    window.googleDriveUI = new GoogleDriveUI(this.songApp);
                    console.log('Google Drive UI initialized');
                } else {
                    // Retry after a delay if GoogleDriveUI not loaded yet
                    setTimeout(() => {
                        if (typeof GoogleDriveUI !== 'undefined') {
                            window.googleDriveUI = new GoogleDriveUI(this.songApp);
                            console.log('Google Drive UI initialized');
                        }
                    }, 500);
                }
            } else {
                // gapi not loaded yet, retry
                setTimeout(checkGapi, 500);
            }
        };
        
        // Start checking after a short delay
        setTimeout(checkGapi, 1000);
    }
}

// Initialize the app
const songApp = new SongApp();
songApp.init();
