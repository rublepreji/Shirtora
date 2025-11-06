import express from 'express';
import {loadHomePage,loadLandingPage,pageNotFound,loadSignin,signin,signup,verifyOtp,loadVerifyOtp,resendOtp,logout,loadSignup} from '../controller/user/userController.js';
import { loadForgotPassword, verifyEmail, verifyPassOtp } from '../controller/user/profileController.js';
import passport from '../config/passport.js';
import { userAuth } from '../middlewares/userAuth.js';

const router = express.Router();

router.get('/', userAuth,loadHomePage);
router.get('/landingPage',loadLandingPage);
router.get('/pageNotFound',pageNotFound);
router.get('/signup',loadSignup);
router.get('/signin',loadSignin);
router.post('/signup',signup);
router.get('/verifyOtp',loadVerifyOtp);
router.post('/verifyOtp',verifyOtp);
router.post('/resendOtp',resendOtp);
router.post('/signin', signin);
router.get('/logout', logout);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signup' }),
  (req, res) => {
    req.session.user = {
      _id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email
    };
    res.redirect('/');
  }
);

router.get('/forgotpassword', loadForgotPassword);
router.post('/verifyemail', verifyEmail);
router.post('/verifyPassOtp', verifyPassOtp);

export default router;
