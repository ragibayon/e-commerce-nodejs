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
  await transporter.sendMail({
    to: email,
    from: 'shop@node.com',
    subject: 'Signup Successful',
    html: '<h1>You have successfully Signed up!</h1>',
  });
};
