'use strict';
// ============ AUDIO: SFX + música chiptune procedural ============
const AudioSys = (() => {
  let ctx = null;
  let enabled = true;
  let musicOn = true;
  let musicTimer = null;
  let curSong = -1;
  let masterGain = null;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function beep(freq, dur, type = 'square', vol = 0.15, slide = 0) {
    if (!enabled) return;
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(masterGain);
    o.start(); o.stop(c.currentTime + dur);
  }

  function noise(dur, vol = 0.2, freq = 1000) {
    if (!enabled) return;
    const c = ensure();
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(masterGain);
    src.start();
  }

  const SFX = {
    shoot()   { noise(0.08, 0.25, 1800); beep(220, 0.06, 'square', 0.1, -120); },
    shootBig(){ noise(0.14, 0.3, 900); beep(120, 0.12, 'square', 0.14, -80); },
    jump()    { beep(240, 0.12, 'square', 0.12, 260); },
    doubleJump(){ beep(340, 0.1, 'square', 0.12, 300); },
    land()    { noise(0.05, 0.08, 400); },
    coin()    { beep(988, 0.05, 'square', 0.12); setTimeout(() => beep(1319, 0.12, 'square', 0.12), 50); },
    gem()     { beep(1175, 0.06, 'triangle', 0.14); setTimeout(() => beep(1568, 0.14, 'triangle', 0.14), 60); },
    hitAnimal(){ noise(0.06, 0.2, 600); beep(160, 0.08, 'sawtooth', 0.1, -60); },
    animalDie(){ beep(300, 0.2, 'sawtooth', 0.12, -220); noise(0.15, 0.15, 500); },
    hurt()    { beep(180, 0.2, 'sawtooth', 0.16, -120); noise(0.1, 0.2, 300); },
    stomp()   { noise(0.1, 0.2, 350); beep(150, 0.1, 'square', 0.1, -60); },
    collect() { beep(523, 0.06, 'square', 0.12); setTimeout(() => beep(784, 0.08, 'square', 0.12), 55); },
    sell()    { beep(659, 0.06, 'square', 0.12); setTimeout(() => beep(880, 0.06, 'square', 0.12), 60); setTimeout(() => beep(1319, 0.15, 'square', 0.12), 120); },
    buy()     { beep(440, 0.08, 'triangle', 0.14); setTimeout(() => beep(660, 0.12, 'triangle', 0.14), 70); },
    denied()  { beep(140, 0.15, 'square', 0.12, -30); },
    spring()  { beep(200, 0.18, 'square', 0.14, 500); },
    checkpoint(){ beep(523, 0.08, 'triangle', 0.13); setTimeout(() => beep(659, 0.08, 'triangle', 0.13), 80); setTimeout(() => beep(784, 0.2, 'triangle', 0.13), 160); },
    bossRoar(){ beep(80, 0.5, 'sawtooth', 0.22, -30); noise(0.5, 0.25, 200); },
    bossHit() { noise(0.08, 0.22, 700); beep(110, 0.1, 'sawtooth', 0.12, -40); },
    bossDie() { for (let i = 0; i < 5; i++) setTimeout(() => { noise(0.25, 0.25, 300 + i * 150); beep(100 + i * 60, 0.2, 'square', 0.12); }, i * 130); },
    win()     { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'square', 0.13), i * 110)); },
    select()  { beep(440, 0.05, 'square', 0.1); },
    confirm() { beep(523, 0.06, 'square', 0.12); setTimeout(() => beep(1047, 0.1, 'square', 0.12), 60); },
    crumble() { noise(0.2, 0.15, 250); },
    throw_()  { beep(300, 0.1, 'triangle', 0.1, 150); },
    explosion(){ noise(0.35, 0.35, 250); beep(70, 0.3, 'sawtooth', 0.2, -40); setTimeout(() => noise(0.2, 0.2, 600), 60); },
    dead()    { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'square', 0.12), i * 140)); },
  };

  // ---- Música: secuenciador chiptune, un patrón por bioma ----
  // Escalas pentatónicas / menores por bioma para variar el mood.
  // 0-9: biomas en orden, 10: boss, 11: menú
  const SONGS = [
    { name: 'bosque',   base: 220.00, scale: [0, 2, 4, 7, 9],      tempo: 340, wave: 'square',   bassWave: 'triangle' },
    { name: 'jungla',   base: 233.08, scale: [0, 3, 5, 7, 10],     tempo: 300, wave: 'square',   bassWave: 'sawtooth' },
    { name: 'desierto', base: 207.65, scale: [0, 1, 4, 5, 8],      tempo: 380, wave: 'triangle', bassWave: 'square' },
    { name: 'sabana',   base: 246.94, scale: [0, 2, 4, 7, 9],      tempo: 320, wave: 'square',   bassWave: 'triangle' },
    { name: 'artico',   base: 196.00, scale: [0, 3, 5, 8, 10],     tempo: 460, wave: 'triangle', bassWave: 'triangle' },
    { name: 'volcan',   base: 164.81, scale: [0, 1, 4, 6, 8],      tempo: 260, wave: 'sawtooth', bassWave: 'square' },
    { name: 'pantano',  base: 185.00, scale: [0, 3, 5, 6, 10],     tempo: 420, wave: 'triangle', bassWave: 'sawtooth' },
    { name: 'montana',  base: 261.63, scale: [0, 2, 5, 7, 9],      tempo: 360, wave: 'square',   bassWave: 'triangle' },
    { name: 'cueva',    base: 155.56, scale: [0, 2, 3, 7, 8],      tempo: 500, wave: 'triangle', bassWave: 'triangle' },
    { name: 'costa',    base: 246.94, scale: [0, 4, 5, 7, 11],     tempo: 330, wave: 'square',   bassWave: 'triangle' },
    { name: 'boss',     base: 174.61, scale: [0, 1, 3, 6, 7],      tempo: 240, wave: 'sawtooth', bassWave: 'square' },
    { name: 'menu',     base: 261.63, scale: [0, 2, 4, 7, 9],      tempo: 400, wave: 'triangle', bassWave: 'triangle' },
  ];
  const SONG_BOSS = 10, SONG_MENU = 11;

  let step = 0, pattern = [], bassPat = [];

  function genPattern(song, seed) {
    let s = seed;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const pat = [], bass = [];
    for (let i = 0; i < 32; i++) {
      pat.push(rnd() < 0.7 ? Math.floor(rnd() * song.scale.length) + (rnd() < 0.3 ? 5 : 0) : -1);
      bass.push(i % 4 === 0 ? Math.floor(rnd() * 3) : (i % 4 === 2 && rnd() < 0.5 ? Math.floor(rnd() * 3) : -1));
    }
    return { pat, bass };
  }

  function noteFreq(song, idx) {
    const oct = Math.floor(idx / song.scale.length);
    const st = song.scale[idx % song.scale.length];
    return song.base * Math.pow(2, (st + oct * 12) / 12);
  }

  function playMusic(songIdx) {
    if (songIdx === curSong && musicTimer) return;
    stopMusic();
    curSong = songIdx;
    if (!musicOn || !enabled) return;
    const song = SONGS[songIdx];
    const gen = genPattern(song, 7919 + songIdx * 131);
    pattern = gen.pat; bassPat = gen.bass;
    step = 0;
    musicTimer = setInterval(() => {
      if (!musicOn || !enabled) return;
      const n = pattern[step % 32];
      if (n >= 0) beep(noteFreq(song, n) * 2, song.tempo / 1000 * 0.9, song.wave, 0.045);
      const b = bassPat[step % 32];
      if (b >= 0) beep(noteFreq(song, b), song.tempo / 1000 * 1.6, song.bassWave, 0.05);
      if (step % 8 === 4) noise(0.03, 0.03, 6000);
      if (step % 4 === 0) noise(0.04, 0.025, 200);
      step++;
    }, SONGS[songIdx].tempo);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    curSong = -1;
  }

  return {
    SFX, playMusic, stopMusic, ensure,
    toggleSound() { enabled = !enabled; if (!enabled) stopMusic(); return enabled; },
    toggleMusic() { musicOn = !musicOn; if (!musicOn) stopMusic(); return musicOn; },
    get soundOn() { return enabled; },
    get musicOn() { return musicOn; },
  };
})();
const SFX = AudioSys.SFX;
