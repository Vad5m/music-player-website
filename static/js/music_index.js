
(function (App) {
    'use strict';

    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose = document.getElementById('settings-close-btn');

    function openSettings() {
        settingsPanel.classList.add('open');
        settingsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSettings() {
        settingsPanel.classList.remove('open');
        settingsOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.getElementById('settings-top-btn').addEventListener('click', function (e) {
        if (e.target.closest('.edit-controls')) return;
        openSettings();
    });
    settingsClose.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', closeSettings);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsPanel.classList.contains('open')) closeSettings();
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

        if (App.config.eq_gains) {
            for (let i = 0; i < Math.min(App.config.eq_gains.length, 7); i++) {
                // eqBands уже обновятся при renderEqSliders
            }
        }

        if (App.config.widgets) {
            for (const id of App.widgetIds) {
                if (App.config.widgets[id]) App.widgetState[id] = App.config.widgets[id];
            }
        }
        App.updateAllWidgets();
        for (const id of App.widgetIds) App.initWidgetControls(id);

        App.fetchSongs();

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

  init();
  console.log(`⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣾⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣾⣿⡿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡄⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡇⠀⠀⠀⠀⠀⠀⠀⣾⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⠃⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⡇⠀⠀⠀⠀⠀⠀⢸⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠆⠀⢰⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⡄⠀⠀⣠⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⣿⡟⠀⠀⠀⠀⠀⠀⠀⢸⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡟⠀⠀⠘⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣦⣴⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠘⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⢀⣴⠀⠀⠀⠸⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣷⡄⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⠿⣿⣦⣀⣰⣿⣿⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⠇
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣧⡀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⣸⣿⣿⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⡟⣰⣿⣿⡿⣿⣿⡟⠀⠀⠀⠀⠀⣴⠋⠀⠀⢠⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡿⠁⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⣷⣀⣠⣾⣿⣿⣿⣿⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⠟⠁⠀⣿⡟⠁⠀⠀⠀⢀⣾⡇⠀⠀⠀⣾⠃⠀⢀⡆⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⡸⠁⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣦⡀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣧⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠀⡄⠀⠏⠀⠀⠀⠀⠀⣾⣿⣷⡀⠀⠐⡏⠀⠀⢸⣷⡀⠀⠀⠀⠀⠀⠀⣼⠁⠀⠀⠀⠀⠁⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⡄⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⢀⣴⡇⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣷⠀⠀⠁⠀⠀⣸⣿⣇⠀⠀⠀⠀⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣦⣄⠀⠀⠀⠀⠀⠀⠀⠈⠃⠀⠀⠀⠀⡀⠀⠀⢸⣿⣿⠀⢠⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣁⣾⣿⡇⠀⠀⠀⣠⣴⣿⣿⣿⣿⣿⣿⠀⠀⠀⢀⣴⣿⣿⡿⠀⠀⠀⠀⠀⢸⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠀⢀⣿⣿⡇⢠⣾⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⣻⣿⣿⣿⣿⣶⣶⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀⠀⣾⣿⣿⣿⠃⠀⠀⠀⠀⠀⢸⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⢸⡀⠀⠀⠀⠀⠀⠀⢂⠀⠀⠀⣂⠀⠀⠀⠘⢿⣿⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⣼⣿⣿⣷⣿⠃⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢹⣿⣿⣿⣿⣿⣿⡿⠋⢸⣿⣿⣿⣿⣿⣿⣿⢿⣿⣿⣿⣿⡏⠀⠀⠀⠀⣿⡿⠟⠁⠀⡀⠀⠀⠀⠀⠀⢿⣿⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠸⣧⠀⠀⠀⠀⠀⠀⠘⣷⡀⠀⢻⣄⠀⠀⠀⠈⢿⣿⣷⡀⠀⠀⠸⡀⠀⠀⢠⣿⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⢸⣿⣿⡿⠟⠛⢁⣠⠀⣿⣿⣿⣿⣿⣿⣿⡿⠈⣿⣿⣿⣿⣇⠀⠀⠀⣸⠏⠀⠀⠀⢰⡇⠀⠀⠀⠀⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⢻⣧⠀⠀⠀⠀⠀⠀⢿⣷⡄⠈⣿⣷⡄⠀⠀⢸⣿⣿⣇⠀⠀⠀⣧⠀⠀⣾⣿⡆⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠋⢁⡄⢸⡿⠋⢀⣤⣶⣿⡇⢰⣿⣿⣿⣿⣿⣿⠟⠁⠀⠸⣿⣿⣿⣿⡄⠀⣴⡟⠀⠀⠀⠀⣾⣧⠀⠀⠀⠀⠀⢸⡟⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠈⠻⣧⠀⠀⠀⠀⠀⢸⣿⣿⣷⣼⣿⣿⡄⠀⠈⣿⣿⣿⠀⠀⠀⢸⣇⢠⣿⣿⣿⡄⠘⣿⣿⣿⣿⡟⢿⣿⣿⢿⣿⣿⣿⠟⠁⣴⣾⣿⣇⠘⢀⣴⣿⣿⣿⣿⠃⣾⣿⣿⣿⣿⣿⡏⠀⣀⡀⠀⣿⣿⣿⣿⢿⠀⣿⣇⠀⠀⣆⠀⣿⣿⣧⠀⠀⠀⢀⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠹⡆⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⠈⠳⡀⠀⠘⣿⣿⠀⠀⠀⠈⣿⣾⣿⣿⣿⣿⣆⠘⣿⣿⣿⡇⠀⠙⢿⠀⠙⣿⣿⢀⣾⣿⣿⣿⣿⢰⣿⣿⣿⣿⣿⡏⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣿⣿⣦⠀⢻⣿⡆⠀⢿⣦⣼⣿⣿⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠋⠻⣿⠛⠀⠀⠑⠀⠀⠘⣿⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣷⣌⣻⣿⣧⡀⠀⠀⠀⣦⡸⡇⣾⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⡟⢠⡿⠋⢉⣥⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⢸⣿⡧⠀⠘⢿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⠀⠀⣴⣦⣀⣰⡄⠘⠀⣾⣿⣧⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⡄⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⢠⠟⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠈⣿⡇⠀⠀⣾⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⣇⠀⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣦⣠⣿⣿⣿⣧⠀⢿⣿⣿⢸⣿⣿⠙⣿⣿⣿⣿⣿⣿⡀⣿⣿⣿⣿⣿⣿⣿⠟⣿⣿⣿⣿⣿⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠉⠀⠀⠀⠉⢿⣿⠀⢿⠇⠀⣸⣿⠏⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡄⠀⠀⠀⢰⡿⠛⠋⠉⠉⠉⠛⠛⠻⠿⢿⣿⣿⠃⢸⣿⡏⢸⣿⣿⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢻⣿⣿⠏⢸⣿⣿⣿⣿⣿⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠈⣿⣆⠸⡇⢠⣿⡏⠀⣴⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣷⣰⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⣀⣤⣤⠀⠀⡄⠀⠸⣿⣷⠈⣿⣿⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⠸⣿⣿⠀⢾⣿⣿⣿⣿⣿⣦⣬⣽⣿⣿⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡆⠁⣸⣿⠀⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⡇⣿⡇⠀⠀⠀⠀⠓⣶⣄⠀⢸⣿⠟⢋⣀⠀⠁⠀⠀⠙⢿⠀⢹⣿��⣿⣿⣿⢇⣿⣿⣿⣿⣿⡇⠀⢿⣿⡀⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣷⡀⣿⣿⠀⣾⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⢸⠀⠀⣿⣿⣠⣿⡇⠀⠀⠘⢄⣀⡈⠛⠀⠘⠁⠞⠁⢀⡀⠈⢀⠀⠀⠀⠀⠈⣿⣿⣿⡿⠋⣼⣿⣿⠇⢸⣿⣷⠀⠈⠻⣧⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⠀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⢳⣿⡿⠀⢿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠈⠀⣦⣿⣿⣿⣿⣷⡀⠀⠀⠈⠛⢿⣶⠀⠀⠀⠀⠀⣅⣈⠀⢀⠀⠀⠀⠀⠀⠙⠋⠉⠁⢾⣿⡿⠃⢀⣾⣿⣿⣧⡀⠀⠈⠛⠦⠈⣉⣻⣿⣿⡿⠿⠋⠁⢀⠀⢀⡼⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⠇⣾⣿⢣⡆⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⣤⣿⣿⣿⣿⣿⣿⢧⡀⠀⠀⠀⠀⠉⠀⢸⣄⠀⠄⠀⠀⠀⠈⢀⠀⠀⠀⠀⠀⠀⡆⣤⣀⣀⣠⣴⣿⣿⣿⣿⣿⣿⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⣿⣿⢋⣾⣿⣿⣿⡇⢸⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⢠⡄⠀⠈⠛⠳⠦⠈⠁⠤⣶⣿⠀⠀⣿⡇⠀⠀⣴⡿⠋⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡛⠻⡄⠰⢤⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⢟⣵⣿⣿⣿⣿⣿⠁⠎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⣿⣿⡟⠀⠀⢀⣾⣦⡀⠈⠁⠀⠀⢦⣀⣠⠀⠀⢀⠘⠋⠀⠀⠈⠁⠀⠚⠋⠀⠼⠿⠛⢿⣿⣿⣿⣿⣿⣟⡛⠿⣿⣶⣮⣑⠦⣌⣙⠻⠶⠦⣤⣄⣀⣀⣀⣀⣀⣀⣤⣴⣾⡿⠟⣋⣴⣿⣿⡿⠛⣿⣿⡟⠀⠀⢠⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⠃⠀⠀⡈⠻⢿⠿⣷⣤⣀⠀⠀⠈⠉⠋⠙⠉⠀⠀⣀⣀⣤⡀⠀⠀⠀⠀⠀⢀⡀⠀⣿⢿⣿⣿⣿⣿⣿⠦⠀⠙⢿⣿⣷⣌⡙⠻⢷⣶⣦⣤⣤⣤⣭⣭⣭⣭⣭⣤⣤⣶⣿⣿⠿⠛⠉⣠⣾⣿⡿⠁⠀⠀⠀⠙⢷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠘⢦⡄⠀⠀⠙⢿⣆⠀⠀⢿⣦⣤⡤⢄⣉⠙⠻⢿⣿⣿⣶⣶⣾⣿⣿⣿⣿⡿⠋⠀⠀⣼⠁⠀⡞⠁⠀⠀⠀⢹⣿⣿⣿⣿⣿⣷⣦⠀⠙⠻⣿⣿⣷⣤⡈⠉⠛⠿⢿⣿⣿⣿⣿⡿⠿⠿⠿⠛⠋⠀⣠⣾⣿⣿⠟⠀⠀⠀⠻⣦⡀⠀⠙⢷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠃⠀⠀⠀⠀⠉⠂⠀⡀⠙⠻⣦⣄⡀⠉⢱⡀⠛⠛⠛⠛⠛⠛⠋⠉⠉⠁⠀⠀⢼⣧⠀⠀⠀⠀⢀⣿⠆⢸⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠈⠙⢿⣿⣿⣶⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣴⣾⣿⠟⠋⢁⣴⣦⡀⠀⠀⠉⢿⣄⠀⠈⢻⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⠀⠀⠀⠀⢹⡄⠀⠀⠈⠉⠛⠛⠛⠓⠀⠀⠀⠀⠀⠀⠀⠀⣤⣄⠀⠀⠻⣦⡀⠀⠀⠘⠁⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠙⢿⣿⣿⣿⣷⣶⣶⣦⣤⣤⣿⣿⣿⣿⠟⢋⣀⡀⠀⠘⢿⣿⣷⣄⠀⠀⠀⢻⣧⠀⠈⢿⡆⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⠀⠀⠀⠀⠈⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣷⠆⢀⣿⣿⣷⠀⠀⢀⣴⣿⣿⠿⣿⣿⣿⣿⣿⡿⠟⠛⢿⣿⡄⠀⠈⠙⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⢠⣿⣿⣿⣄⠀⠈⠻⣿⡿⠃⠀⠀⠀⢿⣷⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣤⣤⣤⣴⣿⣿⣿⡟⠀⣼⣿⣿⡇⠀⠀⢾⠿⠋⢁⣴⣿⣿⣿⠛⠁⠀⠀⠀⣸⣿⠇⠀⠀⠀⠀⠀⠉⠙⠻⢿⣿⣿⣿⣿⣿⠀⠘⢿⣿⣿⣿⣷⣄⠀⠈⠀⠐⢿⣶⣤⣄⣀⣠⣾⠇⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⡏⠀⠀⠀⣰⣿⣿⣿⠁⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⠀⠀⠀⢀⣴⡿⠋⠀⠀⣠⣴⣦⣤⣤⣤⣤⣀⠈⠻⣿⣿⡇⠀⠀⠀⠙⢿⣿⣿⡿⠃⠀⠀⠀⠀⠈⠉⠙⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡿⠋⢀⣀⠉⠙⢿⠇⢠⣿⣿⣿⣿⣿⣿⡀⠀⠈⢀⣼⣿⣿⣿⣿⣿⠇⠀⠀⠘⠋⠉⠀⣠⣴⣿⡿⠟⠛⠛⠛⠛⠿⣿⣷⡀⢸⡟⠀⠀⠀⠀⠀⠀⠉⠛⠁⣰⣶⣦⣄⡀⠀⠀⣰⣶⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⠀⠁⣠⣿⣿⣿⣦⠀⠀⠀⠀⠙⠟⠛⠛⠿⠳⠄⠀⠀⠀⠀⠈⠉⠁⠀⠀⠀⠀⠀⣀⣴⣾⣿⠟⠉⣀⣴⣶⣶⣶⣄⠀⠈⣿⣷⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⠿⣿⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣰⣿⣿⣿⣿⣿⣧⠀⣿⣿⡄⢀⣶⠆⢠⣤⠀⣀⠀⠀⠀⠸⣶⣶⣶⣶⣶⣶⣿⣿⠿⠋⠀⠀⠰⣿⣿⣿⣿⣿⣿⣷⡄⠻⣿⠀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣾⣿⣿⣿⣿⣿⣿⠇⠀⠛⠛⠃⠈⠃⠀⠘⠋⠀⠉⠀⠀⠀⠀⠙⠛⠛⠛⠛⠛⠉⠁⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣦⡈⠀⠙⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣤⣾⣿⣿⣿⣿⣿⣿⣿⠿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠈⠛⢿⣿⣿⣿⣿⣿⣿⣷⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠁⠀⠀⢰⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⡆⠀⠀⠀⠉⠛⢿⣿⣿⣿⣿⣿⣿⣿⣷⣦⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠛⠛⠻⠿⠛⠛⠛⠛⠛⠋⠉⡁⠀⠀⠀⠀⠀⢸⣿⣷⣄⠀⠀⣀⠀⠠⠀⠀⢀⣀⣀⣀⣀⣀⣀⣀⣀⠀⠀⠀⢀⠀⢀⣴⣿⣿⡇⠀⠀⠀⠀⠀⣀⠈⠉⠛⠻⠿⠿⣿⣿⣿⣿⠿⠿⠿⠛⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠲⣾⣿⣿⡀⠀⠀⠀⠀⠘⢿⣿⡿⠇⠀⢁⣠⣴⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⣄⡀⠘⠻⠿⠟⠀⠀⠀⠀⠀⣰⣿⣿⡶⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣤⣤⣀⠀⠀⠀⢀⣠⣴⣾⣿⣿⣿⠿⠿⠛⠋⠉⠉⠉⠉⠉⠛⠻⢿⣿⣿⣿⣿⣶⣤⣀⡀⠀⢀⣀⣴⣴⣿⣿⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠛⠁⠀⠀⠀⢀⡀⠀⠀⠀⢀⣀⡀⠀⠀⠀⠙⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠛⠛⠛⠋⣉⣥⣴⣶⡟⠁⢀⣴⣿⣿⣿⣿⣶⣾⣿⣿⣿⣿⣦⠈⠻⣶⣦⣤⣌⠉⠛⠛⠛⠙⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⠟⢁⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⢻⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⢴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡄⠙⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⣿⣿⣿⣿⣿⣿⡏⣿⣿⣿⣿⣿⣿⠿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠋⠉⠁⠉⠉⠋⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`);
})(window.MusicApp);
