/**
 * Local script for Modes & Scales tool - Guitar Only Version (Canvas Grid)
 */

let currentTuning = "EADGBE";
let checkedNotes = [];

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
    initCheckboxes();
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

function drawGrid(ctx, width, height) {
    const style = getComputedStyle(document.body);
    const gridColor = style.getPropertyValue('--text-white') || '#AEB2B2';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Draw horizontal lines for strings
    for (let i = 0; i < 6; i++) {
        const y = 10 + (29.25 * i);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw vertical lines for frets and fret numbers
    for (let i = 0; i < 15; i++) {
        const x = 4 + (27 * i);
        const prevX = 4 + (27 * (i - 1));
        const middleX = (x + prevX) / 2;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = gridColor;
        if (fretToDraw.includes(i%12)) {
            const middleY = 10 + (29.25 * 5 / 2);
            if (i % 12 !== 0) {
                ctx.arc(middleX, middleY, 2, 0, Math.PI * 2);
            } else {
                ctx.arc(middleX, middleY / 1.5,     2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(middleX, middleY + middleY / 2.8, 2, 0, Math.PI * 2);
            }
            ctx.fill();
        }
        ctx.moveTo(x, 10);
        ctx.lineTo(x, 10 + (29.25 * 5));
        ctx.stroke();
    }

    // Draw nut
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(4, 10);
    ctx.lineTo(4, 10 + (29.25 * 5));
    ctx.stroke();
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
    console.log(checkedNotes);
    console.log(checkedNotes.length);
}

function updateVisuals() {
    const canvas = document.getElementById('circle');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
    checkedNotes.forEach(note => drawGuitarNote(note));
}

function drawGuitarNote(note) {
    const targetIdx = notesArr.indexOf(note);

    for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
        let openNoteName = currentTuning[5 - stringIdx];
        let openNote = openNoteName;
        let startIdx = notesArr.indexOf(openNote);

        if (targetIdx !== -1 && startIdx !== -1) {
            let fret = (targetIdx - startIdx + 12) % 12;

            let xPos = (fret === 0) ? 4 : 18 + (27 * (fret - 1));

            drawCircle(xPos, 10 + (29.25 * stringIdx), note);

            if (fret <= 3 && fret !== 0) {
                drawCircle(18 + (27 * (fret + 11)), 10 + (29.25 * stringIdx), note);
            } else if (fret === 0) {
                drawCircle(18 + (27 * 11), 10 + (29.25 * stringIdx), note);
            }
        }
    }
}

function drawCircle(x, y, text, r = 8) {
    const style = getComputedStyle(document.body);
    const canvas = document.getElementById('circle');
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillStyle = style.getPropertyValue('--accent-red');
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = style.getPropertyValue('--bg-dark');
    ctx.font = "bold 10px Arial";
    if (text.length >= 2) {
        ctx.fillText(text, x - 3*r/4, y + 4);
    } else {
        ctx.fillText(text, x - r/2, y + 4);
    }
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

// Create the dict notesOnBoard or use it if already existing
function createBoardDict() {
    notesOnBoardLocal = {};
    for (u = 0; u < notesArr.length; u++) {
        note = notesArr[u];
        c = [];
        for (i = 0; i < 6; i++) {
            stringN = currentTuning[i];
            y = notesArr.indexOf(stringN);
            if (!notesArr.includes(note)) {
                note = equ[note];
            };
            count = 0;
            while (note != notesArr[y]) {
                y += 1;
                if (y >= notesArr.length) {
                    y = 0;
                };
                count += 1;
            };
            c.push(count);
        };
        notesOnBoardLocal[note] = { 1: c[5], 2: c[4], 3: c[3], 4: c[2], 5: c[1], 6: c[0] };
    };
    notesOnBoard = notesOnBoardLocal;
    return notesOnBoardLocal;
};

// change tuning mode (S;AO;TO)
function changeTuning() {
    var tuningMode = document.getElementById('tuning-select');
    if (getSelectedOption(tuningMode).value != "CUSTOM") {
        currentTuning = getSelectedOption(tuningMode).value;
        text = document.getElementById("custom-tuning")
        text.style.visibility = "hidden"
        createBoardDict()
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

function onTestChange() {
    var key = window.event.keyCode;
    t = document.getElementById("custom-tuning").value
    document.getElementById("custom-tuning").value = t.toUpperCase()

    if (key === 13) {
        if (t.length == 6) {
            t = t.toUpperCase()
            currentTuning = t.toUpperCase()
            writeTune()
            return false;
        } else {
            alert("Seuls les accordages de 6 cordes sont acceptés.")
            document.getElementById("custom-tuning").value = ""
        }
    }
    else {
        return true;
    }
}
