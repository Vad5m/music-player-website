
window.MusicApp = window.MusicApp || {};

(function (App) {
    'use strict';

    const CONFIG_API = window.MUSIC_URLS.config;
    const MUSIC_LIST_API = window.MUSIC_URLS.musicList;
    const MUSIC_BASE = window.MUSIC_URLS.musicBase;
    const MEDIA_BASE = window.MUSIC_URLS.mediaBase;

    const widgetIds = ['settings', 'player', 'info', 'progress', 'volume', 'playlist'];

    const widgetState = {
        settings: { x: 20, y: 20, width: 48, height: 48, rotation: 0, scale: 1, fontScale: 1 },
        player:   { x: 100, y: 100, width: 280, height: 70, rotation: 0, scale: 1, fontScale: 1 },
        info:     { x: 120, y: 40, width: 220, height: 80, rotation: 0, scale: 1, fontScale: 1 },
        progress: { x: 0, y: 0, width: 400, height: 44, rotation: 0, scale: 1, fontScale: 1 },
        volume:   { x: 0, y: 0, width: 180, height: 44, rotation: 0, scale: 1, fontScale: 1 },
        playlist: { x: 0, y: 0, width: 280, height: 340, rotation: 0, scale: 1, fontScale: 1 },
    };

    let configData = {
        accent_color: '#ff001c',
        edit_mode: false,
        site_title: '',
        language: 'ru',
        visualizer_opacity: 30,
        playlist_visible: true,
        visualizer_mode: 0,
        eq_gains: [0,0,0,0,0,0,0],
        effects_mode: 0,
        effects_opacity: 50,
        effects_color: '#ff001c',
        volume: 70,
        widgets: widgetState
    };

    let configLoaded = false;
    let saveTimeout = null;

    const widgets = {};
    for (const id of widgetIds) {
        widgets[id] = document.getElementById(id + '-widget') || document.getElementById('settings-top-btn');
    }

    async function loadConfigFromServer() {
        try {
            const res = await fetch(CONFIG_API);
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            configData = data;
            if (data.widgets) {
                for (const id of widgetIds) {
                    if (data.widgets[id]) widgetState[id] = data.widgets[id];
                }
            }
            configLoaded = true;
            return true;
        } catch (e) {
            console.warn('Failed to load config from server, using defaults, заеьбало блять');
            return false;
        }
    }

    async function saveConfigToServer() {
        if (!configLoaded) return;
        if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
        configData.widgets = {};
        for (const id of widgetIds) {
            configData.widgets[id] = { ...widgetState[id] };
        }
        const volSlider = document.getElementById('widget-vol-slider');
        if (volSlider) configData.volume = parseFloat(volSlider.value);
        try {
            const res = await fetch(CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configData)
            });
            if (!res.ok) throw new Error('Network error');
        } catch (e) { console.warn('Failed to save config to server'); }
    }

    function scheduleSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveConfigToServer, 300);
    }

    App.CONFIG_API = CONFIG_API;
    App.MUSIC_LIST_API = MUSIC_LIST_API;
    App.MUSIC_BASE = MUSIC_BASE;
    App.MEDIA_BASE = MEDIA_BASE;
    App.widgetIds = widgetIds;
    App.widgetState = widgetState;
    App.configData = configData;
    App.widgets = widgets;
    App.loadConfigFromServer = loadConfigFromServer;
    App.saveConfigToServer = saveConfigToServer;
    App.scheduleSave = scheduleSave;
    App.isConfigLoaded = () => configLoaded;

    Object.defineProperty(App, 'config', {
        get: () => configData,
        set: (v) => { configData = v; }
    });
})(window.MusicApp);
