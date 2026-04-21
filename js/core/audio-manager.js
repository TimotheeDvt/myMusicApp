/**
 * audio-manager.js
 * Centralized Audio Engine for the Music Hub
 * Based on original logic from EDO_interface/index.js
 */

const AudioManager = {
    isInitialized: false,

    state: {
        audioContext: null,
        masterGain: null,
        activeVoices: {},
        maxVoices: 12,
        attackTime: 0.02,
        releaseTime: 0.05
    },

    /**
     * Initializes the shared AudioContext and Master Gain.
     * Must be called after a user gesture (click/keypress).
     */
    init() {
        if (this.state.audioContext) return;

        this.state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.state.masterGain = this.state.audioContext.createGain();

        // Initial safety volume
        this.state.masterGain.gain.setValueAtTime(0.8, this.state.audioContext.currentTime);
        this.state.masterGain.connect(this.state.audioContext.destination);

        console.log("Audio Engine Initialized");
        this.isInitialized = true;
    },

    /**
     * Dynamic Gain Scaling to prevent clipping when multiple notes play.
     * Derived from original updateMasterGain().
     */
    updateMasterGain() {
        const activeCount = Object.keys(this.state.activeVoices).length;
        const baseGain = 0.8;
        const newGain = baseGain * (1 / Math.sqrt(activeCount || 1));

        const now = this.state.audioContext.currentTime;
        this.state.masterGain.gain.cancelScheduledValues(now);
        this.state.masterGain.gain.linearRampToValueAtTime(newGain, now + 0.05);
    },

    /**
     * Plays a frequency using a Sine oscillator with an ADSR envelope.
     * Includes the original lowpass filter and compressor chain.
     */
    playNote(frequency, type = 'sine', velocity = 100) {
        if (!this.state.audioContext) this.init();

        // Safety check: ensure frequency is valid and not already playing
        if (!Number.isFinite(frequency) || this.state.activeVoices[frequency]) return;

        const now = this.state.audioContext.currentTime;

        // 1. Convert MIDI Velocity (0-127) to Gain (0.0-1.0)
        // We use a linear mapping here, but a logarithmic one often feels more "natural"
        const normalizedVelocity = velocity / 127;
        const peakGain = normalizedVelocity * 0.3; // 0.3 is a safe max to prevent clipping

        // Voice stealing logic
        if (Object.keys(this.state.activeVoices).length >= this.state.maxVoices) {
            const oldestFreq = Object.keys(this.state.activeVoices)[0];
            this.stopNote(oldestFreq);
        }

        const osc = this.state.audioContext.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);

        const gainNode = this.state.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, now);

        // 2. Apply velocity to the Attack ramp
        gainNode.gain.linearRampToValueAtTime(peakGain, now + this.state.attackTime);

        // Chain: Osc -> Gain -> Filter -> Compressor -> Master
        const filter = this.state.audioContext.createBiquadFilter();
        filter.type = "lowpass";
        // Optional: Make the filter velocity-sensitive (louder notes are brighter)
        const filterFreq = 2000 + (6000 * normalizedVelocity);
        filter.frequency.setValueAtTime(filterFreq, now);

        const compressor = this.state.audioContext.createDynamicsCompressor();

        osc.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(compressor);
        filter.connect(this.state.masterGain); // Direct to master if compressor is internal

        osc.start(now);

        // Store metadata so stopNote knows how to handle the release
        this.state.activeVoices[frequency] = {
            osc,
            gain: gainNode,
            velocity: velocity
        };

        this.updateMasterGain();
    },

    /**
     * Stops a specific frequency with a linear release ramp.
     */
    stopNote(frequency) {
        const voice = this.state.activeVoices[frequency];
        if (!voice) return;

        const now = this.state.audioContext.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        voice.gain.gain.linearRampToValueAtTime(0, now + this.state.releaseTime);

        voice.osc.stop(now + this.state.releaseTime + 0.05);
        delete this.state.activeVoices[frequency];
        this.updateMasterGain();
    },

    stopAll() {
        Object.keys(this.state.activeVoices).forEach(f => this.stopNote(f));
    },

    playNotes(frequencies, duration, type = 'sine') {
        frequencies.forEach(freq => this.playNote(freq, type));
        if (duration) {
            setTimeout(() => frequencies.forEach(freq => this.stopNote(freq)), duration * 1000);
        }
    },

    playNoteWithDuration(note, duration, type = 'sine') { // duration in seconds
        if (typeof note === 'string') note = note.replace("<sup>", "").replace("</sup>", "");
        let frequency;
        if (typeof note === 'string') {
            frequency = TheoryEngine.getSimpleFrequency(note);
        } else if (Number.isFinite(note)) {
            frequency = note;
        }
        this.playNote(frequency, type);
        setTimeout(() => this.stopNote(frequency), duration * 1000);
    },

    async playScale(root, mode, duration = 0.4) {
        let alt = "♮";
        if (root.includes('#')) { alt = "#"; root = root.replace('#', ''); }
        else if (root.includes('b')) { alt = "♭"; root = root.replace('b', ''); }

        const notes = TheoryEngine.getScale(root, mode, alt);
        notes.push(notes[0]); // Add octave

        const baseFreq = 261.63; // C4
        let octaveOffset = 0;
        let lastIdx = -1;

        for (let noteName of notes) {
            const cleanNote = TheoryEngine.normalizeNote(noteName);
            const currentIdx = TheoryEngine.base_notes.indexOf(cleanNote);

            if (lastIdx !== -1 && currentIdx <= lastIdx) octaveOffset++;

            const freq = baseFreq * Math.pow(2, octaveOffset) * Math.pow(2, currentIdx / 12);
            console.log(`Playing ${noteName} at ${freq.toFixed(2)} Hz`);
            this.playNoteWithDuration(freq, duration);
            lastIdx = currentIdx;
            await new Promise(r => setTimeout(r, duration * 1000));
        }
    }
};

if (typeof module !== 'undefined') module.exports = AudioManager;