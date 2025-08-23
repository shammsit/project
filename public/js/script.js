// Matrix Rain Animation
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

// Fullscreen canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Characters (binary)
const binaryChars = "01".split("");

// Font size
const fontSize = 16;
const columns = canvas.width / fontSize;

// Drops (y-coordinate for each column)
const drops = Array(Math.floor(columns)).fill(1);

// Draw function
function draw() {
    // Black background with opacity (fade effect)
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Green text
    ctx.fillStyle = "#00ff00";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const text = binaryChars[Math.floor(Math.random() * binaryChars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset randomly after screen bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        drops[i]++;
    }
}

// Run animation
setInterval(draw, 35);

// Resize support
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
