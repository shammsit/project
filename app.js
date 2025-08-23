// Import required modules
const express = require('express');
const path = require('path');
const session = require('express-session');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session Configuration ---
// This middleware will create a session for each user.
app.use(session({
    secret: 'your-very-secret-key-change-this', // IMPORTANT: Change this to a random string
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// --- Middleware to Protect Admin Routes ---
// This function checks if a user is logged in as an admin before letting them proceed.
function requireAdminLogin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next(); // User is an admin, continue to the requested page.
    } else {
        res.redirect('/'); // Not an admin, send them back to the login page.
    }
}

// --- Routes ---

// Homepage Route
app.get('/', (req, res) => {
    res.render('index');
});

// Admin Data Table Route (now protected by our middleware)
app.get('/data', requireAdminLogin, (req, res) => {
    res.render('data/table');
});

// Login Handling Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check for the special admin credentials
    if (username === 'admin05' && password === '2005#sg') {
        // If credentials match, create an admin session
        req.session.isAdmin = true;
        // Respond with success and the URL to redirect to
        res.json({ success: true, redirect: '/data' });
    } else {
        // For any other credentials, respond with failure
        res.json({ success: false, message: 'Invalid username or password.' });
    }
});

// Logout Route
// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        // ... error handling ...
        res.redirect('/'); // <-- This line sends the user back to the login page.
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// --- Add these new routes to your app.js file ---

// Route to display the signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Route to handle the registration form submission
app.post('/register', (req, res) => {
    const userData = req.body;

    // --- Server-Side Validation (important for security) ---
    if (!userData.name || !userData.username || !userData.password) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    
    // In a real application, you would save this data to your database or Google Sheet.
    // For now, we will just log it to the console to confirm it was received.
    console.log('New user registration received:');
    console.log(userData);

    // Send a success response
    res.json({ 
        success: true, 
        message: 'Login and stay connected for get colaboration link , link will be available here within 72hr if you are eligible either you will be contacted' 
    });
});
