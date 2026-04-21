class MainNav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
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
                z-index: 10;
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
        </style>
        <nav class="main-nav">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            <div class="nav-container">
                <a href="${root}index.html" class="nav-btn ${activeTab === 'home' ? 'active' : ''}"><i class="fa fa-home"></i></a>
                <a href="${root}tools/harmonic_interface/index.html" class="nav-btn ${activeTab === 'harmonic' ? 'active' : ''}">Harmonic Interface</a>
                <a href="${root}tools/modes_scales/index.html" class="nav-btn ${activeTab === 'modes' ? 'active' : ''}">Scales & modes</a>
                <a href="${root}tools/theory_mindmap/index.html" class="nav-btn ${activeTab === 'mindmap' ? 'active' : ''}">12-EDO theory</a>
                <a href="${root}tools/24-edo/index.html" class="nav-btn ${activeTab === '24edo' ? 'active' : ''}">24-EDO theory</a>
            </div>
        </nav>
        `;
    }
}

customElements.define('main-nav', MainNav);