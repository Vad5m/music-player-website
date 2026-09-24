
(function (App) {
    'use strict';

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
        [fireCanvas, rainCanvas].forEach(c => {
            c.width = w; c.height = h;
            c.style.width = '100vw'; c.style.height = '100vh';
        });
    }
    resizeEffectCanvases();
    window.addEventListener('resize', resizeEffectCanvases);

    function initFire() {
        fireParticles = [];
        const w = fireCanvas.width, h = fireCanvas.height;
        for (let i = 0; i < 120; i++) {
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
        const w = fireCanvas.width, h = fireCanvas.height;
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
        const w = fireCanvas.width, h = fireCanvas.height;
        fireCtx.clearRect(0, 0, w, h);
        for (let p of fireParticles) {
            const alpha = (p.life / p.maxLife) * 0.7;
            const size = p.size * (0.3 + 0.7 * (p.life / p.maxLife));
            fireCtx.beginPath();
            fireCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
            fireCtx.fillStyle = effectsColor;
            fireCtx.globalAlpha = alpha;
            fireCtx.shadowColor = effectsColor;
            fireCtx.shadowBlur = 20;
            fireCtx.fill();
            fireCtx.shadowBlur = 0;
        }
        fireCtx.globalAlpha = 1;
    }

    function initRain() {
        rainDrops = [];
        const w = rainCanvas.width, h = rainCanvas.height;
        for (let i = 0; i < 200; i++) {
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
        const w = rainCanvas.width, h = rainCanvas.height;
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
        const w = rainCanvas.width, h = rainCanvas.height;
        rainCtx.clearRect(0, 0, w, h);
        for (let d of rainDrops) {
            rainCtx.beginPath();
            rainCtx.moveTo(d.x, d.y);
            rainCtx.lineTo(d.x + d.length * 0.15, d.y + d.length);
            rainCtx.strokeStyle = effectsColor;
            rainCtx.globalAlpha = d.opacity * 0.6;
            rainCtx.lineWidth = d.width;
            rainCtx.shadowColor = effectsColor;
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
        if (effectsRAF) { cancelAnimationFrame(effectsRAF); effectsRAF = null; }
        effectsRunning = false;
        if (mode === 0) return;
        if (mode === 1) { fireCanvas.classList.remove('hidden'); initFire(); }
        else if (mode === 2) { rainCanvas.classList.remove('hidden'); initRain(); }
        effectsRunning = true;
        lastTime = performance.now();
        animateEffects();
    }

    function animateEffects() {
        if (!effectsRunning) { effectsRAF = null; return; }
        const now = performance.now();
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        if (effectsMode === 1) { updateFire(dt); drawFire(); }
        else if (effectsMode === 2) { updateRain(dt); drawRain(); }
        effectsRAF = requestAnimationFrame(animateEffects);
    }

    function updateEffectsSettings() {
        const configData = App.config;
        const opacity = (configData.effects_opacity || 50) / 100;
        effectsOpacity = opacity;
        document.documentElement.style.setProperty('--effects-opacity', opacity);
        fireCanvas.style.opacity = opacity;
        rainCanvas.style.opacity = opacity;

        const color = configData.effects_color || '#ff001c';
        effectsColor = color;
        document.documentElement.style.setProperty('--effects-color', color);

        const picker = document.getElementById('effectsColorPicker');
        const wrapper = document.getElementById('effectsColorWrapper');
        if (picker) picker.value = color;
        if (wrapper) wrapper.style.background = color;

        const opInput = document.getElementById('effectsOpacity');
        if (opInput) opInput.value = configData.effects_opacity || 50;

        const buttons = document.querySelectorAll('.effects-mode-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.mode) === configData.effects_mode);
        });

        startEffects(configData.effects_mode || 0);
    }

    App.startEffects = startEffects;
    App.updateEffectsSettings = updateEffectsSettings;
    App.setEffectsColor = (c) => { effectsColor = c; };
    App.getEffectsColor = () => effectsColor;
    App.getEffectsOpacity = () => effectsOpacity;
})(window.MusicApp);
