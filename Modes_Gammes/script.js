
/*-----------------\
| GLOBAL VARIABLES |
\-----------------*/
// Instrument currently showed
var globalInstrument;

// Where're the notes on the keyboard (index used in drawCircleForPiano fct)
const notesOnKeyBoard = {
    "C": 1,
    "C#": 1,
    "D": 2,
    "D#": 2,
    "E": 3,
    "F": 4,
    "F#": 4,
    "G": 5,
    "G#": 5,
    "A": 6,
    "A#": 6,
    "B": 7
};

// Note on each guitar string
let tuning = "EADGBE";

// Equivalent for each note to avoid for exemple A# & B♭ in the same scale
const equ = {
    "C": "B#",
    "C#": "D♭",
    "D♭": "C#",
    "E♭": "D#",
    "D#": "E♭",
    "E": "F♭",
    "F♭": "E",
    "F": "E#",
    "E#": "F",
    "F#": "G♭",
    "G♭": "F#",
    "G#": "A♭",
    "A♭": "G#",
    "B♭": "A#",
    "A#": "B♭",
    "B": "C♭",
    "C♭": "B",
    "B#": "C"
};
// All notes used to creates scales in scale_constructor fct
const all_notes = [
    "C♮B#",
    "C#D♭",
    "D♮",
    "D#E♭",
    "E♮F♭",
    "E#F♮",
    "F#G♭",
    "G♮",
    "G#A♭",
    "A♮",
    "A#B♭",
    "B♮C♭"
];

// All Notes, used to creates noteOnBoard dict
const notesaze = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

// All modes and their construction used in scale_constructor fct
const mode = {
    "M": [2, 2, 1, 2, 2, 2], //Majeur
    "m": [2, 1, 2, 2, 1, 2], //mineur
    "D": [2, 1, 2, 2, 2, 1], //Dorien
    "P": [1, 2, 2, 2, 1, 2], //Phrygien
    "L": [2, 2, 2, 1, 2, 2], //Lydien
    "X": [2, 2, 1, 2, 2, 1], //Mixolydien
    "E": [2, 1, 2, 2, 1, 2], //Eolien
    "O": [1, 2, 2, 1, 2, 2], //Locrien
    "K": [2, 2, 3, 2],       //Penta Majeur
    "J": [3, 2, 2, 3]        //Penta mineur
};

// Chart of chords for each mode used in findChords fct
const chords_charts = {
    "M": "MmmMMmd", //majeur
    "m": "mdMmmMM", //mineur
    "D": "mmMMmdM", //Dorien
    "P": "mMMmdMm", //Phrygien
    "L": "MMmdMmm", //Lydien
    "X": "MmdMmmM", //Mixolydien
    "E": "mdMmmMM", //Eolien
    "O": "dMmmMMm", //Locrien
};

// List of all checked note
let checkedcheckboxes = [];

// Dict for all notes on guitar board; -1 at the beginning then filled in createBoardDict() fct
let notesOnBoard;

// Init globalInstrument & Background
function init() {
    var instrument = document.getElementById('instrument-select');
    globalInstrument = getSelectedOption(instrument).value
    if (globalInstrument == "G") {
        document.body.style.backgroundImage = "url('grille.gif')";
    } else if (globalInstrument == "P") {
        document.body.style.backgroundImage = "url('piano.png')";
    };
    writeTune();
};
init();

// Update globalInstrument and change instrument mode (G;P)
function changeInstrument() {
    var instrument = document.getElementById('instrument-select');
    globalInstrument = getSelectedOption(instrument).value;
    if (globalInstrument == "G") {
        document.body.style.backgroundImage = "url('grille.gif')";
        text = document.getElementById("tuning-select")
        text.style.visibility = "visible"
    } else if (globalInstrument == "P") {
        document.body.style.backgroundImage = "url('piano.png')";
        text = document.getElementById("tuning-select")
        text.style.visibility = "hidden"
    };
    writeTune();
};

// Update globalInstrument and change tuning mode (S;AO;TO)
function changeTuning() {
    var tuningMode = document.getElementById('tuning-select');
    if (getSelectedOption(tuningMode).value != "CUSTOM") {
        tuning = getSelectedOption(tuningMode).value;
        text = document.getElementById("custom-tuning")
        text.style.visibility = "hidden"
        createBoardDict()
        writeTune()
    } else {
        text = document.getElementById("custom-tuning")
        text.style.visibility = "visible"
        text.placeholder = tuning
    }

};

// Draw Circle at a given Coo with the text T
function drawCircleGen(X, Y, T, R = 8) {
    const style = window.getComputedStyle(document.body)
    var canvas = document.getElementById('circle');
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = style.getPropertyValue('--accent-red');
        ctx.arc(X, Y, R, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.fillStyle = style.getPropertyValue('--bg-dark');
        ctx.fillText(T, X - R / 2, Y + 3.25);
        ctx.font = 'bold 8px Arial';
        ctx.strokeStyle = style.getPropertyValue('--accent-red');
        ctx.stroke();
    };
};

// Draw circle for a note on the keyboard
function drawCircleForPiano(note) {
    n = notesOnKeyBoard[note];
    if (note.includes("#") || note.includes("♭")) {
        X = 54 + (58.5 * (n - 1));
        Y = 110;
    } else {
        X = 26 + (58 * (n - 1));
        Y = 180;
    }
    drawCircleGen(X, Y, note, 12.5);
};

// Determine coo for a note & draw a circle on this coo with the text T
function drawCircleForGuitar(c, f, T) {
    if (f != 0) {
        X = 18 + (27 * (f - 1));
        Y = 10 + (29.25 * (c - 1));
    } else {
        X = 4;
        Y = 10 + (29.25 * (c - 1));
    }
    drawCircleGen(X, Y, T);
};

// Fill checkedcheckboxes
function sort(t) {
    var e = document.getElementById(t.id);
    if (e.checked) {
        checkedcheckboxes = [];
        const checkboxes = document.querySelectorAll('input[name="f"]:checked');
        checkboxes.forEach((checkbox) => {
            checkedcheckboxes.push(checkbox.value);
        });
        drawAllCircles();
    } else {
        index = checkedcheckboxes.indexOf(e.value);
        checkedcheckboxes.splice(index, 1);
        update();
    };
};

// Reset CheckBox
function resetCheckBox() {
    var canvas = document.getElementById('circle');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1000, 1000);
    const checkboxes = document.querySelectorAll('input[name="f"]');
    checkboxes.forEach(c => {
        if (c.checked) c.checked = false;
    });
};

// Draw All Circles with canvas init
function update() {
    var canvas = document.getElementById('circle');
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1000, 1000);
        drawAllCircles();
    };
};

// Draw Cricles For Each Checked Box
function drawAllCircles() {
    canvas = document.getElementById('circle');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    checkedcheckboxes.forEach((c) => {
        if (globalInstrument == 'G') {
            for (const [key, value] of Object.entries(createBoardDict()[c])) {
                drawCircleForGuitar(key, value, c);
                if (value <= 3) {
                    drawCircleForGuitar(key, value + 12, c);
                };
            };
        } else if (globalInstrument == 'P') {
            drawCircleForPiano(c);
        };
    });
};

// Takes the selected tune, and draws the notes of the scale on the board
function writeTune() {
    table = document.getElementsByTagName('table');
    var tune = document.getElementById('tune-select');
    tune = getSelectedOption(tune).innerHTML;
    var alt = document.getElementById('alt-select');
    if (getSelectedOption(alt).innerHTML == "") { alt = "♮" } else { alt = getSelectedOption(alt).innerHTML };
    var mode = document.getElementById('mode-select');
    if (getSelectedOption(mode).value == "") { mode = "M" } else { mode = getSelectedOption(mode).value };
    if (tune != "") {
        var tempTune = tune + alt + mode;
        findChords(tempTune);
        resetCheckBox();
        scale_constructor(tempTune).forEach(n => {
            if (!Object.keys(createBoardDict()).includes(n) || !Object.keys(notesOnKeyBoard).includes(n)) {
                n = equ[n];
            };
            if (globalInstrument == "G") {
                for (const [key, value] of Object.entries(createBoardDict()[n])) {
                    drawCircleForGuitar(key, value, n);
                    if (value <= 3) {
                        drawCircleForGuitar(key, value + 12, n);
                    };
                    if (n.includes("♭")) {
                        n = equ[n];
                    };
                    var g = document.getElementById(n);
                    if (g == null) {
                        n = equ[n];
                        g = document.getElementById(n);
                    };
                    g.checked = true;
                };
            } else if (globalInstrument == "P") {
                drawCircleForPiano(n);
                if (n.includes("♭")) {
                    n = equ[n];
                };
                var g = document.getElementById(n);
                if (g == null) {
                    n = equ[n];
                    g = document.getElementById(n);
                };
                g.checked = true;
            };
        });
    } else {
        table.innerHTML = "";
        updateCheckBox();
    };
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

// Convert the interval (note -> next note) to the interval (root -> note)
function mode_interval_to_mode(modelocal) {
    rMode = [];
    for (let index = 0; index < modelocal.length; index++) {
        const element = modelocal[index];
        if (index == 0) {
            rMode.push(element);
        } else {
            rMode.push(rMode[index - 1] + element);
        };
    };
    return rMode;
};

// Construct the scale based on tune using mode can return mode name if returnMode is given (!=0)
function scale_constructor(tune, returnMode = 0) {
    root = tune.substring(0, 2);
    alteration = root.slice(-1);
    tune_mode = mode_interval_to_mode(mode[tune.slice(-1)]);
    indexOfRoot = 0;
    for (let i = 0; i < all_notes.length; i++) {
        if (all_notes[i].includes(root)) {
            indexOfRoot = i;
            break;
        };
    };
    final_gamme = [root];
    tune_mode.forEach(shift => {
        new_note = all_notes[(indexOfRoot + shift) % all_notes.length];
        final_gamme.push(new_note);
    });
    for (i = 0; i < final_gamme.length; i++) {
        if (alteration == "#") {
            if (final_gamme[i].length > 2) {
                final_gamme[i] = final_gamme[i].substring(0, 2);
            };
        } else if (alteration == "♭") {
            if (final_gamme[i].length > 2) {
                final_gamme[i] = final_gamme[i].slice(-2);
            };
        } else {
            if (final_gamme[i].length > 2) {
                final_gamme[i] = final_gamme[i].slice(-2);
            };
        };
        if (final_gamme[i].includes("♮")) {
            final_gamme[i] = final_gamme[i][0];
        };
    };
    if (returnMode == 0) {
        return final_gamme;
    } else {
        return [final_gamme, tune.slice(-1)];
    };
};

// Find all the chord of the scale according to chords_charts dict and generate the HTML table
function findChords(tune) {
    temp = scale_constructor(tune, 1);
    scale = temp[0];
    findChords_mode = temp[1];
    chord_list = [];
    chord_dict = {};
    for (i = 0; i < scale.length; i++) {
        if (form_Chord_From_Scale_And_Number(i, scale, findChords_mode) != -1) {
            chord = form_Chord_From_Scale_And_Number(i, scale, findChords_mode);
            chord_dict[toRomanNumberSymbol(i, chord)] = chord;
        } else {
            break;
        };
    };
    let table = document.querySelector("table");
    table.innerHTML = "";
    let data = Object.keys(chord_dict);
    generateTableHead(table, data);
    generateTable(table, chord_dict);
};

// Find the chord for a given note of the scale according to chords_charts dict
function form_Chord_From_Scale_And_Number(n, scale, form_Chord_From_Scale_And_Number_mode) {
    note = scale[n];
    if (!Object.keys(chords_charts).includes(form_Chord_From_Scale_And_Number_mode)) return -1;
    chart = chords_charts[form_Chord_From_Scale_And_Number_mode];
    if (chart[n] == "M") {
        return note;
    } else if (chart[n] == "d") {
        return `${note}°`;
    } else {
        ;
        return `${note}${chart[n]}`;
    };
};

// Change the case of the roman symbol according to the chord
function toRomanNumberSymbol(num, chord) {
    if (chord.charAt(chord.length - 1) == "M" || chord.length == 1) {
        return romanize(num + 1);
    } else if (chord.charAt(chord.length - 1) == "m") {
        return romanize(num + 1).toLowerCase();
    } else if (chord.charAt(chord.length - 1) == "°") {
        return romanize(num + 1) + "°";
    } else {
        return romanize(num + 1);
    };
};

// Give the roman number corresponding to the given number
function romanize(num) {
    var lookup = { V: 5, IV: 4, I: 1 }, roman = '', i;
    for (i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        };
    };
    return roman;
};

// Generate the rows of the chords table
function generateTableHead(table, chord_dict) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of chord_dict) {
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    };
};

// Insert the cell of the chords table
function generateTable(table, chord_dict) {
    let row = table.insertRow();
    for (key in chord_dict) {
        let cell = row.insertCell();
        let text = document.createTextNode(chord_dict[key]);
        cell.appendChild(text);
    };
};

// Create the dict notesOnBoard or use it if already existing
function createBoardDict() {
    notesOnBoardLocal = {};
    for (u = 0; u < notesaze.length; u++) {
        note = notesaze[u];
        c = [];
        for (i = 0; i < 6; i++) {
            stringN = tuning[i];
            y = notesaze.indexOf(stringN);
            if (!notesaze.includes(note)) {
                note = equ[note];
            };
            count = 0;
            while (note != notesaze[y]) {
                y += 1;
                if (y >= notesaze.length) {
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

function onTestChange() {
    var key = window.event.keyCode;
    t = document.getElementById("custom-tuning").value
    document.getElementById("custom-tuning").value = t.toUpperCase()

    if (key === 13) {
        if (t.length == 6) {
            t = t.toUpperCase()
            tuning = t.toUpperCase()
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
