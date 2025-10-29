const User = require("../model/userSchema");

// Middleware for authenticating normal users
async function userAuth(req, res, next) {
  try {
    // 1️⃣ Check if user is logged in
    if (!req.session.user) {
      return res.redirect("/landingPage");
    }

    // 2️⃣ Fetch user from database
    const user = await User.findById(req.session.user._id);

    // 3️⃣ If user doesn’t exist (deleted)
    if (!user) {
      req.session.destroy();
      return res.redirect("/landingPage");
    }

    // 4️⃣ Check if user is blocked
    if (user.isBlocked) {
      req.session.destroy();
      return res.render("blockedPage", {
        message: "Your account has been blocked by the admin.",
      });
    }

    // 5️⃣ Attach fresh user data to request (optional)
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.redirect("/landingPage");
  }
}

module.exports = { userAuth };
