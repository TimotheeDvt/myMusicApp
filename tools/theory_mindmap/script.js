const tabNames = ["fundamentals", "circle", "scales", "chords", "shell", "progressions"]

function showTab(tabName) {
	// Hide all tabs
	const tabs = document.querySelectorAll('.tab-content');
	tabs.forEach(tab => tab.classList.remove('active'));

	if (!tabNames.includes(tabName)) {
		tabName = "fundamentals";
	}

	// Remove active from all buttons
	const buttons = document.querySelectorAll('.tab-btn');
	buttons.forEach(btn => btn.classList.remove('active'));

	// Show selected tab
	document.getElementById(tabName).classList.add('active');

	// Add active to clicked button
	buttons.forEach(btn => { if (btn.innerHTML.toLowerCase().includes(tabName)) { btn.classList.add('active') } });

	if (tabName === 'circle') {
		loadCircleText();
	}

	const url = new URL(window.location);
	url.searchParams.set('page', tabName);
	window.history.pushState({}, '', url);
}

function loadCircleText() {
	const circleSvgTexts = Array.from(document.querySelectorAll('.circle-svg > text'));

	const notes = circleSvgTexts.slice(0, 12);
	notes.forEach(note => {
		const angle = Math.PI / 6 * (notes.indexOf(note) - 3);
		const radius = 175;
		const x = 250 + radius * Math.cos(angle);
		const y = 260 + radius * Math.sin(angle);
		note.setAttribute('x', x);
		note.setAttribute('y', y);
	});

	const minorKeys = circleSvgTexts.slice(12, 24);
	minorKeys.forEach(key => {
		const angle = Math.PI / 6 * (minorKeys.indexOf(key) - 3);
		const radius = 125;
		const x = 250 + radius * Math.cos(angle);
		const y = 260 + radius * Math.sin(angle);
		key.setAttribute('x', x);
		key.setAttribute('y', y);
	});

	const alterations = circleSvgTexts.slice(24, 36);
	alterations.forEach(alt => {
		const angle = Math.PI / 6 * (alterations.indexOf(alt) - 3);
		const radius = 75;
		const x = 250 + radius * Math.cos(angle);
		const y = 260 + radius * Math.sin(angle);
		alt.setAttribute('x', x);
		alt.setAttribute('y', y);
	});

	const circleSvgLines = Array.from(document.querySelectorAll('.circle-svg > line'));

	const lines = circleSvgLines.slice(0, 12);
	lines.forEach((line, i) => {
		const note = notes[i];
		const bbox = note.getBBox();
		const textCenterX = parseFloat(note.getAttribute('x'));
		const textCenterY = parseFloat(note.getAttribute('y')) - bbox.height / 4;
		line.setAttribute('x1', textCenterX);
		line.setAttribute('y1', textCenterY);
		line.setAttribute('x2', 250);
		line.setAttribute('y2', 260);
	});
}

if (window.location) {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);

	const queryValue = urlParams.get('page');
	if (tabNames.includes(queryValue)) {
		showTab(queryValue);
	} else {
		showTab("fundamentals");
	}
}

// add event listeners to "note-circle"

const noteCircles = document.querySelectorAll('.note-circle');
noteCircles.forEach(circle => {
	circle.addEventListener('click', () => {
		const note = circle.innerHTML.trim();
		AudioManager.playNoteWithDuration(note, 0.5);
	});
});

const scaleLi = document.querySelectorAll('.scale-li');

scaleLi.forEach(li => {
	li.addEventListener('click', async () => {
		const text = li.innerHTML.trim();
		const scaleAttr = li.getAttribute('data-scale');

		let notesToPlay = [];
		if (scaleAttr === "chromatic") {
			notesToPlay = TheoryEngine.base_notes_12;
		} else {
			let root = text.replace(/m$/, '');
			const mode = text.endsWith('m') ? 'Natural Minor/Aeolian' : 'Major/Ionian';
			let alteration = "♮";

			if (root.includes('#')) {
				alteration = "#";
				root = root.replace('#', '');
			} else if (root.includes('b') || root.includes('♭')) {
				alteration = "♭";
				root = root.replace(/[b♭]/, '');
			}

			notesToPlay = TheoryEngine.getScale(root, mode, alteration);
			notesToPlay.push(notesToPlay[0]);
		}

		let lastSemitone = TheoryEngine.all_notes.findIndex(n =>
			n.includes(TheoryEngine.normalizeNote(notesToPlay[0]))
		);
		let octaveOffset = 0;
		const baseFreq = 261.63;

		for (let i = 0; i < notesToPlay.length; i++) {
			const noteName = notesToPlay[i];
			const allNoteWrapped = TheoryEngine.all_notes;
			// put scale root note at the start of the array for easier indexing
			while (!allNoteWrapped[0].includes(TheoryEngine.normalizeNote(noteName))) {
				allNoteWrapped.push(allNoteWrapped.shift());
			}
			let currentSemitone = allNoteWrapped.findIndex(n =>
				n.includes(TheoryEngine.normalizeNote(noteName))
			);

			if (i > 0 && currentSemitone <= lastSemitone) {
				octaveOffset++;
			}

			const freq = baseFreq * Math.pow(2, octaveOffset) * Math.pow(2, currentSemitone / 12);

			AudioManager.playNoteWithDuration(freq, 0.4);
			lastSemitone = currentSemitone;

			await new Promise(resolve => setTimeout(resolve, 500));
		}
	});
});

const enharmonicLi = document.querySelectorAll('.enharmonic-li');
enharmonicLi.forEach(li => {
	li.addEventListener('click', () => {
		const note = li.getAttribute('data-note');
		AudioManager.playNoteWithDuration(note, 0.5);
	});
});

const intervalLi = document.querySelectorAll('.interval-li');
intervalLi.forEach(li => {
	li.addEventListener('click', async () => {
		const interval = parseInt(li.getAttribute('data-semitones'));
		const rootNote = "C"; // You can make this dynamic if needed
		const rootFreq = TheoryEngine.getSimpleFrequency(rootNote);
		const intervalFreq = rootFreq * Math.pow(2, interval / 12);
		AudioManager.playNotes([rootFreq, intervalFreq], 0.5);

		// This will now correctly pause the loop for 200ms
		await new Promise(resolve => setTimeout(resolve, 200));
	});
});