/** Song catalogue: load the saved arrangement for the selected step length. */
const GENRE_FILES = Object.fromEntries(['rock', 'pop', 'electronic', 'hip-hop', 'jazz', 'classical', 'country', 'reggae', 'metal', 'indie', 'disco', 'blues', 'funk'].map(genre => [genre, `data/songs/${genre}`]));
const genreCache = new Map();
const genreRequests = new Map();

async function loadGenreFile(genre, length = 64) {
    if (!GENRE_FILES[genre] || ![16, 32, 64].includes(length)) throw new Error('Choose a supported genre and pattern length.');
    const cacheKey = `${genre}/${length}`;
    if (genreCache.has(cacheKey)) return genreCache.get(cacheKey);
    if (genreRequests.has(cacheKey)) return genreRequests.get(cacheKey);
    const request = (async () => {
        const response = await fetch(`${GENRE_FILES[genre]}_${length}step.json`);
        if (!response.ok) throw new Error(`Could not load ${genre} songs. Please try again.`);
        const data = await response.json();
        if (data.genre !== genre || data.patternLength !== length || !Array.isArray(data.songs) || data.songs.some(song => song.patternLength !== length)) throw new Error('The song file does not match the selected pattern length.');
        genreCache.set(cacheKey, data);
        return data;
    })();
    genreRequests.set(cacheKey, request);
    try { return await request; } finally { genreRequests.delete(cacheKey); }
}

function buildSongPresetsFromGenreData(genreData) {
    const presets = {};
    for (const data of Object.values(genreData)) {
        for (const song of data.songs) {
            presets[song.key] = {...song, key: song.keyName, genre: data.genre};
        }
    }
    return presets;
}

async function loadAllGenreData() {
    const entries = await Promise.all(Object.keys(GENRE_FILES).map(async genre => [genre, await loadGenreFile(genre, 64)]));
    return Object.fromEntries(entries);
}

async function getPresetsByGenre(genre, length = 64) {
    const data = await loadGenreFile(genre, length);
    return buildSongPresetsFromGenreData({[genre]: data});
}

async function getSongPreset(key, length, genre) {
    if (!genre) {
        if (!SONG_PRESETS[key]) Object.assign(SONG_PRESETS, buildSongPresetsFromGenreData(await loadAllGenreData()));
        genre = SONG_PRESETS[key]?.genre;
    }
    if (!genre) throw new Error('This song could not be found. Choose a song again.');
    const presets = await getPresetsByGenre(genre, length);
    if (!presets[key]) throw new Error('This song is unavailable at the selected length.');
    return presets[key];
}

async function getRandomPresetByGenre(genre, length = 64) {
    const presets = await getPresetsByGenre(genre, length);
    const keys = Object.keys(presets);
    return keys.length ? presets[keys[Math.floor(Math.random() * keys.length)]] : null;
}

function getAllGenreNames() { return Object.keys(GENRE_FILES); }

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
}).catch(error => console.warn('Song catalogue preload failed; choosing a genre will retry.', error.message));

// Export for use in other modules
window.SONG_PRESETS = SONG_PRESETS;
window.GENRE_METADATA = GENRE_METADATA;
window.getPresetsByGenre = getPresetsByGenre;
window.getRandomPresetByGenre = getRandomPresetByGenre;
window.getAllGenres = getAllGenres;
window.getAllGenreNames = getAllGenreNames;
window.loadAllGenreData = loadAllGenreData;

window.getSongPreset = getSongPreset;
