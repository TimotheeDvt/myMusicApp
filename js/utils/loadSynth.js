/**
 * Persistent configuration and global input handling (MIDI/Keyboard).
 */

const InputHandler = {
    pressedKeys: new Set(),
    letters: ["AZERTYUIOPQSDFGHJKLMWXCVBN123456789", "QWERTYUIOPASDFGHJKLZXCVBNM123456789"],

    init() {
        this.setupKeyboard();
        this.setupMIDI();
    },

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.pressedKeys.has(e.key)) return;
            this.pressedKeys.add(e.key);

            if (e.key === " ") {
                AudioManager.stopAll();
                return;
            }

            const freq = this.keyToFrequency(e.key);
            if (freq) AudioManager.playNote(freq);
        });

        document.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.key);
            const freq = this.keyToFrequency(e.key);
            if (freq) AudioManager.stopNote(freq);
        });
    },

    keyToFrequency(key) {
        const layout = parseInt(localStorage.getItem("layout") || "0");
        const startFreq = parseFloat(localStorage.getItem("startFreq") || "440");
        const subdivisions = parseInt(localStorage.getItem("subdivisions") || "12");

        const cleanKey = key.toUpperCase().trim();
        const index = this.letters[layout].indexOf(cleanKey);

        if (index === -1) return null;
        const degree = index % subdivisions;
        return startFreq * Math.pow(2, degree / subdivisions);
    },

    setupMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({ sysex: true })
                .then((midi) => {
                    for (let input of midi.inputs.values()) {
                        input.onmidimessage = (msg) => this.handleMIDIMessage(msg);
                    }
                });
        }
    },

    handleMIDIMessage(event) {
        const [command, note, velocity] = event.data;
        const startFreq = parseFloat(localStorage.getItem("startFreq") || "440");
        const subdivisions = parseInt(localStorage.getItem("subdivisions") || "12");

        // Calculate frequency based on EDO settings
        const freq = startFreq * Math.pow(2, (note - 69) / subdivisions);

        if (command >= 144 && command <= 159 && velocity > 0) {
            AudioManager.playNote(freq, 'sine', velocity);
        } else if ((command >= 128 && command <= 143) || (command >= 144 && command <= 159 && velocity === 0)) {
            AudioManager.stopNote(freq);
        }
    }
};

function loadSynth() {
    const initAudio = () => {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.init();
            InputHandler.init();
        }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
}

loadSynth();