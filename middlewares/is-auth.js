module.exports = (req, res, next) => {
  if (!req.session.user || !req.session.user.isLoggedIn) {
    return res.redirect('/login');
  }
  next();
};
