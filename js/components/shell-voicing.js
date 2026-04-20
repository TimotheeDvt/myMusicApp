class ShellVoicing extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const Xs = [3.35, 6.35, 9.35];

        this.voicingData = {
            "maj7": {
                "E": [[5, Xs[1], "R"], [4, Xs[0], "3"], [3, Xs[2], "7"]],
                "A": [[4, Xs[1], "R"], [3, Xs[0], "3"], [2, Xs[2], "7"]],
                "D": [[3, Xs[1], "R"], [2, Xs[0], "3"], [1, Xs[2], "7"]],
                "G": [[2, Xs[0], "R"], [1, Xs[0], "3"], [0, Xs[2], "7"]]
            },
            "min7": {
                "E": [[5, Xs[2], "R"], [4, Xs[0], "b3"], [3, Xs[2], "b7"]],
                "A": [[4, Xs[2], "R"], [3, Xs[0], "b3"], [2, Xs[2], "b7"]],
                "D": [[3, Xs[1], "R"], [2, 0.75, "b3"], [1, Xs[2], "b7"]],
                "G": [[2, Xs[1], "R"], [1, Xs[0], "b3"], [0, Xs[2], "b7"]]
            },
            "dom7": {
                "E": [[5, Xs[1], "R"], [4, Xs[0], "3"], [3, Xs[1], "b7"]],
                "A": [[4, Xs[1], "R"], [3, Xs[0], "3"], [2, Xs[1], "b7"]],
                "D": [[3, Xs[1], "R"], [2, Xs[0], "3"], [1, Xs[2], "b7"]],
                "G": [[2, Xs[1], "R"], [1, Xs[1], "3"], [0, Xs[2], "b7"]]
            },
            "6": {
                "E": [[5, Xs[1], "R"], [4, Xs[0], "3"], [3, Xs[0], "6"]],
                "A": [[4, Xs[1], "R"], [3, Xs[0], "3"], [2, Xs[0], "6"]],
                "D": [[3, Xs[1], "R"], [2, Xs[0], "3"], [1, Xs[1], "6"]],
                "G": [[2, Xs[1], "R"], [1, Xs[1], "3"], [0, Xs[1], "6"]]
            }
        };
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const type = this.getAttribute('type') || 'maj7';
        const rootStr = this.getAttribute('root-string') || 'E';
        const data = this.voicingData[type][rootStr] || [];
        const strings = ['E', 'B', 'G', 'D', 'A', 'E'];

        let stringsHtml = strings.map((label, idx) => {
            const markerData = data.find(m => m[0] === idx);
            const markerHtml = markerData
                ? `<div class="note-marker" style="left: calc(100% / 12 * ${markerData[1]});">${markerData[2]}</div>`
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
                    /* box-shadow: 0 1px 2px rgba(0, 0, 0, 0.6); adds subtle depth */
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