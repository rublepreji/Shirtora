let express=require('express')
let router=express.Router()
let userController= require('../controller/user/userController')
const profileController= require('../controller/user/profileController')
const passport= require('../config/passport')
let {userAuth}= require("../middlewares/userAuth")


router.get('/',userAuth,userController.loadHomePage)
router.get('/landingPage',userController.loadLandingPage)
router.get('/pageNotFound',userController.pageNotFound)
router.get('/signup',userController.loadSignup)
router.get('/signin',userController.loadSignin)
router.post('/signup',userController.signup)
router.get('/verifyOtp',userController.loadVerifyOtp)
router.post('/verifyOtp',userController.verifyOtp)
router.post('/resendOtp',userController.resendOtp)
router.post('/signin',userController.signin)
router.get('/logout',userController.logout)

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.user={
        _id:req.user._id,
        firstName:req.user.firstName,
        lastName:req.user.lastName,
        email:req.user.email
    }
    res.redirect('/')
})


router.get('/forgotpassword',profileController.loadForgotPassword)
router.post('/verifyemail',profileController.verifyEmail)
router.post('/verifyPassOtp',profileController.verifyPassOtp)


module.exports=router