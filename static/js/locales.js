window.LOCALES = {
    ru: {
        shuffle: "Перемешать",
        prev: "Предыдущий",
        playPause: "Играть/Пауза",
        next: "Следующий",
        repeat: "Повтор",
        volume: "Звук",
        playlist: "Плейлист",
        search: "Поиск...",
        noTracks: "Нет треков",
        download: "Скачать",
        loadingError: "Ошибка загрузки",
        unknownArtist: "Неизвестный артист",
        settings: "Настройки",
        siteTitle: "Название сайта",
        editMode: "Режим редактирования",
        language: "Язык",
        accent: "Акцент",
        visualizerOpacity: "Прозрачность визуализатора",
        playlistVisible: "Плейлист",
        effects: "Эффекты",
        effectsOff: "Выкл",
        effectsFire: "Огонь",
        effectsRain: "Дождь",
        effectsOpacity: "Прозрачность эффектов",
        effectsColor: "Цвет эффектов",
        visualizer: "Визуализатор",
        visualizerOff: "Выкл",
        equalizer: "Эквалайзер",
        reset: "сброс",
        aboutPlayer: "О плеере",
        version: "Версия",
        developer: "Разработчик",
        colorPicker: "Выбор цвета",
        cancel: "Отмена",
        apply: "Применить",
        unknownTitle: "-"
    },
    eng: {
        shuffle: "Shuffle",
        prev: "Previous",
        playPause: "Play/Pause",
        next: "Next",
        repeat: "Repeat",
        volume: "Volume",
        playlist: "Playlist",
        search: "Search...",
        noTracks: "No tracks",
        download: "Download",
        loadingError: "Loading error",
        unknownArtist: "Unknown Artist",
        settings: "Settings",
        siteTitle: "Site title",
        editMode: "Edit mode",
        language: "Language",
        accent: "Accent",
        visualizerOpacity: "Visualizer opacity",
        playlistVisible: "Playlist",
        effects: "Effects",
        effectsOff: "Off",
        effectsFire: "Fire",
        effectsRain: "Rain",
        effectsOpacity: "Effects opacity",
        effectsColor: "Effects color",
        visualizer: "Visualizer",
        visualizerOff: "Off",
        equalizer: "Equalizer",
        reset: "reset",
        aboutPlayer: "About player",
        version: "Version",
        developer: "Developer",
        colorPicker: "Color picker",
        cancel: "Cancel",
        apply: "Apply",
        unknownTitle: "-"
    }
};

window.currentLocale = 'ru';

window.t = function(key) {
    return (window.LOCALES[window.currentLocale] && window.LOCALES[window.currentLocale][key])
        || (window.LOCALES['eng'] && window.LOCALES['eng'][key])
        || key;
};

window.applyLocale = function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const translation = window.t(key);
        if (el.tagName === 'INPUT' && el.type !== 'range') {
            el.placeholder = translation;
        } else if (el.tagName === 'INPUT' && el.type === 'range') {
        } else {
            const svg = el.querySelector('svg');
            if (svg && el.tagName === 'BUTTON') {
            } else {
                el.textContent = translation;
            }
        }
    });

    const tooltips = {
        'shuffleBtn': 'shuffle',
        'prevBtn': 'prev',
        'nextBtn': 'next',
        'repeatBtn': 'repeat'
    };
    for (const [id, key] of Object.entries(tooltips)) {
        const btn = document.getElementById(id);
        if (btn) {
            const tip = btn.querySelector('.btn-tooltip');
            if (tip) tip.textContent = window.t(key);
        }
    }

    const playTip = document.querySelector('#customPlayBtn .btn-tooltip');
    if (playTip) playTip.textContent = window.t('playPause');

    const volTip = document.querySelector('#customVolBtn .btn-tooltip');
    if (volTip) volTip.textContent = window.t('volume');

    const plHeader = document.querySelector('#playlist-widget .pl-header > span');
    if (plHeader) plHeader.textContent = window.t('playlist');

    const settingsTitle = document.getElementById('settings-title');
    if (settingsTitle) settingsTitle.textContent = window.t('settings');

    const labels = document.querySelectorAll('#settings-panel .settings-main .setting-item .label');
    if (labels.length >= 1) {
        const labelKeys = ['siteTitle', 'editMode', 'language', 'accent'];
        labels.forEach((label, i) => {
            if (labelKeys[i]) label.textContent = window.t(labelKeys[i]);
        });
    }

    const opacityLabels = document.querySelectorAll('#settings-panel .opacity-slider-wrap .label');
    if (opacityLabels.length >= 1) {
        opacityLabels[0].textContent = window.t('visualizerOpacity');
        if (opacityLabels[1]) opacityLabels[1].textContent = window.t('effectsOpacity');
    }

    const allSettingItems = document.querySelectorAll('#settings-panel .settings-content > .setting-item');
    allSettingItems.forEach(item => {
        const label = item.querySelector('.label');
        const toggle = item.querySelector('.toggle-switch input');
        if (label && toggle) {
            if (toggle.id === 'playlistToggle') {
                label.textContent = window.t('playlistVisible');
            }
        }
    });

    const effectsHeader = document.querySelector('.settings-effects-modes .effects-modes-header > span');
    if (effectsHeader) effectsHeader.textContent = window.t('effects');

    const effectsBtns = document.querySelectorAll('.effects-mode-btn');
    if (effectsBtns.length === 3) {
        effectsBtns[0].textContent = window.t('effectsOff');
        effectsBtns[1].textContent = window.t('effectsFire');
        effectsBtns[2].textContent = window.t('effectsRain');
    }

    const effectsColorLabel = document.querySelector('#effectsColorWrapper')?.closest('.setting-item')?.querySelector('.label');
    if (effectsColorLabel) effectsColorLabel.textContent = window.t('effectsColor');

    const eqHeader = document.querySelector('.settings-eq-modes .eq-modes-header > span');
    if (eqHeader) eqHeader.textContent = window.t('visualizer');

    const eqModeBtns = document.querySelectorAll('.eq-mode-btn');
    if (eqModeBtns.length >= 1) {
        eqModeBtns[0].textContent = window.t('visualizerOff');
    }

    const eqTitle = document.querySelector('.settings-eq .eq-header > span');
    if (eqTitle) eqTitle.textContent = window.t('equalizer');

    const eqReset = document.getElementById('widget-eq-reset');
    if (eqReset) eqReset.textContent = window.t('reset');

    const aboutTitle = document.querySelector('.about-section .about-title');
    if (aboutTitle) aboutTitle.textContent = window.t('aboutPlayer');

    const aboutRows = document.querySelectorAll('.about-section .about-row');
    if (aboutRows.length >= 2) {
        aboutRows[0].querySelector('.about-label').textContent = window.t('version');
        aboutRows[1].querySelector('.about-label').textContent = window.t('developer');
    }

    const searchInput = document.getElementById('widget-search');
    if (searchInput) searchInput.placeholder = '';
    const userLabel = document.querySelector('#playlist-widget .user-label');
    if (userLabel) userLabel.textContent = window.t('search');

    const cpTitle = document.querySelector('.color-picker-modal-header h3');
    if (cpTitle) cpTitle.textContent = window.t('colorPicker');
    const cpCancel = document.getElementById('colorPickerModalCancel');
    if (cpCancel) cpCancel.textContent = window.t('cancel');
    const cpApply = document.getElementById('colorPickerModalApply');
    if (cpApply) cpApply.textContent = window.t('apply');
};
