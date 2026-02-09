/**
 * IndexedDB Manager for Song Designer
 * Handles large local song libraries with better performance than localStorage
 * Features:
 * - Store unlimited songs (no 5MB localStorage limit)
 * - Fast queries and indexing
 * - Offline-first approach with cloud sync
 */

class IndexedDBManager {
    static DB_NAME = 'SongDesignerDB';
    static DB_VERSION = 1;
    static STORE_NAME = 'songs';
    static COLLECTION_STORE = 'collections';
    static db = null;

    /**
     * Initialize IndexedDB
     */
    static async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create songs object store
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const songStore = db.createObjectStore(this.STORE_NAME, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Create indexes for fast searching
                    songStore.createIndex('name', 'name', { unique: false });
                    songStore.createIndex('timestamp', 'timestamp', { unique: false });
                    songStore.createIndex('genre', 'data.genre', { unique: false });
                    songStore.createIndex('tempo', 'data.tempo', { unique: false });
                }

                // Create collections object store
                if (!db.objectStoreNames.contains(this.COLLECTION_STORE)) {
                    const collectionStore = db.createObjectStore(this.COLLECTION_STORE, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    collectionStore.createIndex('name', 'name', { unique: false });
                    collectionStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('IndexedDB object stores created');
            };
        });
    }

    /**
     * Ensure DB is initialized
     */
    static async ensureDB() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    }

    /**
     * Save song to IndexedDB
     */
    static async saveSong(songName, songData) {
        try {
            await this.ensureDB();

            const song = {
                name: songName,
                data: songData,
                timestamp: Date.now(),
                version: '1.0'
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.add(song);

                request.onsuccess = () => {
                    console.log('Song saved to IndexedDB:', songName, 'ID:', request.result);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('Error saving song:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error in saveSong:', error);
            throw error;
        }
    }

    /**
     * Update existing song
     */
    static async updateSong(songId, songData) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const getRequest = store.get(songId);

                getRequest.onsuccess = () => {
                    const song = getRequest.result;
                    if (song) {
                        song.data = songData;
                        song.timestamp = Date.now();

                        const updateRequest = store.put(song);
                        updateRequest.onsuccess = () => {
                            console.log('Song updated in IndexedDB:', songId);
                            resolve(true);
                        };
                        updateRequest.onerror = () => reject(updateRequest.error);
                    } else {
                        reject(new Error('Song not found'));
                    }
                };

                getRequest.onerror = () => reject(getRequest.error);
            });
        } catch (error) {
            console.error('Error updating song:', error);
            throw error;
        }
    }

    /**
     * Get song by ID
     */
    static async getSong(songId) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.get(songId);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting song:', error);
            throw error;
        }
    }

    /**
     * Get all songs
     */
    static async getAllSongs() {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting all songs:', error);
            throw error;
        }
    }

    /**
     * Search songs by name
     */
    static async searchSongsByName(searchTerm) {
        try {
            await this.ensureDB();

            const allSongs = await this.getAllSongs();
            const lowerSearch = searchTerm.toLowerCase();
            
            return allSongs.filter(song => 
                song.name.toLowerCase().includes(lowerSearch)
            );
        } catch (error) {
            console.error('Error searching songs:', error);
            throw error;
        }
    }

    /**
     * Get songs by genre
     */
    static async getSongsByGenre(genre) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const index = store.index('genre');
                const request = index.getAll(genre);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting songs by genre:', error);
            throw error;
        }
    }

    /**
     * Get recent songs (last N songs)
     */
    static async getRecentSongs(limit = 10) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const index = store.index('timestamp');
                const request = index.openCursor(null, 'prev');
                
                const results = [];
                let count = 0;

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && count < limit) {
                        results.push(cursor.value);
                        count++;
                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting recent songs:', error);
            throw error;
        }
    }

    /**
     * Delete song
     */
    static async deleteSong(songId) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.delete(songId);

                request.onsuccess = () => {
                    console.log('Song deleted from IndexedDB:', songId);
                    resolve(true);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error deleting song:', error);
            throw error;
        }
    }

    /**
     * Clear all songs
     */
    static async clearAllSongs() {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('All songs cleared from IndexedDB');
                    resolve(true);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error clearing songs:', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    static async getStats() {
        try {
            await this.ensureDB();

            const allSongs = await this.getAllSongs();
            
            // Calculate total size (approximate)
            const totalSize = allSongs.reduce((sum, song) => {
                return sum + JSON.stringify(song).length;
            }, 0);

            return {
                totalSongs: allSongs.length,
                totalSize: totalSize,
                totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
                oldestSong: allSongs.length > 0 ? 
                    allSongs.reduce((oldest, song) => 
                        song.timestamp < oldest.timestamp ? song : oldest
                    ) : null,
                newestSong: allSongs.length > 0 ? 
                    allSongs.reduce((newest, song) => 
                        song.timestamp > newest.timestamp ? song : newest
                    ) : null
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalSongs: 0,
                totalSize: 0,
                totalSizeMB: '0.00'
            };
        }
    }

    /**
     * Export all songs to JSON
     */
    static async exportAllToJSON() {
        try {
            const allSongs = await this.getAllSongs();
            return JSON.stringify(allSongs, null, 2);
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            throw error;
        }
    }

    /**
     * Import songs from JSON
     */
    static async importFromJSON(jsonData) {
        try {
            const songs = JSON.parse(jsonData);
            
            if (!Array.isArray(songs)) {
                throw new Error('Invalid JSON format - expected array of songs');
            }

            let imported = 0;
            for (const song of songs) {
                if (song.name && song.data) {
                    await this.saveSong(song.name, song.data);
                    imported++;
                }
            }

            return imported;
        } catch (error) {
            console.error('Error importing from JSON:', error);
            throw error;
        }
    }

    // ===== COLLECTION METHODS =====

    /**
     * Save collection
     */
    static async saveCollection(collectionName, collectionData) {
        try {
            await this.ensureDB();

            const collection = {
                name: collectionName,
                data: collectionData,
                timestamp: Date.now()
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.COLLECTION_STORE], 'readwrite');
                const store = transaction.objectStore(this.COLLECTION_STORE);
                const request = store.add(collection);

                request.onsuccess = () => {
                    console.log('Collection saved to IndexedDB:', collectionName);
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error saving collection:', error);
            throw error;
        }
    }

    /**
     * Get all collections
     */
    static async getAllCollections() {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.COLLECTION_STORE], 'readonly');
                const store = transaction.objectStore(this.COLLECTION_STORE);
                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting collections:', error);
            throw error;
        }
    }

    /**
     * Delete collection
     */
    static async deleteCollection(collectionId) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.COLLECTION_STORE], 'readwrite');
                const store = transaction.objectStore(this.COLLECTION_STORE);
                const request = store.delete(collectionId);

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error deleting collection:', error);
            throw error;
        }
    }
}

// Initialize IndexedDB on load
if (typeof window !== 'undefined') {
    window.IndexedDBManager = IndexedDBManager;
    
    // Auto-initialize
    IndexedDBManager.init().catch(error => {
        console.error('Failed to initialize IndexedDB:', error);
    });
}
