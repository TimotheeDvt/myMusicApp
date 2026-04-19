/**
 * audio-manager.js
 * Centralized Audio Engine for the Music Hub
 * Based on original logic from EDO_interface/index.js
 */

const AudioManager = {
    state: {
        audioContext: null,
        masterGain: null,
        activeVoices: {},
        maxVoices: 10,
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
    playNote(frequency, type = 'sine') {
        if (!this.state.audioContext) this.init();
        if (!Number.isFinite(frequency) || this.state.activeVoices[frequency]) return;

        const now = this.state.audioContext.currentTime;

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
        gainNode.gain.linearRampToValueAtTime(0.2, now + this.state.attackTime);

        // Chain: Osc -> Gain -> Filter -> Compressor -> Master
        const filter = this.state.audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(8000, now);

        const compressor = this.state.audioContext.createDynamicsCompressor();

        osc.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(compressor);
        compressor.connect(this.state.masterGain);

        osc.start(now);
        this.state.activeVoices[frequency] = { osc, gain: gainNode };
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
        let frequency;
        if (typeof note === 'string') {
            frequency = TheoryEngine.getSimpleFrequency(note);
        } else if (Number.isFinite(note)) {
            frequency = note;
        }
        this.playNote(frequency, type);
        setTimeout(() => this.stopNote(frequency), duration * 1000);
    }
};

if (typeof module !== 'undefined') module.exports = AudioManager;