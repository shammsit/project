const express = require("express");
});


// --- Protected pages ---
app.get("/dashboard", requireUser, (req, res) => {
res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});
app.get("/admin", requireAdmin, (req, res) => {
res.sendFile(path.join(__dirname, "views", "admin.html"));
});


// --- Me API (role-aware) ---
app.get("/api/me", (req, res) => {
if (!req.session.user) return res.status(401).send("Not logged in");


if (req.session.user.role === "admin") {
db.all("SELECT id, name, mobile, github, inviteLink, status, createdAt FROM users ORDER BY createdAt DESC", [], (err, rows) => {
if (err) return res.status(500).send("Database error.");
return res.json({ role: "admin", data: rows });
});
} else {
db.get("SELECT name, mobile, github, inviteLink, status FROM users WHERE id = ?", [req.session.user.id], (err, row) => {
if (err) return res.status(500).send("Database error.");
return res.json({ role: "user", data: row });
});
}
});


// --- Admin: update row (invite link + approve/reject) ---
app.post("/api/update", requireAdmin, (req, res) => {
const { id, inviteLink, action } = req.body; // action: Approve | Reject
if (!id || !action) return res.status(400).send("Missing fields");
const status = action === "Approve" ? "Approved" : action === "Reject" ? "Rejected" : "Pending";


db.run("UPDATE users SET inviteLink = COALESCE(?, inviteLink), status = ? WHERE id = ?",
[inviteLink || null, status, id],
function (err) {
if (err) return res.status(500).send("Update failed");
return res.send("Updated");
}
);
});


// --- Logout ---
app.get("/logout", (req, res) => {
req.session.destroy(() => {
res.clearCookie("sid");
res.redirect("/");
});
});


// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));