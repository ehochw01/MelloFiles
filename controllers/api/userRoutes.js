const router = require('express').Router();
const { User } = require('../../models');

// GET /api/users/me
// Returns current session state for AuthContext hydration
router.get('/me', (req, res) => {
  if (req.session.loggedIn) {
    res.status(200).json({
      loggedIn: true,
      userId: req.session.userID
    });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

// CREATE new user
router.post('/', async (req, res) => {
  try {
    const dbUserData = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    const userData = dbUserData.get({plain: true});

    req.session.save(() => {
      req.session.loggedIn = true;
      req.session.userID = userData.id;
      res.status(200).json({ message: 'You are now logged in!' });
    });
  } catch (err) {
    console.log(err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'An account with that email already exists.' });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
});

// Login
// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const dbUserData = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!dbUserData) {
      res
        .status(400)
        .json({ message: 'Incorrect email. Please try again!' });
      return;
    }

    const validPassword = await dbUserData.checkPassword(req.body.password);

    if (!validPassword) {
      res
        .status(400)
        .json({ message: 'Incorrect password. Please try again!'});
      return;
    }

    const userData = dbUserData.get({plain: true});

    console.log(userData);

    req.session.save(() => {
      req.session.loggedIn = true;
      req.session.userID = userData.id;
      res.status(200).json({ message: 'You are now logged in!' });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// Logout
router.post('/logout', (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

module.exports = router;
