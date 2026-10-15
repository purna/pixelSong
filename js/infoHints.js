// Explain musical terminology at deliberately chosen headings and control groups.
(function () {
    const preferenceKey = 'pixelSong.showInformationIcons';
    const topics = {
        helper: 'Tune Helper offers two starting points: load a song by genre, or create a tune. Both use the selected number of steps. For a new tune, Mood shapes the melody and Energy changes how busy it is. Full tune includes every part and a stage layout; Melody only keeps your backing parts.',
        harmony: 'Harmony means notes sounding together to support the tune. Select note tiles to build a chord, which is a group of notes played together.',
        melody: 'The melody is the main tune. Higher grid rows have higher pitches; columns are time slots played from left to right.',
        rhythm: 'Rhythm is the pattern of beats and pauses. Each drum row has its own sound; selected squares tell it when to play.',
        bass: 'Bass is the low-pitched part that gives music weight and connects the beat to the harmony.',
        lead: 'A lead is a prominent melodic part. It can answer the main melody or add a short musical phrase.',
        percussion: 'Percussion adds rhythmic texture. Congas and bongos are hand drums; shakers and cymbals add softer or brighter accents.',
        tempo: 'Tempo is the speed of your tune, measured in beats per minute (BPM). Higher numbers play faster.',
        steps: 'Steps are time slots in the pattern. In this app, 16 steps make one bar: 16, 32 and 64 steps give you one, two and four bars. When adding steps, Repeat current pattern copies your notes into the extra bars; Leave new steps empty gives you space to write; Load selected song version uses its saved arrangement.',
        chords: 'A chord progression is a sequence of chords. Choose one, then press Apply to generate harmony and hear a preview.',
        scale: 'A scale is a set of notes that work together. Major scales often sound bright; minor scales often sound more reflective.',
        octave: 'An octave is the distance from one note to the next note with the same name. Moving up one octave gives the same note a higher pitch.',
        tone: 'Volume sets loudness. Cutoff controls the filter frequency: a lower low-pass cutoff softens the sound, while a higher one lets more brightness through. Pan places a sound between the left and right speakers.',
        stage: 'The stage is a picture of the stereo space. Left and right represent the speakers; depth represents how close or distant an instrument feels.',
        formations: 'A formation is a layout for all instruments. All Center keeps parts near the middle; Spread Out separates them; the band and orchestra choices arrange them like an ensemble. The other choices provide alternative layouts for musical movement or answering phrases.',
        movement: 'Stay Put keeps a fixed position. Smooth Glide travels from Start to End; Back & Forth moves between them repeatedly; Bounce gives the movement a rhythmic shape. Start and End are positions between the left and right speakers.',
        depth: 'Stage depth describes distance. Front feels close and direct; Back suggests a more distant sound with more reverb, which is the reflection of sound in a room.',
        repeats: 'A section is a group of 16 steps. Its repeat count sets how many times it plays before moving to the next group.',
        reverb: 'Reverb is the fading reflection of sound in a room or hall. It adds a sense of space and distance.',
        echo: 'Echo repeats a sound after a short delay. Small amounts add space; larger amounts create a noticeable rhythmic repeat.',
        chorus: 'Chorus blends slightly shifted copies of a sound to make it thicker and wider.',
        lowpass: 'A low-pass filter reduces frequencies above its cutoff, making the sound warmer or softer.',
        highpass: 'A high-pass filter reduces frequencies below its cutoff, removing bass and low rumble.',
        distortion: 'Distortion adds grit and extra harmonics, which are frequencies above the original note. More distortion makes the sound rougher.',
        bitcrush: 'Bitcrush reduces sound resolution for a crunchy, retro game sound.',
        tremolo: 'Tremolo makes volume rise and fall repeatedly, creating a pulse.',
        vibrato: 'Vibrato makes pitch rise and fall slightly, creating a wavering sound.',
        velocity: 'Velocity means how strongly a note is played. Higher values usually sound louder. A velocity curve changes this strength over time.',
        panCurve: 'Pan places sound between the left and right speakers. Draw a curve to change that position as the pattern plays.',
        filterCurve: 'A filter changes which frequencies you hear. Low-pass softens highs, high-pass removes lows, and band-pass keeps a middle range. The curve changes the cutoff over time.',
        automation: 'Automation means changing a setting over time. Draw a curve to vary the selected effect as your tune plays.'
    };
    let enabled = true, popup, current;
    const seen = new WeakSet();
    function hide() {
        popup.hidden = true;
        if (current) current.removeAttribute('aria-describedby');
        current = null;
    }
    function show(icon, text) {
        if (!enabled) return;
        hide();
        popup.textContent = text;
        popup.hidden = false;
        current = icon;
        icon.setAttribute('aria-describedby', popup.id);
        const rect = icon.getBoundingClientRect();
        const size = popup.getBoundingClientRect();
        popup.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - size.width - 8)) + 'px';
        popup.style.top = Math.max(8, rect.bottom + size.height + 8 <= window.innerHeight ? rect.bottom + 8 : rect.top - size.height - 8) + 'px';
    }
    function addIcons() {
        const candidates = document.querySelectorAll('[data-info]');
        candidates.forEach(element => {
            if (seen.has(element)) return;
            const text = topics[element.dataset.info];
            if (!text) return;
            seen.add(element);
            const icon = document.createElement('span');
            icon.className = 'info-hint';
            icon.textContent = 'i';
            icon.tabIndex = 0;
            icon.setAttribute('role', 'button');
            icon.setAttribute('aria-label', 'Information: ' + text);
            icon.addEventListener('mouseenter', () => show(icon, text));
            icon.addEventListener('mouseleave', hide);
            icon.addEventListener('focus', () => show(icon, text));
            icon.addEventListener('blur', hide);
            icon.addEventListener('click', event => {
                event.preventDefault(); event.stopPropagation(); show(icon, text);
            });
            icon.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault(); event.stopPropagation(); show(icon, text);
                }
            });
            if (element.matches('h2, h3, h4, summary, label')) element.appendChild(icon);
            else element.insertAdjacentElement('afterend', icon);
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        popup = document.createElement('div');
        popup.id = 'infoHintPopup'; popup.className = 'info-hint-popup';
        popup.setAttribute('role', 'tooltip'); popup.hidden = true;
        document.body.appendChild(popup);
        try { enabled = localStorage.getItem(preferenceKey) !== 'false'; } catch (_) { /* Keep the default when storage is unavailable. */ }
        document.body.classList.toggle('hide-info-icons', !enabled);
        const toggle = document.getElementById('infoIconsToggle');
        if (toggle) {
            toggle.checked = enabled;
            toggle.addEventListener('change', () => {
                enabled = toggle.checked;
                document.body.classList.toggle('hide-info-icons', !enabled);
                hide();
                try { localStorage.setItem(preferenceKey, String(enabled)); } catch (_) { /* Still works for this visit. */ }
            });
        }
        addIcons();
        // Only explicitly annotated terminology gets an icon, including rebuilt groups.
        const observer = new MutationObserver(records => {
            if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && !node.matches('.info-hint, .info-hint-popup') && !node.closest('.info-hint-popup, .custom-tooltip')))) addIcons();
        });
        observer.observe(document.body, {childList: true, subtree: true});
        document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
        document.addEventListener('click', event => { if (!event.target.closest('.info-hint')) hide(); });
        window.addEventListener('resize', hide);
        window.addEventListener('scroll', hide, true);
    });
})();
