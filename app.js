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
const SPREADSHEET_ID = '1u3ltAu6JEv0pW3VPxHHTs8wG5m5Wo3kjb6kK6PbY6bg';

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
app.get('/', (req, res) => { res.render('index'); });
app.get('/signup', (req, res) => { res.render('signup'); });

app.get('/data', requireAdminLogin, async (req, res) => {
    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        const getRows = await googleSheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A2:J',
        });
        const sheetData = getRows.data.values || [];
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
        const newRow = [name, username, password, `${countryCode}${mobile}`, email, projectName, role, '', '', ''];
        await googleSheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:J',
            valueInputOption: 'USER_ENTERED',
            resource: { values: [newRow] },
        });
        res.json({ success: true, message: 'Login and stay connected...' });
    } catch (error) {
        console.error('Error writing to Google Sheets:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// --- NEW: Route to update a row ---
app.post('/update-row', requireAdminLogin, async (req, res) => {
    const { rowIndex, rowData } = req.body;
    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        await googleSheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Sheet1!A${rowIndex}:G${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating Google Sheet:', error);
        res.status(500).json({ success: false });
    }
});

// --- NEW: Route to delete a row ---
app.post('/delete-row', requireAdminLogin, async (req, res) => {
    const { rowIndex } = req.body;
    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        await googleSheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // Assumes the first sheet
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        }
                    }
                }]
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting from Google Sheet:', error);
        res.status(500).json({ success: false });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
