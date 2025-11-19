import dotenv from 'dotenv';
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
import morgan from 'morgan';

// For __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(morgan("dev"))
app.use(nocache())
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSIIONSECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 100,
    },
  })
);

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

db();

app.listen(process.env.PORT, () => {
  console.log('server is running');
});
