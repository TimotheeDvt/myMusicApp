class GuitarFretboard extends HTMLElement {
    static get observedAttributes() {
        return ['strings', 'tuning', 'notes', 'width', 'height'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.notesArr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.fretToDraw = [0, 5, 7, 10, 12];
    }

    attributeChangedCallback() {
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const stringsCount = parseInt(this.getAttribute('strings')) || 6;
        const tuning = (this.getAttribute('tuning') || "EADGBE").toUpperCase();
        const activeNotes = (this.getAttribute('notes') || "").split(/[\s,]+/).filter(n => n);
        const width = parseInt(this.getAttribute('width')) || 800;
        const height = parseInt(this.getAttribute('height')) || 250;

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                canvas {
                    background: var(--bg-dark, #1C1C1C);
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
            </style>
            <canvas id="fretboard" width="${width}" height="${height}"></canvas>
        `;

        const canvas = this.shadowRoot.getElementById('fretboard');
        const ctx = canvas.getContext('2d');
        this.drawFretboard(ctx, width, height, stringsCount, tuning, activeNotes);
    }

    drawFretboard(ctx, w, h, stringsCount, tuning, activeNotes) {
        const offsetX = 40;
        const offsetY = 20;
        const boardWidth = w - (offsetX * 2);
        const boardHeight = h - (offsetY * 2);
        const spaceBetweenStrings = boardHeight / (stringsCount - 1);
        const spaceBetweenFrets = boardWidth / 15;

        // Draw strings and frets
        ctx.strokeStyle = "#AEB2B2";
        ctx.lineWidth = 1;

        for (let i = 0; i < stringsCount; i++) {
            let y = offsetY + (i * spaceBetweenStrings);
            ctx.beginPath();
            ctx.moveTo(offsetX, y);
            ctx.lineTo(w - offsetX, y);
            ctx.stroke();
        }

        for (let i = 0; i <= 15; i++) {
            let x = offsetX + (i * spaceBetweenFrets);
            ctx.lineWidth = i === 0 ? 4 : 1;
            ctx.beginPath();
            ctx.moveTo(x, offsetY);
            ctx.lineTo(x, h - offsetY);
            ctx.stroke();

            // Fret markers
            if (this.fretToDraw.includes(i % 12) && i !== 0) {
                ctx.fillStyle = "#AEB2B2";
                let midX = x - (spaceBetweenFrets / 2);
                let midY = offsetY + (boardHeight / 2);
                ctx.beginPath();
                if (i % 12 === 0) { // Double dot for octave
                    ctx.arc(midX, midY - spaceBetweenStrings, 4, 0, Math.PI * 2);
                    ctx.arc(midX, midY + spaceBetweenStrings, 4, 0, Math.PI * 2);
                } else {
                    ctx.arc(midX, midY, 4, 0, Math.PI * 2);
                }
                ctx.fill();
            }
        }

        // Draw Active Notes
        activeNotes.forEach(note => {
            const targetIdx = this.notesArr.indexOf(note);
            if (targetIdx === -1) return;

            for (let sIdx = 0; sIdx < stringsCount; sIdx++) {
                // Tuning is typically defined from high string to low or low to high.
                // We assume standard index: tuning[0] is bottom visual string.
                let openNote = tuning[stringsCount - 1 - sIdx] || "E";
                let startIdx = this.notesArr.indexOf(openNote);
                let fret = (targetIdx - startIdx + 12) % 12;

                const radius = spaceBetweenFrets / 3.5;
                const drawNote = (f, xOffset = 0) => {
                    let x = offsetX + (f * spaceBetweenFrets) - (f === 0 ? 25 : spaceBetweenFrets / 2) + xOffset;
                    let y = offsetY + (sIdx * spaceBetweenStrings);

                    ctx.beginPath();
                    ctx.fillStyle = "#6F8FF0"; // --accent-blue
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = "#1C1C1C"; // --bg-dark
                    ctx.font = `bold ${radius}px Inter`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(note, x, y + 1);
                };

                drawNote(fret);
                if (fret <= 3) drawNote(fret + 12); // Show repeats at high frets
            }
        });
    }

    update() {
        this.render();
    }
}

customElements.define('guitar-fretboard', GuitarFretboard);