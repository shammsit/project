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

// --- UPDATED /data Route ---
app.get('/data', requireAdminLogin, async (req, res) => {
    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        const spreadsheetId = '1u3ltAu6JEv0pW3VPxHHTs8wG5m5Wo3kjb6kK6PbY6bg';

        // Fetch all the data from the sheet
        const getRows = await googleSheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A2:J', // Get data from the second row onwards
        });

        const sheetData = getRows.data.values || [];
        
        // Render the table page and pass the sheet data to it
        res.render('data/table', { sheetData });

    } catch (error) {
        console.error('Error reading from Google Sheets:', error);
        res.status(500).send('Error fetching data from the spreadsheet.');
    }
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

app.post('/register', async (req, res) => {
    const { name, username, password, countryCode, mobile, email, projectName, role } = req.body;

    if (!name || !username || !password || !mobile || !email || !projectName || !role) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        const spreadsheetId = '1u3ltAu6JEv0pW3VPxHHTs8wG5m5Wo3kjb6kK6PbY6bg';

        const newRow = [ name, username, password, `${countryCode}${mobile}`, email, projectName, role, '', '', '' ];

        await googleSheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:J',
            valueInputOption: 'USER_ENTERED',
            resource: { values: [newRow] },
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
