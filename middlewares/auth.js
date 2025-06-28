const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET

// Middleware to expose user to all EJS templates
function attachUser(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    res.locals.user = null;
    return next();
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    res.locals.user = err ? null : decoded.username;
    next();
  });
}

// Middleware to protect routes
function isLoggedIn(req, res, next) {
  const token = req.cookies.token;

  if (!token) return res.redirect("/login");

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.redirect("/login");

    res.locals.user = decoded.username; // expose user to templates
    next();
  });
}

module.exports = { attachUser, isLoggedIn, };
