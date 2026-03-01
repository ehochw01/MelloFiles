const withAuth = (req, res, next) => {
  if (!req.session.loggedIn) {
    res.status(401).json({ message: 'Not authenticated' });
  } else {
    next();
  }
};

module.exports = withAuth;
