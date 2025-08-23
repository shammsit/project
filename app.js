// Import required modules
const express = require('express');
const path = require('path');
const session = require('express-session');
const { google } = require('googleapis');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-very-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// --- Google Sheets API Logic ---
async function getAuthClient() {
    const auth = new google.auth.GoogleAuth({
        // UPDATED: Using path.join for a more reliable file path
        keyFile: path.join(__dirname, 'credentials.json'),
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });
    return await auth.getClient();
}

async function getSheetsInstance(authClient) {
    return google.sheets({ version: 'v4', auth: authClient });
}

// --- Middleware to Protect Routes ---
function requireAdminLogin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        res.redirect('/');
    }
}

// --- Routes ---
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/data', requireAdminLogin, (req, res) => {
    res.render('data/table');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin05' && password === '2005#sg') {
        req.session.isAdmin = true;
        res.json({ success: true, redirect: '/data' });
    } else {
        res.json({ success: false, message: 'Invalid username or password.' });
    }
});

// --- UPDATED /register Route ---
app.post('/register', async (req, res) => {
    const { name, username, password, countryCode, mobile, email, projectName, role } = req.body;

    // Basic server-side validation
    if (!name || !username || !password || !mobile || !email || !projectName || !role) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        const spreadsheetId = '1u3ltAu6JEv0pW3VPxHHTs8wG5m5Wo3kjb6kK6PbY6bg'; // Your sheet ID

        // Format the data for the new row
        const newRow = [
            name,
            username,
            password,
            `${countryCode}${mobile}`, // Combine country code and mobile
            email,
            projectName,
            role,
            // The last 3 columns are for buttons, so we leave them empty
            '', // Approve
            '', // Reject/Delete
            ''  // Contact
        ];

        // Append the new row to the spreadsheet
        await googleSheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:J', // The range of columns to append to
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [newRow],
            },
        });

        res.json({
            success: true,
            message: 'Login and stay connected for get colaboration link , link will be available here within 72hr if you are eligible either you will be contacted'
        });

    } catch (error) {
        console.error('Error writing to Google Sheets:', error);
        res.status(500).json({ success: false, message: 'Server error. Could not save data.' });
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/data');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
