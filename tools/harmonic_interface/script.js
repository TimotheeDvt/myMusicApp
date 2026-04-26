/******************
 * CONFIGURATIONS *
 ******************/
const CONFIG = {
	subdivisions: 12,
	radius: 50,
	startFreq: 440,
	endFreq: this.startFreq * 2,
	canvasSize: 500,
	dotSize: 4,
	scaleFactor: 4,
	smallestInterval: undefined,

	maxVoices: 10,
	attackTime: 0.02,
	releaseTime: 0.05,
	scaleJustIntonation: [
		1, 16 / 15, 10 / 9, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 64 / 42, 3 / 2, 8 / 5, 5 / 3, 7 / 4, 16 / 9, 9 / 5, 15 / 8, 2
	],
	scalePythagorean: [
		1, 256 / 243, 9 / 8, 32 / 27, 81 / 64, 4 / 3, 1024 / 729, 729 / 512, 3 / 2, 128 / 81, 27 / 16, 16 / 9, 243 / 128, 2
	]
};
const CONFIG_TO_STORE = ["subdivisions", "startFreq"]
const letters = ["AZERTYUIOPQSDFGHJKLMWXCVBN123456789", "QWERTYUIOPASDFGHJKLZXCVBNM123456789"];
const style = window.getComputedStyle(document.body)
let COLORS = {
	white: style.getPropertyValue('--text-white'),
	black: style.getPropertyValue('--text-dark'),
	red: style.getPropertyValue('--accent-red'),
	blue: style.getPropertyValue('--accent-blue')
};

const state = {
	notes: [],
	showFreq: true,
	showKeys: true,
	showNoteNames: true,
	showWave: true,
	darkMode: true,
	layout: 0,
	type: "sine",
	time: 0,
	scale: "justIntonation"
};

/********************
 * AUDIO MANAGEMENT *
 * (Now using AudioManager)
 ********************/
function stopNote(frequency) {
	AudioManager.stopNote(frequency);
}

function stopAllNotes() {
	AudioManager.stopAll();
}

function playNote(frequency, velocity) {
	AudioManager.playNote(frequency, state.type, velocity);
	drawPlayingNotes();
}

// Internal noteOff kept for compatibility with MIDI/Keyboard logic
function noteOff(frequency) {
	AudioManager.stopNote(frequency);
	drawPlayingNotes();
}

/*************************
 * CALCULATION FUNCTIONS *
 *************************/
function calculateNoteFrequencies() {
	if (state.scale === "justIntonation")
		return Array.from({ length: CONFIG.subdivisions }, (_, i) => {
			return CONFIG.startFreq * CONFIG.scaleJustIntonation[i];
		});
	if (state.scale === "pythagorean") {
		return Array.from({ length: CONFIG.subdivisions }, (_, i) => {
			return CONFIG.startFreq * CONFIG.scalePythagorean[i];
		});
	}
	// Use TheoryEngine for EDO if subdivisions != 12, otherwise default log
	return TheoryEngine.calculateEDOFrequencies(CONFIG.startFreq, CONFIG.subdivisions);
}

function calculateNotePositions(radius = CONFIG.radius) {
	const ret = [{ x: radius * Math.cos(-Math.PI / 2), y: radius * Math.sin(-Math.PI / 2), angle: -Math.PI / 2 }];
	for (let i = 1; i < CONFIG.subdivisions; i++) {
		const angle = (i * 2 * Math.PI) / CONFIG.subdivisions - Math.PI / 2;
		ret.push({
			x: radius * Math.cos(angle),
			y: radius * Math.sin(angle),
			angle
		});
	}
	return ret;
}

function normalize(value, min, max, newMin, newMax) {
	return ((value - min) * (newMax - newMin)) / (max - min) + newMin;
}


/*********************
 * DRAWING FUNCTIONS *
 *********************/
function setupCanvas(canvas) {
	canvas.width = CONFIG.canvasSize;
	canvas.height = CONFIG.canvasSize;
	canvas.style.width = `${CONFIG.canvasSize}px`;
	canvas.style.height = `${CONFIG.canvasSize}px`;

	const ctx = canvas.getContext('2d');
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.scale(CONFIG.scaleFactor, CONFIG.scaleFactor);
	ctx.lineWidth = 0.5;
	return ctx;
}

function drawMainCircle() {
	const canvas = document.getElementById('circle');
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = COLORS.blue;
	ctx.strokeStyle = COLORS.blue;
	ctx.beginPath();
	ctx.arc(0, 0, CONFIG.radius, 0, Math.PI * 2);
	ctx.stroke();
}

function drawAllNotes() {
	const frequencies = calculateNoteFrequencies();
	const positions = calculateNotePositions();
	state.notes = positions.map((pos, i) => ({ ...pos, frequency: frequencies[i], index: i, velocity: 0 }));
}

function fillTable() {
	const table = document.getElementById('table');
	const notes = state.notes;
	const rows = TheoryEngine.findSmallestPerfectSquare(notes.length);
	const cols = rows;

	table.innerHTML = '';

	for (let i = 0; i < rows; i++) {
		const row = document.createElement('tr');
		for (let j = 0; j < cols; j++) {
			const index = i * cols + j;
			if (index < notes.length) {
				const cell = document.createElement('td');
				cell.innerHTML = `<p>${index}</p>`;
				cell.dataset.frequency = notes[index].frequency;
				cell.dataset.index = index;
				if (state.showFreq) {
					const freq = document.createElement('div');
					freq.className = "freq";
					freq.innerText = notes[index].frequency.toFixed(2) + " Hz";
					cell.appendChild(freq);
				}
				if (state.showKeys) {
					const key = document.createElement('div');
					key.className = "key";
					key.innerText = letters[state.layout][index % (CONFIG.subdivisions)] || "";
					cell.appendChild(key);
				}
				if (state.showNoteNames && (CONFIG.subdivisions == 12 || CONFIG.subdivisions == 24)) {
					const key = document.createElement('div');
					key.className = "noteName";
					key.innerText = TheoryEngine.getEDONoteName(index, CONFIG.subdivisions) || "";
					cell.appendChild(key);
				}
				row.appendChild(cell);
			}
		}
		table.appendChild(row);
	}
	const emptyCells = table.querySelectorAll('td:not([data-frequency])');
	for (cell of emptyCells) cell.style.border = "none";
}

function updateTableSize() {
	const tds = document.querySelectorAll('td');
	const trs = document.querySelectorAll('tr');
	const ps = document.querySelectorAll('td>p');
	const table = document.getElementById('table-container');

	const tableWidth = table.clientWidth;
	const tableHeight = table.clientHeight;
	const rows = trs.length;
	const cols = trs[0]?.children.length || 0;

	const cellSize = Math.floor(Math.min(tableWidth / cols, tableHeight / rows));

	for (let i = 0; i < tds.length; i++) {
		tds[i].style.width = tds[i].style.height = tds[i].style.maxWidth = tds[i].style.maxHeight = `${cellSize}px`;
		tds[i].style.overflow = 'hidden';
		if (ps[i]) ps[i].style.fontSize = `${cellSize / 2}px`;
	}

	const keys = document.querySelectorAll('.key');
	const freqs = document.querySelectorAll('.freq');
	const noteNames = document.querySelectorAll('.noteName');
	for (const key of keys) key.style.fontSize = `${cellSize / 6}px`;
	for (const noteName of noteNames) noteName.style.fontSize = `${cellSize / 6}px`;
	for (const freq of freqs) freq.style.fontSize = `${cellSize / 8}px`;
}

function drawPlayingNotes() {
	const canvas = document.getElementById('circle');
	const ctx = canvas.getContext('2d');
	const notes = state.notes;

	ctx.clearRect(-CONFIG.canvasSize / 2, -CONFIG.canvasSize / 2, CONFIG.canvasSize, CONFIG.canvasSize);
	setupCanvas(canvas);
	drawMainCircle();
	writeIndexes();

	if (AudioManager.state.activeVoices.length === 0) return;

	let playingNotes = Object.keys(AudioManager.state.activeVoices).map(freqStr => {
		const activeFreq = parseFloat(freqStr);

		return notes.find(note => {
			const semitoneDistance = CONFIG.subdivisions * Math.log2(activeFreq / note.frequency);

			const octaveOffset = Math.abs((semitoneDistance % CONFIG.subdivisions + CONFIG.subdivisions) % CONFIG.subdivisions);

			return octaveOffset < 0.01 || octaveOffset > CONFIG.subdivisions - 0.01;
		});
	}).filter(n => n);

	// Draw on circle
	if (playingNotes.length >= 1) {
		playingNotes.sort((a, b) => a.index - b.index);

		playingNotes.forEach((note, i) => {
			ctx.beginPath();
			ctx.fillStyle = COLORS.red
			ctx.arc(note.x, note.y, 1, 0, Math.PI * 2);
			ctx.fill();

			let nextNote;
			if (i < playingNotes.length - 1) {
				nextNote = playingNotes[i + 1];
			} else if (playingNotes.length > 2) {
				nextNote = playingNotes[0]; // Loop back
			}

			if (nextNote) {
				drawVariableLine(ctx, note, nextNote);
			}
		});
	}

	// Draw on table
	notes.forEach(note => {
		const cell = document.querySelector(`td[data-index="${note.index}"]`);
		if (!cell) return;

		const noteMidi = CONFIG.subdivisions * Math.log2(note.frequency / CONFIG.startFreq) + 69;
		const notePitchClass = (noteMidi % CONFIG.subdivisions + CONFIG.subdivisions) % CONFIG.subdivisions;

		const activeFreqKey = Object.keys(AudioManager.state.activeVoices).find(freqStr => {
			const f = parseFloat(freqStr);
			const activeMidi = CONFIG.subdivisions * Math.log2(f / CONFIG.startFreq) + 69;
			const activePC = (activeMidi % CONFIG.subdivisions + CONFIG.subdivisions) % CONFIG.subdivisions;
			return Math.abs(activePC - notePitchClass) < 0.01;
		});

		if (activeFreqKey) {
			const velocity = AudioManager.state.activeVoices[activeFreqKey].velocity || 100;
			note.velocity = velocity;
			cell.style.backgroundColor = "#FE5658" + velocityToHexOpacity(velocity);
			cell.classList.add("active");
		} else {
			cell.style.backgroundColor = "";
			cell.classList.remove("active");
		}
	});

	const notesToHighlight = playingNotes.map(note => {
		const noteName = TheoryEngine.getEDONoteName(note.index, CONFIG.subdivisions);
		return noteName;
	}).join(" - ");

	const keyboard = document.querySelector('custom-keyboard');
	if (keyboard) {
		keyboard.setAttribute('keys', notesToHighlight);

		if (CONFIG.subdivisions === 24) {
			keyboard.setAttribute('is24edo', 'true');
		} else {
			keyboard.setAttribute('is24edo', 'false');
		}
	}
}

function drawVariableLine(ctx, n1, n2) {
	const minOpactity = 0.3;
	const maxOpacity = 2.5;
	const w1 = normalize(n1.velocity || 100, 0, 127, minOpactity, maxOpacity) / 2;
	const w2 = normalize(n2.velocity || 100, 0, 127, minOpactity, maxOpacity) / 2;

	const dx = n2.x - n1.x;
	const dy = n2.y - n1.y;
	const angle = Math.atan2(dy, dx);

	const sinA = Math.sin(angle);
	const cosA = Math.cos(angle);

	const p1x = n1.x + w1 * sinA;
	const p1y = n1.y - w1 * cosA;
	const p2x = n1.x - w1 * sinA;
	const p2y = n1.y + w1 * cosA;

	const p3x = n2.x - w2 * sinA;
	const p3y = n2.y + w2 * cosA;
	const p4x = n2.x + w2 * sinA;
	const p4y = n2.y - w2 * cosA;

	ctx.beginPath();
	ctx.moveTo(p1x, p1y);
	ctx.lineTo(p2x, p2y);
	ctx.lineTo(p3x, p3y);
	ctx.lineTo(p4x, p4y);
	ctx.closePath();

	ctx.fillStyle = COLORS.red;
	ctx.fill();
}

function normalize(value, min, max, newMin, newMax) {
	return ((value - min) * (newMax - newMin)) / (max - min) + newMin;
}

function velocityToHexOpacity(velocity) {
	const maxVelocity = 127; // MIDI max velocity
	const minOpacity = 0.3;
	const maxOpacity = 1;
	const opacity = normalize(velocity, 0, maxVelocity, minOpacity, maxOpacity);
	const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');
	return hexOpacity;
}

function writeIndexes() {
	const notes = state.notes;
	const canvas = document.getElementById("circle");
	const ctx = canvas.getContext('2d');
	const newPos = calculateNotePositions(CONFIG.radius + 5);

	ctx.font = `6px Courier New`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	notes.forEach((note, i) => {
		const isActive = AudioManager.state.activeVoices[note.frequency];
		const noteMidi = CONFIG.subdivisions * Math.log2(note.frequency / CONFIG.startFreq) + 69;
		const notePitchClass = (noteMidi % CONFIG.subdivisions + CONFIG.subdivisions) % CONFIG.subdivisions;
		const activeFreqKey = Object.keys(AudioManager.state.activeVoices).find(freqStr => {
			const f = parseFloat(freqStr);
			const activeMidi = CONFIG.subdivisions * Math.log2(f / CONFIG.startFreq) + 69;
			const activePC = (activeMidi % CONFIG.subdivisions + CONFIG.subdivisions) % CONFIG.subdivisions;
			return Math.abs(activePC - notePitchClass) < 0.01;
		});
		ctx.fillStyle = ctx.strokeStyle = activeFreqKey ? COLORS.blue : COLORS.white;
		ctx.fillText(note.index, newPos[i].x, newPos[i].y);
		ctx.strokeText(note.index, newPos[i].x, newPos[i].y);
	});
}

function drawWaveForms() {
	if (!state.showWave) return;
	const canvas = document.getElementById('waveform');
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const waveformHeight = canvas.height;
	for (let voice of Object.values(AudioManager.state.activeVoices)) {
		const frequency = voice.osc.frequency.value;
		ctx.strokeStyle = COLORS.blue;
		ctx.beginPath();
		for (let i = 0; i < canvas.width; i += 2) {
			const x = (i / canvas.width) * 2 * Math.PI * frequency / 100 + state.time;
			let y;
			switch (state.type) {
				case 'sine':
					y = Math.sin(x) * (waveformHeight / 2) + waveformHeight / 2;
					break;
				case 'square':
					y = Math.sign(Math.sin(x)) * (waveformHeight / 2) + waveformHeight / 2;
					break;
				case 'sawtooth':
					y = ((x / Math.PI) % 2 - 1) * (waveformHeight / 2) + waveformHeight / 2;
					break;
				case 'triangle':
					y = Math.abs((x / Math.PI) % 2 - 1) * (waveformHeight / 2) + waveformHeight / 2;
					break;
			}
			y = normalize(y, 0, waveformHeight, 0, 0 + waveformHeight);
			ctx.lineTo(i, y);
		}
		ctx.stroke();
	}
	state.time += 0.05;
	if (state.time > 2 * Math.PI) state.time = 0; // Reset time to avoid overflow
}

/******************
 * EVENT HANDLERS *
 ******************/
function handleTableClick(event) {
	const cell = event.target.closest('td');
	if (!cell) return;
	const frequency = parseFloat(cell.dataset.frequency);
	if (frequency) {
		if (AudioManager.state.activeVoices[frequency]) stopNote(frequency);
		else playNote(frequency);
	}
	update();
}

function handleCanvasClick(event) {
	const canvas = document.getElementById('circle');
	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;
	const canvasX = (event.clientX - rect.left) * scaleX;
	const canvasY = (event.clientY - rect.top) * scaleY;
	const click = {
		x: (canvasX - canvas.width / 2) / CONFIG.scaleFactor,
		y: (canvasY - canvas.height / 2) / CONFIG.scaleFactor
	};
	const clickRadius = 7;
	const newPos = calculateNotePositions(CONFIG.radius + 5);
	state.notes.forEach((note, i) => {
		const distance = Math.sqrt((click.x - newPos[i].x) ** 2 + (click.y - newPos[i].y) ** 2);
		if (distance < clickRadius) {
			if (AudioManager.state.activeVoices[note.frequency]) stopNote(note.frequency);
			else playNote(note.frequency);
		}
	});
	update();
}

function handleShowFreqClick() { state.showFreq = !state.showFreq; update(); }
function handleShowKeysClick() { state.showKeys = !state.showKeys; update(); }
function handleShowNoteNamesClick() { state.showNoteNames = !state.showNoteNames; update(); }
function handleShowWaveFormClick() {
	state.showWave = !state.showWave;
	const canvas = document.getElementById('waveform');
	canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
	update();
}

function handleLayoutChange() {
	state.layout = document.getElementById('changeLayout').value === "AZERTY" ? 0 : 1;
	update();
}

function handleWaveFormChange() {
	AudioManager.stopAll();
	state.type = document.getElementById('changeWaveform').value;
	update();
}

function handleScaleChange() {
	state.scale = document.getElementById('changeScale').value;
	update();
}

/********************
 * KEYBOARD SUPPORT *
 ********************/
const key_to_index = {};
function calculate_key_to_index() {
	const keys = letters[state.layout].split('');
	for (let i = 0; i < keys.length; i++) {
		key_to_index[keys[i]] = i % (CONFIG.subdivisions);
	}
}

function keyToFrequency(key) {
	if (!key) return null;
	const cleanKey = key.toUpperCase().trim();
	const index = key_to_index[cleanKey];

	return (index !== undefined && state.notes[index])
		? state.notes[index].frequency
		: null;
}

const pressedKeys = new Set();
document.addEventListener('keydown', (e) => {
	if (pressedKeys.has(e.key)) return;
	pressedKeys.add(e.key);
	const noteKey = keyToFrequency(e.key);
	if (noteKey) playNote(noteKey);
	else if (e.key === " ") { stopAllNotes(); }
	update();
});

document.addEventListener('keyup', (e) => {
	pressedKeys.delete(e.key);
	const noteKey = keyToFrequency(e.key);
	if (noteKey) stopNote(noteKey);
	update();
});

function preventSubmit1(e) { if (e.key === 'Enter') { CONFIG.startFreq = parseFloat(e.target.value); update(); e.preventDefault(); } }
function preventSubmit2(e) { if (e.key === 'Enter') { CONFIG.subdivisions = parseInt(e.target.value); update(); e.preventDefault(); } }

document.addEventListener("click", () => {
	AudioManager.init();
	document.getElementById("toRemove").style.visibility = "hidden";
}, { once: true });

/******************
 * INITIALIZATION *
 ******************/
function init() {
	const storedSubdivisions = localStorage.getItem("subdivisions");
	const storedStartFreq = localStorage.getItem("startFreq");
	if (storedSubdivisions) {
		CONFIG.subdivisions = parseInt(storedSubdivisions);
		document.getElementById('subdivNb').value = CONFIG.subdivisions;
	}
	if (storedStartFreq) {
		CONFIG.startFreq = parseFloat(storedStartFreq);
		document.getElementById('StartingFreq').value = CONFIG.startFreq;
	}

	if (document.getElementById('subdivNb').value == 24 || document.getElementById('subdivNb').value == 12) {
		const keyboardContainer = document.querySelector('#keyboard-container');
		keyboardContainer.style.display = 'block';
		const keyboard = document.querySelector("custom-keyboard");
		keyboard.setAttribute('is24edo', CONFIG.subdivisions == 24 ? "true" : "false");
	} else {
		const keyboardContainer = document.querySelector('#keyboard-container');
		keyboardContainer.style.display = 'none';
	}

	handleLayoutChange();
	document.getElementById('circle').addEventListener('click', handleCanvasClick);
	document.getElementById('table').addEventListener('click', handleTableClick);
	document.querySelector('#showFreq').addEventListener('click', handleShowFreqClick);
	document.querySelector('#showKey').addEventListener('click', handleShowKeysClick);
	document.querySelector('#showNoteNames').addEventListener('click', handleShowNoteNamesClick);
	document.querySelector('#showWave').addEventListener('click', handleShowWaveFormClick);
	document.querySelector('#changeLayout').addEventListener('change', handleLayoutChange);
	document.querySelector('#changeWaveform').addEventListener('change', handleWaveFormChange);
	document.querySelector('#changeScale').addEventListener('change', handleScaleChange);
	document.querySelector('#subdivNb').addEventListener('change', (e) => {
		CONFIG.subdivisions = parseInt(e.target.value);
		if (CONFIG.subdivisions != 12 && CONFIG.subdivisions != 24) {
			state.showNoteNames = false;
			document.querySelector('#showNoteNames').checked = false;

			const keyboardContainer = document.querySelector('#keyboard-container');
			keyboardContainer.style.display = 'none';
		} else {
			const keyboardContainer = document.querySelector('#keyboard-container');
			keyboardContainer.style.display = 'block';
			const keyboard = document.querySelector("custom-keyboard");
			keyboard.setAttribute('is24edo', CONFIG.subdivisions == 24 ? "true" : "false");
		}
		localStorage.setItem("subdivisions", CONFIG.subdivisions);
		update();
	});
	document.querySelector('#StartingFreq').addEventListener('change', (e) => {
		CONFIG.startFreq = parseFloat(e.target.value);
		localStorage.setItem("startFreq", CONFIG.startFreq);
		update();
	});

	update();
}

function update() {
	const select = document.getElementById('changeScale');
	if (CONFIG.subdivisions == 12) {
		state.scale = select.value;
		select.hidden = false;
	} else {
		select.hidden = true;
		state.scale = null;
	}
	calculate_key_to_index();
	drawAllNotes();
	fillTable();
	drawPlayingNotes();
	updateTableSize();
}

setInterval(() => {
	drawWaveForms();
	drawPlayingNotes();
}, 1000 / 50);

init();

document.getElementById('toggle-footer').addEventListener('click', () => {
	document.querySelector('footer').classList.toggle('folded');
	localStorage.setItem("foldedHarmonic", document.querySelector('footer').classList.contains('folded'))
});

if (localStorage.getItem("foldedHarmonic") === "true") {
	document.querySelector('footer').classList.add('folded');
}

document.addEventListener('keydown', (event) => {
	const isHardRefresh = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'r';

	if (isHardRefresh) {
		localStorage.clear();
	}
});