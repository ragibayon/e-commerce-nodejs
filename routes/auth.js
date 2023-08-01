const express = require('express');
const {check} = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid Email address')
      .custom(async (value, {req}) => {
        const user = await User.findOne({email: value}); // user already exist
        if (user) {
          throw new Error('user already exists');
        }
      })
      .normalizeEmail(),
    check(
      'password',
      'Please enter a password with only numbers and characters and at least 6 characters' // for common error msg
    )
      .isLength({min: 6})
      .isAlphanumeric()
      .trim(),
    check('confirmPassword').custom((value, {req}) => {
      if (value !== req.body.password) {
        throw new Error('Passwords did not match');
      }
      return true;
    }),
  ],
  authController.postSignup
);
router.post(
  '/login',
  [
    check('email')
      .isEmail()
      .withMessage('please enter a valid email address')
      .normalizeEmail(),
    check('password', 'invalid password')
      .isLength({min: 6})
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);
router.post('/logout', authController.postLogout);

module.exports = router;
