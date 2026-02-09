// MIDI Manager - Export/Import MIDI files for patterns
// Based on simple MIDI format specification

class MidiManager {
    constructor(app) {
        this.app = app;
        this.songCounter = this.loadSongCounter();
    }

    // Auto-numbering system
    loadSongCounter() {
        const counter = localStorage.getItem('pixelSong_counter');
        return counter ? parseInt(counter) : 0;
    }

    saveSongCounter(counter) {
        localStorage.setItem('pixelSong_counter', counter.toString());
    }

    generateNextSongName() {
        this.songCounter++;
        this.saveSongCounter(this.songCounter);
        return `Song ${this.songCounter.toString().padStart(3, '0')}`;
    }

    getNextSongNumber() {
        return this.songCounter + 1;
    }

    // MIDI file structure helpers
    static arrayToHex(array) {
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(' ');
    }

    // Create a basic MIDI file from song data
    createMidiFile(songData, songName = 'pixelSong') {
        const ticksPerBeat = 120;
        const beatsPerMeasure = 4;
        const tempo = songData.tempo || 120;
        const patternLength = songData.patternLength || 16;
        
        // Calculate total ticks
        const totalBeats = patternLength; // Each step = 1 beat
        const totalTicks = totalBeats * ticksPerBeat;

        // MIDI file header: MThd chunk
        const headerChunk = [
            0x4D, 0x54, 0x68, 0x64, // "MThd"
            0x00, 0x00, 0x00, 0x06, // Chunk length
            0x00, 0x00, // Format type 0
            0x00, 0x01, // One track
            0x00, beatsPerMeasure.toString(16).padStart(2, '0').slice(0, 2).charCodeAt(0), // Ticks per beat (high byte)
            0x00, 0x78, // 120 ticks per beat
        ];

        // Tempo meta event (microseconds per beat)
        const microsecondsPerBeat = Math.round(60000000 / tempo);
        const tempoBytes = [
            0x00, // Delta time (0)
            0xFF, 0x51, 0x03, // Meta event: set tempo
            (microsecondsPerBeat >> 16) & 0xFF,
            (microsecondsPerBeat >> 8) & 0xFF,
            microsecondsPerBeat & 0xFF
        ];

        // Convert song data to MIDI events
        const trackEvents = this.songDataToMidiEvents(songData, ticksPerBeat);
        
        // End of track
        const endOfTrack = [
            0x00, // Delta time
            0xFF, 0x2F, 0x00 // Meta: end of track
        ];

        // Track chunk header: MTrk
        const trackData = [...tempoBytes, ...trackEvents, ...endOfTrack];
        const trackChunk = [
            0x4D, 0x54, 0x72, 0x6B, // "MTrk"
            0x00, 0x00, 0x00, (trackData.length >> 24) & 0xFF,
            0x00, 0x00, (trackData.length >> 16) & 0xFF,
            0x00, (trackData.length >> 8) & 0xFF,
            trackData.length & 0xFF,
            ...trackData
        ];

        // Combine all chunks
        const midiFile = new Uint8Array([...headerChunk, ...trackChunk]);
        return new Blob([midiFile], { type: 'audio/midi' });
    }

    // Convert song data to MIDI track events
    songDataToMidiEvents(songData, ticksPerBeat) {
        const events = [];
        const patternLength = songData.patternLength || 16;
        
        // Map MIDI note numbers
        const melodyScale = songData.scale ? this.getScaleNotes(songData.scale) : ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        const bassNotes = ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2'];
        const harmonicNotes = ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'B4', 'D5'];

        // Process melody (1-based row index, so add 60 for octave)
        const melody = songData.melody || {};
        Object.entries(melody).forEach(([key, val]) => {
            const [col, row] = key.split('-').map(Number);
            if (row < melodyScale.length) {
                const noteName = melodyScale[row];
                const noteNum = this.noteToMidi(noteName);
                const deltaTime = col * ticksPerBeat;
                
                // Note On event (channel 1 - melody)
                events.push(
                    this.createMidiEvent(deltaTime, 0x90, 1, noteNum, 100) // Note On
                );
                // Note Off event (1 beat later)
                events.push(
                    this.createMidiEvent(ticksPerBeat, 0x80, 1, noteNum, 0) // Note Off
                );
            }
        });

        // Process bass (channel 2)
        const bass = songData.bass || {};
        Object.entries(bass).forEach(([key, val]) => {
            const [col, row] = key.split('-').map(Number);
            if (row < bassNotes.length) {
                const noteName = bassNotes[row];
                const noteNum = this.noteToMidi(noteName);
                const deltaTime = col * ticksPerBeat;
                
                events.push(
                    this.createMidiEvent(deltaTime, 0x90, 2, noteNum, 100) // Note On
                );
                events.push(
                    this.createMidiEvent(ticksPerBeat, 0x80, 2, noteNum, 0) // Note Off
                );
            }
        });

        // Process lead (channel 3)
        const lead = songData.lead || {};
        Object.entries(lead).forEach(([key, val]) => {
            const [col, row] = key.split('-').map(Number);
            if (row < melodyScale.length) {
                const noteName = melodyScale[row];
                const noteNum = this.noteToMidi(noteName);
                const deltaTime = col * ticksPerBeat;
                
                events.push(
                    this.createMidiEvent(deltaTime, 0x90, 3, noteNum + 12, 90) // One octave higher
                );
                events.push(
                    this.createMidiEvent(ticksPerBeat, 0x80, 3, noteNum + 12, 0) // Note Off
                );
            }
        });

        // Process rhythm (drums on channel 10)
        const rhythm = songData.rhythm || {};
        const drumMap = {
            'kick': 36,    // MIDI note 36 = C1 (Bass Drum)
            'snare': 38,   // MIDI note 38 = D1 (Snare)
            'hihat': 42,   // MIDI note 42 = F#1 (Closed Hi-Hat)
            'tom': 41,     // MIDI note 41 = E1 (Low Tom)
            'conga': 64,   // MIDI note 64 = E3 (High Conga)
            'bongo': 63,   // MIDI note 63 = D3 (High Bongo)
            'shaker': 69,  // MIDI note 69 = A3 (Cabasa/Shaker)
            'cymbal': 49   // MIDI note 49 = B2 (Crash Cymbal)
        };

        Object.entries(rhythm).forEach(([inst, steps]) => {
            if (Array.isArray(steps)) {
                steps.forEach(step => {
                    const drumNote = drumMap[inst] || 36;
                    const deltaTime = step * ticksPerBeat;
                    
                    events.push(
                        this.createMidiEvent(deltaTime, 0x99, 10, drumNote, 100) // Note On (channel 10)
                    );
                    events.push(
                        this.createMidiEvent(ticksPerBeat / 2, 0x89, 10, drumNote, 0) // Note Off
                    );
                });
            }
        });

        // Merge events by delta time to avoid overlap issues
        return this.mergeEventsByDeltaTime(events);
    }

    // Create MIDI event with variable length delta time
    createMidiEvent(deltaTime, status, channel, data1, data2) {
        const event = [];
        
        // Variable length delta time
        const deltaBytes = this.intToVarLen(deltaTime);
        event.push(...deltaBytes);
        
        // Status byte + channel
        event.push(status | (channel & 0x0F));
        
        // Data bytes
        event.push(data1, data2);
        
        return event;
    }

    // Convert integer to variable length value (MIDI standard)
    intToVarLen(value) {
        const bytes = [];
        let v = value;
        let buffer = v & 0x7F;
        
        while ((v >>= 7) > 0) {
            buffer <<= 8;
            buffer |= ((v & 0x7F) | 0x80);
        }
        
        bytes.push(buffer);
        
        return bytes;
    }

    // Merge events with same delta time
    mergeEventsByDeltaTime(events) {
        const merged = [];
        let currentDelta = 0;
        
        // Sort events by delta time
        const sorted = [...events];
        
        while (sorted.length > 0) {
            // Find minimum delta time among remaining events
            let minDelta = Infinity;
            sorted.forEach(e => {
                const d = this.varLenToInt(e.slice(0, e.findIndex((b, i) => (b & 0x80) === 0 && i > 0)));
            });
            
            // Simple approach: just concat all events with running delta times
            break;
        }
        
        // Simplified: return events as-is with accumulated delta times
        let accumulatedDelta = 0;
        events.forEach(event => {
            const deltaBytes = event.slice(0, event.findIndex((b, i) => i > 0 && (b & 0x80) === 0));
            const delta = this.varLenToInt(deltaBytes);
            accumulatedDelta += delta;
            
            // Replace delta with new accumulated value
            const newDelta = this.intToVarLen(accumulatedDelta);
            const newEvent = [...newDelta, ...event.slice(deltaBytes.length)];
            merged.push(...newEvent);
        });
        
        return merged;
    }

    varLenToInt(bytes) {
        let value = 0;
        bytes.forEach((b, i) => {
            if (i < bytes.length - 1) {
                value = (value << 7) | (b & 0x7F);
            } else {
                value = (value << 7) | (b & 0x7F);
            }
        });
        return value;
    }

    // Convert note name to MIDI number
    noteToMidi(noteName) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const match = noteName.match(/^([A-G]#?)(-?\d+)$/);
        if (!match) return 60; // Default C4
        
        const note = match[1];
        const octave = parseInt(match[2]);
        const noteIndex = notes.indexOf(note);
        
        return (octave + 1) * 12 + noteIndex;
    }

    // Get scale notes for a given scale
    getScaleNotes(scaleKey) {
        const scales = {
            'c-major': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
            'g-major': ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
            'f-major': ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'],
            'd-minor': ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5'],
            'a-minor': ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5']
        };
        return scales[scaleKey] || scales['c-major'];
    }

    // Export song to MIDI file
    exportToMidi(songData = null, autoSave = false) {
        const data = songData || this.app.getSongData();
        const songName = autoSave ? this.generateNextSongName() : `pixelSong_${Date.now()}`;
        
        const midiBlob = this.createMidiFile(data, songName);
        const url = URL.createObjectURL(midiBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${songName}.mid`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        const displayName = autoSave ? songName : `MIDI (${songName})`;
        this.showNotification(`${displayName} exported as MIDI!`, 'success');
        
        return songName;
    }

    // Import MIDI file
    importFromMidi() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mid,.midi';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const midiData = this.parseMidiFile(new Uint8Array(event.target.result));
                    this.applyMidiDataToSong(midiData);
                    this.showNotification(`Imported: ${file.name}`, 'success');
                } catch (error) {
                    console.error('Error parsing MIDI file:', error);
                    this.showNotification('Error importing MIDI: ' + error.message, 'error');
                }
            };

            reader.readAsArrayBuffer(file);
        };

        input.click();
    }

    // Parse basic MIDI file
    parseMidiFile(data) {
        const result = {
            tempo: 120,
            patternLength: 16,
            melody: {},
            bass: {},
            lead: {},
            rhythm: { kick: [], snare: [], hihat: [], tom: [] }
        };

        // Basic MIDI header parsing
        let offset = 0;
        
        // Check MThd chunk
        const header = String.fromCharCode(...data.slice(0, 4));
        if (header !== 'MThd') {
            throw new Error('Invalid MIDI file: missing MThd header');
        }
        
        offset += 8; // Skip chunk length
        // format type = data[8-9], num tracks = data[10-11], division = data[12-13]
        
        // Find tempo from first track
        let ticksPerBeat = 120;
        
        // Parse track chunks
        while (offset < data.length) {
            const chunkType = String.fromCharCode(...data.slice(offset, offset + 4));
            const chunkLength = (data[offset + 4] << 24) | (data[offset + 5] << 16) | (data[offset + 6] << 8) | data[offset + 7];
            
            if (chunkType === 'MTrk') {
                const trackData = data.slice(offset + 8, offset + 8 + chunkLength);
                this.parseMidiTrack(trackData, ticksPerBeat, result);
            }
            
            offset += 8 + chunkLength;
        }

        return result;
    }

    // Parse MIDI track events
    parseMidiTrack(trackData, ticksPerBeat, result) {
        let offset = 0;
        let currentDelta = 0;
        const ticksPerStep = ticksPerBeat; // Each step = 1 beat
        
        const drumMap = {
            36: 'kick',  // Bass Drum
            38: 'snare', // Snare
            40: 'snare', // Snare (alternate)
            42: 'hihat', // Closed Hi-Hat
            46: 'hihat', // Open Hi-Hat
            41: 'tom',   // Low Tom
            43: 'tom',   // High Tom
            45: 'tom',   // Mid Tom
            48: 'tom',   // High Tom
            50: 'tom',   // Highest Tom
            64: 'conga', // High Conga
            63: 'bongo', // High Bongo
            62: 'bongo', // Low Bongo
            69: 'shaker', // Cabasa
            70: 'shaker', // Tambourine
            49: 'cymbal', // Crash Cymbal
            55: 'cymbal', // Crash Cymbal (alternate)
            52: 'cymbal'  // Chinese Cymbal
        };

        while (offset < trackData.length) {
            // Read delta time
            let delta = 0;
            let bytesRead = 0;
            while (offset + bytesRead < trackData.length) {
                delta = (delta << 7) | (trackData[offset + bytesRead] & 0x7F);
                bytesRead++;
                if ((trackData[offset + bytesRead - 1] & 0x80) === 0) break;
            }
            offset += bytesRead;
            currentDelta += delta;
            
            if (offset >= trackData.length) break;
            
            // Read status byte
            const status = trackData[offset];
            offset++;
            
            if (status === 0xFF) {
                // Meta event
                const metaType = trackData[offset];
                offset++;
                let metaLength = trackData[offset];
                offset++;
                
                if (metaType === 0x51) {
                    // Tempo change
                    const microsecondsPerBeat = (trackData[offset] << 16) | (trackData[offset + 1] << 8) | trackData[offset + 2];
                    result.tempo = Math.round(60000000 / microsecondsPerBeat);
                }
                offset += metaLength;
            } else if ((status & 0xF0) === 0x90) {
                // Note On event
                if (offset + 2 > trackData.length) break;
                const note = trackData[offset];
                const velocity = trackData[offset + 1];
                offset += 2;
                
                if (velocity > 0) {
                    const step = Math.floor(currentDelta / ticksPerStep);
                    const channel = status & 0x0F;
                    
                    if (step < result.patternLength) {
                        if (channel === 9) {
                            // Drum channel (10)
                            const drumType = drumMap[note];
                            if (drumType) {
                                if (!result.rhythm[drumType]) result.rhythm[drumType] = [];
                                if (!result.rhythm[drumType].includes(step)) {
                                    result.rhythm[drumType].push(step);
                                }
                            }
                        } else {
                            // Melody/Bass/Lead channels
                            const noteNum = note % 12;
                            const octave = Math.floor(note / 12) - 1;
                            
                            // Determine which instrument based on channel and note range
                            if (channel === 0) {
                                // Melody (Channel 1)
                                // Find closest row in scale
                                const scaleNote = noteNum; // 0 = C
                                const scaleIndices = [0, 2, 4, 5, 7, 9, 11, 0]; // Major scale
                                const row = scaleIndices.findIndex(n => n === scaleNote) || Math.floor(Math.random() * 8);
                                result.melody[`${step}-${row}`] = true;
                            } else if (channel === 1) {
                                // Bass (Channel 2)
                                const bassNote = noteNum % 12;
                                const bassIndices = [0, 2, 4, 5, 7, 9, 11, 1]; // Bass notes
                                const row = bassIndices.findIndex(n => n === bassNote) || Math.floor(Math.random() * 8);
                                result.bass[`${step}-${row}`] = true;
                            } else {
                                // Lead (Channel 3)
                                const leadNote = noteNum % 12;
                                const leadIndices = [0, 2, 4, 5, 7, 9, 11, 0];
                                const row = leadIndices.findIndex(n => n === leadNote) || Math.floor(Math.random() * 8);
                                result.lead[`${step}-${row}`] = true;
                            }
                        }
                    }
                }
            } else if ((status & 0xF0) === 0x80) {
                // Note Off event
                offset += 2;
            } else if ((status & 0xE0) === 0xB0) {
                // Control change
                offset += 2;
            } else if (status === 0xF0 || status === 0xF7) {
                // Sysex event
                let sysexLength = trackData[offset];
                offset++;
                offset += sysexLength;
            }
        }
    }

    // Apply parsed MIDI data to current song
    applyMidiDataToSong(midiData) {
        // Only apply if we have a valid app reference
        if (!this.app) return;

        // Clear existing patterns
        if (this.app.clearAll) {
            this.app.clearAll();
        }

        // Apply tempo
        if (midiData.tempo && this.app.tempo !== undefined) {
            this.app.tempo = midiData.tempo;
            const tempoSlider = document.getElementById('tempoSlider');
            if (tempoSlider) {
                tempoSlider.value = midiData.tempo;
                document.getElementById('tempoValue').textContent = `${midiData.tempo} BPM`;
            }
        }

        // Apply pattern length
        if (midiData.patternLength && this.app.setPatternLength) {
            this.app.setPatternLength(midiData.patternLength);
        }

        // Apply melody
        if (midiData.melody && this.app.melodyRows) {
            Object.entries(midiData.melody).forEach(([key, val]) => {
                const [col, row] = key.split('-').map(Number);
                this.app.melodyRows.set(col, row);
            });
        }

        // Apply bass
        if (midiData.bass && this.app.bassRows) {
            Object.entries(midiData.bass).forEach(([key, val]) => {
                const [col, row] = key.split('-').map(Number);
                this.app.bassRows.set(col, row);
            });
        }

        // Apply lead
        if (midiData.lead && this.app.leadRows) {
            Object.entries(midiData.lead).forEach(([key, val]) => {
                const [col, row] = key.split('-').map(Number);
                this.app.leadRows.set(col, row);
            });
        }

        // Apply rhythm
        if (midiData.rhythm) {
            Object.keys(this.app.rhythm || {}).forEach(inst => {
                if (midiData.rhythm[inst]) {
                    midiData.rhythm[inst].forEach(step => {
                        this.app.rhythm[inst].add(step);
                    });
                }
            });
        }

        // Rebuild grids if available
        if (this.app.rebuildGrids) {
            this.app.rebuildGrids();
        }
    }

    showNotification(message, type = 'info') {
        if (this.app?.showNotification) {
            this.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Export as global
window.MidiManager = MidiManager;
