
(function (App) {
    'use strict';

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
    let cpHue = 0, cpValue = 1, cpRgb = [255, 255, 255];
    let cpDragging = false, cpBrightnessDragging = false, cpGrayscaleDragging = false;
    let cpWheelImage = null, cpWheelImageValue = -1, cpGrayValue = 0;
    let colorPickerMouseDownTarget = null;

    const CP_SIZE = cpWheel.width;
    const CP_CX = CP_SIZE / 2, CP_CY = CP_SIZE / 2;
    const CP_OUTER = Math.min(cpWheel.width, cpWheel.height) / 2 - 20;
    const CP_INNER = CP_OUTER * 0.75;
    const CP_MID_R = (CP_OUTER + CP_INNER) / 2;
    const CP_B_PAD = 16, CP_B_H = cpBrightness.height;
    const CP_bRect = { x: CP_B_PAD, y: 10, w: cpBrightness.width - CP_B_PAD * 2, h: CP_B_H - 20 };
    const CP_G_PAD = 16, CP_G_H = cpGrayscale.height;
    const CP_gRect = { x: CP_G_PAD, y: 10, w: cpGrayscale.width - CP_G_PAD * 2, h: CP_G_H - 20 };

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
        off.width = size; off.height = size;
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
        c.moveTo(0, -size); c.lineTo(size, 0); c.lineTo(0, size); c.lineTo(-size, 0);
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
        c.moveTo(0, -(size - 3)); c.lineTo(size - 3, 0); c.lineTo(0, size - 3); c.lineTo(-(size - 3), 0);
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
        cpDrawDiamond(cpCtx, px, py, 13, `rgb(${cpRgb[0]}, ${cpRgb[1]}, ${cpRgb[2]})`);
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
        cpDrawDiamond(cpBCtx, hx, CP_B_H / 2, 10, `rgb(${cpRgb[0]}, ${cpRgb[1]}, ${cpRgb[2]})`);
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
        cpDrawDiamond(cpGCtx, hx, CP_G_H / 2, 10, `rgb(${cpRgb[0]}, ${cpRgb[1]}, ${cpRgb[2]})`);
    }

    function cpGetMousePos(e, cv) {
        const rect = cv.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (cv.width / rect.width),
            y: (e.clientY - rect.top) * (cv.height / rect.height),
        };
    }

    function cpUpdateFromPos(x, y) {
        const dx = x - CP_CX, dy = y - CP_CY;
        cpHue = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
        cpRecalc();
    }

    function cpUpdateBrightnessFromPos(x) {
        let ratio = (x - CP_bRect.x) / CP_bRect.w;
        cpValue = Math.max(0, Math.min(1, ratio));
        cpRecalc();
    }

    function cpApplyGray(ratio) {
        cpGrayValue = ratio;
        const c = Math.round((1 - ratio) * 255);
        cpRgb = [c, c, c];
        cpHue = 0;
        cpValue = 1 - ratio;
        cpDraw(); cpDrawBrightness(); cpDrawGrayscale();
    }

    function cpUpdateGrayscaleFromPos(x) {
        let ratio = (x - CP_gRect.x) / CP_gRect.w;
        cpApplyGray(Math.max(0, Math.min(1, ratio)));
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
        cpDraw(); cpDrawBrightness(); cpDrawGrayscale();
    }

    function openColorPicker(target) {
        activeColorTarget = target;
        const configData = App.config;
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
        cpDragging = false;
        cpBrightnessDragging = false;
        cpGrayscaleDragging = false;
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
        cpUpdateBrightnessFromPos(cpGetMousePos(e, cpBrightness).x);
    });
    cpBrightness.addEventListener('mousemove', e => {
        if (!cpBrightnessDragging) return;
        cpUpdateBrightnessFromPos(cpGetMousePos(e, cpBrightness).x);
    });
    window.addEventListener('mouseup', () => cpBrightnessDragging = false);

    cpGrayscale.addEventListener('mousedown', e => {
        cpGrayscaleDragging = true;
        cpUpdateGrayscaleFromPos(cpGetMousePos(e, cpGrayscale).x);
    });
    cpGrayscale.addEventListener('mousemove', e => {
        if (!cpGrayscaleDragging) return;
        cpUpdateGrayscaleFromPos(cpGetMousePos(e, cpGrayscale).x);
    });
    window.addEventListener('mouseup', () => cpGrayscaleDragging = false);

    colorPickerModalClose.addEventListener('click', closeColorPicker);
    colorPickerModalCancel.addEventListener('click', closeColorPicker);
    colorPickerModalApply.addEventListener('click', () => {
        const hex = cpHexFromRgb(cpRgb);
        if (activeColorTarget === 'accent') {
            App.setAccentColor(hex);
        } else if (activeColorTarget === 'effects') {
            const configData = App.config;
            configData.effects_color = hex;
            effectsColorWrapper.style.background = hex;
            document.documentElement.style.setProperty('--effects-color', hex);
            if (App.setEffectsColor) App.setEffectsColor(hex);
            effectsColorPicker.value = hex;
            App.scheduleSave();
        }
        closeColorPicker();
    });

    colorPickerModal.addEventListener('mousedown', (e) => {
        colorPickerMouseDownTarget = e.target;
    });
    colorPickerModal.addEventListener('click', (e) => {
        if (e.target === colorPickerModal && colorPickerMouseDownTarget === colorPickerModal) {
            closeColorPicker();
        }
    });

    function getContrastTextColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6 ? '#000000' : '#ffffff';
    }

    function setAccentColor(hex) {
        document.documentElement.style.setProperty('--neon-red', hex);
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        document.documentElement.style.setProperty('--neon-glow', `rgba(${r},${g},${b},0.8)`);
        document.documentElement.style.setProperty('--neon-dim', `rgba(${r},${g},${b},0.2)`);
        document.documentElement.style.setProperty('--neon-border', `rgba(${r},${g},${b},0.4)`);
        document.documentElement.style.setProperty('--neon-border-light', `rgba(${r},${g},${b},0.3)`);
        const textColor = getContrastTextColor(hex);
        document.documentElement.style.setProperty('--accent-text-color', textColor);
        document.documentElement.classList.toggle('light-accent', textColor === '#000000');
        pickerWrapper.style.background = hex;
        App.config.accent_color = hex;
        colorPicker.value = hex;
        App.scheduleSave();
    }

    pickerWrapper.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        openColorPicker('accent');
    });
    effectsColorWrapper.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        openColorPicker('effects');
    });

    colorPicker.addEventListener('input', (e) => setAccentColor(e.target.value));
    effectsColorPicker.addEventListener('input', function (e) {
        const hex = e.target.value;
        App.config.effects_color = hex;
        effectsColorWrapper.style.background = hex;
        document.documentElement.style.setProperty('--effects-color', hex);
        if (App.setEffectsColor) App.setEffectsColor(hex);
        App.scheduleSave();
    });

    App.openColorPicker = openColorPicker;
    App.closeColorPicker = closeColorPicker;
    App.setAccentColor = setAccentColor;
    App.getContrastTextColor = getContrastTextColor;
})(window.MusicApp);
