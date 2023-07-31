const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  console.log(message);

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
  });
};

exports.getSignup = async (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  console.log(message);
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
  });
};

exports.postLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({email: email}).select('-__v');
    if (userData) {
      const passwordMatched = await bcrypt.compare(password, userData.password);
      if (passwordMatched) {
        const user = {...userData._doc, isLoggedIn: true};
        req.session.user = user;
        await req.session.save();
        return res.redirect('/');
      } else {
        // username matched but password did not match
        req.flash('error', 'password is invalid.');
        return res.redirect('/login');
      }
    } else {
      // user not found
      req.flash('error', "couldn't find user in system");
      res.redirect('/login');
    }
  } catch (err) {
    console.log(err);
  }
};

exports.postSignup = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    // do validation

    const user = await User.findOne({email: email}); // user already exist
    if (user) {
      req.flash('error', 'user already exists');
      return res.redirect('/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      email: email,
      password: hashedPassword,
      cart: {items: []},
    });

    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.log(err);
  }
};

exports.postLogout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect('/');
  } catch (err) {
    console.log(err);
  }
};
