
(function (App) {
    'use strict';

    const MUSIC_BASE = App.MUSIC_BASE;
    const MEDIA_BASE = App.MEDIA_BASE;
    const MUSIC_LIST_API = App.MUSIC_LIST_API;

    let songs = [], filteredSongs = [], currentIndex = 0;
    let isPlaying = false, isShuffle = false, isRepeat = false;
    let shuffledOrder = [], currentShufflePos = -1;
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
        if (animationType === 'pulse') btn.classList.add('animate-pulse');
        else if (animationType === 'rotate') btn.classList.add('animate-rotate');
        setTimeout(() => btn.classList.remove('animate-pulse', 'animate-rotate'), 500);
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
        visualizerMode = App.config.visualizer_mode || 0;
        if (visualizerMode === 0) {
            visualizerEl.classList.add('mode-off');
            if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
            ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        } else {
            visualizerEl.classList.remove('mode-off');
            if (!animFrameId && webaudioReady) animateVisualizer();
        }
        document.querySelectorAll('.eq-mode-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.mode) === visualizerMode);
        });
    }

    function renderEqSliders() {
        const container = document.getElementById('widget-eq-sliders');
        if (!container) return;
        container.innerHTML = '';
        const freqs = ['60Hz', '150Hz', '400Hz', '1kHz', '2.4kHz', '6kHz', '15kHz'];
        const gains = App.config.eq_gains || [0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < eqBands.length; i++) {
            eqBands[i].gain = gains[i] || 0;
            const div = document.createElement('div');
            div.className = 'eq-band';
            const label = document.createElement('span');
            label.textContent = freqs[i];
            const input = document.createElement('input');
            input.type = 'range';
            input.id = `eq-slider-${i}`;
            input.min = '-12'; input.max = '12';
            input.value = eqBands[i].gain || 0;
            input.step = '0.5';
            input.setAttribute('orient', 'vertical');
            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                eqBands[i].gain = val;
                App.config.eq_gains[i] = val;
                if (webaudioReady && eqFilters[i]) eqFilters[i].gain.value = val;
                App.scheduleSave();
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
        const gains = App.config.eq_gains || [0, 0, 0, 0, 0, 0, 0];
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
            App.config.eq_gains[i] = 0;
            if (webaudioReady && eqFilters[i]) eqFilters[i].gain.value = 0;
            const slider = document.getElementById(`eq-slider-${i}`);
            if (slider) slider.value = '0';
        }
        App.scheduleSave();
    }

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
            if (App.config.visualizer_mode !== 0) updateVisualizerVisibility();
            return true;
        } catch (e) { return false; }
    }

    function formatTime(sec) {
        if (isNaN(sec) || sec === Infinity) return '0:00';
        const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
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
            if (pos > 0) [shuffledOrder[0], shuffledOrder[pos]] = [shuffledOrder[pos], shuffledOrder[0]];
            currentShufflePos = 0;
        } else { currentShufflePos = -1; }
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
        } else togglePlay();
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
        } else loadSong(currentIndex - 1);
        if (isPlaying) {
            audio.play().catch(e => {});
            customPlayBtn.classList.add('playing');
        } else togglePlay();
    }

    function toggleShuffle() {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        animateButton(shuffleBtn, 'pulse');
        if (isShuffle) buildShuffleOrder();
        else { shuffledOrder = []; currentShufflePos = -1; }
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
            audio.volume = 0;
            volSlider.value = 0;
            setVolume(0);
            customVolBtn.classList.add('muted');
        } else {
            let prev = parseFloat(audio.dataset.prevVol) || 0.7;
            audio.volume = prev;
            volSlider.value = Math.min(100, Math.max(0, Math.round(Math.pow(prev, 1 / 1.8) * 100)));
            setVolume(volSlider.value);
            customVolBtn.classList.remove('muted');
        }
        animateButton(customVolBtn, 'pulse');
        App.scheduleSave();
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
                <span class="pl-num">${(i + 1).toString().padStart(2, '0')}</span>
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
                if (!isPlaying) togglePlay();
                else { audio.play().catch(e => {}); customPlayBtn.classList.add('playing'); }
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
        const fs = App.widgetState.playlist.fontScale || 1;
        App.applyPlaylistScale(plList.parentElement, fs);
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
        if (!webaudioReady || !analyser || App.config.visualizer_mode === 0) {
            ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
            return;
        }
        analyser.getByteFrequencyData(dataArray);
        const w = visualizerCanvas.width, h = visualizerCanvas.height;
        ctx.clearRect(0, 0, w, h);
        const step = 4;
        const count = Math.floor(dataArray.length / step);
        const barWidth = (w / count) * 0.9;
        const half = h / 2;
        const color = getComputedStyle(document.documentElement).getPropertyValue('--neon-red').trim() || '#ff001c';
        const mode = App.config.visualizer_mode || 0;
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
            const cx = w / 2, cy = h / 2;
            const radius = Math.min(w, h) * 0.35;
            const angleStep = (Math.PI * 2) / count;
            ctx.beginPath();
            for (let i = 0; i < count; i++) {
                const val = dataArray[i * step] / 255;
                const r = radius + val * radius * 0.6;
                const angle = i * angleStep;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
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
        if (webaudioReady && App.config.visualizer_mode !== 0) {
            if (animFrameId) cancelAnimationFrame(animFrameId);
            animateVisualizer();
        }
    }

    customPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); animateButton(customPlayBtn, 'pulse'); });
    customVolBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMute(); });
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    progressLevel.addEventListener('input', seek);
    volSlider.addEventListener('input', (e) => { setVolume(e.target.value); App.scheduleSave(); });
    volSlider.addEventListener('change', () => {
        if (audio.volume === 0) customVolBtn.classList.add('muted');
        else customVolBtn.classList.remove('muted');
        App.scheduleSave();
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
            } else loadSong(currentIndex + 1);
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

    document.getElementById('widget-eq-reset').addEventListener('click', resetEqualizer);

    App.fetchSongs = fetchSongs;
    App.renderEqSliders = renderEqSliders;
    App.updateVisualizerVisibility = updateVisualizerVisibility;
    App.ensureVisualizer = ensureVisualizer;
    App.setVolume = setVolume;
    App.togglePlay = togglePlay;
    App.loadSong = loadSong;
    App.renderPlaylist = renderPlaylist;
    App.initWebAudio = initWebAudio;
    App.getSongs = () => songs;
    App.getCurrentIndex = () => currentIndex;
    App.isPlaying = () => isPlaying;
    App.getAudio = () => audio;
    App.getVolSlider = () => volSlider;
    App.getCustomVolBtn = () => customVolBtn;
})(window.MusicApp);
