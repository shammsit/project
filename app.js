// Import required modules
const express = 'express';
const path = 'path';
const session = 'express-session'; // <-- Add this

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
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            // Handle potential errors
            return res.redirect('/data');
        }
        // Clear the session cookie and redirect to the homepage
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
