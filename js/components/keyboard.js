class CustomKeyboard extends HTMLElement {
  static get observedAttributes() {
    return ['height', 'width', 'keys', 'showNames'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.defaultKeys = [
      { note: 'C', type: "white" },
      { note: 'C^', type: "grey" },
      { note: 'C#', type: "black" },
      { note: 'Dv', type: "grey" },
      { note: 'D', type: "white" },
      { note: 'D^', type: "grey" },
      { note: 'D#', type: "black" },
      { note: 'Ev', type: "grey" },
      { note: 'E', type: "white" },
      { note: 'E^', type: "grey" },
      { note: 'F', type: "white" },
      { note: 'F^', type: "grey" },
      { note: 'F#', type: "black" },
      { note: 'Gv', type: "grey" },
      { note: 'G', type: "white" },
      { note: 'G^', type: "grey" },
      { note: 'G#', type: "black" },
      { note: 'Av', type: "grey" },
      { note: 'A', type: "white" },
      { note: 'A^', type: "grey" },
      { note: 'A#', type: "black" },
      { note: 'Bv', type: "grey" },
      { note: 'B', type: "white" },
      { note: 'B^', type: "grey" },
      { note: 'Cv', type: "grey" }
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    // Read attributes or default values
    const height = this.getAttribute('height') || '70px';
    const width = this.getAttribute('width') || '100%';
    const is24edo = this.getAttribute('is24edo') === 'true';
    const showNames = this.getAttribute('showNames') || false;
    let keysAttr = this.getAttribute('keys')
      .replace(" - ", " ")
      .replace("Db", "C#")
      .replace("Eb", "D#")
      .replace("Gb", "F#")
      .replace("Ab", "G#")
      .replace("Bb", "A#");

    let keysToHighlight = [];

    if (keysAttr) {
      // Parse keys attribute (comma/space separated notes)
      const requestedNotes = keysAttr.split(/[\s,]+/).map(k => {
        try {
          const num = parseInt(k);
          if (!isNaN(num)) {
            const noteName = this.defaultKeys[num % this.defaultKeys.length].note;
            return noteName;
          }
        } catch (e) {
          // Ignore parse errors
        }
        return k.trim();
      });
      // Get keys to highlight by filtering
      keysToHighlight = this.defaultKeys.filter(k => requestedNotes.includes(k.note)).map(k => k.note);
    }

    const style = `
      <style>
        .keyboard {
          position: relative;
          width: ${width};
          height: ${height};
          background: #fff;
          border: 1px solid #999;
          border-radius: 6px;
          user-select: none;
          box-sizing: border-box;
          display: flex;
        }
        .white-key {
          flex: 1;
          border: 1px solid #999;
          border-right: none;
          height: 100%;
          background: linear-gradient(to bottom, #fff, #ccc);
          box-shadow:
            inset 0 0 5px #ddd,
            0 2px 5px rgba(0,0,0,0.15);
          position: relative;
          z-index: 1;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          font-family: monospace, sans-serif;
          font-weight: bold;
          color: #333;
          font-size: 16px;
          box-sizing: border-box;
          transition: background-color 0.3s, color 0.3s;
        }
        .white-key[data-note="C"] {
          border-radius: 6px 0 0 6px;
        }
        .white-key[data-note="B"] {
          border-radius: 0 6px 6px 0;
        }
        .white-key span {
          font-size: 0.75em;
          margin-bottom: -4px;
        }
        .black-key {
          position: absolute;
          --black-width: calc(${width} / ${this.defaultKeys.filter(k => k.type == "white").length} * 0.6);
          width: var(--black-width);
          height: ${is24edo ? '50%' : '60%'};
          background: linear-gradient(to bottom, #333, #000);
          border-radius: 0 0 4px 4px;
          border: 1px solid #222;
          box-shadow:
            inset 0 1px 2px rgba(255,255,255,0.2),
            0 2px 5px rgba(0,0,0,0.6);
          z-index: 2;
          cursor: pointer;
          top: 0;
          transition: background-color 0.3s;
        }
        .black-key span {
          font-size: 0.75em;
          display: flex;
          justify-content: center;
          padding-top: 25%;
        }
        .grey-key {
          position: absolute;
          width: calc(${width} / ${this.defaultKeys.filter(k => k.type == "white").length} * 0.6 / 1.4);
          height: 73%;
          background: linear-gradient(to bottom, #777, #555);
          border-radius: 0 0 4px 4px;
          border: 1px solid #222;
          box-shadow:
            inset 0 1px 2px rgba(255,255,255,0.2),
            0 2px 5px rgba(0,0,0,0.6);
          z-index: 2;
          cursor: pointer;
          top: 0;
          transition: background-color 0.3s;
        }
        .grey-key span {
          color: var(--text-white);
          font-size: 0.25em;
          display: flex;
          justify-content: center;
          padding-top: 25px;
        }
        .grey-key[data-note="Cv"] {
          border-radius: 6px 0 6px 0;
          width: calc(${width} / ${this.defaultKeys.filter(k => k.type == "white").length} * 0.6 / 1.4 * 0.5);
        }
        .grey-key[data-note="B^"] {
          border-radius: 0px 6px 0px 6px;
          width: calc(${width} / ${this.defaultKeys.filter(k => k.type == "white").length} * 0.6 / 1.4 * 0.5);
        }
        /* Highlight styles */
        .white-key.highlight {
          background: var(--accent-blue);
          box-shadow:
            inset 0 0 3px  var(--accent-yellow),
            0 2px 10px var(--accent-yellow);
        }
        .black-key.highlight {
          background: var(--accent-blue);
          box-shadow:
            inset 0 0 3px var(--accent-yellow),
            0 2px 12px var(--accent-yellow);
        }
        .grey-key.highlight {
          background: var(--accent-blue);
          box-shadow:
            inset 0 0 3px var(--accent-yellow),
            0 2px 12px var(--accent-yellow);
        }
        .grey-key.highlight span {
          color:  var(--text-dark);
        }
      </style>
    `;

    const blackKeyOffsets = {
      'C#': 0.7,
      'D#': 1.7,
      'F#': 3.7,
      'G#': 4.7,
      'A#': 5.7
    };

    const whiteKeyCount = this.defaultKeys.filter(k => k.type == "white").length;

    // Construct white keys html
    const whiteKeysHtml = this.defaultKeys
      .filter(k => k.type == "white")
      .map(k => {
        const highlightClass = keysToHighlight.includes(k.note) ? 'highlight' : '';
        return `<div class="white-key ${highlightClass}" data-note="${k.note}"><span>${showNames ? k.note : ''}</span></div>`;
      }).join('');

    // Construct black keys html
    const blackKeysHtml = this.defaultKeys
      .filter(k => k.type == "black" && blackKeyOffsets.hasOwnProperty(k.note))
      .map(k => {
        const highlightClass = keysToHighlight.includes(k.note) ? 'highlight' : '';
        const leftPercent = (blackKeyOffsets[k.note] / whiteKeyCount) * 100;
        return `<div class="black-key ${highlightClass}" style="left: calc(${leftPercent}%);" data-note="${k.note}"><span>${showNames ? k.note : ''}</span></div>`;
      }).join('');

    let greyKeysHtml = '';
    if (is24edo) {
      const greyKeyOffsets = {
        'C^': 0.55,
        'Dv': 1,
        'D^': 1.55,
        'Ev': 2,
        'E^': 2.8,
        'F^': 3.55,
        'Gv':4,
        'G^': 4.55,
        'Av': 5,
        'A^': 5.55,
        'Bv': 6,
        'B^': 6.75,
        'Cv': 0,
      }
      greyKeysHtml = this.defaultKeys
        .filter(k => k.type == "grey" && greyKeyOffsets.hasOwnProperty(k.note))
        .map(k => {
          const highlightClass = keysToHighlight.includes(k.note) ? 'highlight' : '';
          const leftPercent = (greyKeyOffsets[k.note] / whiteKeyCount) * 100;
          const noteToDisplay = k.note.replace('^', '↑').replace('v', '↓');
          return `<div class="grey-key ${highlightClass}" style="left: calc(${leftPercent}%);" data-note="${k.note}"><span>${showNames ? noteToDisplay : ''}</span></div>`;
        }).join('');
    }

    this.shadowRoot.innerHTML = `
      ${style}
      <div class="keyboard">
        ${whiteKeysHtml}
        ${is24edo ? greyKeysHtml : ''}
        ${blackKeysHtml}
      </div>
    `;
  }
}

customElements.define('custom-keyboard', CustomKeyboard);
