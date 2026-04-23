let currentTuning = "EADGBE";
let currentStringsCount = 6;
let checkedNotes = [];
const grid = document.getElementById('grid');

// Standardized mapping to 12 semitones
const noteToSemitone = {
    "B#": "C", "C": "C", "C#": "C#", "Db": "C#", "D♭": "C#",
    "D": "D", "D#": "D#", "Eb": "D#", "E♭": "D#",
    "E": "E", "Fb": "E", "F♭": "E", "E#": "F", "F": "F",
    "F#": "F#", "Gb": "F#", "G♭": "F#", "G": "G",
    "G#": "G#", "Ab": "G#", "A♭": "G#", "A": "A",
    "A#": "A#", "Bb": "A#", "B♭": "A#", "B": "B", "Cb": "B", "C♭": "B"
};

const fretToDraw = [ 0, 5, 7, 10, 12 ];

const notesArr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

window.addEventListener('DOMContentLoaded', () => {
    currentStringsCount = document.getElementById("string-number").value;
    changeTuning();
    initCheckboxes();
    initModes();
    writeTune();
});

function initCheckboxes() {
    const container = document.getElementById('checkbox-container');
    notesArr.forEach(n => {
        const label = document.createElement('label');
        label.innerHTML = `${n} <input type="checkbox" value="${n}" class="note-check"> `;
        label.querySelector('input').addEventListener('change', (e) => {
            const note = e.target.value;
            if (e.target.checked) {
                if (!checkedNotes.includes(note)) checkedNotes.push(note);
            } else {
                checkedNotes = checkedNotes.filter(n => n !== note);
            }
            updateVisuals();
        });
        container.appendChild(label);
    });
}

function initModes() {
    const modeSelect = document.getElementById('mode-select');
    Object.keys(TheoryEngine.modes).forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.text = mode;
        modeSelect.appendChild(option);
    });
}

function writeTune() {
    const root = document.getElementById('tune-select').value;
    const alt = document.getElementById('alt-select').value;
    const modeKey = document.getElementById('mode-select').value;

    const rawScale = TheoryEngine.getScale(root, modeKey, alt);
    const boxes = document.querySelectorAll('.note-check');
    boxes.forEach(b => b.checked = false);

    checkedNotes = rawScale.map(note => {
        const cleanNote = note.replace('♮', '');
        return noteToSemitone[cleanNote] || cleanNote;
    });

    checkedNotes.forEach(standardName => {
        let box = document.querySelector(`.note-check[value="${standardName}"]`);
        if (box) box.checked = true;
    });

    updateVisuals();
    updateChordTable(rawScale, modeKey);
}

function updateVisuals() {
    grid.setAttribute("notes", checkedNotes.join(", "));
    grid.setAttribute("strings", currentStringsCount);
    grid.setAttribute("tuning", currentTuning);
    grid.update();
}

function updateChordTable(scale, modeKey) {
    const table = document.getElementById('chord-table');
    table.innerHTML = "";
    const chart = TheoryEngine.chords_charts[modeKey];
    if (!chart) return;

    let headRow = table.insertRow();
    let dataRow = table.insertRow();

    scale.forEach((note, i) => {
        if (i >= chart.length) return;
        let quality = chart[i];
        let roman = TheoryEngine.getRomanNumeral(i + 1, quality);
        note = TheoryEngine.normalizeNote(note); // Ensure we have a standardized note name
        let chordName = note + (quality === 'M' ? '' : quality === 'd' ? '°' : quality);

        headRow.insertCell().innerText = roman;
        dataRow.insertCell().innerText = chordName;
    });
}

// change string count
function changeStringCount() {
    const stringCount = document.getElementById('string-number');
    currentStringsCount = parseInt(stringCount.value);
    if (currentStringsCount != 6) {
        if (currentTuning.length < currentStringsCount) {
            currentTuning = currentTuning + "X".repeat(currentStringsCount - currentTuning.length);
        } else if (currentTuning.length > currentStringsCount) {
            currentTuning = currentTuning.slice(0, currentStringsCount);
        }

        text = document.getElementById("custom-tuning")
        text.style.visibility = "visible"
        text.style.display = "block"
        text.placeholder = currentTuning;
    }
    writeTune();
    updateVisuals();
};

// change tuning mode (S;AO;TO)
function changeTuning() {
    var tuningMode = document.getElementById('tuning-select');
    if (getSelectedOption(tuningMode).value != "CUSTOM") {
        currentTuning = getSelectedOption(tuningMode).value;
        text = document.getElementById("custom-tuning")
        text.style.visibility = "hidden"
        writeTune()
    } else {
        text = document.getElementById("custom-tuning")
        text.style.visibility = "visible"
        text.style.display = "block"
        text.placeholder = currentTuning;
    }
    updateVisuals();
};

// Return the selected option on the HTML Select element
function getSelectedOption(sel) {
    var opt;
    for (var i = 0, len = sel.options.length; i < len; i++) {
        opt = sel.options[i];
        if (opt.selected === true) {
            break;
        };
    };
    return opt;
};

function onTuningChange() {
    var key = window.event.keyCode;
    t = document.getElementById("custom-tuning").value
    document.getElementById("custom-tuning").value = t.toUpperCase()

    if (key === 13) {
        if (t.length >= currentStringsCount) {
            t = t.toUpperCase()
            currentTuning = t.toUpperCase()
            writeTune()
            return false;
        } else {
            alert("L'accordage attendu doit avoir " + currentStringsCount + " cordes sont acceptés.")
        }
    }
    else {
        return true;
    }
}

document.getElementById('toggle-footer').addEventListener('click', () => {
    document.querySelector('footer').classList.toggle('folded');
    localStorage.setItem("foldedModesScales", document.querySelector('footer').classList.contains('folded'))
});

if (localStorage.getItem("foldedModesScales") === "true") {
    document.querySelector('footer').classList.add('folded');
}

document.addEventListener('keydown', (event) => {
    const isHardRefresh = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'r';

    if (isHardRefresh) {
        localStorage.clear();
    }
});