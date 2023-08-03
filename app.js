const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csurf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
// routers
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// models
const User = require('./models/user');

// controllers
const errorController = require('./controllers/error');
const throwError = require('./util/throwError');

const app = express();

const MONGODB_URI = process.env.MONGODB_URI;

// store for session
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'session',
});

const csrfProtection = csurf();

// file storage to store multer files
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: fileStorage, fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);
app.use(flash());

// for each request send isAuthenticated and csrfToken to the view
app.use((req, res, next) => {
  // local variables to the response
  res.locals.isAuthenticated = req.session.user
    ? req.session.user.isLoggedIn
    : false;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// store logged in user mongoose document to req
app.use(async (req, res, next) => {
  try {
    if (!req.session.user) {
      return next();
    }
    const user = await User.findById(req.session.user._id);
    req.user = user;
    next();
  } catch (err) {
    const error = throwError(err, 500);
    next(error);
  }
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(error.httpStatusCode || 500).render('500', {
    pageTitle: 'Error',
    path: '/500',
  });
});

const connectionString = MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectDb = async () => {
  await mongoose.connect(connectionString, options);
  console.log('Connected to MongoDB Atlas');
};

const startServer = async () => {
  await connectDb();
  app.listen(3000, () => console.log('app listening on port 3000'));
};

startServer();
