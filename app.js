// Import required modules
const express = require('express');
const path = require('path');
const session = require('express-session'); // <-- Add this
const { google } = require('googleapis');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session Configuration ---
app.use(session({
    secret: 'a_very_secret_key_that_is_long_and_random', // Replace with a long, random string
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if you are using HTTPS
}));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// --- Google Sheets API Logic (remains the same) ---
async function getAuthClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });
    return await auth.getClient();
}

async function getSheetsInstance(authClient) {
    return google.sheets({ version: 'v4', auth: authClient });
}


// --- Middleware to Protect Routes ---
function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next(); // User is logged in, proceed to the route
    } else {
        res.redirect('/'); // User is not logged in, redirect to login page
    }
}


// --- Routes ---
app.get('/', (req, res) => {
    res.render('index');
});

// NEW: Protected Dashboard Route
app.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { username: req.session.user });
});

// Login Route (Updated to create a session)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // <-- IMPORTANT: Replace with your Sheet ID

        const getRows = await googleSheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A2:B',
        });

        const userFound = getRows.data.values?.find(row => row[0] === username && row[1] === password);

        if (userFound) {
            // Create a session for the user
            req.session.user = username;
            res.json({ success: true, message: 'Login successful!' });
        } else {
            res.json({ success: false, message: 'Invalid username or password.' });
        }
    } catch (error) {
        console.error('Error connecting to Google Sheets:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// NEW: Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
