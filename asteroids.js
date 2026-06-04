/* ============================================================
   Asteroids — playable arcade minigame for the hero header.
   Vector style, screen-wrap, attract mode + interactive mode.
   ============================================================ */
(function () {
  const canvas = document.getElementById('asteroids');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const hero = document.getElementById('hero');
  const hud = document.getElementById('hud');
  const hudScore = document.getElementById('hudScore');
  const hudLives = document.getElementById('hudLives');
  const startBtn = document.getElementById('gameStart');
  const exitBtn = document.getElementById('gameExit');
  const gameOverEl = document.getElementById('gameOver');
  const finalScoreEl = document.getElementById('finalScore');
  const restartBtn = document.getElementById('gameRestart');
  const overExitBtn = document.getElementById('gameOverExit');
  const touch = document.getElementById('touch');
  const controlsHint = document.getElementById('controlsHint');

  const ACCENT = '#a78bfa';
  const ACCENT2 = '#22d3ee';
  const TWO_PI = Math.PI * 2;
  const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;

  // World state
  let W = 0, H = 0, dpr = 1;
  let mode = 'attract';            // 'attract' | 'play' | 'over'
  let ship = null;
  let bullets = [];
  let asteroids = [];
  let particles = [];
  let score = 0, lives = 3, level = 1;
  let invuln = 0;
  let last = 0, raf = null;

  const keys = Object.create(null);

  // ---------- helpers ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  function wrap(o) {
    if (o.x < 0) o.x += W; else if (o.x > W) o.x -= W;
    if (o.y < 0) o.y += H; else if (o.y > H) o.y -= H;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- entities ----------
  function makeAsteroid(x, y, size) {
    const verts = [];
    const n = 9 + Math.floor(rand(0, 4));
    for (let i = 0; i < n; i++) verts.push(rand(0.7, 1.15));
    const speed = rand(12, 42) / size;
    const ang = rand(0, TWO_PI);
    return {
      x, y, size, r: size * 16,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      rot: rand(0, TWO_PI), vr: rand(-0.6, 0.6), verts, n
    };
  }

  function spawnWave(count, avoidX, avoidY) {
    for (let i = 0; i < count; i++) {
      let x, y, tries = 0;
      do {
        x = rand(0, W); y = rand(0, H); tries++;
      } while (avoidX != null && Math.hypot(x - avoidX, y - avoidY) < 140 && tries < 40);
      asteroids.push(makeAsteroid(x, y, 3));
    }
  }

  function makeShip() {
    return { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0, thrust: false };
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const ang = rand(0, TWO_PI), sp = rand(30, 150);
      particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: rand(0.3, 0.7), color });
    }
  }

  // ---------- game flow ----------
  function startGame() {
    mode = 'play';
    score = 0; lives = 3; level = 1; invuln = 1.5;
    bullets = []; particles = []; asteroids = [];
    ship = makeShip();
    spawnWave(4, ship.x, ship.y);
    hero.classList.add('is-playing');
    hud.hidden = false;
    gameOverEl.hidden = true;
    if (isTouch) touch.hidden = false; else if (controlsHint) controlsHint.hidden = false;
    updateHud();
    startBtn.blur();
  }

  function exitGame() {
    mode = 'attract';
    ship = null; bullets = []; particles = [];
    asteroids = [];
    spawnWave(5);
    hero.classList.remove('is-playing');
    hud.hidden = true;
    gameOverEl.hidden = true;
    touch.hidden = true;
    if (controlsHint) controlsHint.hidden = true;
  }

  function gameOver() {
    mode = 'over';
    finalScoreEl.textContent = score;
    gameOverEl.hidden = false;
    touch.hidden = true;
    if (controlsHint) controlsHint.hidden = true;
  }

  function updateHud() {
    hudScore.textContent = score;
    hudLives.textContent = lives > 0 ? Array(lives).fill('▲').join(' ') : '–';
  }

  function fire() {
    if (!ship || bullets.length > 5) return;
    bullets.push({
      x: ship.x + Math.cos(ship.a) * 14,
      y: ship.y + Math.sin(ship.a) * 14,
      vx: Math.cos(ship.a) * 460 + ship.vx,
      vy: Math.sin(ship.a) * 460 + ship.vy,
      life: 1.1
    });
  }

  function hitAsteroid(idx) {
    const a = asteroids[idx];
    score += (4 - a.size) * 20;
    burst(a.x, a.y, ACCENT, 14);
    if (a.size > 1) {
      for (let k = 0; k < 2; k++) {
        const na = makeAsteroid(a.x, a.y, a.size - 1);
        asteroids.push(na);
      }
    }
    asteroids.splice(idx, 1);
    updateHud();
    if (asteroids.length === 0) {
      level++;
      spawnWave(3 + level, ship ? ship.x : null, ship ? ship.y : null);
    }
  }

  function loseLife() {
    lives--;
    burst(ship.x, ship.y, ACCENT2, 26);
    updateHud();
    if (lives <= 0) { gameOver(); return; }
    ship = makeShip(); invuln = 2;
  }

  // ---------- update ----------
  function update(dt) {
    // ship controls
    if (ship && mode === 'play') {
      if (keys.ArrowLeft) ship.a -= 3.4 * dt;
      if (keys.ArrowRight) ship.a += 3.4 * dt;
      ship.thrust = !!keys.ArrowUp;
      if (ship.thrust) {
        ship.vx += Math.cos(ship.a) * 320 * dt;
        ship.vy += Math.sin(ship.a) * 320 * dt;
        if (Math.random() < 0.6)
          burst(ship.x - Math.cos(ship.a) * 12, ship.y - Math.sin(ship.a) * 12, ACCENT2, 1);
      }
      ship.vx *= 0.992; ship.vy *= 0.992;
      ship.x += ship.vx * dt; ship.y += ship.vy * dt;
      wrap(ship);
      if (invuln > 0) invuln -= dt;
    }

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; wrap(b);
      if (b.life <= 0) { bullets.splice(i, 1); continue; }
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r) {
          bullets.splice(i, 1);
          hitAsteroid(j);
          break;
        }
      }
    }

    // asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt; wrap(a);
      // collision with ship
      if (ship && mode === 'play' && invuln <= 0 &&
          Math.hypot(a.x - ship.x, a.y - ship.y) < a.r + 10) {
        loseLife();
      }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // ---------- draw ----------
  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y); ctx.rotate(a.rot);
    ctx.beginPath();
    for (let i = 0; i < a.n; i++) {
      const ang = (i / a.n) * TWO_PI;
      const rr = a.r * a.verts[i];
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(167,139,250,.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  function drawShip() {
    if (!ship) return;
    if (invuln > 0 && Math.floor(invuln * 12) % 2 === 0) return; // blink
    ctx.save();
    ctx.translate(ship.x, ship.y); ctx.rotate(ship.a);
    ctx.beginPath();
    ctx.moveTo(15, 0); ctx.lineTo(-11, 9); ctx.lineTo(-6, 0); ctx.lineTo(-11, -9);
    ctx.closePath();
    ctx.strokeStyle = ACCENT2; ctx.lineWidth = 2;
    ctx.shadowColor = ACCENT2; ctx.shadowBlur = 12;
    ctx.stroke();
    if (ship.thrust) {
      ctx.beginPath();
      ctx.moveTo(-6, 0); ctx.lineTo(-16, 5); ctx.lineTo(-22, 0); ctx.lineTo(-16, -5); ctx.closePath();
      ctx.strokeStyle = ACCENT; ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;

    for (const a of asteroids) drawAsteroid(a);

    ctx.fillStyle = '#fff'; ctx.shadowColor = ACCENT2; ctx.shadowBlur = 8;
    for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 2.2, 0, TWO_PI); ctx.fill(); }
    ctx.shadowBlur = 0;

    drawShip();
  }

  // ---------- loop ----------
  function frame(t) {
    const dt = Math.min((t - last) / 1000, 0.05) || 0;
    last = t;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  // ---------- input ----------
  const GAME_KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Space: 1 };
  window.addEventListener('keydown', (e) => {
    const code = e.code === 'Space' ? 'Space' : e.code;
    if (code === 'Escape' && (mode === 'play' || mode === 'over')) { exitGame(); return; }
    if (mode === 'play' && GAME_KEYS[code]) {
      e.preventDefault();
      if (code === 'Space') { if (!keys.Space) fire(); keys.Space = true; }
      else keys[code] = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    const code = e.code === 'Space' ? 'Space' : e.code;
    keys[code] = false;
  });

  // touch buttons
  touch && touch.querySelectorAll('.touch__btn').forEach((btn) => {
    const key = btn.dataset.key;
    const press = (e) => { e.preventDefault(); if (key === 'Space') fire(); else keys[key] = true; };
    const release = (e) => { e.preventDefault(); keys[key] = false; };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  });

  startBtn && startBtn.addEventListener('click', startGame);
  restartBtn && restartBtn.addEventListener('click', startGame);
  exitBtn && exitBtn.addEventListener('click', exitGame);
  overExitBtn && overExitBtn.addEventListener('click', exitGame);

  // ---------- boot ----------
  resize();
  spawnWave(5);
  window.addEventListener('resize', resize);
  // pause loop when hero is off-screen to save cycles
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0 });
  io.observe(hero);
})();
