class ShellVoicing extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Base fret X-positions for your 4-fret span
        const Xs = [3.35, 6.35, 9.35];

        // FORMULAS: [ [relString, relFretIdx, label], ... ]
        // relString: 0 is the root string, -1 is one string higher (closer to floor)
        // relFretIdx: index into the Xs array (0, 1, or 2)
        this.formulas = {
            "maj7": [[0, 1, "R"], [-1, 0, "3"], [-2, 2, "7"]],
            "min7": [[0, 2, "R"], [-1, 0, "b3"], [-2, 2, "b7"]],
            "dom7": [[0, 1, "R"], [-1, 0, "3"], [-2, 1, "b7"]],
            "6": [[0, 1, "R"], [-1, 0, "3"], [-2, 0, "6"]]
        };

        // Map root string names to their index in the ['E','B','G','D','A','E'] array
        this.stringMap = { "E": 5, "A": 4, "D": 3, "G": 2 };
    }

    connectedCallback() { this.render(); }

    render() {
        const type = this.getAttribute('type') || 'maj7';
        const rootStrName = this.getAttribute('root-string') || 'E';

        const formula = this.formulas[type];
        const rootIdx = this.stringMap[rootStrName];
        const Xs = [3.35, 6.35, 9.35];

        const activeMarkers = formula.map(([sOffset, fIdx, label]) => {
            return {
                stringIdx: rootIdx + sOffset,
                xPos: Xs[fIdx],
                label: label
            };
        });

        const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
        let stringsHtml = strings.map((label, idx) => {
            const marker = activeMarkers.find(m => m.stringIdx === idx);
            const markerHtml = marker
                ? `<div class="note-marker" style="left: calc(100% / 12 * ${marker.xPos});">${marker.label}</div>`
                : '';

            return `
                <div class="string">
                    <span class="string-label">${label}</span>
                    <div class="string-line">${markerHtml}</div>
                </div>`;
        }).join('');

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; margin: 10px; }

                /* Applying your Fretboard CSS */
                .fretboard {
                    background: var(--bg-dark);
                    // padding:10px;
                    border-radius:10px;
                    // margin:10px 0;
                    border: 1px solid rgba(255,255,255,0.03);
                    max-height: 200px;
                    max-width: 200px;
                    position: relative;
                }

                .string-diagram { display:flex; flex-direction:column; gap:0px; margin:10px 0; }

                .string { display:flex; align-items:center; gap:1px; }

                .string-label{
                    width:15px;
                    font-weight:500;
                    color:var(--text-muted);
                }

                /* string line */
                .string-line {
                    flex: 1;
                    height: 2px;
                    border-radius: 2px;
                    position: relative;
                    background: repeating-linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0.8) 0,          /* bright fret edge */
                        rgba(255, 255, 255, 0.8) 2px,        /* fret width */
                        rgba(255, 255, 255, 0.15) 2px,       /* start of string area */
                        rgba(255, 255, 255, 0.15) calc(100% * 4)  /* divide into 12 equal segments */
                    );
                    background-size: calc(100% / 4) 100%;
                    background-repeat: repeat-x;
                }

                /* note markers (use accent and softer border) */
                .note-marker{
                    transform: translateY(-50%);
                    position:absolute;
                    width:22px;
                    height:22px;
                    background: var(--accent-blue);
                    border-radius:50%;
                    border: 1px solid rgba(255,255,255,0.5);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:0.72em;
                    color:#02262b;
                    font-weight:800;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.6);
                }

            </style>
            <div class="fretboard">
                <div class="string-diagram">
                    ${stringsHtml}
                </div>
            </div>
        `;
    }
}
customElements.define('shell-voicing', ShellVoicing);