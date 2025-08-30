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

// --- Google Sheets API Setup ---
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
    return sheets.map(sheet => sheet.properties.title);
}

// --- Middleware to Protect Routes ---
function requireAdminLogin(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    } else {
        res.redirect('/');
    }
}

function requireUserLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.redirect('/');
    }
}

// --- Routes ---
// Login page
app.get('/', (req, res) => {
    res.render('index');
});

// Signup (fetch project names)
app.get('/signup', async (req, res) => {
    try {
        const authClient = await getAuthClient();
        const sheetNames = await getSheetNames(authClient);
        const filtered = sheetNames.filter(
            name => name.toLowerCase() !== 'other' && name.toLowerCase() !== 'admin'
        );
        res.render('signup', { projectNames: filtered });
    } catch (error) {
        console.error('Failed to fetch sheet names:', error);
        res.render('signup', { projectNames: [] }); // fallback
    }
});

// --- LOGIN (admin + user combined) ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const authClient = await getAuthClient();
        const googleSheets = await getSheetsInstance(authClient);

        // --- First check ADMIN sheet ---
        const adminResult = await googleSheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `admin(dont select it)!A2:Z`
        });

        const adminRows = adminResult.data.values || [];
        for (const row of adminRows) {
            const [name, adminUser, adminPass] = row;
            if (adminUser === username && adminPass === password) {
                req.session.user = { name, role: "admin" };
                return res.json({ success: true, redirect: '/admin-dashboard' });
            }
        }

        // --- Then check other project sheets (except "other" and "Admin") ---
        const sheetNames = await getSheetNames(authClient);
        let foundUser = null;

        for (const sheetName of sheetNames) {
            if (sheetName.toLowerCase() === "admin" || sheetName.toLowerCase() === "other") continue;

            const result = await googleSheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sheetName}!A2:Z`
            });

            const rows = result.data.values || [];
            for (const row of rows) {
                const [name, userUser, userPass] = row;
                if (userUser === username && userPass === password) {
                    foundUser = { name, project: sheetName, role: "user" };
                    break;
                }
            }
            if (foundUser) break;
        }

        if (foundUser) {
            req.session.user = foundUser;
            return res.json({ success: true, redirect: '/user-dashboard' });
        }

        return res.json({ success: false, message: "Invalid credentials" });

    } catch (error) {
        console.error("Login error:", error);
        return res.json({ success: false, message: "Server error during login" });
    }
});

// --- Middleware to protect routes ---
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/');
    next();
}

// --- Dashboards ---
app.get('/admin-dashboard', requireLogin, (req, res) => {
    if (req.session.user.role !== "admin") return res.redirect('/');
    res.render('admin_dashboard', { user: req.session.user });
});

app.get('/user-dashboard', requireLogin, (req, res) => {
    if (req.session.user.role !== "user") return res.redirect('/');
    res.render('user_dashboard', { user: req.session.user });
});

// --- Logout ---
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// --- Admin Data Table ---
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

// --- User Dashboard ---
app.get('/user-dashboard', requireUserLogin, (req, res) => {
    res.render('user-dashboard', { user: req.session.user });
});

// --- Register New User ---
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

// --- Update Row (Admin only) ---
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

// --- Delete Row (Admin only) ---
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

// --- Approve User (Move from "other" to project sheet) ---
app.post('/approve-user', requireAdminLogin, async (req, res) => {
    const { projectName, rowIndex } = req.body;

    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        const sourceSheet = "other";

        // 1. Get row data
        const rowRange = `${sourceSheet}!A${rowIndex}:Z${rowIndex}`;
        const rowRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: rowRange,
        });

        if (!rowRes.data.values || rowRes.data.values.length === 0) {
            return res.status(400).json({ success: false, message: "Row not found" });
        }

        const rowData = rowRes.data.values[0];

        // 2. Append to project sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${projectName}!A1`,
            valueInputOption: "RAW",
            requestBody: { values: [rowData] },
        });

        // 3. Delete from "other"
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // adjust sheetId if "other" is not 0
                            dimension: "ROWS",
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex,
                        },
                    },
                }],
            },
        });

        res.json({ success: true, message: `User approved & moved to sheet: ${projectName}` });

    } catch (error) {
        console.error("Error approving user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to approve user. Ensure a sheet with the correct project name exists.",
        });
    }
});

// --- Logout ---
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Admin control panel route
app.get('/admin-control', requireLogin, (req, res) => {
    if (req.session.user.role !== "admin") return res.redirect('/');
    // Fetch sheet data for table
    res.render('data/table', { sheetData: /* pass fetched data here */ });
});

