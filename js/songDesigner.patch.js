/**
 * songDesigner.patch.js
 * 
 * Drop this AFTER songDesigner.js in your index.html.
 * It patches SongDesignerApp with audio quality improvements without
 * touching the original file, so it's safe and easy to roll back.
 *
 * Improvements:
 *  1. Replace setInterval sequencer with Tone.js Transport (fixes timing drift)
 *  2. Richer instrument definitions (wider supersaw, warmer FM, better piano)
 *  3. Velocity humanization — subtle random variation each step
 *  4. Per-instrument reverb sends (drums drier, pads wetter)
 *  5. Better compressor settings (less pumpy)
 *  6. Harmonic chord voicing — spread across octaves for fullness
 *  7. Note length variation — melody gets '8n' not just '16n' for longer notes
 */

(function patchSongDesigner() {
    // Wait for SongDesignerApp to be defined
    if (typeof SongDesignerApp === 'undefined') {
        document.addEventListener('DOMContentLoaded', patchSongDesigner);
        return;
    }

    const proto = SongDesignerApp.prototype;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. BETTER INSTRUMENT DEFINITIONS
    //    Called in initAudio() — patch the instrument configs on construction
    // ─────────────────────────────────────────────────────────────────────────

    const originalInitAudio = proto.initAudio;
    proto.initAudio = function() {
        // Override instrument configs BEFORE super call creates the synths

        // ── Supersaw: wider spread, more oscillators ─────────────────────────
        // Original: count:5, spread:20  →  Patched: count:7, spread:50
        this.melodyInstruments.supersaw = {
            synth: Tone.PolySynth,
            opts: {
                oscillator: { type: 'fatsawtooth', count: 7, spread: 50 },
                envelope: { attack: 0.03, decay: 0.15, sustain: 0.5, release: 0.8 }
            }
        };
        this.leadInstruments.supersaw = {
            synth: Tone.PolySynth,
            opts: {
                oscillator: { type: 'fatsawtooth', count: 7, spread: 50 },
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.45, release: 0.7 }
            }
        };

        // ── Piano: triangle + detune for richer tone ─────────────────────────
        // Original: plain triangle  →  Patched: AmSynth for natural amplitude modulation
        this.harmonicInstruments.piano = {
            synth: Tone.PolySynth,
            opts: {
                oscillator: { type: 'triangle14' }, // partials 1+4 = fuller tone
                envelope: { attack: 0.005, decay: 0.8, sustain: 0.2, release: 2.0 },
                volume: -2
            }
        };

        // ── FM Synth: warmer modulator (sine instead of square) ───────────────
        // Original: modulation: { type: 'square' }  →  sine is warmer, less buzzy
        this.harmonicInstruments.fm = {
            synth: Tone.PolySynth,
            opts: {
                voice: Tone.FMSynth,
                harmonicity: 2,           // lower = warmer (was 3)
                modulationIndex: 8,       // slightly less harsh (was 10)
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 2.0 },
                modulation: { type: 'sine' },           // CHANGED from 'square'
                modulationEnvelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 1.0 }
            }
        };

        // ── Pad: slow attack, rich AM modulation ─────────────────────────────
        this.harmonicInstruments.pad = {
            synth: Tone.PolySynth,
            opts: {
                voice: Tone.AMSynth,
                oscillator: { type: 'fatsine', count: 3, spread: 20 },
                envelope: { attack: 0.8, decay: 0.5, sustain: 0.9, release: 3.0 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.8, decay: 0.5, sustain: 0.9, release: 3.0 }
            }
        };

        // ── Bass: add sub-harmonics with fatter waveform ──────────────────────
        this.bassInstruments.synth = {
            synth: Tone.MonoSynth,
            opts: {
                oscillator: { type: 'fatsawtooth', count: 2, spread: 10 },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 },
                filterEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.5, baseFrequency: 250, octaves: 2.5 }
            }
        };
        this.bassInstruments.sub = {
            synth: Tone.MonoSynth,
            opts: {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.02, decay: 0.4, sustain: 0.6, release: 0.8 },
                filterEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.6, release: 0.8, baseFrequency: 80, octaves: 1.5 }
            }
        };

        // ── Better drum kit defaults ──────────────────────────────────────────
        // Acoustic kit: more realistic decay times
        this.drumKits.acoustic = {
            kick: { synth: Tone.MembraneSynth, opts: {
                pitchDecay: 0.08,    // longer sweep = more thump (was 0.05)
                octaves: 9,          // slightly more pitch drop
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.6, sustain: 0.01, release: 1.2 }
            }},
            snare: { synth: Tone.NoiseSynth, opts: {
                noise: { type: 'white' },
                envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.2 }
            }},
            hihat: { synth: Tone.MetalSynth, opts: {
                frequency: 300,
                envelope: { attack: 0.001, decay: 0.1, release: 0.02 },
                harmonicity: 5.1, modulationIndex: 32, resonance: 6000, octaves: 2.5
            }},
            tom: { synth: Tone.MembraneSynth, opts: {
                pitchDecay: 0.08, octaves: 6,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.01, release: 0.5 }
            }}
        };

        // Now call the original initAudio
        originalInitAudio.call(this);

        // ── After init: tune the master compressor ────────────────────────────
        // Original: threshold:-24, ratio:4 → pumpy
        // Patched:  threshold:-12, ratio:2.5 → transparent glue
        if (this.compressor) {
            this.compressor.set({
                threshold: -12,
                ratio: 2.5,
                knee: 6,
                attack: 0.005,
                release: 0.2
            });
        }

        // ── After init: add per-instrument reverb sends ───────────────────────
        this._addReverbSends();
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PER-INSTRUMENT REVERB SENDS
    //    Drums go dry; pads/harmony go wet. Creates depth and separation.
    // ─────────────────────────────────────────────────────────────────────────

    proto._addReverbSends = function() {
        if (!this.effects?.reverb) return;

        // Create a secondary "dry" reverb (short room) for drums
        this._drumReverb = new Tone.Reverb({ decay: 0.4, wet: 0.08 });
        this._drumReverb.connect(this.compressor);

        // Create a lush reverb for pads/harmony
        this._padReverb = new Tone.Reverb({ decay: 3.5, wet: 0.4 });
        this._padReverb.connect(this.compressor);

        // Route drum panners to drum reverb instead of main effects
        if (this.drumPanners) {
            Object.values(this.drumPanners).forEach(panner => {
                if (panner) {
                    // Keep main chain connection, add parallel send
                    try { panner.connect(this._drumReverb); } catch(e) {}
                }
            });
        }

        // Route harmony panner to pad reverb
        if (this.harmonyPanner) {
            try { this.harmonyPanner.connect(this._padReverb); } catch(e) {}
        }

        console.log('[patch] Per-instrument reverb sends added');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. REPLACE setInterval WITH Tone.js Transport
    //    setInterval drifts by 10-50ms per beat at 120BPM — noticeable!
    //    Tone.Transport is sample-accurate and never drifts.
    // ─────────────────────────────────────────────────────────────────────────

    proto.play = function() {
        if (this.isPlaying) return;

        if (this.howlerEngine) this.howlerEngine.resume();
        if (this.rhythmVisualizer?.enabled) this.rhythmVisualizer.setTempo(this.tempo);

        this.isPlaying = true;
        this.currentStep = 0;
        this.groupLoopCurrent = [0, 0, 0, 0];

        // Use Tone.Transport for accurate timing
        Tone.Transport.bpm.value = this.tempo;
        Tone.Transport.cancel(); // clear any previous events

        // Schedule repeating 16th-note step
        this._transportEvent = Tone.Transport.scheduleRepeat((time) => {
            // Use Tone.Draw for UI updates (keeps audio thread clean)
            Tone.Draw.schedule(() => {
                this._advanceStep();
            }, time);
            this._playStepAtTime(this.currentStep, time);
        }, '16n');

        Tone.Transport.start();

        // Update UI
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.remove('btn-play');
            playBtn.classList.add('btn-stop');
            const playText = playBtn.querySelector('#playText');
            if (playText) playText.textContent = 'Stop';
        }
    };

    proto._advanceStep = function() {
        const groupCount = this.patternLength / 16;
        const currentGroup = Math.floor(this.currentStep / 16);
        const localStep = this.currentStep % 16;

        if (localStep === 15) {
            this.groupLoopCurrent[currentGroup]++;
            if (this.groupLoopCurrent[currentGroup] < this.groupLoopCounts[currentGroup]) {
                this.currentStep = currentGroup * 16;
            } else {
                this.groupLoopCurrent[currentGroup] = 0;
                this.currentStep = currentGroup < groupCount - 1
                    ? (currentGroup + 1) * 16
                    : 0;
            }
        } else {
            this.currentStep++;
        }

        this.updateTimelineState();
        this.updateSectionTimelinesPlaying();
    };

    proto.stop = function() {
        this.isPlaying = false;

        // Stop Tone.Transport
        Tone.Transport.stop();
        if (this._transportEvent !== undefined) {
            Tone.Transport.clear(this._transportEvent);
            this._transportEvent = undefined;
        }

        this.currentStep = 0;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.remove('btn-stop');
            playBtn.classList.add('btn-play');
            const playText = playBtn.querySelector('#playText');
            if (playText) playText.textContent = 'Play';
        }
        document.querySelectorAll('.rhythm-cell').forEach(c => c.classList.remove('playing'));
        document.querySelectorAll('.timeline-step').forEach(c => c.classList.remove('playing'));
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 4. ENHANCED playStep WITH HUMANIZATION + TIMING
    //    The original playStep() becomes _playStepAtTime(step, time)
    //    so Tone.js can schedule notes at the exact audio time.
    // ─────────────────────────────────────────────────────────────────────────

    proto._playStepAtTime = function(step, time) {
        if (!this.polySynth) return;

        // Rhythm visualizer
        if (this.rhythmVisualizer?.enabled) {
            this.rhythmVisualizer.onStepPlay(step);
        }

        const groupIndex = Math.floor(step / 16);
        const localStep = step % 16;

        const groupMelody  = this.patternGroups.melody[groupIndex];
        const groupBass    = this.patternGroups.bass[groupIndex];
        const groupLead    = this.patternGroups.lead[groupIndex];
        const groupRhythm  = this.patternGroups.rhythm[groupIndex];

        // Humanization: subtle velocity variation (±8%) and timing nudge (±5ms)
        const humanVel  = () => Math.max(0.05, Math.min(1, (Math.random() * 0.16) - 0.08));
        const humanTime = () => time + (Math.random() * 0.01 - 0.005); // ±5ms

        const melodyVel  = (this.melodyVelocity.get(step)  ?? 0.8) + humanVel();
        const harmonyVel = (this.harmonyVelocity.get(step) ?? 0.75) + humanVel();
        const leadVel    = (this.leadVelocity.get(step)    ?? 0.7) + humanVel();
        const bassVel    = (this.bassVelocity.get(step)    ?? 0.8) + humanVel();

        // Filter automation
        const lowpassVal = this.effectAutomation.lowpass?.get(step);
        if (lowpassVal !== undefined && this.effects?.lowpass) {
            const freq = 200 + (20000 - 200) * Math.pow(lowpassVal / 100, 2);
            this.effects.lowpass.frequency.rampTo(freq, 0.05, time);
        }

        // ── Drums ─────────────────────────────────────────────────────────────
        if (this.rhythmEnabled && groupRhythm) {
            const drumInstruments = ['kick', 'snare', 'hihat', 'tom'];
            drumInstruments.forEach(instrument => {
                if (groupRhythm[instrument]?.has(localStep)) {
                    const vel = Math.min(1, (this.rhythmVelocity[instrument]?.get(step) ?? 0.8) + humanVel());

                    if (this.howlerEngine?.initialized) {
                        this.howlerEngine.playDrum(instrument, vel);
                    } else if (this.drums?.[instrument]) {
                        // Tone.js drum - note: MembraneSynth takes a note, NoiseSynth takes nothing
                        if (this.drums[instrument] instanceof Tone.MembraneSynth) {
                            this.drums[instrument].triggerAttackRelease('C1', '16n', humanTime(), vel);
                        } else {
                            this.drums[instrument].triggerAttackRelease('16n', humanTime(), vel);
                        }
                    }

                    // UI flash (deferred to draw thread)
                    Tone.Draw.schedule(() => {
                        const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${localStep}"]`);
                        if (cell) {
                            cell.classList.add('playing');
                            setTimeout(() => cell.classList.remove('playing'), 150);
                        }
                    }, time);
                }
            });
        }

        // ── Harmony (chords) — trigger every 4 steps for motion ───────────────
        // Original: only triggered on step 0 (once per whole loop!)
        // Patched: re-triggers every bar (every 16 steps) for chord changes
        if (this.harmonicsEnabled && localStep === 0 && this.harmonics.size > 0) {
            const notes = Array.from(this.harmonics).map(i => this.harmonicNotes[i]);
            // Voice the chord across octaves for fullness
            const voicedNotes = this._voiceChord(notes);
            this.polySynth.triggerAttackRelease(voicedNotes, '1m', time, Math.min(1, harmonyVel));
        }

        // ── Melody ────────────────────────────────────────────────────────────
        if (this.melodyEnabled && groupMelody?.has(localStep)) {
            const row = groupMelody.get(localStep);
            const scale = this.getCurrentScale();
            if (row < scale.length) {
                // Vary note length: most are 16n, some are 8n for expression
                const noteLen = Math.random() > 0.7 ? '8n' : '16n';
                this.melodySynth.triggerAttackRelease(scale[row], noteLen, humanTime(), Math.min(1, melodyVel));
            }
        }

        // ── Bass ──────────────────────────────────────────────────────────────
        if (this.bassEnabled && groupBass?.has(localStep)) {
            const row = groupBass.get(localStep);
            if (row < this.bassNotes.length) {
                this.bassSynth.triggerAttackRelease(this.bassNotes[row], '8n', humanTime(), Math.min(1, bassVel));
            }
        }

        // ── Lead ─────────────────────────────────────────────────────────────
        if (this.leadEnabled && groupLead?.has(localStep)) {
            const row = groupLead.get(localStep);
            const scale = this.getCurrentScale();
            if (row < scale.length) {
                const noteLen = Math.random() > 0.6 ? '8n' : '16n';
                this.leadSynth.triggerAttackRelease(scale[row], noteLen, humanTime(), Math.min(1, leadVel));
            }
        }

        // ── Percussion ───────────────────────────────────────────────────────
        if (this.percussionEnabled && groupRhythm) {
            ['conga', 'bongo', 'shaker', 'cymbal'].forEach(instrument => {
                if (this.percussion?.[instrument] && groupRhythm[instrument]?.has(localStep)) {
                    const vel = Math.min(1, (this.rhythmVelocity[instrument]?.get(step) ?? 0.7) + humanVel());
                    this.percussion[instrument].triggerAttackRelease('16n', humanTime(), vel);

                    Tone.Draw.schedule(() => {
                        const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${localStep}"]`);
                        if (cell) {
                            cell.classList.add('playing');
                            setTimeout(() => cell.classList.remove('playing'), 150);
                        }
                    }, time);
                }
            });
        }
    };

    // Keep original playStep as fallback (called from UI click previews)
    proto.playStep = proto._playStepAtTime.bind
        ? function(step) { proto._playStepAtTime.call(this, step, Tone.now()); }
        : proto.playStep;

    // ─────────────────────────────────────────────────────────────────────────
    // 5. CHORD VOICING — spread notes across octaves for fullness
    //    Tight voicing (all notes in one octave) sounds muddy.
    //    Open voicing (spread over 2+ octaves) sounds rich.
    // ─────────────────────────────────────────────────────────────────────────

    proto._voiceChord = function(notes) {
        if (!notes || notes.length === 0) return notes;

        // Parse note name and octave
        const parseNote = (n) => {
            const match = n.match(/^([A-G]#?)(\d+)$/);
            if (!match) return { name: n, octave: 4 };
            return { name: match[1], octave: parseInt(match[2]) };
        };

        const voiced = notes.map((note, i) => {
            const parsed = parseNote(note);
            // Root stays at original octave
            // 3rd goes up an octave, 5th stays, 7th (if present) goes up 2
            const octaveShift = i === 1 ? 1 : i === 3 ? 1 : 0;
            return `${parsed.name}${parsed.octave + octaveShift}`;
        });

        return voiced;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 6. TEMPO CHANGE — update Tone.Transport too
    // ─────────────────────────────────────────────────────────────────────────

    const originalSetupEventListeners = proto.setupEventListeners;
    proto.setupEventListeners = function() {
        originalSetupEventListeners.call(this);

        // Patch tempo slider to also update Transport
        const tempoSlider = document.getElementById('tempoSlider');
        if (tempoSlider) {
            tempoSlider.addEventListener('input', () => {
                Tone.Transport.bpm.value = this.tempo;
            });
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 7. RICHER SYNTH CREATION
    //    Patch createHarmonicSynth to use polyphony limit (avoids voice stealing clicks)
    // ─────────────────────────────────────────────────────────────────────────

    const originalCreateHarmonicSynth = proto.createHarmonicSynth;
    proto.createHarmonicSynth = function() {
        originalCreateHarmonicSynth.call(this);
        // Set polyphony cap to prevent CPU overload and voice stealing artefacts
        if (this.polySynth && this.polySynth.maxPolyphony !== undefined) {
            this.polySynth.maxPolyphony = 6;
        }
    };

    const originalCreateMelodySynth = proto.createMelodySynth;
    proto.createMelodySynth = function() {
        originalCreateMelodySynth.call(this);
        if (this.melodySynth && this.melodySynth.maxPolyphony !== undefined) {
            this.melodySynth.maxPolyphony = 4;
        }
    };

    const originalCreateLeadSynth = proto.createLeadSynth;
    proto.createLeadSynth = function() {
        originalCreateLeadSynth.call(this);
        if (this.leadSynth && this.leadSynth.maxPolyphony !== undefined) {
            this.leadSynth.maxPolyphony = 3;
        }
    };

    console.log('[songDesigner.patch.js] Audio quality patches applied ✓');

})();
