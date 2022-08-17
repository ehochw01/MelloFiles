const withAuth = (req, res, next) => {
  // If not logged in then redirect them back to /login page
  console.log("WITH AUTH");
  console.log("req.session.loggedIn:", req.session.loggedIn);
  if (!req.session.loggedIn) {
    console.log("NOT LOGGED IN");
    res.status(500).json("Log In");
  } else {
    next();
  }
};

module.exports = withAuth;
