const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.user ? req.session.user.isLoggedIn : false,
  });
};

exports.postLogin = async (req, res, next) => {
  try {
    const userData = await User.findById('64c1e1cf2970e570a466ca48').select(
      '-__v'
    ); // this provides mongoose document
    const user = {...userData._doc, isLoggedIn: true};
    req.session.user = user;
    await req.session.save();
    res.redirect('/');
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
