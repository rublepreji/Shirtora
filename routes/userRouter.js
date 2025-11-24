import express from 'express';
import {loadHomePage,pageNotFound,loadSignin,signin,signup,verifyOtp,loadVerifyOtp,logout,loadSignup, resendOtp, viewProducts, filterProduct, productDetails} from '../controller/user/userController.js';
import { loadForgotPassword, verifyEmail, verifyPassOtp, loadOTPpage, loadPasswordReset, resendOtps, resetPassword, loadAbout, loadContact, loadUserDetails, loadAddressBook, loadNewAddress, addNewAddress, loadEditAddress, editAddress, deleteAddress, loadChangeEmailOtp, verifyChangeEmailOtp, newEmail, setNewEmail, resetPass, loadResetPass, updateDetails} from '../controller/user/profileController.js';
import {loadCart} from '../controller/user/cartController.js'
import passport from '../config/passport.js';
import { userAuth,userIsLogged } from '../middlewares/auth.js';
import uploadTo from '../middlewares/multerCloudinary.js';
import multer from 'multer';
import {storage} from '../helpers/multer.js';

const router = express.Router();
const uploads = multer({ storage: storage });

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

//userProfile
router.get('/userProfile',userAuth,loadUserDetails)
router.get('/addressbook',userAuth,loadAddressBook)
router.get('/addnewaddress',userAuth,loadNewAddress)
router.post('/addnewaddress',userAuth,addNewAddress)
router.get('/editaddress/:addressId',userAuth,loadEditAddress)
router.post('/editaddress/:addressId',userAuth,editAddress)
router.delete('/deleteaddress/:id',userAuth,deleteAddress)
router.get('/changeemailotp',userAuth,loadChangeEmailOtp)
router.post('/changeemailotp',userAuth,verifyChangeEmailOtp)
router.get('/loadnewemail',userAuth,newEmail)
router.post('/setnewemail',userAuth,setNewEmail)
router.get('/resetpass',userAuth,loadResetPass)
router.post('/resetpass',userAuth,resetPass)
router.post('/updatedetails',userAuth,uploadTo('users').single('profileImage'),updateDetails)

//Cart Management
router.get('/cart',userAuth,loadCart)

export default router;
