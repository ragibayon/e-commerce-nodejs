const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');

const auth = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN, // This is the domain associated with your Mailgun account
  },
};

const transporter = nodemailer.createTransport(mailgunTransport(auth));

exports.sendSignupSuccessful = async email => {
  try {
    await transporter.sendMail({
      to: email,
      from: 'shop@node.com',
      subject: 'Signup Successful',
      html: '<h1>You have successfully Signed up!</h1>',
    });
  } catch (err) {
    console.log(err);
  }
};

exports.sendPasswordResetLink = async (email, token) => {
  try {
    await transporter.sendMail({
      to: email,
      from: 'shop@node.com',
      subject: 'Password Reset',
      html: `<p>You requested password reset </p>
    <p> Click this <a href=http://localhost:3000/reset/${token}> link </a> to set a new password`,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.sendPasswordResetSuccessful = async email => {
  try {
    await transporter.sendMail({
      to: email,
      from: 'shop@node.com',
      subject: 'Password Reset Successful',
      html: `<p>Your password reset has been successful</p>`,
    });
  } catch (err) {
    console.log(err);
  }
};
