// Import required modules
const express = require('express');
const path = require('path');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
// Set the path for views
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, client-side JS, images) from the 'public' directory
// CORRECTED: __dirname is used to correctly locate the public folder.
app.use(express.static(path.join(__dirname, 'public')));

// Define the route for the homepage
app.get('/', (req, res) => {
    // Render the index.ejs template
    res.render('index');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
