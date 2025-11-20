import express from 'express';
import {loadHomePage,pageNotFound,loadSignin,signin,signup,verifyOtp,loadVerifyOtp,logout,loadSignup, resendOtp, viewProducts, filterProduct, productDetails} from '../controller/user/userController.js';
import { loadForgotPassword, verifyEmail, verifyPassOtp, loadOTPpage, loadPasswordReset, resendOtps, resetPassword, loadAbout, loadContact} from '../controller/user/profileController.js';
import passport from '../config/passport.js';
import { userAuth,userIsLogged } from '../middlewares/auth.js';

const router = express.Router();

router.get('/',loadHomePage);
// router.get('/landingPage',loadLandingPage);
router.get('/pageNotFound',pageNotFound);
router.get('/signup',userIsLogged,loadSignup);
router.get('/signin',userIsLogged,loadSignin);
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

//profile management
router.get('/forgotpassword', loadForgotPassword);
router.post('/verifyemail', verifyEmail);
router.post('/verifyPassOtp', verifyPassOtp);
router.get('/forgototppage',loadOTPpage)
router.get('/passreset',loadPasswordReset)
router.post('/resendOtps',resendOtps)
router.post('/resetpassword', resetPassword)

router.get('/viewproducts',viewProducts)
router.get('/filterproduct',filterProduct)
router.get('/productdetails/:id',productDetails)

router.get('/about',loadAbout)
router.get('/contact',loadContact)

export default router;
