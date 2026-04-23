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

	let playingNotes = Object.keys(AudioManager.state.activeVoices).map(freqStr => {
		const activeFreq = parseFloat(freqStr);

		return notes.find(note => {
			const semitoneDistance = CONFIG.subdivisions * Math.log2(activeFreq / note.frequency);

			const octaveOffset = Math.abs((semitoneDistance % CONFIG.subdivisions + CONFIG.subdivisions) % CONFIG.subdivisions);

			return octaveOffset < 0.01 || octaveOffset > CONFIG.subdivisions - 0.01;
		});
	}).filter(n => n);

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
function handleShowNoteNamesClick() {state.showNoteNames = !state.showNoteNames; update(); }
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

// if audio manager is already initialized (e.g. from another tool), we can skip the user interaction step
if (!AudioManager.isInitialized) {
	const toRemove = document.getElementById("toRemove");
	toRemove.style.visibility = "hidden";
} else {
	document.addEventListener("click", () => {
		AudioManager.init();
		document.getElementById("toRemove").style.visibility = "hidden";
	}, { once: true });
}

/******************
 * INITIALIZATION *
 ******************/
function init() {
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
		}
		update();
	});
	document.querySelector('#StartingFreq').addEventListener('change', (e) => { CONFIG.startFreq = parseFloat(e.target.value); update(); });

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

setInterval(drawWaveForms, 1000 / 50);

init();

// MIDI Logic kept exactly as is, just calling playNote/noteOff
if (navigator.requestMIDIAccess) {
	navigator.requestMIDIAccess({ sysex: true })
		.then(onMIDISuccess, onMIDIFailure)
		.catch((error) => console.error("Error accessing MIDI devices:", error));
} else {
	console.error("Web MIDI API is not supported in this browser.");
}

// Check MIDI permissions using Permissions API
navigator.permissions.query({ name: "midi", sysex: true }).then((result) => {
	if (result.state === "granted") {
		navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
	} else if (result.state === "prompt") {
		console.warn("MIDI access requires user permission.");
	} else {
		console.error("MIDI access denied.");
	}
});

// Handle failure to access MIDI devices
function onMIDIFailure(error) {
	console.error("Failed to get MIDI access:", error);
}

// Map to store connected MIDI inputs
const connectedInputs = new Map();

// Handle successful access to MIDI devices
function onMIDISuccess(midiAccess) {

	// List all available MIDI inputs and outputs
	listInputsAndOutputs(midiAccess);

	// Listen for device connection/disconnection events
	midiAccess.onstatechange = updateDevices;

	// Set up message handlers for specific inputs
	for (const input of midiAccess.inputs.values()) {
		input.onmidimessage = handleInput;
	}
}

const isShowed = new Map();

// List all available MIDI inputs and outputs
function listInputsAndOutputs(midiAccess) {
	const select = document.getElementById('midiControl');
	for (const [id, input] of midiAccess.inputs) {
		if (isShowed.has(id))
			continue;
		isShowed.set(id, true);
		let selected;
		select.innerHTML += `<option value="${id}" ${selected}>${input.name}</option>`;
		console.log(`Input: [ID: ${id}] Name: ${input.name}`);
	}

	for (const [id, output] of midiAccess.outputs) {
		console.log(`Output: [ID: ${id}] Name: ${output.name}`);
	}
}

// Handle device connection or disconnection events
function updateDevices(event) {
	const port = event.port;
	const timestamp = new Date().toLocaleTimeString();
	const select = document.getElementById('midiControl');
	if (port.name !== select.value) return;

	const popUp = document.getElementById('midiConnection');
	if (port.connection == "open" || port.state == "connected" && !connectedInputs.has(port.id)) {
		connectedInputs.set(port.id, [port, timestamp]);
		port.onmidimessage = handleInput;
		showPopUp(popUp, `Connected to MIDI device: ${port.name}`, 'connected');
	} else if (port.connection == "closed" && connectedInputs.has(port.id)) {
		if (connectedInputs.get(port.id)[1] == timestamp) return;
		connectedInputs.delete(port.id);
		port.onmidimessage = null;
		showPopUp(popUp, `Disconnected from MIDI device: ${port.name}`, 'disconnected');
	} else if (port.connection == "pending") {
		console.warn(`Pending connection: ${event}`);
		showPopUp(popUp, `Pending from MIDI device: ${port.name}`, 'pending');
	}
}


// Display connection status in a pop-up element
function showPopUp(element, message, statusClass) {
	element.classList.add(statusClass);
	element.style.top = "0px";
	element.innerText = message;

	setTimeout(() => {
		element.style.top = "-100px";
		element.classList.remove(statusClass);
	}, 1500);
}

// Handle incoming MIDI messages
function handleInput(event) {
	const [command, note, velocity] = event.data;

	const freq = noteToFreq(note);
	if (freq == null) return;
	if (command >= 144 && command <= 159) { // Note On event
		if (velocity > 0) playNote(freq, velocity);
		else noteOff(freq); // Note Off with velocity zero
	} else if (command >= 128 && command <= 143) { // Note Off event
		noteOff(freq);
	}
}

// Convert a MIDI note (0-127) to a functional frequency
function noteToFreq(midiNote) {
	if (midiNote < 0 || midiNote > 127) return null;

	const frequency = CONFIG.startFreq * Math.pow(2, (midiNote - 69) / CONFIG.subdivisions);
	let degree = (midiNote - 69) % CONFIG.subdivisions;

	if (degree < 0) degree += CONFIG.subdivisions;
	else if (degree == -0) degree = 0;

	return frequency;
}

function keyToFrequency(key) {
	if (!key) return null;
	const cleanKey = key.toUpperCase().trim();
	const index = key_to_index[cleanKey];

	return (index !== undefined && state.notes[index])
		? state.notes[index].frequency
		: null;
}

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
        localStorage.removeItem("foldedHarmonic");
    }
});