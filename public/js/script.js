// Binary Rain Wallpaper Script

const canvas = document.getElementById("matrix-bg");
const ctx = canvas.getContext("2d");

// --- Configuration ---
const config = {
  charSet: ["0", "1"],
  baseFontSize: 16,
  minFontSize: 12,
  maxFontSize: 22,
  columnSpacing: 1.0,
  speedMin: 60,   // pixels/sec
  speedMax: 180,  // pixels/sec
  trailFade: 0.08,
  glow: true,
  color: "#00ff41",
  tailColor: "rgba(0,0,0,0.08)",
  fpsCap: 60,
  randomBlink: 0.02
};

// --- Setup ---
let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let width = 0, height = 0;
let fontSize = config.baseFontSize;
let columnWidth = 0;
let columns = [];
let lastTime = 0;
let frameInterval = 1000 / config.fpsCap;

function resizeCanvas() {
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;

  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  width = Math.floor(cssW * dpr);
  height = Math.floor(cssH * dpr);

  canvas.width = width;
  canvas.height = height;

  const scaleHint = Math.sqrt((cssW * cssH) / (1280 * 720));
  fontSize = Math.max(config.minFontSize, Math.min(config.maxFontSize, config.baseFontSize * scaleHint)) * dpr;
  columnWidth = Math.floor(fontSize * config.columnSpacing);

  ctx.textBaseline = "top";
  ctx.font = `${fontSize}px Fira Code, monospace`;

  const colCount = Math.ceil(width / columnWidth);
  columns = new Array(colCount).fill().map((_, i) => ({
    x: i * columnWidth,
    y: Math.random() * -height,
    speed: Math.random() * (config.speedMax - config.speedMin) + config.speedMin,
    glyph: config.charSet[Math.floor(Math.random() * config.charSet.length)]
  }));
  ctx.clearRect(0, 0, width, height);
}

function draw(now) {
  if (!lastTime) lastTime = now;
  const elapsed = now - lastTime;

  if (elapsed < frameInterval) {
    requestAnimationFrame(draw);
    return;
  }
  lastTime = now;

  ctx.fillStyle = config.tailColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  if (config.glow) {
    ctx.shadowBlur = fontSize * 0.6;
    ctx.shadowColor = config.color;
  }
  ctx.fillStyle = config.color;

  const dyFactor = elapsed / 1000;
  for (let col of columns) {
    if (Math.random() < config.randomBlink) {
      col.glyph = config.charSet[Math.floor(Math.random() * config.charSet.length)];
    }

    ctx.fillText(col.glyph, col.x, col.y);

    col.y += col.speed * dyFactor;
    if (col.y > height) {
      col.y = Math.random() * -100;
      col.speed = Math.random() * (config.speedMax - config.speedMin) + config.speedMin;
      col.glyph = config.charSet[Math.floor(Math.random() * config.charSet.length)];
    }
  }
  ctx.restore();

  requestAnimationFrame(draw);
}

// --- Init ---
resizeCanvas();
window.addEventListener("resize", () => {
  clearTimeout(window._resizeTimer);
  window._resizeTimer = setTimeout(resizeCanvas, 100);
});
requestAnimationFrame(draw);
