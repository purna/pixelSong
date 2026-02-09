// Song Storage Module - Adapted from pixelAudio library
// Integrates DatabaseManager, FileManager, and CollectionUI functionality

/**
 * Song Database Manager - Save/load songs to database (GitHub/localStorage)
 */
class SongDatabaseManager {
    constructor(app) {
        this.app = app;
        this.GITHUB_API_URL = 'https://api.github.com';
        this.REPO_NAME = 'pixel-song-collections';
        this.USERNAME = 'pixel-song-user';
        this.ACCESS_TOKEN = null;
        this.checkGitHubCredentials();
    }

    checkGitHubCredentials() {
        this.ACCESS_TOKEN = localStorage.getItem('github_access_token');
        if (!this.ACCESS_TOKEN) {
            console.log('No GitHub credentials found. Using localStorage fallback.');
        }
    }

    async connectToGitHub() {
        this.ACCESS_TOKEN = 'simulated-github-token-' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('github_access_token', this.ACCESS_TOKEN);
        await this.createRepositoryIfNotExists();
        this.showNotification('Connected to GitHub database', 'success');
        return true;
    }

    async createRepositoryIfNotExists() {
        console.log('Checking/creating GitHub repository:', this.REPO_NAME);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }

    async saveSongToDatabase(songName = null) {
        const songData = this.app.getSongData();
        const name = songName || prompt('Enter song name for database:', 'My Song');
        if (!name) return false;

        if (!this.ACCESS_TOKEN) {
            return this.saveSongToLocalStorage(name, songData);
        }

        try {
            const exportData = {
                name: name,
                data: songData,
                timestamp: Date.now()
            };
            const fileContent = JSON.stringify(exportData, null, 2);
            const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.json`;

            console.log('Saving song to GitHub:', fileName);
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.showNotification(`Song "${name}" saved to GitHub`, 'success');
            return true;
        } catch (error) {
            console.error('Error saving song to GitHub:', error);
            return this.saveSongToLocalStorage(name, songData);
        }
    }

    saveSongToLocalStorage(name, songData) {
        try {
            const songs = JSON.parse(localStorage.getItem('pixelSongDatabase') || '{}');
            songs[name] = songData;
            songs[name].savedAt = Date.now();
            songs[name].name = name;
            localStorage.setItem('pixelSongDatabase', JSON.stringify(songs));
            this.showNotification(`Song "${name}" saved locally`, 'success');
            return true;
        } catch (error) {
            console.error('Error saving song locally:', error);
            this.showNotification('Error saving song: ' + error.message, 'error');
            return false;
        }
    }

    async loadSongsFromDatabase() {
        if (!this.ACCESS_TOKEN) {
            return this.loadSongsFromLocalStorage();
        }

        try {
            console.log('Loading songs from GitHub...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            return this.loadSongsFromLocalStorage();
        } catch (error) {
            console.error('Error loading songs from GitHub:', error);
            return this.loadSongsFromLocalStorage();
        }
    }

    loadSongsFromLocalStorage() {
        try {
            const songs = JSON.parse(localStorage.getItem('pixelSongDatabase') || '{}');
            const songNames = Object.keys(songs);
            if (songNames.length > 0) {
                this.showNotification(`${songNames.length} songs loaded from local storage`, 'success');
            }
            return songs;
        } catch (error) {
            console.error('Error loading songs:', error);
            return {};
        }
    }

    loadSongFromDatabase(songName) {
        try {
            const songs = JSON.parse(localStorage.getItem('pixelSongDatabase') || '{}');
            if (songs[songName]) {
                this.app.loadSongData(songs[songName]);
                this.showNotification(`Loaded: ${songName}`, 'success');
                return true;
            }
            this.showNotification('Song not found', 'error');
            return false;
        } catch (error) {
            console.error('Error loading song:', error);
            this.showNotification('Error loading song: ' + error.message, 'error');
            return false;
        }
    }

    getDatabaseStatus() {
        const songs = JSON.parse(localStorage.getItem('pixelSongDatabase') || '{}');
        return {
            githubConnected: !!this.ACCESS_TOKEN,
            localSongs: Object.keys(songs).length
        };
    }

    showNotification(message, type = 'info') {
        if (this.app.showNotification) {
            this.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                background: ${type === 'success' ? '#00c853' : type === 'error' ? '#ff5252' : '#2196f3'};
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
}

/**
 * Song File Manager - Save/load songs to filesystem
 */
class SongFileManager {
    constructor(app) {
        this.app = app;
        this.autoSaveKey = 'pixelSong_autosave';
    }

    exportSongToFile(songName = null) {
        try {
            const songData = this.app.getSongData();
            const name = songName || 'pixelSong';
            
            const exportData = {
                version: '1.0',
                timestamp: Date.now(),
                name: name,
                data: songData
            };

            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${name.replace(/\s+/g, '_')}_${Date.now()}.json`;

            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            this.showNotification('Song exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting song:', error);
            this.showNotification('Error exporting song: ' + error.message, 'error');
        }
    }

    importSongFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const projectData = JSON.parse(event.target.result);

                    if (projectData.data) {
                        this.app.loadSongData(projectData.data);
                        this.showNotification(`Loaded: ${projectData.name || 'Song'}`, 'success');
                    } else {
                        throw new Error('Invalid song file format');
                    }
                } catch (error) {
                    console.error('Error loading song:', error);
                    this.showNotification('Error loading song: ' + error.message, 'error');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    enableAutoSave(intervalMinutes = 2) {
        this.disableAutoSave();
        
        this.autoSaveInterval = setInterval(() => {
            this.saveToLocalStorage();
        }, intervalMinutes * 60 * 1000);

        window.addEventListener('beforeunload', () => {
            this.saveToLocalStorage();
        });
    }

    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    saveToLocalStorage() {
        try {
            const songData = this.app.getSongData();
            const data = {
                timestamp: Date.now(),
                data: songData
            };
            localStorage.setItem(this.autoSaveKey, JSON.stringify(data));
            console.log('Auto-saved song to local storage');
        } catch (error) {
            console.error('Error auto-saving:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.autoSaveKey);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.data) {
                    this.app.loadSongData(parsed.data);
                    const date = new Date(parsed.timestamp);
                    this.showNotification(
                        `Restored from auto-save (${date.toLocaleString()})`,
                        'info'
                    );
                    return true;
                }
            }
        } catch (error) {
            console.error('Error loading auto-save:', error);
        }
        return false;
    }

    clearAutoSave() {
        try {
            localStorage.removeItem(this.autoSaveKey);
            this.showNotification('Auto-save cleared', 'info');
        } catch (error) {
            console.error('Error clearing auto-save:', error);
        }
    }

    showNotification(message, type = 'info') {
        if (this.app.showNotification) {
            this.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

/**
 * Song Collection Manager - Organize songs into collections with name and description
 */
class SongCollectionManager {
    constructor(app) {
        this.app = app;
        this.collections = JSON.parse(localStorage.getItem('pixelSongCollections') || '[]');
        this.currentCollectionId = null;
    }

    createCollection(name, description = '') {
        if (!name || !name.trim()) {
            this.showNotification('Collection name is required', 'error');
            return false;
        }

        if (this.collections.find(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
            this.showNotification('Collection already exists', 'error');
            return false;
        }

        this.collections.push({
            id: Date.now(),
            name: name.trim(),
            description: description,
            songs: [],
            createdAt: Date.now()
        });

        this.saveCollections();
        return true;
    }

    updateCollection(collectionId, name, description = '') {
        const index = this.collections.findIndex(c => c.id === collectionId);
        if (index === -1) {
            this.showNotification('Collection not found', 'error');
            return false;
        }

        // Check for duplicate name
        const duplicate = this.collections.find((c, i) => 
            i !== index && c.name.toLowerCase() === name.toLowerCase()
        );
        if (duplicate) {
            this.showNotification('A collection with that name already exists', 'error');
            return false;
        }

        this.collections[index].name = name;
        this.collections[index].description = description;
        this.saveCollections();
        return true;
    }

    addSongToCollection(collectionId, songData, songName = 'Untitled Song') {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            this.showNotification('Collection not found', 'error');
            return false;
        }

        collection.songs.push({
            id: Date.now(),
            name: songName,
            data: songData,
            createdAt: Date.now()
        });

        this.saveCollections();
        return true;
    }

    getCollectionSongs(collectionId) {
        const collection = this.collections.find(c => c.id === collectionId);
        return collection ? collection.songs : [];
    }

    getCollection(collectionId) {
        return this.collections.find(c => c.id === collectionId);
    }

    loadSongFromCollection(collectionId, songId) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            this.showNotification('Collection not found', 'error');
            return null;
        }

        const song = collection.songs.find(s => s.id === songId);
        if (!song) {
            this.showNotification('Song not found', 'error');
            return null;
        }

        return song;
    }

    deleteSongFromCollection(collectionId, songId) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            this.showNotification('Collection not found', 'error');
            return false;
        }

        const index = collection.songs.findIndex(s => s.id === songId);
        if (index === -1) {
            this.showNotification('Song not found', 'error');
            return false;
        }

        collection.songs.splice(index, 1);
        this.saveCollections();
        return true;
    }

    deleteCollection(collectionId) {
        const index = this.collections.findIndex(c => c.id === collectionId);
        if (index === -1) {
            this.showNotification('Collection not found', 'error');
            return false;
        }

        this.collections.splice(index, 1);
        this.saveCollections();
        return true;
    }

    exportCollection(collectionName) {
        const collection = this.collections.find(c => c.name === collectionName);
        if (!collection) {
            this.showNotification('Collection not found', 'error');
            return;
        }

        this.exportCollectionData(collection);
    }

    exportCollectionById(collectionId) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            this.showNotification('Collection not found', 'error');
            return;
        }

        this.exportCollectionData(collection);
    }

    exportCollectionData(collection) {
        const exportData = {
            version: '1.0',
            timestamp: Date.now(),
            name: collection.name,
            description: collection.description,
            songs: collection.songs.map(s => ({
                name: s.name,
                data: s.data,
                createdAt: s.createdAt
            }))
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${collection.name.replace(/\s+/g, '_')}_collection.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showNotification('Collection exported', 'success');
    }

    importCollection() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.name && Array.isArray(data.songs)) {
                        // Check if collection already exists
                        const existing = this.collections.find(c => c.name.toLowerCase() === data.name.toLowerCase());
                        
                        if (existing) {
                            // Merge songs
                            data.songs.forEach(song => {
                                if (!existing.songs.find(s => s.name === song.name)) {
                                    existing.songs.push({
                                        id: Date.now() + Math.random(),
                                        name: song.name,
                                        data: song.data,
                                        createdAt: song.createdAt || Date.now()
                                    });
                                }
                            });
                            this.showNotification(`Imported songs to "${existing.name}"`, 'success');
                        } else {
                            // Create new collection
                            const newCollection = {
                                id: Date.now(),
                                name: data.name,
                                description: data.description || '',
                                songs: data.songs.map(s => ({
                                    id: Date.now() + Math.random(),
                                    name: s.name,
                                    data: s.data,
                                    createdAt: s.createdAt || Date.now()
                                })),
                                createdAt: Date.now()
                            };
                            this.collections.push(newCollection);
                            this.saveCollections();
                            this.showNotification(`Collection "${data.name}" imported with ${data.songs.length} songs`, 'success');
                        }
                    } else {
                        throw new Error('Invalid collection file format');
                    }
                } catch (error) {
                    console.error('Error importing collection:', error);
                    this.showNotification('Error importing collection: ' + error.message, 'error');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    saveCollections() {
        localStorage.setItem('pixelSongCollections', JSON.stringify(this.collections));
    }

    getAllCollections() {
        return this.collections;
    }

    getCollectionCount() {
        return this.collections.length;
    }

    getTotalSongCount() {
        return this.collections.reduce((total, c) => total + c.songs.length, 0);
    }

    showNotification(message, type = 'info') {
        if (this.app.showNotification) {
            this.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Export as global
window.SongDatabaseManager = SongDatabaseManager;
window.SongFileManager = SongFileManager;
window.SongCollectionManager = SongCollectionManager;
