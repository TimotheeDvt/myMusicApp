function showTab(tabName) {
	// Hide all tabs
	const tabs = document.querySelectorAll('.tab-content');
	tabs.forEach(tab => tab.classList.remove('active'));

	// Remove active from all buttons
	const buttons = document.querySelectorAll('.tab-btn');
	buttons.forEach(btn => btn.classList.remove('active'));

	// Show selected tab
	document.getElementById(tabName).classList.add('active');

	// Add active to clicked button
	buttons.forEach(btn => { if(btn.innerHTML.toLowerCase().includes(tabName)){ btn.classList.add('active') }} );

	if (tabName === 'circle') {
		loadCircleText();
	}
}

showTab('progressions'); // Show default tab on load

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