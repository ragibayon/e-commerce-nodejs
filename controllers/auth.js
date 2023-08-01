const bcrypt = require('bcrypt');
const User = require('../models/user');
const crypto = require('crypto');
const {validationResult} = require('express-validator');

const {
  sendSignupSuccessful,
  sendPasswordResetLink,
  sendPasswordResetSuccessful,
} = require('../util/mailTransporter');

exports.getSignup = async (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationErrors: [],
  });
};
exports.postSignup = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: errors.array()[0].msg, // the error msg generated from the check
        oldInput: {
          email: email,
          password: password,
          confirmPassword: confirmPassword,
        },
        validationErrors: errors.array(),
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email: email,
      password: hashedPassword,
      cart: {items: []},
    });

    await newUser.save();
    sendSignupSuccessful(email);
    res.redirect('/login');
  } catch (err) {
    console.log(err);
  }
};

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
    },
    validationErrors: [],
  });
};
exports.postLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errors.array()[0].msg, // the error msg generated from the check
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: errors.array(),
      });
    }

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
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'User Authentication failed', // the error msg generated from the check
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [{path: 'email'}, {path: 'password'}],
        });
      }
    } else {
      // user not found
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: 'User Authentication failed', // the error msg generated from the check
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: [{path: 'email'}, {path: 'password'}],
      });
    }
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

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message,
  });
};

exports.postReset = async (req, res, next) => {
  try {
    // check if the provided email exists
    // if not redirect to '/login with error
    // if exists save the token to db and send email

    const email = req.body.email;
    const buffer = crypto.randomBytes(32);
    const token = buffer.toString('hex'); // should be stored in db

    const user = await User.findOne({email: email});
    if (!user) {
      req.flash('error', 'No account with the email');
      return res.redirect('/reset');
    }

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();
    res.redirect('/');
    await sendPasswordResetLink(email, token);
  } catch (err) {
    console.log(err);
    res.redirect('/reset');
  }
};

exports.getNewPassword = async (req, res, next) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: {$gt: Date.now()},
    });

    if (user) {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        passwordToken: token,
        userId: user._id.toString(),
      });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.postNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  // get user
  // change password
  // reset other fields
  // send email
  // redirect to login

  const user = await User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: {$gt: Date.now()},
    _id: userId,
  });

  if (user) {
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();
    res.redirect('/');
    await sendPasswordResetSuccessful(user.email);
  } else {
    req.flash('error', 'something went wrong');
    res.redirect('/login');
  }
};
