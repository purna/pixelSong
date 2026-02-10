/**
 * Song Presets - Top 100 Songs Database
 * Loads presets from JSON files in docs/ directory
 * Each preset includes genre, tempo, harmony, melody, and rhythm patterns
 * Based on characteristics of famous songs across different genres
 */

// Cache for loaded genre data
let genreCache = {};
let isLoading = false;

// Genre files mapping - uses 64-step JSON files
const GENRE_FILES = {
    'rock': 'docs/rock_64step.json',
    'pop': 'docs/pop_64step.json',
    'electronic': 'docs/electronic_64step.json',
    'hip-hop': 'docs/hip-hop_64step.json',
    'jazz': 'docs/jazz_64step.json',
    'classical': 'docs/classical_64step.json',
    'country': 'docs/country_64step.json',
    'reggae': 'docs/reggae_64step.json',
    'metal': 'docs/metal_64step.json',
    'indie': 'docs/indie_64step.json',
    'disco': 'docs/disco_64step.json',
    'blues': 'docs/blues_64step.json',
    'funk': 'docs/funk_64step.json'
};

// Load a single genre file
async function loadGenreFile(genre) {
    const filePath = GENRE_FILES[genre];
    if (!filePath) {
        console.warn(`No JSON file found for genre: ${genre}`);
        return null;
    }
    
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
        return null;
    }
}

// Load all genre files
async function loadAllGenreData() {
    if (isLoading) return genreCache;
    isLoading = true;
    
    const genres = Object.keys(GENRE_FILES);
    
    await Promise.all(
        genres.map(async (genre) => {
            const data = await loadGenreFile(genre);
            if (data) {
                genreCache[genre] = data;
            }
        })
    );
    
    isLoading = false;
    return genreCache;
}

// Build SONG_PRESETS from genre data
function buildSongPresetsFromGenreData(genreData) {
    const presets = {};
    
    Object.values(genreData).forEach(genre => {
        // Handle new format: song_variations (with arrays of 16/32/64 variations)
        if (genre.song_variations) {
            Object.entries(genre.song_variations).forEach(([variationName, variations]) => {
                variations.forEach(variation => {
                    presets[variation.key] = {
                        name: variation.name,
                        artist: variation.artist && variation.artist !== 'Unknown Artist' ? variation.artist : genre.genre,
                        year: variation.year,
                        genre: genre.genre,
                        subgenre: variation.subgenre,
                        tempo: variation.tempo,
                        key: variation.keyName,
                        timeSignature: variation.timeSignature,
                        patternLength: variation.patternLength || 16,
                        harmonics: variation.harmonics,
                        melody: variation.melody,
                        bass: variation.bass,
                        lead: variation.lead,
                        rhythm: variation.rhythm,
                        characteristics: variation.characteristics,
                        variationKey: variationName
                    };
                });
            });
        }
        // Handle legacy format: songs array
        else if (genre.songs) {
            genre.songs.forEach(song => {
                presets[song.key] = {
                    name: song.name,
                    artist: song.artist && song.artist !== 'Unknown Artist' ? song.artist : genre.genre,
                    year: song.year,
                    genre: genre.genre,
                    subgenre: song.subgenre,
                    tempo: song.tempo,
                    key: song.keyName,
                    timeSignature: song.timeSignature,
                    patternLength: song.patternLength || 16,
                    harmonics: song.harmonics,
                    melody: song.melody,
                    bass: song.bass,
                    lead: song.lead,
                    rhythm: song.rhythm,
                    characteristics: song.characteristics
                };
            });
        }
    });
    
    return presets;
}

// Get presets by genre (async)
async function getPresetsByGenre(genre) {
    if (!genreCache[genre]) {
        await loadGenreFile(genre);
    }
    
    if (!genreCache[genre]) {
        return [];
    }
    
    const presets = {};
    const genreData = genreCache[genre];
    
    // Handle new format: song_variations
    if (genreData.song_variations) {
        Object.entries(genreData.song_variations).forEach(([variationName, variations]) => {
            variations.forEach(variation => {
                presets[variation.key] = {
                    name: variation.name,
                    artist: variation.artist && variation.artist !== 'Unknown Artist' ? variation.artist : genre,
                    year: variation.year,
                    genre: genre,
                    subgenre: variation.subgenre,
                    tempo: variation.tempo,
                    key: variation.keyName,
                    timeSignature: variation.timeSignature,
                    patternLength: variation.patternLength || 16,
                    harmonics: variation.harmonics,
                    melody: variation.melody,
                    bass: variation.bass,
                    lead: variation.lead,
                    rhythm: variation.rhythm,
                    characteristics: variation.characteristics,
                    variationKey: variationName
                };
            });
        });
    }
    // Handle legacy format: songs array
    else {
        const songs = genreData.songs || [];
        songs.forEach(song => {
            presets[song.key] = {
                name: song.name,
                artist: song.artist && song.artist !== 'Unknown Artist' ? song.artist : genre,
                year: song.year,
                genre: genre,
                subgenre: song.subgenre,
                tempo: song.tempo,
                key: song.keyName,
                timeSignature: song.timeSignature,
                patternLength: song.patternLength || 16,
                harmonics: song.harmonics,
                melody: song.melody,
                bass: song.bass,
                lead: song.lead,
                rhythm: song.rhythm,
                characteristics: song.characteristics
            };
        });
    }
    
    return presets;
}

// Get random preset from genre (async)
async function getRandomPresetByGenre(genre) {
    const presets = await getPresetsByGenre(genre);
    const keys = Object.keys(presets);
    
    if (keys.length === 0) return null;
    
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return presets[randomKey];
}

// Get all genres from JSON files
function getAllGenreNames() {
    return Object.keys(GENRE_FILES);
}

// Genre metadata
const GENRE_METADATA = {
    'rock': {
        name: 'Rock',
        tempo: { min: 100, max: 160 },
        characteristics: ['guitar-driven', 'energetic', 'powerful'],
        color: '#e74c3c'
    },
    'pop': {
        name: 'Pop',
        tempo: { min: 100, max: 130 },
        characteristics: ['catchy', 'melodic', 'danceable'],
        color: '#9b59b6'
    },
    'electronic': {
        name: 'Electronic',
        tempo: { min: 110, max: 180 },
        characteristics: ['synth-driven', 'rhythmic', 'energetic'],
        color: '#3498db'
    },
    'hip-hop': {
        name: 'Hip-Hop',
        tempo: { min: 80, max: 120 },
        characteristics: ['beat-driven', 'rhythmic', 'bass-heavy'],
        color: '#2ecc71'
    },
    'jazz': {
        name: 'Jazz',
        tempo: { min: 100, max: 180 },
        characteristics: ['sophisticated', 'improvisational', 'complex'],
        color: '#f39c12'
    },
    'classical': {
        name: 'Classical',
        tempo: { min: 60, max: 150 },
        characteristics: ['orchestral', 'composed', 'timeless'],
        color: '#1abc9c'
    },
    'country': {
        name: 'Country',
        tempo: { min: 80, max: 160 },
        characteristics: ['storytelling', 'acoustic', 'warm'],
        color: '#d35400'
    },
    'reggae': {
        name: 'Reggae',
        tempo: { min: 60, max: 90 },
        characteristics: ['laid-back', 'rhythmic', 'peaceful'],
        color: '#27ae60'
    },
    'metal': {
        name: 'Metal',
        tempo: { min: 120, max: 220 },
        characteristics: ['heavy', 'intense', 'dark'],
        color: '#34495e'
    },
    'indie': {
        name: 'Indie',
        tempo: { min: 80, max: 150 },
        characteristics: ['alternative', 'melodic', 'varied'],
        color: '#16a085'
    },
    'disco': {
        name: 'Disco',
        tempo: { min: 100, max: 130 },
        characteristics: ['danceable', 'groovy', 'funky'],
        color: '#8e44ad'
    },
    'blues': {
        name: 'Blues',
        tempo: { min: 60, max: 120 },
        characteristics: ['emotional', 'raw', 'soulful'],
        color: '#2980b9'
    },
    'funk': {
        name: 'Funk',
        tempo: { min: 90, max: 120 },
        characteristics: ['groovy', 'danceable', 'bass-driven'],
        color: '#f39c12'
    }
};

// Get all genres
function getAllGenres() {
    return Object.keys(GENRE_METADATA);
}

// Load all presets synchronously (returns empty object until loaded)
const SONG_PRESETS = {};

// Initialize by loading all genre data
loadAllGenreData().then(genreData => {
    Object.assign(SONG_PRESETS, buildSongPresetsFromGenreData(genreData));
    console.log('Loaded song presets from JSON files:', Object.keys(SONG_PRESETS).length, 'songs');
});

// Export for use in other modules
window.SONG_PRESETS = SONG_PRESETS;
window.GENRE_METADATA = GENRE_METADATA;
window.getPresetsByGenre = getPresetsByGenre;
window.getRandomPresetByGenre = getRandomPresetByGenre;
window.getAllGenres = getAllGenres;
window.getAllGenreNames = getAllGenreNames;
window.loadAllGenreData = loadAllGenreData;
