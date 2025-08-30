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

// --- Function to get all sheet names ---
async function getSheetNames(authClient) {
    const googleSheets = await getSheetsInstance(authClient);
    const metaData = await googleSheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
    });
    const sheets = metaData.data.sheets || [];
    // Filter out the sheet named "other" which is our main data sheet
    return sheets.map(sheet => sheet.properties.title).filter(title => title.toLowerCase() !== 'other');
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

app.get('/signup', async (req, res) => {
    try {
        const authClient = await getAuthClient();
        const sheetNames = await getSheetNames(authClient);
        res.render('signup', { projectNames: sheetNames });
    } catch (error) {
        console.error('Failed to fetch sheet names:', error);
        res.render('signup', { projectNames: ['ResQva', 'Other'] }); // Fallback
    }
});

app.get('/data', requireAdminLogin, async (req, res) => {
    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        const getRows = await googleSheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'other!A2:J',
        });
        const sheetData = getRows.data.values || [];
        res.render('data/table', { sheetData });
    } catch (error) {
        console.error('Error reading from Google Sheets:', error);
        res.status(500).send('Error fetching data from the spreadsheet.');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin05' && password === '2005#sg') {
        req.session.isAdmin = true;
        return res.json({ success: true, redirect: '/data' });
    }

    if (username === 'admin05' && password !== '2005#sg') {
        return res.json({ success: false, message: "Wrong Password. Please try again, use 'Forgot Password', or contact an admin from the links below." });
    } else {
        return res.json({ success: false, message: 'This user ID does not exist. Please sign up first.' });
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

        const getRows = await googleSheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'other!B2:B',
        });
        const existingUsernames = getRows.data.values?.map(row => row[0]) || [];
        if (existingUsernames.includes(username)) {
            return res.status(409).json({ success: false, message: 'Username already exists. Please login.' });
        }

        const newRow = [name, username, password, `${countryCode}${mobile}`, email, projectName, role, '', '', ''];
        await googleSheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'other!A:J',
            valueInputOption: 'USER_ENTERED',
            resource: { values: [newRow] },
        });
        res.json({ success: true, message: 'Login and stay connected for the collaboration link. The link will be available here within 72 hours if you are eligible; otherwise, you will be contacted.' });
    } catch (error) {
        console.error('Error writing to Google Sheets:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

app.post('/update-row', requireAdminLogin, async (req, res) => {
    const { rowIndex, rowData } = req.body;
    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);
        await googleSheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `other!A${rowIndex}:G${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating Google Sheet:', error);
        res.status(500).json({ success: false });
    }
});

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
                            sheetId: 0,
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

// --- Route to approve a project ---
app.post('/approve-user', requireAdminLogin, async (req, res) => {
    const { projectName, rowIndex } = req.body; 
    // rowIndex = index of the row in the "other" sheet
    // projectName = the project name to move data into the sheet with same name

    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        const sourceSheet = "other"; // <-- CHANGE if your sheet of unapproved projects has a different name

        // 1. Get row data from source sheet
        const rowRange = `${sourceSheet}!A${rowIndex}:Z${rowIndex}`; 
        const rowRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: rowRange,
        });

        if (!rowRes.data.values || rowRes.data.values.length === 0) {
            return res.status(400).json({ success: false, message: "Row not found" });
        }

        const rowData = rowRes.data.values[0];

        // 2. Append row to target sheet (must exist, same name as projectName)
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${projectName}!A1`,
            valueInputOption: "RAW",
            requestBody: {
                values: [rowData],
            },
        });

        // 3. Delete row from source sheet
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: 0,  // ID of "other" sheet, use real ID if different
                                dimension: "ROWS",
                                startIndex: rowIndex - 1, // API is 0-based
                                endIndex: rowIndex,
                            },
                        },
                    },
                ],
            },
        });

        res.json({ success: true, message: `Project moved to sheet: ${projectName}` });

    } catch (error) {
        console.error("Error approving user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve user. Ensure a sheet with the correct project name exists.",
        });
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
