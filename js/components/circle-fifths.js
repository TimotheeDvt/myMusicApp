class CircleOfFifths extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.majorKeys = ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F"];
        this.minorKeys = ["Am", "Em", "Bm", "F#m", "C#m", "G#m", "D#m", "A#m", "Fm", "Cm", "Gm", "Dm"];
        this.accidLabels = ["0", "1#", "2#", "3#", "4#", "5#", "6b/6#", "5b", "4b", "3b", "2b", "1b"];
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; width: 100%; max-width: 500px; margin: auto; }
            svg { width: 100%; height: auto; font-family: 'Inter', sans-serif; }
            circle, line { stroke: rgba(255,255,255,0.1); fill: none; stroke-width: 1.5; }
            .major { fill: var(--accent-yellow, #FDE87B); font-size: 22px; font-weight: bold; cursor: pointer; }
            .major:nth-child(even) { fill: var(--accent-blue, #6F8FF0); }
            .major:nth-child(odd) { fill: var(--accent-yellow, #FDE87B); }
            .minor { fill: var(--accent-blue, #6F8FF0); font-size: 16px; cursor: pointer; }
            .minor:nth-child(even) { fill: var(--accent-blue, #6F8FF0); }
            .minor:nth-child(odd) { fill: var(--accent-yellow, #FDE87B); }
            .accid { fill: var(--accent-red, #FE5658); font-size: 12px; font-weight: 600; }
            .arrow-txt { font-size: 12px; font-weight: bold; }
            text:hover { filter: brightness(1.2); }
        </style>
        <svg viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
            <defs>
                <marker id="head-right" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#FDE87B" />
                </marker>
                <marker id="head-left" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6F8FF0" />
                </marker>
            </defs>

            <circle cx="250" cy="250" r="200" />
            <circle cx="250" cy="250" r="150" />
            <circle cx="250" cy="250" r="100" />

            <g id="lines"></g>
            <g id="major-group"></g>
            <g id="minor-group"></g>
            <g id="accid-group"></g>

            <path d="M 260,25 A 250,250 0 0 1 359,50" stroke="#FDE87B" stroke-width="3" marker-end="url(#head-right)" />
            <path d="M 240,25 A 250,250 0 0 0 143,50" stroke="#6F8FF0" stroke-width="3" marker-end="url(#head-left)" />
            <text x="300" y="25" style="fill:#FDE87B" class="arrow-txt" >+5 / +1#</text>
            <text x="190" y="25" style="fill:#6F8FF0" class="arrow-txt" text-anchor="end">+4 / +1b</text>
        </svg>
        `;

        this.drawLabels();
    }

    drawLabels() {
        const majorG = this.shadowRoot.getElementById('major-group');
        const minorG = this.shadowRoot.getElementById('minor-group');
        const accidG = this.shadowRoot.getElementById('accid-group');
        const linesG = this.shadowRoot.getElementById('lines');

        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI / 6) * (i - 3);

            // Major Keys (Outer)
            this.createText(majorG, this.majorKeys[i], 175, angle, 'major', () => AudioManager.playScale(this.majorKeys[i], 'Major/Ionian', 0.2));

            // Minor Keys (Inner)
            this.createText(minorG, this.minorKeys[i], 125, angle, 'minor', () => AudioManager.playScale(this.minorKeys[i].replace('m', ''), 'Natural Minor/Aeolian', 0.2));

            // Accidentals (Center)
            this.createText(accidG, this.accidLabels[i], 75, angle, 'accid');

            // Connecting Lines
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute('x1', 250 + 160 * Math.cos(angle));
            line.setAttribute('y1', 250 + 160 * Math.sin(angle));
            line.setAttribute('x2', 250);
            line.setAttribute('y2', 250);
            linesG.appendChild(line);
        }
    }

    createText(group, txt, radius, angle, className, onClick) {
        const x = 250 + radius * Math.cos(angle);
        const y = 255 + radius * Math.sin(angle); // Slight offset for vertical centering
        const textNode = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textNode.setAttribute('x', x);
        textNode.setAttribute('y', y);
        textNode.setAttribute('text-anchor', 'middle');
        textNode.setAttribute('class', className);
        textNode.textContent = txt;
        if (onClick) textNode.onclick = onClick;
        group.appendChild(textNode);
    }
}

customElements.define('circle-fifths', CircleOfFifths);