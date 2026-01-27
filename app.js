import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import session from 'express-session';
import path from 'path';
import cors from 'cors';
import passport from './config/passport.js';
import db from './config/db.js';
import userRoute from './routes/userRouter.js';
import adminRouter from './routes/adminRouter.js';
import { fileURLToPath } from 'url';
import nocache from 'nocache';
import flash from "connect-flash";
import User from './model/userSchema.js';
import Cart from './model/cartSchema.js';
import errorHandler from './middlewares/errorHandler.js';

// For __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();

app.use(flash());
app.use(nocache())
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 100,
    },
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.use(async (req, res, next) => {
  if (req.session.user) {
    const userData = await User.findById(req.session.user._id).lean();
    res.locals.user = userData;
  } else {
    res.locals.user = null;
  }
  next();
});

app.use(async (req, res, next) => {
  try {
    if (req.session?.user?._id) {
      const cart = await Cart.findOne({ userId: req.session.user._id });
      res.locals.cartCount = cart?.items?.length || 0;
    } else {
      res.locals.cartCount = 0;
    }
  } catch (err) {
    console.log("Cart count middleware error:", err);
    res.locals.cartCount = 0;
  }

  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'view/user'),
  path.join(__dirname, 'view/admin'),
]);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', userRoute);
app.use('/admin', adminRouter);
app.use(errorHandler)
db();

app.listen(process.env.PORT, () => {
  console.log('server is running');
});
