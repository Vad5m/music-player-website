(function (App) {
    'use strict';

    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose = document.getElementById('settings-close-btn');

    const profilePanel = document.getElementById('profile-panel');
    const profileOverlay = document.getElementById('profile-overlay');
    const profileClose = document.getElementById('profile-close-btn');

    const filePanel = document.getElementById('file-panel');
    const fileOverlay = document.getElementById('file-overlay');
    const fileClose = document.getElementById('file-close-btn');
    const fileAddBtn = document.getElementById('file-add-btn');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const fileSearch = document.getElementById('file-search');
    const fileTitle = document.getElementById('file-title');

    let fileQuery = '';

    function openSettings() {
        closeProfile();
        closeFilePanel();
        settingsPanel.classList.add('open');
        settingsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSettings() {
        settingsPanel.classList.remove('open');
        settingsOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openProfile() {
        closeSettings();
        closeFilePanel();
        profilePanel.classList.add('open');
        profileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeProfile() {
        profilePanel.classList.remove('open');
        profileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openFilePanel() {
        closeSettings();
        closeProfile();
        filePanel.classList.add('open');
        fileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderFileList();
    }
    function closeFilePanel() {
        filePanel.classList.remove('open');
        fileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function renderFileList() {
        const songs = App.getSongs ? App.getSongs() : [];
        const q = fileQuery.trim().toLowerCase();
        const display = q
            ? songs.filter(s => (s.name || s.file).toLowerCase().includes(q))
            : songs;

        if (!display.length) {
            fileList.innerHTML = '<div style="padding:12px;color:rgba(255,255,255,0.4);text-align:center;">' + window.t('noTracks') + '</div>';
            return;
        }

        const currentIdx = App.getCurrentIndex ? App.getCurrentIndex() : -1;
        const fragment = document.createDocumentFragment();

        display.forEach((s, i) => {
            const raw = s.name || s.file.replace(/\.[^/.]+$/, '');
            const origIdx = songs.findIndex(o => o.file === s.file);
            const item = document.createElement('div');
            item.className = 'file-item' + (origIdx === currentIdx ? ' active-song' : '');
            item.dataset.file = s.file;
            item.dataset.index = origIdx;
            item.innerHTML = `
                <span class="file-num">${(i + 1).toString().padStart(2, '0')}</span>
                <span class="file-name">${raw}</span>
                <button class="file-dl" data-file="${s.file}" data-name="${raw}">
                    <img src="${App.MEDIA_BASE}icons/download.svg" alt="download" />
                    <span class="btn-tooltip">${window.t('download')}</span>
                </button>
                <button class="file-del" data-file="${s.file}">
                    <img src="${App.MEDIA_BASE}icons/trash.svg" alt="delete" />
                    <span class="btn-tooltip">${window.t('delete')}</span>
                </button>
            `;
            fragment.appendChild(item);
        });

        fileList.innerHTML = '';
        fileList.appendChild(fragment);

        fileList.querySelectorAll('.file-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.file-dl') || e.target.closest('.file-del')) return;
                const idx = parseInt(el.dataset.index);
                if (App.loadSong) App.loadSong(idx);
                if (App.togglePlay && !App.isPlaying()) App.togglePlay();
                else if (App.getAudio) App.getAudio().play().catch(() => {});
                renderFileList();
            });
        });

        fileList.querySelectorAll('.file-dl').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const a = document.createElement('a');
                a.href = App.MUSIC_BASE + encodeURIComponent(btn.dataset.file);
                a.download = btn.dataset.name || btn.dataset.file;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
        });

        fileList.querySelectorAll('.file-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFile(btn.dataset.file);
            });
        });
    }

    async function deleteFile(file) {
        try {
            const res = await fetch(App.MUSIC_URLS.deleteMusic, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: file })
            });
            if (res.ok) {
                await App.fetchSongs();
                renderFileList();
            }
        } catch (e) {
            console.warn('Delete failed');
        }
    }

    async function uploadFiles(files) {
        if (!files || !files.length) return;
        const formData = new FormData();
        for (const f of files) {
            formData.append('files', f);
        }
        try {
            const res = await fetch(App.MUSIC_URLS.upload, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                await App.fetchSongs();
                renderFileList();
            }
        } catch (e) {
            console.warn('Upload failed');
        }
    }

    document.getElementById('file-top-btn').addEventListener('click', function (e) {
        if (e.target.closest('.edit-controls')) return;
        if (filePanel.classList.contains('open')) closeFilePanel();
        else openFilePanel();
    });

    fileClose.addEventListener('click', closeFilePanel);
    fileOverlay.addEventListener('click', closeFilePanel);

    fileAddBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        uploadFiles(fileInput.files);
        fileInput.value = '';
    });

    fileSearch.addEventListener('input', (e) => {
        fileQuery = e.target.value;
        renderFileList();
    });

    fileList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileList.classList.add('drag-over');
    });

    fileList.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileList.classList.remove('drag-over');
    });

    fileList.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileList.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        uploadFiles(files);
    });

    document.getElementById('settings-top-btn').addEventListener('click', function (e) {
        if (e.target.closest('.edit-controls')) return;
        openSettings();
    });
    settingsClose.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', closeSettings);

    document.getElementById('profile-top-btn').addEventListener('click', function (e) {
        if (e.target.closest('.edit-controls')) return;
        openProfile();
    });
    profileClose.addEventListener('click', closeProfile);
    profileOverlay.addEventListener('click', closeProfile);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (settingsPanel.classList.contains('open')) closeSettings();
            if (profilePanel.classList.contains('open')) closeProfile();
            if (filePanel.classList.contains('open')) closeFilePanel();
        }
    });

    document.getElementById('editModeToggle').addEventListener('change', function (e) {
        App.config.edit_mode = e.target.checked;
        document.querySelectorAll('.widget-wrapper').forEach(el => {
            if (e.target.checked) el.classList.add('edit-mode');
            else el.classList.remove('edit-mode');
        });
        App.scheduleSave();
    });

    function initLanguageSwitch() {
        const savedLang = App.config.language || 'ru';
        window.currentLocale = savedLang;
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === savedLang);
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                window.currentLocale = lang;
                App.config.language = lang;
                langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
                window.applyLocale();
                App.renderPlaylist();
                renderFileList();
                App.scheduleSave();
            });
        });
    }

    document.getElementById('siteTitleInput').addEventListener('input', function (e) {
        const title = e.target.value.trim();
        document.title = title || 'None';
        App.config.site_title = title;
        App.scheduleSave();
    });

    document.getElementById('visualizerOpacity').addEventListener('input', function (e) {
        const val = parseInt(e.target.value);
        App.config.visualizer_opacity = val;
        document.documentElement.style.setProperty('--visualizer-opacity', val / 100);
        App.scheduleSave();
    });

    document.getElementById('playlistToggle').addEventListener('change', function (e) {
        App.config.playlist_visible = e.target.checked;
        const widget = document.getElementById('playlist-widget');
        if (widget) {
            if (!e.target.checked) widget.classList.add('hidden');
            else widget.classList.remove('hidden');
        }
        App.scheduleSave();
    });

    document.querySelectorAll('.effects-mode-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.effects-mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            App.config.effects_mode = parseInt(this.dataset.mode);
            App.scheduleSave();
            App.updateEffectsSettings();
        });
    });

    document.getElementById('effectsOpacity').addEventListener('input', function (e) {
        const val = parseInt(e.target.value);
        App.config.effects_opacity = val;
        document.documentElement.style.setProperty('--effects-opacity', val / 100);
        document.getElementById('effects-fire-canvas').style.opacity = val / 100;
        document.getElementById('effects-rain-canvas').style.opacity = val / 100;
        App.scheduleSave();
    });

    document.querySelectorAll('.eq-mode-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.eq-mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            App.config.visualizer_mode = parseInt(this.dataset.mode);
            App.scheduleSave();
            App.updateVisualizerVisibility();
        });
    });

    async function init() {
        await App.loadConfigFromServer();

        initLanguageSwitch();
        window.applyLocale();

        App.setAccentColor(App.config.accent_color || '#ff001c');

        if (App.config.site_title) {
            document.title = App.config.site_title;
            document.getElementById('siteTitleInput').value = App.config.site_title;
        }

        const editMode = App.config.edit_mode || false;
        document.getElementById('editModeToggle').checked = editMode;
        document.querySelectorAll('.widget-wrapper').forEach(el => {
            if (editMode) el.classList.add('edit-mode');
            else el.classList.remove('edit-mode');
        });

        const opacity = App.config.visualizer_opacity || 30;
        document.getElementById('visualizerOpacity').value = opacity;
        document.documentElement.style.setProperty('--visualizer-opacity', opacity / 100);

        const plVisible = App.config.playlist_visible !== false;
        document.getElementById('playlistToggle').checked = plVisible;
        const plWidget = document.getElementById('playlist-widget');
        if (plWidget) {
            if (!plVisible) plWidget.classList.add('hidden');
            else plWidget.classList.remove('hidden');
        }

        if (App.config.widgets) {
            for (const id of App.widgetIds) {
                if (App.config.widgets[id]) App.widgetState[id] = App.config.widgets[id];
            }
        }
        App.updateAllWidgets();
        for (const id of App.widgetIds) App.initWidgetControls(id);

        await App.fetchSongs();

        const volSlider = App.getVolSlider();
        if (App.config.volume !== undefined) volSlider.value = App.config.volume;
        App.setVolume(volSlider.value);
        if (parseFloat(volSlider.value) === 0) App.getCustomVolBtn().classList.add('muted');
        else App.getCustomVolBtn().classList.remove('muted');

        App.updateVisualizerVisibility();
        App.updateEffectsSettings();

        const effOpacity = (App.config.effects_opacity || 50) / 100;
        document.getElementById('effects-fire-canvas').style.opacity = effOpacity;
        document.getElementById('effects-rain-canvas').style.opacity = effOpacity;

        setTimeout(() => {
            App.ensureVisualizer();
        }, 1000);
    }

    App.renderFileList = renderFileList;
    App.openFilePanel = openFilePanel;
    App.closeFilePanel = closeFilePanel;

    init();
})(window.MusicApp);
