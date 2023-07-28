const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// routers
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// models
const User = require('./models/user');

// controllers
const errorController = require('./controllers/error');

const MONGODB_URI =
  'mongodb+srv://admin:adminpw@node-complete-cluster.7fvy3qw.mongodb.net/shop';

const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'session',
});

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(async (req, res, next) => {
  try {
    if (!req.session.user) {
      return next();
    }
    const user = await User.findById(req.session.user._id);
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
  }
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

const connectionString = MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectDb = async () => {
  await mongoose.connect(connectionString, options);
  console.log('Connected to MongoDB Atlas');
};

const createUser = async () => {
  const user = await User.findOne();
  if (!user) {
    const user = new User({
      name: 'ragib',
      email: 'ragib@email.com',
      items: [],
    });
    user.save();
  }
};

const startServer = async () => {
  await connectDb();
  await createUser();
  app.listen(3000, () => console.log('app listening on port 3000'));
};

startServer();
