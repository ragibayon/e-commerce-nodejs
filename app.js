const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');

const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  User.findById('64c1e1cf2970e570a466ca48')
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

const connectionString =
  'mongodb+srv://admin:adminpw@node-complete-cluster.7fvy3qw.mongodb.net/shop';
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
mongoose
  .connect(connectionString, options)
  .then(() => {
    console.log('Connected to MongoDB Atlas');

    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: 'ragib',
          email: 'ragib@email.com',
          items: [],
        });
        user.save();
      }
    });

    app.listen(3000, () => console.log('app listening on port 3000'));
  })
  .catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err.message);
  });
