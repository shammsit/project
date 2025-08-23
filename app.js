const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

// Make canvas full screen
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

// Characters
const chars = "01";
const fontSize = 16;
const columns = canvas.width / fontSize;

// Array of drops
const drops = Array(Math.floor(columns)).fill(1);

function draw() {
  // Semi-transparent background to fade the characters
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text style
  ctx.fillStyle = "#0f0"; // green
  ctx.font = fontSize + "px monospace";

  // Looping over drops
  for (let i = 0; i < drops.length; i++) {
    const text = chars.charAt(Math.floor(Math.random() * chars.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    // Reset drop randomly
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

setInterval(draw, 50);

// Resize handler
window.addEventListener('resize', () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
});
