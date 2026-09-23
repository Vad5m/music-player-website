(function() {
    const fireCanvas = document.getElementById('effects-fire-canvas');
    const fireCtx = fireCanvas.getContext('2d');
    const rainCanvas = document.getElementById('effects-rain-canvas');
    const rainCtx = rainCanvas.getContext('2d');

    let effectsMode = 0;
    let effectsRunning = false;
    let effectsRAF = null;
    let lastTime = 0;
    let fireParticles = [];
    let rainDrops = [];

    let effectsColor = '#ff001c';
    let effectsOpacity = 0.5;

    function resizeEffectCanvases() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        fireCanvas.width = w;
        fireCanvas.height = h;
        fireCanvas.style.width = '100vw';
        fireCanvas.style.height = '100vh';
        rainCanvas.width = w;
        rainCanvas.height = h;
        rainCanvas.style.width = '100vw';
        rainCanvas.style.height = '100vh';
    }
    resizeEffectCanvases();
    window.addEventListener('resize', resizeEffectCanvases);

    function initFire() {
        fireParticles = [];
        const w = fireCanvas.width;
        const h = fireCanvas.height;
        const count = 120;
        for (let i = 0; i < count; i++) {
            fireParticles.push({
                x: Math.random() * w,
                y: h + Math.random() * 200,
                size: 2 + Math.random() * 8,
                vx: (Math.random() - 0.5) * 30,
                vy: -(50 + Math.random() * 150),
                life: 0.3 + Math.random() * 0.8,
                maxLife: 0.3 + Math.random() * 0.8
            });
        }
    }

    function updateFire(dt) {
        const w = fireCanvas.width;
        const h = fireCanvas.height;
        for (let p of fireParticles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 25 * dt;
            p.life -= dt * 0.4;

            if (p.y < -30 || p.life <= 0) {
                p.x = Math.random() * w;
                p.y = h + 20 + Math.random() * 100;
                p.size = 2 + Math.random() * 8;
                p.vx = (Math.random() - 0.5) * 30;
                p.vy = -(50 + Math.random() * 150);
                p.life = 0.3 + Math.random() * 0.8;
                p.maxLife = p.life;
            }
        }
    }

    function drawFire() {
        const w = fireCanvas.width;
        const h = fireCanvas.height;
        fireCtx.clearRect(0, 0, w, h);
        const color = effectsColor;
        for (let p of fireParticles) {
            const alpha = (p.life / p.maxLife) * 0.7;
            const size = p.size * (0.3 + 0.7 * (p.life / p.maxLife));
            fireCtx.beginPath();
            fireCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
            fireCtx.fillStyle = color;
            fireCtx.globalAlpha = alpha;
            fireCtx.shadowColor = color;
            fireCtx.shadowBlur = 20;
            fireCtx.fill();
            fireCtx.shadowBlur = 0;
        }
        fireCtx.globalAlpha = 1;
    }

    function initRain() {
        rainDrops = [];
        const w = rainCanvas.width;
        const h = rainCanvas.height;
        const count = 200;
        for (let i = 0; i < count; i++) {
            rainDrops.push({
                x: Math.random() * w,
                y: -10 - Math.random() * 200,
                speed: 100 + Math.random() * 300,
                length: 10 + Math.random() * 30,
                width: 0.5 + Math.random() * 2,
                opacity: 0.2 + Math.random() * 0.5
            });
        }
    }

    function updateRain(dt) {
        const w = rainCanvas.width;
        const h = rainCanvas.height;
        for (let d of rainDrops) {
            d.x += d.speed * 0.05 * dt;
            d.y += d.speed * dt;

            if (d.y > h + 30) {
                d.x = Math.random() * w;
                d.y = -10 - Math.random() * 100;
                d.speed = 100 + Math.random() * 300;
                d.length = 10 + Math.random() * 30;
                d.opacity = 0.2 + Math.random() * 0.5;
            }
            if (d.x < -50 || d.x > w + 50) {
                d.x = Math.random() * w;
                d.y = -10 - Math.random() * 100;
            }
        }
    }

    function drawRain() {
        const w = rainCanvas.width;
        const h = rainCanvas.height;
        rainCtx.clearRect(0, 0, w, h);
        const color = effectsColor;
        for (let d of rainDrops) {
            rainCtx.beginPath();
            rainCtx.moveTo(d.x, d.y);
            rainCtx.lineTo(d.x + d.length * 0.15, d.y + d.length);
            rainCtx.strokeStyle = color;
            rainCtx.globalAlpha = d.opacity * 0.6;
            rainCtx.lineWidth = d.width;
            rainCtx.shadowColor = color;
            rainCtx.shadowBlur = 4;
            rainCtx.stroke();
            rainCtx.shadowBlur = 0;
        }
        rainCtx.globalAlpha = 1;
    }

    function startEffects(mode) {
        effectsMode = mode;

        fireCanvas.classList.add('hidden');
        rainCanvas.classList.add('hidden');

        if (effectsRAF) {
            cancelAnimationFrame(effectsRAF);
            effectsRAF = null;
        }
        effectsRunning = false;

        if (mode === 0) return;

        if (mode === 1) {
            fireCanvas.classList.remove('hidden');
            initFire();
        } else if (mode === 2) {
            rainCanvas.classList.remove('hidden');
            initRain();
        }

        effectsRunning = true;
        lastTime = performance.now();
        animateEffects();
    }

    function animateEffects() {
        if (!effectsRunning) {
            effectsRAF = null;
            return;
        }

        const now = performance.now();
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        if (effectsMode === 1) {
            updateFire(dt);
            drawFire();
        } else if (effectsMode === 2) {
            updateRain(dt);
            drawRain();
        }

        effectsRAF = requestAnimationFrame(animateEffects);
    }

    function updateEffectsSettings() {
        const opacity = (configData.effects_opacity || 50) / 100;
        effectsOpacity = opacity;
        document.documentElement.style.setProperty('--effects-opacity', opacity);
        fireCanvas.style.opacity = opacity;
        rainCanvas.style.opacity = opacity;

        const color = configData.effects_color || '#ff001c';
        effectsColor = color;
        document.documentElement.style.setProperty('--effects-color', color);
        effectsColorPicker.value = color;
        effectsColorWrapper.style.background = color;
        document.getElementById('effectsOpacity').value = configData.effects_opacity || 50;

        effectsModeButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.mode) === configData.effects_mode);
        });

        startEffects(configData.effects_mode || 0);
    }

    const CONFIG_API = window.MUSIC_URLS.config;
    const MUSIC_LIST_API = window.MUSIC_URLS.musicList;
    const MUSIC_BASE = window.MUSIC_URLS.musicBase;
    const MEDIA_BASE = window.MUSIC_URLS.mediaBase;
    const widgetIds = ['settings', 'player', 'info', 'progress', 'volume', 'playlist'];

    let widgetState = {
        settings: { x: 20, y: 20, width: 48, height: 48, rotation: 0, scale: 1, fontScale: 1 },
        player: { x: 100, y: 100, width: 280, height: 70, rotation: 0, scale: 1, fontScale: 1 },
        info: { x: 120, y: 40, width: 220, height: 80, rotation: 0, scale: 1, fontScale: 1 },
        progress: { x: 0, y: 0, width: 400, height: 44, rotation: 0, scale: 1, fontScale: 1 },
        volume: { x: 0, y: 0, width: 180, height: 44, rotation: 0, scale: 1, fontScale: 1 },
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
            console.warn('Failed to load config from server, using defaults');
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
        configData.volume = parseFloat(volSlider.value);
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

    function applyWidgetState(id) {
        const w = widgetState[id];
        const el = widgets[id];
        if (!el) return;
        el.style.left = w.x + 'px';
        el.style.top = w.y + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.transform = `rotate(${w.rotation}deg)`;
        if (id === 'settings') {
            el.style.width = w.width + 'px';
            el.style.height = w.height + 'px';
            const icon = el.querySelector('.btn-icon');
            if (icon) {
                let size = Math.min(w.width, w.height) * 0.58;
                size = Math.max(16, size);
                icon.style.width = size + 'px';
                icon.style.height = size + 'px';
            }
        } else if (id === 'player') {
            scalePlayer(el, w.scale || 1);
        } else if (id === 'info') {
            el.style.width = w.width + 'px';
            el.style.height = w.height + 'px';
            applyInfoScale(el, w.fontScale || 1);
        } else if (id === 'progress') {
            el.style.width = w.width + 'px';
        } else if (id === 'volume') {
            el.style.width = w.width + 'px';
        } else if (id === 'playlist') {
            el.style.width = w.width + 'px';
            el.style.height = w.height + 'px';
            applyPlaylistScale(el, w.fontScale || 1);
        }
    }

    function scalePlayer(el, scale) {
        const btns = el.querySelectorAll('.player-btn');
        const base = 44;
        btns.forEach(btn => {
            const s = base * scale;
            btn.style.width = s + 'px';
            btn.style.height = s + 'px';
            const svg = btn.querySelector('svg');
            if (svg) {
                const ns = 22 * scale;
                svg.style.width = ns + 'px';
                svg.style.height = ns + 'px';
            }
        });
        const customPlay = el.querySelector('.custom-play-container');
        if (customPlay) {
            const s = base * scale;
            customPlay.style.width = s + 'px';
            customPlay.style.height = s + 'px';
            customPlay.style.fontSize = s + 'px';
            const svgs = customPlay.querySelectorAll('svg');
            svgs.forEach(svg => {
                svg.style.width = (20 * scale) + 'px';
                svg.style.height = (20 * scale) + 'px';
            });
        }
        el.style.gap = (6 * scale) + 'px';
    }

    function applyInfoScale(el, fontScale) {
        const title = el.querySelector('.track-title');
        const artist = el.querySelector('.artist-name');
        if (title) title.style.fontSize = (20 * fontScale) + 'px';
        if (artist) artist.style.fontSize = (13 * fontScale) + 'px';
        el.style.padding = (12 * fontScale) + 'px ' + (24 * fontScale) + 'px';
        el.style.gap = (4 * fontScale) + 'px';
        el.style.borderRadius = (16 * fontScale) + 'px';
    }

    function applyPlaylistScale(el, fontScale) {
        const header = el.querySelector('.pl-header');
        const inputGroup = el.querySelector('.input-group');
        const input = el.querySelector('.input');
        const label = el.querySelector('.user-label');
        const searchIcon = el.querySelector('.search-icon');
        const items = el.querySelectorAll('.pl-item');
        if (header) header.style.fontSize = (9 * fontScale) + 'px';
        if (inputGroup) inputGroup.style.width = (110 * fontScale) + 'px';
        if (input) {
            input.style.fontSize = (0.75 * fontScale) + 'rem';
            input.style.padding = (0.35 * fontScale) + 'rem ' + (0.6 * fontScale) + 'rem ' + (0.35 * fontScale) + 'rem ' + (1.8 * fontScale) + 'rem';
        }
        if (label) {
            label.style.fontSize = (0.75 * fontScale) + 'rem';
            label.style.left = (1.8 * fontScale) + 'rem';
        }
        if (searchIcon) {
            searchIcon.style.width = (12 * fontScale) + 'px';
            searchIcon.style.height = (12 * fontScale) + 'px';
            searchIcon.style.left = (6 * fontScale) + 'px';
        }
        items.forEach(item => {
            item.style.fontSize = (12 * fontScale) + 'px';
            item.style.padding = (4 * fontScale) + 'px ' + (6 * fontScale) + 'px';
            item.style.borderRadius = (6 * fontScale) + 'px';
            item.style.gridTemplateColumns = (24 * fontScale) + 'px 1fr ' + (28 * fontScale) + 'px';
            const num = item.querySelector('.pl-num');
            const dl = item.querySelector('.pl-dl');
            if (num) num.style.fontSize = (10 * fontScale) + 'px';
            if (dl) {
                dl.style.width = (24 * fontScale) + 'px';
                dl.style.height = (24 * fontScale) + 'px';
                const img = dl.querySelector('img');
                if (img) {
                    img.style.width = (12 * fontScale) + 'px';
                    img.style.height = (12 * fontScale) + 'px';
                }
            }
        });
        el.style.padding = (14 * fontScale) + 'px ' + (16 * fontScale) + 'px ' + (16 * fontScale) + 'px';
        el.style.gap = (8 * fontScale) + 'px';
        el.style.borderRadius = (20 * fontScale) + 'px';
    }

    function updateAllWidgets() {
        for (const id of widgetIds) applyWidgetState(id);
    }

    function makeDraggable(widgetId, moveBtn) {
        let dragging = false, offX = 0, offY = 0;
        moveBtn.addEventListener('mousedown', function(e) {
            e.stopPropagation(); e.preventDefault();
            if (!document.getElementById('editModeToggle').checked) return;
            const el = widgets[widgetId];
            const rect = el.getBoundingClientRect();
            offX = e.clientX - rect.left;
            offY = e.clientY - rect.top;
            dragging = true;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
        function onMove(e) {
            if (!dragging) return;
            const w = widgetState[widgetId];
            const el = widgets[widgetId];
            let nx = e.clientX - offX;
            let ny = e.clientY - offY;
            nx = Math.max(0, Math.min(nx, window.innerWidth - el.offsetWidth));
            ny = Math.max(0, Math.min(ny, window.innerHeight - el.offsetHeight));
            w.x = nx; w.y = ny;
            el.style.left = nx + 'px'; el.style.top = ny + 'px';
        }
        function onUp() {
            if (dragging) { dragging = false; scheduleSave(); }
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
    }

    function makeRotatable(widgetId, rotateBtn) {
        let rotating = false, startAngle = 0, startRotation = 0, total = 0, prev = 0;
        rotateBtn.addEventListener('mousedown', function(e) {
            e.stopPropagation(); e.preventDefault();
            if (!document.getElementById('editModeToggle').checked) return;
            const w = widgetState[widgetId];
            const el = widgets[widgetId];
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width/2;
            const cy = rect.top + rect.height/2;
            startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
            startRotation = w.rotation;
            total = 0; prev = startAngle;
            rotating = true;
            document.addEventListener('mousemove', onRotate);
            document.addEventListener('mouseup', onRotateUp);
        });
        function onRotate(e) {
            if (!rotating) return;
            const w = widgetState[widgetId];
            const el = widgets[widgetId];
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width/2;
            const cy = rect.top + rect.height/2;
            const cur = Math.atan2(e.clientY - cy, e.clientX - cx);
            let delta = cur - prev;
            if (delta > Math.PI) delta -= 2*Math.PI;
            if (delta < -Math.PI) delta += 2*Math.PI;
            total += delta; prev = cur;
            w.rotation = startRotation + total*(180/Math.PI);
            el.style.transform = `rotate(${w.rotation}deg)`;
        }
        function onRotateUp() {
            if (rotating) {
                rotating = false;
                const w = widgetState[widgetId];
                let r = Math.round(w.rotation/30)*30;
                r = ((r%360)+360)%360;
                w.rotation = r;
                widgets[widgetId].style.transform = `rotate(${r}deg)`;
                scheduleSave();
            }
            document.removeEventListener('mousemove', onRotate);
            document.removeEventListener('mouseup', onRotateUp);
        }
    }

    function makeResizable(widgetId, resizeBtn) {
        let resizing = false, startX=0, startY=0, startW=0, startH=0, startScale=1, startFontScale=1;
        resizeBtn.addEventListener('mousedown', function(e) {
            e.stopPropagation(); e.preventDefault();
            if (!document.getElementById('editModeToggle').checked) return;
            const w = widgetState[widgetId];
            startX = e.clientX; startY = e.clientY;
            startW = w.width; startH = w.height;
            startScale = w.scale || 1;
            startFontScale = w.fontScale || 1;
            resizing = true;
            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', onResizeUp);
        });
        function onResize(e) {
            if (!resizing) return;
            const w = widgetState[widgetId];
            const el = widgets[widgetId];
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (widgetId === 'settings') {
                let nw = startW + dx, nh = startH + dy;
                nw = Math.max(40, Math.min(nw, window.innerWidth - 20));
                nh = Math.max(40, Math.min(nh, window.innerHeight - 20));
                w.width = nw; w.height = nh;
                el.style.width = nw + 'px'; el.style.height = nh + 'px';
                const icon = el.querySelector('.btn-icon');
                if (icon) {
                    let s = Math.min(nw, nh) * 0.58;
                    s = Math.max(16, s);
                    icon.style.width = s + 'px';
                    icon.style.height = s + 'px';
                }
            } else if (widgetId === 'player') {
                let ns = startScale + dx/200;
                ns = Math.max(0.3, Math.min(3, ns));
                w.scale = ns;
                scalePlayer(el, ns);
                const rect = el.getBoundingClientRect();
                w.width = rect.width; w.height = rect.height;
            } else if (widgetId === 'info') {
                let nw = startW + dx, nh = startH + dy;
                nw = Math.max(100, Math.min(nw, window.innerWidth - 20));
                nh = Math.max(40, Math.min(nh, window.innerHeight - 20));
                const scaleRatio = Math.min(nw/startW, nh/startH);
                let nfs = startFontScale * scaleRatio;
                nfs = Math.max(0.4, Math.min(2.5, nfs));
                w.fontScale = nfs; w.width = nw; w.height = nh;
                el.style.width = nw + 'px'; el.style.height = nh + 'px';
                applyInfoScale(el, nfs);
            } else if (widgetId === 'progress') {
                let nw = startW + dx;
                nw = Math.max(200, Math.min(nw, window.innerWidth - 20));
                w.width = nw; el.style.width = nw + 'px';
            } else if (widgetId === 'volume') {
                let nw = startW + dx;
                nw = Math.max(120, Math.min(nw, window.innerWidth - 20));
                w.width = nw; el.style.width = nw + 'px';
            } else if (widgetId === 'playlist') {
                let nw = startW + dx, nh = startH + dy;
                nw = Math.max(160, Math.min(nw, window.innerWidth - 20));
                nh = Math.max(150, Math.min(nh, window.innerHeight - 20));
                const scaleRatio = Math.min(nw/startW, nh/startH);
                let nfs = startFontScale * scaleRatio;
                nfs = Math.max(0.4, Math.min(2.5, nfs));
                w.fontScale = nfs; w.width = nw; w.height = nh;
                el.style.width = nw + 'px'; el.style.height = nh + 'px';
                applyPlaylistScale(el, nfs);
            }
        }
        function onResizeUp() {
            if (resizing) { resizing = false; scheduleSave(); }
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('mouseup', onResizeUp);
        }
    }

    function initWidgetControls(widgetId) {
        const el = widgets[widgetId];
        if (!el) return;
        const move = el.querySelector('.move-btn');
        const rotate = el.querySelector('.rotate-btn');
        const resize = el.querySelector('.resize-btn');
        if (move) makeDraggable(widgetId, move);
        if (rotate) makeRotatable(widgetId, rotate);
        if (resize) makeResizable(widgetId, resize);
    }

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
    document.getElementById('settings-top-btn').addEventListener('click', function(e) {
        if (e.target.closest('.edit-controls')) return;
        openSettings();
    });
    settingsClose.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', closeSettings);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsPanel.classList.contains('open')) closeSettings();
    });

    document.getElementById('editModeToggle').addEventListener('change', function(e) {
        configData.edit_mode = e.target.checked;
        document.querySelectorAll('.widget-wrapper').forEach(el => {
            if (e.target.checked) el.classList.add('edit-mode');
            else el.classList.remove('edit-mode');
        });
        scheduleSave();
    });

    // === Language switch ===
    function initLanguageSwitch() {
        const savedLang = configData.language || 'ru';
        window.currentLocale = savedLang;

        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === savedLang);
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                window.currentLocale = lang;
                configData.language = lang;
                langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
                window.applyLocale();
                // Обновляем динамические тексты
                renderPlaylist();
                updateTrackDisplay();
                scheduleSave();
            });
        });
    }

    const colorPicker = document.getElementById('accentColorPicker');
    const pickerWrapper = document.getElementById('colorPickerWrapper');
    const effectsColorPicker = document.getElementById('effectsColorPicker');
    const effectsColorWrapper = document.getElementById('effectsColorWrapper');
    const colorPickerModal = document.getElementById('color-picker-modal');
    const colorPickerModalClose = document.getElementById('colorPickerModalClose');
    const colorPickerModalCancel = document.getElementById('colorPickerModalCancel');
    const colorPickerModalApply = document.getElementById('colorPickerModalApply');
    const cpWheel = document.getElementById('cp-wheel');
    const cpBrightness = document.getElementById('cp-brightness');
    const cpGrayscale = document.getElementById('cp-grayscale');

    let activeColorTarget = null;
    let cpHue = 0;
    let cpValue = 1;
    let cpRgb = [255, 255, 255];
    let cpDragging = false;
    let cpBrightnessDragging = false;
    let cpGrayscaleDragging = false;
    let cpWheelImage = null;
    let cpWheelImageValue = -1;
    let cpGrayValue = 0;

    const CP_SIZE = cpWheel.width;
    const CP_CX = CP_SIZE / 2;
    const CP_CY = CP_SIZE / 2;
    const CP_OUTER = Math.min(cpWheel.width, cpWheel.height) / 2 - 20;
    const CP_INNER = CP_OUTER * 0.75;
    const CP_MID_R = (CP_OUTER + CP_INNER) / 2;
    const CP_B_PAD = 4;
    const CP_B_H = cpBrightness.height;
    const CP_bRect = { x: CP_B_PAD, y: 8, w: cpBrightness.width - CP_B_PAD * 2, h: CP_B_H - 16 };
    const CP_G_PAD = 4;
    const CP_G_H = cpGrayscale.height;
    const CP_gRect = { x: CP_G_PAD, y: 8, w: cpGrayscale.width - CP_G_PAD * 2, h: CP_G_H - 16 };

    const cpCtx = cpWheel.getContext('2d');
    const cpBCtx = cpBrightness.getContext('2d');
    const cpGCtx = cpGrayscale.getContext('2d');

    function cpBuildWheelImage() {
        const size = CP_SIZE;
        const img = cpCtx.createImageData(size, size);
        const data = img.data;
        const cx = size / 2, cy = size / 2;
        const outer = size / 2;
        const inner = outer * 0.75;
        const v = cpValue;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x + 0.5 - cx;
                const dy = y + 0.5 - cy;
                const r = Math.hypot(dx, dy);
                if (r > outer || r < inner) continue;

                const h = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
                const [rr, gg, bb] = cpHsvToRgb(h / 360, 1, v);

                const i = (y * size + x) * 4;
                data[i] = rr; data[i + 1] = gg; data[i + 2] = bb; data[i + 3] = 255;
            }
        }

        const off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        off.getContext('2d').putImageData(img, 0, 0);
        return off;
    }

    function cpHsvToRgb(h, s, v) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    function cpRgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        if (d !== 0) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
                case g: h = ((b - r) / d + 2); break;
                case b: h = ((r - g) / d + 4); break;
            }
            h *= 60;
        }
        return [h, max === 0 ? 0 : d / max, max];
    }

    function cpRecalc() {
        cpRgb = cpHsvToRgb(((cpHue % 360) + 360) % 360 / 360, 1, cpValue);
        cpDraw();
        cpDrawBrightness();
        cpDrawGrayscale();
    }

    function cpDrawDiamond(c, x, y, size, fillColor) {
        c.save();
        c.translate(x, y);
        c.beginPath();
        c.moveTo(0, -size);
        c.lineTo(size, 0);
        c.lineTo(0, size);
        c.lineTo(-size, 0);
        c.closePath();

        c.fillStyle = fillColor;
        c.fill();

        const r = parseInt(fillColor.slice(1, 3), 16);
        const g = parseInt(fillColor.slice(3, 5), 16);
        const b = parseInt(fillColor.slice(5, 7), 16);
        const lum = r + g + b;
        c.lineWidth = 2;
        c.strokeStyle = lum > 380 ? '#000' : '#fff';
        c.stroke();

        c.beginPath();
        c.moveTo(0, -(size - 3));
        c.lineTo(size - 3, 0);
        c.lineTo(0, size - 3);
        c.lineTo(-(size - 3), 0);
        c.closePath();
        c.lineWidth = 1;
        c.strokeStyle = lum > 380 ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
        c.stroke();

        c.restore();
    }

    function cpDraw() {
        cpCtx.clearRect(0, 0, CP_SIZE, CP_SIZE);

        if (!cpWheelImage || Math.abs(cpWheelImageValue - cpValue) > 1e-3) {
            cpWheelImage = cpBuildWheelImage();
            cpWheelImageValue = cpValue;
        }
        cpCtx.save();
        cpCtx.translate(CP_CX, CP_CY);
        const scale = (CP_OUTER * 2) / cpWheelImage.width;
        cpCtx.scale(scale, scale);
        cpCtx.drawImage(cpWheelImage, -cpWheelImage.width / 2, -cpWheelImage.height / 2);
        cpCtx.restore();

        cpCtx.beginPath();
        cpCtx.arc(CP_CX, CP_CY, CP_INNER * 0.55, 0, Math.PI * 2);
        cpCtx.fillStyle = `rgb(${cpRgb[0]}, ${cpRgb[1]}, ${cpRgb[2]})`;
        cpCtx.fill();

        const text = `${cpRgb[0]}, ${cpRgb[1]}, ${cpRgb[2]}`;
        cpCtx.fillStyle = (cpRgb[0] + cpRgb[1] + cpRgb[2] > 380) ? '#000' : '#fff';
        cpCtx.font = `bold ${Math.max(8, Math.floor(CP_INNER * 0.13))}px sans-serif`;
        cpCtx.textAlign = 'center';
        cpCtx.textBaseline = 'middle';
        cpCtx.fillText(text, CP_CX, CP_CY);

        const ang = cpHue * Math.PI / 180;
        const px = CP_CX + CP_MID_R * Math.sin(ang);
        const py = CP_CY - CP_MID_R * Math.cos(ang);
        const fill = `rgb(${cpRgb[0]}, ${cpRgb[1]}, ${cpRgb[2]})`;
        cpDrawDiamond(cpCtx, px, py, 13, fill);
    }

    function cpRoundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r);
        c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r);
        c.arcTo(x, y, x + w, y, r);
        c.closePath();
    }

    function cpDrawBrightness() {
        cpBCtx.clearRect(0, 0, cpBrightness.width, CP_B_H);

        const base = cpHsvToRgb(((cpHue % 360) + 360) % 360 / 360, 1, 1);

        const grad = cpBCtx.createLinearGradient(CP_bRect.x, 0, CP_bRect.x + CP_bRect.w, 0);
        grad.addColorStop(0, 'rgb(0, 0, 0)');
        grad.addColorStop(1, `rgb(${base[0]}, ${base[1]}, ${base[2]})`);

        cpBCtx.fillStyle = grad;
        cpRoundRect(cpBCtx, CP_bRect.x, CP_bRect.y, CP_bRect.w, CP_bRect.h, 4);
        cpBCtx.fill();

        const hx = CP_bRect.x + cpValue * CP_bRect.w;
        const hy = CP_B_H / 2;
        const fill = `rgb(${cpRgb[0]}, ${cpRgb[1]}, ${cpRgb[2]})`;
        cpDrawDiamond(cpBCtx, hx, hy, 11, fill);
    }

    function cpDrawGrayscale() {
        cpGCtx.clearRect(0, 0, cpGrayscale.width, CP_G_H);

        const grad = cpGCtx.createLinearGradient(CP_gRect.x, 0, CP_gRect.x + CP_gRect.w, 0);
        grad.addColorStop(0, 'rgb(255, 255, 255)');
        grad.addColorStop(1, 'rgb(0, 0, 0)');

        cpGCtx.fillStyle = grad;
        cpRoundRect(cpGCtx, CP_gRect.x, CP_gRect.y, CP_gRect.w, CP_gRect.h, 4);
        cpGCtx.fill();

        const hx = CP_gRect.x + cpGrayValue * CP_gRect.w;
        const hy = CP_G_H / 2;
        const fill = `rgb(${cpRgb[0]}, ${cpRgb[1]}, ${cpRgb[2]})`;
        cpDrawDiamond(cpGCtx, hx, hy, 11, fill);
    }

    function cpGetMousePos(e, cv) {
        const rect = cv.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (cv.width / rect.width),
            y: (e.clientY - rect.top) * (cv.height / rect.height),
        };
    }

    function cpUpdateFromPos(x, y) {
        const dx = x - CP_CX;
        const dy = y - CP_CY;
        cpHue = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
        cpRecalc();
    }

    function cpUpdateBrightnessFromPos(x) {
        let ratio = (x - CP_bRect.x) / CP_bRect.w;
        ratio = Math.max(0, Math.min(1, ratio));
        cpValue = ratio;
        cpRecalc();
    }

    function cpApplyGray(ratio) {
        cpGrayValue = ratio;
        const c = Math.round((1 - ratio) * 255);
        cpRgb = [c, c, c];
        cpHue = 0;
        cpValue = 1 - ratio;

        cpDraw();
        cpDrawBrightness();
        cpDrawGrayscale();
    }

    function cpUpdateGrayscaleFromPos(x) {
        let ratio = (x - CP_gRect.x) / CP_gRect.w;
        ratio = Math.max(0, Math.min(1, ratio));
        cpApplyGray(ratio);
    }

    function cpHexFromRgb(rgb) {
        return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
    }

    function cpSetRgb(r, g, b) {
        const [h, , v] = cpRgbToHsv(r, g, b);
        cpHue = h;
        cpValue = Math.max(0, Math.min(1, v));
        cpRgb = [r, g, b];
        cpGrayValue = 0;
        cpDraw();
        cpDrawBrightness();
        cpDrawGrayscale();
    }

    function openColorPicker(target) {
        activeColorTarget = target;
        const current = target === 'accent' ? configData.accent_color : configData.effects_color;
        const hex = current || '#ff001c';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        cpSetRgb(r, g, b);
        colorPickerModal.classList.add('open');
    }

    function closeColorPicker() {
        colorPickerModal.classList.remove('open');
        activeColorTarget = null;
    }

    cpWheel.addEventListener('mousedown', e => {
        cpDragging = true;
        const { x, y } = cpGetMousePos(e, cpWheel);
        cpUpdateFromPos(x, y);
    });
    cpWheel.addEventListener('mousemove', e => {
        if (!cpDragging) return;
        const { x, y } = cpGetMousePos(e, cpWheel);
        cpUpdateFromPos(x, y);
    });
    window.addEventListener('mouseup', () => cpDragging = false);

    cpBrightness.addEventListener('mousedown', e => {
        cpBrightnessDragging = true;
        const { x } = cpGetMousePos(e, cpBrightness);
        cpUpdateBrightnessFromPos(x);
    });
    cpBrightness.addEventListener('mousemove', e => {
        if (!cpBrightnessDragging) return;
        const { x } = cpGetMousePos(e, cpBrightness);
        cpUpdateBrightnessFromPos(x);
    });
    window.addEventListener('mouseup', () => cpBrightnessDragging = false);

    cpGrayscale.addEventListener('mousedown', e => {
        cpGrayscaleDragging = true;
        const { x } = cpGetMousePos(e, cpGrayscale);
        cpUpdateGrayscaleFromPos(x);
    });
    cpGrayscale.addEventListener('mousemove', e => {
        if (!cpGrayscaleDragging) return;
        const { x } = cpGetMousePos(e, cpGrayscale);
        cpUpdateGrayscaleFromPos(x);
    });
    window.addEventListener('mouseup', () => cpGrayscaleDragging = false);

    colorPickerModalClose.addEventListener('click', closeColorPicker);
    colorPickerModalCancel.addEventListener('click', closeColorPicker);
    colorPickerModalApply.addEventListener('click', () => {
        const hex = cpHexFromRgb(cpRgb);
        if (activeColorTarget === 'accent') {
            setAccentColor(hex);
        } else if (activeColorTarget === 'effects') {
            configData.effects_color = hex;
            effectsColorWrapper.style.background = hex;
            document.documentElement.style.setProperty('--effects-color', hex);
            effectsColor = hex;
            effectsColorPicker.value = hex;
            scheduleSave();
        }
        closeColorPicker();
    });

    colorPickerModal.addEventListener('click', (e) => {
        if (e.target === colorPickerModal) closeColorPicker();
    });

    function setAccentColor(hex) {
        document.documentElement.style.setProperty('--neon-red', hex);
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        document.documentElement.style.setProperty('--neon-glow', `rgba(${r},${g},${b},0.8)`);
        document.documentElement.style.setProperty('--neon-dim', `rgba(${r},${g},${b},0.2)`);
        document.documentElement.style.setProperty('--neon-border', `rgba(${r},${g},${b},0.4)`);
        document.documentElement.style.setProperty('--neon-border-light', `rgba(${r},${g},${b},0.3)`);
        pickerWrapper.style.background = hex;
        configData.accent_color = hex;
        colorPicker.value = hex;
        scheduleSave();
    }

    pickerWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openColorPicker('accent');
    });

    effectsColorWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openColorPicker('effects');
    });

    colorPicker.addEventListener('input', (e) => setAccentColor(e.target.value));
    effectsColorPicker.addEventListener('input', function(e) {
        const hex = e.target.value;
        configData.effects_color = hex;
        effectsColorWrapper.style.background = hex;
        document.documentElement.style.setProperty('--effects-color', hex);
        effectsColor = hex;
        scheduleSave();
    });

    document.getElementById('siteTitleInput').addEventListener('input', function(e) {
        const title = e.target.value.trim();
        document.title = title || 'None';
        configData.site_title = title;
        scheduleSave();
    });

    document.getElementById('visualizerOpacity').addEventListener('input', function(e) {
        const val = parseInt(e.target.value);
        configData.visualizer_opacity = val;
        document.documentElement.style.setProperty('--visualizer-opacity', val/100);
        scheduleSave();
    });

    document.getElementById('playlistToggle').addEventListener('change', function(e) {
        configData.playlist_visible = e.target.checked;
        const widget = document.getElementById('playlist-widget');
        if (widget) {
            if (!e.target.checked) widget.classList.add('hidden');
            else widget.classList.remove('hidden');
        }
        scheduleSave();
    });

    const effectsModeButtons = document.querySelectorAll('.effects-mode-btn');
    effectsModeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            effectsModeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            configData.effects_mode = parseInt(this.dataset.mode);
            scheduleSave();
            updateEffectsSettings();
        });
    });

    document.getElementById('effectsOpacity').addEventListener('input', function(e) {
        const val = parseInt(e.target.value);
        configData.effects_opacity = val;
        document.documentElement.style.setProperty('--effects-opacity', val/100);
        fireCanvas.style.opacity = val/100;
        rainCanvas.style.opacity = val/100;
        scheduleSave();
    });

    const modeButtons = document.querySelectorAll('.eq-mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            modeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            configData.visualizer_mode = parseInt(this.dataset.mode);
            scheduleSave();
            updateVisualizerVisibility();
            if (configData.visualizer_mode !== 0 && webaudioReady && !animFrameId) {
                animateVisualizer();
            }
        });
    });

    let songs = [], filteredSongs = [], currentIndex = 0, isPlaying = false, isShuffle = false, isRepeat = false;
    let shuffledOrder = [];
    let currentShufflePos = -1;
    let audioCtx = null, analyser = null, srcNode = null, dataArray = null, webaudioReady = false;
    let eqFilters = [];
    let eqBands = [
        { freq: 60, gain: 0 }, { freq: 150, gain: 0 }, { freq: 400, gain: 0 }, { freq: 1000, gain: 0 },
        { freq: 2400, gain: 0 }, { freq: 6000, gain: 0 }, { freq: 15000, gain: 0 },
    ];
    let searchQuery = '', isSeeking = false;

    let visualizerMode = 0;
    let animFrameId = null;
    const visualizerEl = document.getElementById('visualizer-widget');
    const visualizerCanvas = document.getElementById('visualizer-canvas');
    const ctx = visualizerCanvas.getContext('2d');

    const audio = document.getElementById('audio-player');
    const customPlayBtn = document.getElementById('customPlayBtn');
    const customVolBtn = document.getElementById('customVolBtn');

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const trackTitle = document.getElementById('widget-track-title');
    const artistName = document.getElementById('widget-artist-name');
    const currentTimeSpan = document.getElementById('widget-current-time');
    const totalTimeSpan = document.getElementById('widget-total-time');
    const progressLevel = document.getElementById('widget-progress-track');
    const volSlider = document.getElementById('widget-vol-slider');
    const plList = document.getElementById('widget-pl-list');
    const searchInput = document.getElementById('widget-search');

    function animateButton(btn, animationType) {
        if (!btn) return;
        btn.classList.remove('animate-pulse', 'animate-rotate');
        void btn.offsetWidth;
        if (animationType === 'pulse') {
            btn.classList.add('animate-pulse');
        } else if (animationType === 'rotate') {
            btn.classList.add('animate-rotate');
        }
        setTimeout(() => {
            btn.classList.remove('animate-pulse', 'animate-rotate');
        }, 500);
    }

    function initCanvasSize() {
        visualizerCanvas.width = window.innerWidth;
        visualizerCanvas.height = window.innerHeight;
        visualizerCanvas.style.width = '100%';
        visualizerCanvas.style.height = '100%';
    }
    initCanvasSize();
    window.addEventListener('resize', initCanvasSize);

    function updateVisualizerVisibility() {
        visualizerMode = configData.visualizer_mode || 0;
        if (visualizerMode === 0) {
            visualizerEl.classList.add('mode-off');
            if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
            ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        } else {
            visualizerEl.classList.remove('mode-off');
            if (!animFrameId && webaudioReady) animateVisualizer();
        }
        modeButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.mode) === visualizerMode);
        });
    }

    function renderEqSliders() {
        const container = document.getElementById('widget-eq-sliders');
        if (!container) return;
        container.innerHTML = '';
        const freqs = ['60Hz','150Hz','400Hz','1kHz','2.4kHz','6kHz','15kHz'];
        const gains = configData.eq_gains || [0,0,0,0,0,0,0];
        for (let i = 0; i < eqBands.length; i++) {
            eqBands[i].gain = gains[i] || 0;
            const div = document.createElement('div');
            div.className = 'eq-band';
            const label = document.createElement('span');
            label.textContent = freqs[i];
            const input = document.createElement('input');
            input.type = 'range';
            input.id = `eq-slider-${i}`;
            input.min = '-12';
            input.max = '12';
            input.value = eqBands[i].gain || 0;
            input.step = '0.5';
            input.setAttribute('orient', 'vertical');
            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                eqBands[i].gain = val;
                configData.eq_gains[i] = val;
                if (webaudioReady && eqFilters[i]) eqFilters[i].gain.value = val;
                scheduleSave();
            });
            div.appendChild(label);
            div.appendChild(input);
            container.appendChild(div);
        }
    }

    function initEqualizer() {
        if (!audioCtx || !srcNode) return;
        if (eqFilters.length) {
            eqFilters.forEach(f => f.disconnect());
            srcNode.disconnect();
            srcNode.connect(analyser);
            analyser.connect(audioCtx.destination);
            eqFilters = [];
        }
        let prevNode = srcNode;
        const gains = configData.eq_gains || [0,0,0,0,0,0,0];
        for (let i = 0; i < eqBands.length; i++) {
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = eqBands[i].freq;
            filter.Q.value = 1.5;
            filter.gain.value = gains[i] || 0;
            eqFilters.push(filter);
            prevNode.connect(filter);
            prevNode = filter;
        }
        prevNode.connect(analyser);
        analyser.connect(audioCtx.destination);
    }

    function resetEqualizer() {
        for (let i = 0; i < eqBands.length; i++) {
            eqBands[i].gain = 0;
            configData.eq_gains[i] = 0;
            if (webaudioReady && eqFilters[i]) eqFilters[i].gain.value = 0;
            const slider = document.getElementById(`eq-slider-${i}`);
            if (slider) slider.value = '0';
        }
        scheduleSave();
    }
    document.getElementById('widget-eq-reset').addEventListener('click', resetEqualizer);

    function initWebAudio() {
        if (webaudioReady || !audio.src) return false;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AC();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            srcNode = audioCtx.createMediaElementSource(audio);
            initEqualizer();
            webaudioReady = true;
            if (configData.visualizer_mode !== 0) updateVisualizerVisibility();
            return true;
        } catch (e) { return false; }
    }

    function formatTime(sec) {
        if (isNaN(sec) || sec === Infinity) return '0:00';
        const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2,'0')}`;
    }

    function updateTrackDisplay() {
        if (!songs.length || !songs[currentIndex]) { trackTitle.textContent = '—'; artistName.textContent = '—'; return; }
        const song = songs[currentIndex];
        const raw = song.name || song.file.replace(/\.[^/.]+$/, '');
        let artist = window.t('unknownArtist'), title = raw;
        if (raw.includes(' - ')) {
            const parts = raw.split(' - ');
            if (parts.length >= 2) { artist = parts[0].trim(); title = parts.slice(1).join(' - ').trim(); }
        }
        trackTitle.textContent = title || '—';
        artistName.textContent = artist;
    }

    function buildShuffleOrder() {
        shuffledOrder = songs.map((_, i) => i);
        for (let i = shuffledOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOrder[i], shuffledOrder[j]] = [shuffledOrder[j], shuffledOrder[i]];
        }
        if (currentIndex >= 0) {
            const pos = shuffledOrder.indexOf(currentIndex);
            if (pos > 0) {
                [shuffledOrder[0], shuffledOrder[pos]] = [shuffledOrder[pos], shuffledOrder[0]];
            }
            currentShufflePos = 0;
        } else {
            currentShufflePos = -1;
        }
    }

    function loadSong(index) {
        if (!songs.length) return;
        if (index < 0) index = songs.length - 1;
        if (index >= songs.length) index = 0;
        currentIndex = index;
        audio.src = MUSIC_BASE + songs[currentIndex].file;
        updateTrackDisplay();
        renderPlaylist();
        progressLevel.value = 0;
        currentTimeSpan.textContent = '0:00';
        totalTimeSpan.textContent = audio.duration ? formatTime(audio.duration) : '0:00';

        if (isPlaying) {
            audio.play().catch(e => {});
            customPlayBtn.classList.add('playing');
        } else {
            customPlayBtn.classList.remove('playing');
        }

        setTimeout(() => {
            const activeItem = plList.querySelector('.pl-item.active-song');
            if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 100);
    }

    function togglePlay() {
        if (!songs.length) return;
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            customPlayBtn.classList.remove('playing');
        } else {
            if (!webaudioReady && audio.src) initWebAudio();
            audio.play().catch(e => {});
            isPlaying = true;
            customPlayBtn.classList.add('playing');
        }
    }

    function nextTrack() {
        if (!songs.length) return;
        animateButton(nextBtn, 'rotate');

        if (isShuffle) {
            if (shuffledOrder.length === 0) buildShuffleOrder();
            currentShufflePos = (currentShufflePos + 1) % shuffledOrder.length;
            loadSong(shuffledOrder[currentShufflePos]);
        } else {
            loadSong(currentIndex + 1);
        }

        if (isPlaying) {
            audio.play().catch(e => {});
            customPlayBtn.classList.add('playing');
        } else {
            togglePlay();
        }
    }

    function prevTrack() {
        if (!songs.length) return;
        animateButton(prevBtn, 'rotate');

        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            updateProgress();
            return;
        }

        if (isShuffle) {
            if (shuffledOrder.length === 0) buildShuffleOrder();
            currentShufflePos = (currentShufflePos - 1 + shuffledOrder.length) % shuffledOrder.length;
            loadSong(shuffledOrder[currentShufflePos]);
        } else {
            loadSong(currentIndex - 1);
        }

        if (isPlaying) {
            audio.play().catch(e => {});
            customPlayBtn.classList.add('playing');
        } else {
            togglePlay();
        }
    }

    function toggleShuffle() {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        animateButton(shuffleBtn, 'pulse');

        if (isShuffle) {
            buildShuffleOrder();
        } else {
            shuffledOrder = [];
            currentShufflePos = -1;
        }
    }

    function toggleRepeat() {
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle('active', isRepeat);
        animateButton(repeatBtn, 'pulse');
    }

    function updateProgress() {
        if (!isSeeking && audio.duration && !isNaN(audio.duration)) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressLevel.value = pct;
            currentTimeSpan.textContent = formatTime(audio.currentTime);
            totalTimeSpan.textContent = formatTime(audio.duration);
        }
    }

    function seek(e) {
        if (!audio.duration) return;
        const pct = parseFloat(e.target.value) / 100;
        isSeeking = true;
        audio.currentTime = pct * audio.duration;
        setTimeout(() => { isSeeking = false; }, 100);
    }

    function setVolume(val) {
        const percent = parseFloat(val) / 100;
        audio.volume = Math.min(1, Math.max(0, Math.pow(percent, 1.8)));
        if (audio.volume === 0) customVolBtn.classList.add('muted');
        else customVolBtn.classList.remove('muted');
    }

    function toggleMute() {
        if (audio.volume > 0) {
            audio.dataset.prevVol = audio.volume;
            audio.volume = 0; volSlider.value = 0; setVolume(0);
            customVolBtn.classList.add('muted');
        } else {
            let prev = parseFloat(audio.dataset.prevVol) || 0.7;
            audio.volume = prev;
            volSlider.value = Math.min(100, Math.max(0, Math.round(Math.pow(prev, 1/1.8) * 100)));
            setVolume(volSlider.value);
            customVolBtn.classList.remove('muted');
        }
        animateButton(customVolBtn, 'pulse');
        scheduleSave();
    }

    function renderPlaylist() {
        const display = filteredSongs.length ? filteredSongs : songs;
        if (!display.length) {
            plList.innerHTML = '<div style="padding:8px;color:rgba(255,255,255,0.4);text-align:center;">' + window.t('noTracks') + '</div>';
            return;
        }
        const fragment = document.createDocumentFragment();
        display.forEach((s, i) => {
            const raw = s.name || s.file.replace(/\.[^/.]+$/, '');
            const origIdx = songs.findIndex(o => o.file === s.file);
            const item = document.createElement('div');
            item.className = 'pl-item' + (origIdx === currentIndex ? ' active-song' : '');
            item.dataset.index = origIdx;
            item.innerHTML = `
                <span class="pl-num">${(i+1).toString().padStart(2,'0')}</span>
                <span class="pl-name">${raw}</span>
                <button class="pl-dl" data-file="${s.file}" data-name="${raw}"><img src="${MEDIA_BASE}icons/download.svg" alt="download" /><span class="btn-tooltip">${window.t('download')}</span></button>
            `;
            fragment.appendChild(item);
        });
        plList.innerHTML = '';
        plList.appendChild(fragment);

        plList.querySelectorAll('.pl-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.pl-dl')) return;
                const idx = parseInt(el.dataset.index);
                loadSong(idx);
                if (isShuffle && shuffledOrder.length > 0) {
                    const pos = shuffledOrder.indexOf(idx);
                    if (pos >= 0) currentShufflePos = pos;
                }
                if (!isPlaying) {
                    togglePlay();
                } else {
                    audio.play().catch(e => {});
                    customPlayBtn.classList.add('playing');
                }
            });
        });
        plList.querySelectorAll('.pl-dl').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const a = document.createElement('a');
                a.href = MUSIC_BASE + btn.dataset.file;
                a.download = btn.dataset.name || btn.dataset.file;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
            });
        });
        const fs = widgetState.playlist.fontScale || 1;
        applyPlaylistScale(plList.parentElement, fs);
    }

    function filterSongs() {
        const q = searchQuery.trim().toLowerCase();
        filteredSongs = q ? songs.filter(s => (s.name || s.file.replace(/\.[^/.]+$/, '')).toLowerCase().includes(q)) : [...songs];
        renderPlaylist();
    }

    async function fetchSongs() {
        try {
            const res = await fetch(MUSIC_LIST_API);
            if (!res.ok) throw new Error();
            songs = (await res.json()) || [];
            filteredSongs = [...songs];
            if (songs.length) loadSong(0);
            renderPlaylist();
            renderEqSliders();
        } catch (err) {
            plList.innerHTML = '<div style="padding:8px;color:rgba(255,0,0,0.6);">' + window.t('loadingError') + '</div>';
            renderEqSliders();
        }
    }

    function drawVisualizer() {
        if (!webaudioReady || !analyser || configData.visualizer_mode === 0) {
            ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
            return;
        }
        analyser.getByteFrequencyData(dataArray);
        const w = visualizerCanvas.width;
        const h = visualizerCanvas.height;
        ctx.clearRect(0, 0, w, h);

        const step = 4;
        const count = Math.floor(dataArray.length / step);
        const barWidth = (w / count) * 0.9;
        const half = h / 2;
        const color = getComputedStyle(document.documentElement).getPropertyValue('--neon-red').trim() || '#ff001c';

        const mode = configData.visualizer_mode || 0;
        if (mode === 1) {
            for (let i = 0; i < count; i++) {
                const val = dataArray[i * step] / 255;
                const barHeight = val * half;
                const x = i * (barWidth + 1);
                ctx.fillStyle = color;
                ctx.fillRect(x, half - barHeight, barWidth, barHeight);
                ctx.fillRect(x, half, barWidth, barHeight);
            }
        } else if (mode === 2) {
            for (let i = 0; i < count; i++) {
                const val = dataArray[i * step] / 255;
                const barHeight = val * h;
                const x = i * (barWidth + 1);
                ctx.fillStyle = color;
                ctx.fillRect(x, h - barHeight, barWidth, barHeight);
            }
        } else if (mode === 3) {
            const cx = w / 2;
            const cy = h / 2;
            const radius = Math.min(w, h) * 0.35;
            const angleStep = (Math.PI * 2) / count;
            ctx.beginPath();
            for (let i = 0; i < count; i++) {
                const val = dataArray[i * step] / 255;
                const r = radius + val * radius * 0.6;
                const angle = i * angleStep;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    function animateVisualizer() {
        drawVisualizer();
        animFrameId = requestAnimationFrame(animateVisualizer);
    }

    function ensureVisualizer() {
        if (webaudioReady && configData.visualizer_mode !== 0) {
            if (animFrameId) cancelAnimationFrame(animFrameId);
            animateVisualizer();
        }
    }

    customPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
        animateButton(customPlayBtn, 'pulse');
    });
    customVolBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
    });
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    progressLevel.addEventListener('input', seek);
    volSlider.addEventListener('input', (e) => { setVolume(e.target.value); scheduleSave(); });
    volSlider.addEventListener('change', (e) => {
        if (audio.volume === 0) customVolBtn.classList.add('muted');
        else customVolBtn.classList.remove('muted');
        scheduleSave();
    });
    searchInput.addEventListener('input', (e) => { searchQuery = e.target.value; filterSongs(); });
    audio.addEventListener('timeupdate', updateProgress);

    audio.addEventListener('ended', () => {
        isPlaying = false;
        customPlayBtn.classList.remove('playing');

        if (isRepeat) {
            audio.currentTime = 0;
            audio.play().catch(e => {});
            isPlaying = true;
            customPlayBtn.classList.add('playing');
        } else {
            if (isShuffle) {
                if (shuffledOrder.length === 0) buildShuffleOrder();
                currentShufflePos = (currentShufflePos + 1) % shuffledOrder.length;
                loadSong(shuffledOrder[currentShufflePos]);
            } else {
                loadSong(currentIndex + 1);
            }
            if (songs.length > 0) {
                audio.play().catch(e => {});
                isPlaying = true;
                customPlayBtn.classList.add('playing');
            }
        }
    });

    audio.addEventListener('loadedmetadata', () => { totalTimeSpan.textContent = formatTime(audio.duration); });

    document.body.addEventListener('click', () => {
        if (!webaudioReady && audio.src) {
            const ok = initWebAudio();
            if (ok) ensureVisualizer();
        }
    }, { once: true });

    async function init() {
        await loadConfigFromServer();

        // === Инициализация языка ===
        initLanguageSwitch();
        window.applyLocale();

        setAccentColor(configData.accent_color || '#ff001c');

        if (configData.site_title) {
            document.title = configData.site_title;
            document.getElementById('siteTitleInput').value = configData.site_title;
        }

        const editMode = configData.edit_mode || false;
        document.getElementById('editModeToggle').checked = editMode;
        document.querySelectorAll('.widget-wrapper').forEach(el => {
            if (editMode) el.classList.add('edit-mode');
            else el.classList.remove('edit-mode');
        });

        const opacity = configData.visualizer_opacity || 30;
        document.getElementById('visualizerOpacity').value = opacity;
        document.documentElement.style.setProperty('--visualizer-opacity', opacity/100);

        const plVisible = configData.playlist_visible !== false;
        document.getElementById('playlistToggle').checked = plVisible;
        const plWidget = document.getElementById('playlist-widget');
        if (plWidget) {
            if (!plVisible) plWidget.classList.add('hidden');
            else plWidget.classList.remove('hidden');
        }

        visualizerMode = configData.visualizer_mode || 0;
        updateVisualizerVisibility();

        if (configData.eq_gains) {
            for (let i = 0; i < Math.min(configData.eq_gains.length, eqBands.length); i++) {
                eqBands[i].gain = configData.eq_gains[i] || 0;
            }
        }

        if (configData.widgets) {
            for (const id of widgetIds) {
                if (configData.widgets[id]) widgetState[id] = configData.widgets[id];
            }
        }
        updateAllWidgets();

        for (const id of widgetIds) initWidgetControls(id);

        fetchSongs();
        renderEqSliders();

        if (configData.volume !== undefined) {
            volSlider.value = configData.volume;
        }
        setVolume(volSlider.value);
        if (audio.volume === 0) customVolBtn.classList.add('muted');
        else customVolBtn.classList.remove('muted');

        updateEffectsSettings();

        const effOpacity = (configData.effects_opacity || 50) / 100;
        fireCanvas.style.opacity = effOpacity;
        rainCanvas.style.opacity = effOpacity;

        if (isShuffle) shuffleBtn.classList.add('active');
        if (isRepeat) repeatBtn.classList.add('active');

        setTimeout(() => {
            if (webaudioReady && configData.visualizer_mode !== 0) ensureVisualizer();
        }, 1000);
    }

    scheduleSave = function() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveConfigToServer, 300);
    };

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
})();
