class MainNav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupAudioToggle();
    }

    setupAudioToggle() {
        const toggle = this.shadowRoot.getElementById('audio-toggle');

        // Synchronize UI with current AudioManager state
        const updateUI = () => {
            const isMuted = localStorage.getItem('audioMuted') === 'true';
            toggle.classList.toggle('muted', isMuted);
            toggle.innerHTML = isMuted ? '<i class="fa fa-volume-off"></i>' : '<i class="fa fa-volume-up"></i>';

            if (window.AudioManager && window.AudioManager.state.masterGain) {
                // Set gain to 0 if muted, otherwise restore to standard 0.7
                const targetGain = isMuted ? 0 : 0.7;
                window.AudioManager.state.masterGain.gain.setValueAtTime(
                    targetGain,
                    window.AudioManager.state.audioContext?.currentTime || 0
                );
            }
        };

        toggle.addEventListener('click', () => {
            const currentlyMuted = localStorage.getItem('audioMuted') === 'true';
            localStorage.setItem('audioMuted', !currentlyMuted);
            updateUI();
        });

        // Initial UI check
        updateUI();
    }

    render() {
        const root = this.getAttribute('root-path') || './';
        const activeTab = this.getAttribute('active-tab');

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                width: 100%;
                background: var(--bg-nav);
                border-bottom: 1px solid var(--accent-blue);
                position: sticky;
                top: 0;
                z-index: var(--level-1);
            }
            .nav-container {
                display: flex;
                justify-content: center;
                gap: 20px;
                padding: 10px;
            }
            .nav-btn {
                background: none;
                border: none;
                color: var(--text-white);
                padding: 12px 24px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                border-bottom: 2px solid transparent;
                text-decoration: none;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
            }
            .nav-btn:hover {
                color: var(--accent-blue);
            }
            .nav-btn.active {
                color: var(--accent-blue);
                border-bottom: 2px solid var(--accent-blue);
            }
            /* Global Audio Toggle Style */
            #audio-toggle {
                position: absolute;
                right: 20px;
                background: var(--glass);
                border: 1px solid var(--accent-blue);
                color: var(--accent-blue);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            #audio-toggle.muted {
                border-color: var(--accent-red);
                color: var(--accent-red);
                opacity: 0.6;
            }
            #audio-toggle:hover {
                transform: scale(1.1);
                background: var(--glass);
            }
        </style>
        <nav class="main-nav">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            <div class="nav-container">
                <a href="${root}index.html" class="nav-btn ${activeTab === 'home' ? 'active' : ''}"><i class="fa fa-home"></i></a>
                <a href="${root}tools/harmonic_interface/index.html" class="nav-btn ${activeTab === 'harmonic' ? 'active' : ''}">Harmonic Interface</a>
                <a href="${root}tools/modes_scales/index.html" class="nav-btn ${activeTab === 'modes' ? 'active' : ''}">Scales & modes</a>
                <a href="${root}tools/theory_mindmap/index.html" class="nav-btn ${activeTab === 'mindmap' ? 'active' : ''}">12-EDO theory</a>
                <a href="${root}tools/24-edo/index.html" class="nav-btn ${activeTab === '24edo' ? 'active' : ''}">24-EDO theory</a>

                <button id="audio-toggle" title="Toggle Sound">
                    <i class="fa fa-volume-up"></i>
                </button>
            </div>
        </nav>
        `;
    }
}

customElements.define('main-nav', MainNav);