const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// In-memory "database"
let users = [];
let admin = { id: "shammsit", password: "8391831602#sg" };

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/register", (req, res) => {
  const { name, mobile, github } = req.body;
  users.push({ name, mobile, github, invite: "", status: "pending" });
  res.redirect("/");
});

app.post("/login", (req, res) => {
  const { github, password } = req.body;

  if (github === admin.id && password === admin.password) {
    req.session.user = { role: "admin", id: github };
    return res.redirect("/admin");
  }

  const found = users.find(
    (u) => u.github === github && u.mobile === password
  );
  if (found) {
    req.session.user = { role: "user", id: github };
    return res.redirect("/dashboard");
  }

  res.send("Invalid credentials");
});

function ensureAuth(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect("/");
    if (role && req.session.user.role !== role) return res.status(403).send("Forbidden");
    next();
  };
}

// User dashboard
app.get("/dashboard", ensureAuth("user"), (req, res) => {
  const user = users.find((u) => u.github === req.session.user.id);
  if (!user) return res.send("User not found");
  res.send(`
    <h1>Welcome, ${user.name}</h1>
    <table border="1">
      <tr><th>Name</th><th>Mobile</th><th>GitHub</th><th>Invite</th></tr>
      <tr><td>${user.name}</td><td>${user.mobile}</td><td>${user.github}</td><td>${user.invite}</td></tr>
    </table>
    <a href="/logout">Logout</a>
  `);
});

// Admin dashboard
app.get("/admin", ensureAuth("admin"), (req, res) => {
  let rows = users
    .map(
      (u, i) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.mobile}</td>
        <td>${u.github}</td>
        <td>${u.invite}</td>
        <td>${u.status}</td>
        <td>
          <form action="/admin/invite/${i}" method="post" style="display:inline;">
            <input name="link" placeholder="Invite Link"/>
            <button type="submit">Add Link</button>
          </form>
          <form action="/admin/approve/${i}" method="post" style="display:inline;">
            <button type="submit">Approve</button>
          </form>
          <form action="/admin/reject/${i}" method="post" style="display:inline;">
            <button type="submit">Reject</button>
          </form>
        </td>
      </tr>
    `
    )
    .join("");

  res.send(`
    <h1>Admin Dashboard</h1>
    <table border="1">
      <tr><th>Name</th><th>Mobile</th><th>GitHub</th><th>Invite</th><th>Status</th><th>Actions</th></tr>
      ${rows}
    </table>
    <a href="/logout">Logout</a>
  `);
});

// Admin actions
app.post("/admin/invite/:id", ensureAuth("admin"), (req, res) => {
  users[req.params.id].invite = req.body.link;
  res.redirect("/admin");
});

app.post("/admin/approve/:id", ensureAuth("admin"), (req, res) => {
  users[req.params.id].status = "Approved";
  res.redirect("/admin");
});

app.post("/admin/reject/:id", ensureAuth("admin"), (req, res) => {
  users[req.params.id].status = "Rejected";
  res.redirect("/admin");
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
