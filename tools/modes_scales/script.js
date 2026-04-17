/**
 * Local script for Modes & Scales tool - Guitar Only Version (Canvas Grid)
 */

let currentTuning = "EADGBE";
let checkedNotes = [];

const enharmonics = {
    "B#": "C", "C#": "D♭", "D♭": "C#", "D#": "E♭", "E♭": "D#", "E": "F♭", "F♭": "E",
    "E#": "F", "F": "E#", "F#": "G♭", "G♭": "F#", "G#": "A♭", "A♭": "G#", "A#": "B♭",
    "B♭": "A#", "B": "C♭", "C♭": "B", "C": "B#"
};

window.addEventListener('DOMContentLoaded', () => {
    initCheckboxes();
    writeTune();
});

function initCheckboxes() {
    const container = document.getElementById('checkbox-container');
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    notes.forEach(n => {
        const label = document.createElement('label');
        label.innerHTML = `${n} <input type="checkbox" value="${n}" class="note-check"> `;
        // add onclick
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

/**
 * Draws the guitar fretboard grid manually on the canvas
 */
function drawGrid(ctx, width, height) {
    const style = getComputedStyle(document.body);
    const gridColor = style.getPropertyValue('--text-white') || '#AEB2B2';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Draw 6 horizontal lines (Strings)
    for (let i = 0; i < 6; i++) {
        const y = 10 + (29.25 * i);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw 15 vertical lines (Frets)
    // Starting offset at 4 for the nut, then 27px intervals
    for (let i = 0; i < 15; i++) {
        const x = 4 + (27 * i);
        ctx.beginPath();
        ctx.lineWidth = (i === 0) ? 3 : 1; // Thicker line for the nut
        ctx.moveTo(x, 10);
        ctx.lineTo(x, 10 + (29.25 * 5));
        ctx.stroke();
    }
}

function writeTune() {
    const root = document.getElementById('tune-select').value;
    const alt = document.getElementById('alt-select').value;
    const modeKey = document.getElementById('mode-select').value;

    const scale = TheoryEngine.getScale(root, modeKey, alt);

    const boxes = document.querySelectorAll('.note-check');
    boxes.forEach(b => b.checked = false);

    checkedNotes = scale.map(n => {
        let clean = n.replace('♮', '');
        let box = document.querySelector(`.note-check[value="${clean}"]`);
        if (!box && enharmonics[clean]) {
            clean = enharmonics[clean];
            box = document.querySelector(`.note-check[value="${clean}"]`);
        }
        if (box) box.checked = true;
        return clean;
    });

    updateVisuals();
    updateChordTable(scale, modeKey);
}

function updateVisuals() {
    const canvas = document.getElementById('circle');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the grid background first
    drawGrid(ctx, canvas.width, canvas.height);

    checkedNotes.forEach(note => drawGuitarNote(note));
}

function drawGuitarNote(note) {
    const notesArr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
        let openNote = currentTuning[5 - stringIdx];
        let startIdx = notesArr.indexOf(openNote);
        let targetIdx = notesArr.indexOf(note);
        let fret = (targetIdx - startIdx + 12) % 12;

        // Draw note on current fret
        drawCircle(18 + (27 * (fret - 1)), 10 + (29.25 * stringIdx), note);
        // Draw octave duplicate (fret 12+)
        if (fret <= 3) drawCircle(18 + (27 * (fret + 11)), 10 + (29.25 * stringIdx), note);
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
    ctx.fillText(text, x - 5, y + 4);
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
        let roman = TheoryEngine.getRomanNumeral(i, quality);
        let chordName = note + (quality === 'M' ? '' : quality === 'd' ? '°' : quality);

        headRow.insertCell().innerText = roman;
        dataRow.insertCell().innerText = chordName;
    });
}