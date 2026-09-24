
(function (App) {
    'use strict';

    function applyWidgetState(id) {
        const w = App.widgetState[id];
        const el = App.widgets[id];
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
                let size = Math.max(16, Math.min(w.width, w.height) * 0.58);
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
        const base = 44;
        el.querySelectorAll('.player-btn').forEach(btn => {
            const s = base * scale;
            btn.style.width = s + 'px';
            btn.style.height = s + 'px';
            const svg = btn.querySelector('svg');
            if (svg) { svg.style.width = (22 * scale) + 'px'; svg.style.height = (22 * scale) + 'px'; }
        });
        const customPlay = el.querySelector('.custom-play-container');
        if (customPlay) {
            const s = base * scale;
            customPlay.style.width = s + 'px';
            customPlay.style.height = s + 'px';
            customPlay.style.fontSize = s + 'px';
            customPlay.querySelectorAll('svg').forEach(svg => {
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
        if (label) { label.style.fontSize = (0.75 * fontScale) + 'rem'; label.style.left = (1.8 * fontScale) + 'rem'; }
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
                if (img) { img.style.width = (12 * fontScale) + 'px'; img.style.height = (12 * fontScale) + 'px'; }
            }
        });
        el.style.padding = (14 * fontScale) + 'px ' + (16 * fontScale) + 'px ' + (16 * fontScale) + 'px';
        el.style.gap = (8 * fontScale) + 'px';
        el.style.borderRadius = (20 * fontScale) + 'px';
    }

    function updateAllWidgets() {
        for (const id of App.widgetIds) applyWidgetState(id);
    }

    function makeDraggable(widgetId, moveBtn) {
        let dragging = false, offX = 0, offY = 0;
        moveBtn.addEventListener('mousedown', function (e) {
            e.stopPropagation(); e.preventDefault();
            if (!document.getElementById('editModeToggle').checked) return;
            const el = App.widgets[widgetId];
            const rect = el.getBoundingClientRect();
            offX = e.clientX - rect.left;
            offY = e.clientY - rect.top;
            dragging = true;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
        function onMove(e) {
            if (!dragging) return;
            const w = App.widgetState[widgetId];
            const el = App.widgets[widgetId];
            let nx = e.clientX - offX;
            let ny = e.clientY - offY;
            nx = Math.max(0, Math.min(nx, window.innerWidth - el.offsetWidth));
            ny = Math.max(0, Math.min(ny, window.innerHeight - el.offsetHeight));
            w.x = nx; w.y = ny;
            el.style.left = nx + 'px'; el.style.top = ny + 'px';
        }
        function onUp() {
            if (dragging) { dragging = false; App.scheduleSave(); }
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
    }

    function makeRotatable(widgetId, rotateBtn) {
        let rotating = false, startRotation = 0, total = 0, prev = 0;
        rotateBtn.addEventListener('mousedown', function (e) {
            e.stopPropagation(); e.preventDefault();
            if (!document.getElementById('editModeToggle').checked) return;
            const el = App.widgets[widgetId];
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
            startRotation = App.widgetState[widgetId].rotation;
            total = 0; prev = startAngle;
            rotating = true;
            document.addEventListener('mousemove', onRotate);
            document.addEventListener('mouseup', onRotateUp);
        });
        function onRotate(e) {
            if (!rotating) return;
            const el = App.widgets[widgetId];
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const cur = Math.atan2(e.clientY - cy, e.clientX - cx);
            let delta = cur - prev;
            if (delta > Math.PI) delta -= 2 * Math.PI;
            if (delta < -Math.PI) delta += 2 * Math.PI;
            total += delta; prev = cur;
            App.widgetState[widgetId].rotation = startRotation + total * (180 / Math.PI);
            el.style.transform = `rotate(${App.widgetState[widgetId].rotation}deg)`;
        }
        function onRotateUp() {
            if (rotating) {
                rotating = false;
                const w = App.widgetState[widgetId];
                let r = Math.round(w.rotation / 30) * 30;
                r = ((r % 360) + 360) % 360;
                w.rotation = r;
                App.widgets[widgetId].style.transform = `rotate(${r}deg)`;
                App.scheduleSave();
            }
            document.removeEventListener('mousemove', onRotate);
            document.removeEventListener('mouseup', onRotateUp);
        }
    }

    function makeResizable(widgetId, resizeBtn) {
        let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0, startScale = 1, startFontScale = 1;
        resizeBtn.addEventListener('mousedown', function (e) {
            e.stopPropagation(); e.preventDefault();
            if (!document.getElementById('editModeToggle').checked) return;
            const w = App.widgetState[widgetId];
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
            const w = App.widgetState[widgetId];
            const el = App.widgets[widgetId];
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (widgetId === 'settings') {
                let nw = Math.max(40, Math.min(startW + dx, window.innerWidth - 20));
                let nh = Math.max(40, Math.min(startH + dy, window.innerHeight - 20));
                w.width = nw; w.height = nh;
                el.style.width = nw + 'px'; el.style.height = nh + 'px';
                const icon = el.querySelector('.btn-icon');
                if (icon) {
                    let s = Math.max(16, Math.min(nw, nh) * 0.58);
                    icon.style.width = s + 'px'; icon.style.height = s + 'px';
                }
            } else if (widgetId === 'player') {
                let ns = Math.max(0.3, Math.min(3, startScale + dx / 200));
                w.scale = ns;
                scalePlayer(el, ns);
                const rect = el.getBoundingClientRect();
                w.width = rect.width; w.height = rect.height;
            } else if (widgetId === 'info') {
                let nw = Math.max(100, Math.min(startW + dx, window.innerWidth - 20));
                let nh = Math.max(40, Math.min(startH + dy, window.innerHeight - 20));
                const scaleRatio = Math.min(nw / startW, nh / startH);
                let nfs = Math.max(0.4, Math.min(2.5, startFontScale * scaleRatio));
                w.fontScale = nfs; w.width = nw; w.height = nh;
                el.style.width = nw + 'px'; el.style.height = nh + 'px';
                applyInfoScale(el, nfs);
            } else if (widgetId === 'progress') {
                let nw = Math.max(200, Math.min(startW + dx, window.innerWidth - 20));
                w.width = nw; el.style.width = nw + 'px';
            } else if (widgetId === 'volume') {
                let nw = Math.max(120, Math.min(startW + dx, window.innerWidth - 20));
                w.width = nw; el.style.width = nw + 'px';
            } else if (widgetId === 'playlist') {
                let nw = Math.max(160, Math.min(startW + dx, window.innerWidth - 20));
                let nh = Math.max(150, Math.min(startH + dy, window.innerHeight - 20));
                const scaleRatio = Math.min(nw / startW, nh / startH);
                let nfs = Math.max(0.4, Math.min(2.5, startFontScale * scaleRatio));
                w.fontScale = nfs; w.width = nw; w.height = nh;
                el.style.width = nw + 'px'; el.style.height = nh + 'px';
                applyPlaylistScale(el, nfs);
            }
        }
        function onResizeUp() {
            if (resizing) { resizing = false; App.scheduleSave(); }
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('mouseup', onResizeUp);
        }
    }

    function initWidgetControls(widgetId) {
        const el = App.widgets[widgetId];
        if (!el) return;
        const move = el.querySelector('.move-btn');
        const rotate = el.querySelector('.rotate-btn');
        const resize = el.querySelector('.resize-btn');
        if (move) makeDraggable(widgetId, move);
        if (rotate) makeRotatable(widgetId, rotate);
        if (resize) makeResizable(widgetId, resize);
    }

    App.applyWidgetState = applyWidgetState;
    App.scalePlayer = scalePlayer;
    App.applyInfoScale = applyInfoScale;
    App.applyPlaylistScale = applyPlaylistScale;
    App.updateAllWidgets = updateAllWidgets;
    App.initWidgetControls = initWidgetControls;
})(window.MusicApp);
