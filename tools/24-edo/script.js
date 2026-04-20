function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById(tabId+'-btn').classList.add('active');
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    const url = new URL(window.location);
    url.searchParams.set('page', tabId);
    window.history.pushState({}, '', url);
}

if (window.location) {
    const url = new URL(window.location);
    const tab = url.searchParams.get('page');
    if (tab) {
        showTab(tab);
    } else {
        showTab('intervals');
    }
}