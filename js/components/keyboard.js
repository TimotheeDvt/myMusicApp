class CustomKeyboard extends HTMLElement {
  static get observedAttributes() {
    return ['height', 'width', 'keys', 'showNames'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.defaultKeys = [
      { note: 'C', type: "white"},
      { note: 'Chs', type: "grey" },
      { note: 'C#', type: "black" },
      { note: 'Dhf', type: "grey" },
      { note: 'D', type: "white" },
      { note: 'Dhs', type: "grey" },
      { note: 'D#', type: "black" },
      { note: 'Ehf', type: "grey" },
      { note: 'E', type: "white" },
      { note: 'Ehs', type: "grey" },
      { note: 'F', type: "white" },
      { note: 'Fhs', type: "grey" },
      { note: 'F#', type: "black" },
      { note: 'Ghf', type: "grey" },
      { note: 'G', type: "white" },
      { note: 'Ghs', type: "grey" },
      { note: 'G#', type: "black" },
      { note: 'Ahf', type: "grey" },
      { note: 'A', type: "white" },
      { note: 'Ahs', type: "grey" },
      { note: 'A#', type: "black" },
      { note: 'Bhf', type: "grey" },
      { note: 'B', type: "white" },
      { note: 'Bhs', type: "grey" }
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
		const is24edo = this.getAttribute('is24edo') || false;
		const showNames = this.getAttribute('showNames') || false;
    const keysAttr = this.getAttribute('keys')
												 .replace(" - ", " ")
												 .replace("Db", "C#")
												 .replace("Eb", "D#")
												 .replace("Gb", "F#")
												 .replace("Ab", "G#")
												 .replace("Bb", "A#");
    let keysToHighlight = [];

    if (keysAttr) {
      // Parse keys attribute (comma/space separated notes)
      const requestedNotes = keysAttr.split(/[\s,]+/).map(k => k.trim());
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
          padding-bottom: 8px;
          box-sizing: border-box;
          transition: background-color 0.3s, color 0.3s;
        }
        .white-key:last-child {
          border-right: 1px solid #999;
        }
        .black-key {
          position: absolute;
          width: calc(${width} / ${this.defaultKeys.filter(k => k.type == "white").length} * 0.6);
          height: 60%;
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
        .grey-key {
          position: absolute;
          width: calc(${width} / ${this.defaultKeys.filter(k => k.type == "grey").length} * 0.6);
          height: 60%;
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
        /* Highlight styles */
        .white-key.highlight {
          background: var(--accent-blue);
          color: #441a00;
          box-shadow:
            inset 0 0 8px  var(--accent-yellow),
            0 2px 10px var(--accent-yellow);
        }
        .black-key.highlight {
          background: var(--accent-blue);
          box-shadow:
            inset 0 1px 3px var(--accent-yellow),
            0 2px 12px var(--accent-yellow);
        }
      </style>
    `;

    const blackKeyOffsets = {
      'C#': 0.65,
      'D#': 1.65,
      'F#': 3.65,
      'G#': 4.65,
      'A#': 5.65
    };

    const whiteKeyCount = this.defaultKeys.filter(k => k.type == "white").length;

    // Construct white keys html
    const whiteKeysHtml = this.defaultKeys
      .filter(k => k.type == "white")
      .map(k => {
        const highlightClass = keysToHighlight.includes(k.note) ? 'highlight' : '';
        return `<div class="white-key ${highlightClass}" data-note="${k.note}">${showNames ? k.note : ''}</div>`;
      }).join('');

    // Construct black keys html
    const blackKeysHtml = this.defaultKeys
      .filter(k => k.type == "black" && blackKeyOffsets.hasOwnProperty(k.note))
      .map(k => {
        console.log(k)
        const highlightClass = keysToHighlight.includes(k.note) ? 'highlight' : '';
        const leftPercent = (blackKeyOffsets[k.note] / whiteKeyCount) * 100;
        return `<div class="black-key ${highlightClass}" style="left: calc(${leftPercent}%);" data-note="${showNames ? k.note : ''}"></div>`;
      }).join('');

    this.shadowRoot.innerHTML = `
      ${style}
      <div class="keyboard">
        ${whiteKeysHtml}
        ${blackKeysHtml}
      </div>
    `;
  }
}

customElements.define('custom-keyboard', CustomKeyboard);
