/**
 * Centralized logic for Music Theory, Scales, and EDO Calculations
 */

const TheoryEngine = {
    all_notes: [
        "C♮B#", "C#D♭", "D♮", "D#E♭", "E♮F♭", "E#F♮",
        "F#G♭", "G♮", "G#A♭", "A♮", "A#B♭", "B♮C♭"
    ],

    // Mode definitions (interval steps)
    modes: {
        "Major/Ionian": [2, 2, 1, 2, 2, 2], // Major/Ionian
        "Natural Minor/Aeolian": [2, 1, 2, 2, 1, 2], // Natural Minor/Aeolian
        "Dorian": [2, 1, 2, 2, 2, 1], // Dorian
        "Phrygian": [1, 2, 2, 2, 1, 2], // Phrygian
        "Lydian": [2, 2, 2, 1, 2, 2], // Lydian
        "Mixolydian": [2, 2, 1, 2, 2, 1], // Mixolydian
        "Locrian": [1, 2, 2, 1, 2, 2], // Locrian
        "Hungarian Minor": [2, 1, 3, 1, 1, 2, 1], // Hungarian Minor
        "Pentatonic Major": [2, 2, 3, 2],       // Pentatonic Major
        "Pentatonic Minor": [3, 2, 2, 3]        // Pentatonic Minor
    },

    // Chord qualities for each mode degree
    chords_charts: {
        "Major/Ionian": "MmmMMmd",
        "Natural Minor/Aeolian": "mdMmmMM",
        "Dorian": "mmMMmdM",
        "Phrygian": "mMMmdMm",
        "Lydian": "MMmdMmm",
        "Mixolydian": "MmdMmmM",
        "Locrian": "dMmmMMm"
    },

    /**
     * Calculates frequencies for any EDO system.
     * Derived from EDO_interface/index.js logic
     */
    calculateEDOFrequencies(startFreq, subdivisions=12) {
        return Array.from({ length: subdivisions }, (_, i) => {
            return startFreq * Math.pow(2, i / subdivisions);
        });
    },

    /**
     * Centralized scale constructor
     * @param {string} root - e.g., "C", "F#"
     * @param {string} modeKey - e.g., "M", "m", "D"
     * @param {string} alteration - "#", "♭", or "♮"
     */
    getScale(root, modeKey, alteration = "♮") {
        const modeIntervals = this.modes[modeKey];
        if (!modeIntervals) return [];

        // Convert step intervals to cumulative semitones
        let cumulative = 0;
        const semitoneSteps = [0, ...modeIntervals.map(step => cumulative += step)];

        // Find index of root note
        const rootLookup = root + alteration;
        const indexOfRoot = this.all_notes.findIndex(n => n.includes(rootLookup));

        return semitoneSteps.map(shift => {
            let noteGroup = this.all_notes[(indexOfRoot + shift) % 12];

            // Logic to choose the right enharmonic based on alteration
            if (alteration === "#") return noteGroup.substring(0, 2).replace("♮", "");
            if (alteration === "♭") return noteGroup.slice(-2).replace("♮", "");
            return noteGroup.split("♮")[0] || noteGroup[0];
        }).map(n => this.normalizeNote(n)); // Final cleanup to remove natural signs
    },

    getRomanNumeral(degree, chordType) {
        const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
        let rom = numerals[(degree - 1) % 7];
        if (chordType === "m") return rom.toLowerCase();
        if (chordType === "d") return rom.toLowerCase() + "°";
        return rom;
    },

    getEDONoteName(index, subdivisions) {
        if (subdivisions == 12) {
            // Map 12-EDO to standard names
            const standardNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            return standardNames[index % 12];
        } else if (subdivisions == 24) {
            // For 24-EDO, use a combination of natural and accidental symbols
            const baseNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            const accidental = (index % 2 === 0) ? "" : (index % 4 === 1 ? "#" : "♭");
            return baseNames[Math.floor(index / 2) % 12] + accidental;
        }
        // For other EDOs, use a numerical notation (e.g., "0", "1", "2"...)
        return index.toString();
    },

    findSmallestPerfectSquare(n) {
        const sqrt = Math.sqrt(n);
        return (sqrt % 1 === 0) ? sqrt : Math.floor(sqrt) + 1;
    },

    normalizeNote(note) {
        let clean = note.replace(/♮/g, "");

        const equivalents = {
            "CB#": "C",
            "C#D♭": "C#",
            "D#E♭": "D#",
            "EF♭": "E",
            "E#F": "F",
            "F#G♭": "F#",
            "G#A♭": "G#",
            "A#B♭": "A#",
            "BC♭": "C"
        };

        if (equivalents[clean]) clean = equivalents[clean];

        return clean;
    },

    getSimpleFrequency(note) {
        const base = 440; // A4
        const noteIndex = this.all_notes.findIndex(n => n.includes(note));
        if (noteIndex === -1) return null;
        return base * Math.pow(2, noteIndex / 12);
    }
};

// Export for use in other files
if (typeof module !== 'undefined') module.exports = TheoryEngine;