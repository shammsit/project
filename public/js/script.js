// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to fill the entire window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// The characters to be used in the rain effect (now binary)
const characters = '01';
const charactersArray = characters.split('');

const fontSize = 16;
// Calculate the number of columns based on the canvas width and font size
const columns = Math.floor(canvas.width / fontSize);

// Create an array to track the y-position of each column's character drop
const drops = [];
for (let x = 0; x < columns; x++) {
    drops[x] = 1;
}

// The main drawing function that creates the animation
function draw() {
    // Fill the canvas with a semi-transparent black to create a fading trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set the color and font for the dropping characters
    ctx.fillStyle = '#00BFFF'; // Deep Sky Blue
    ctx.font = `${fontSize}px Fira Code`;

    // Loop through each column
    for (let i = 0; i < drops.length; i++) {
        // Get a random character from the array
        const text = charactersArray[Math.floor(Math.random() * charactersArray.length)];
        
        // Draw the character at its current position
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset the drop to the top if it goes off the screen, with a random chance
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        // Move the drop down for the next frame
        drops[i]++;
    }
}

// Run the draw function every 33 milliseconds to create the animation
setInterval(draw, 33);

// Adjust canvas size if the window is resized
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
