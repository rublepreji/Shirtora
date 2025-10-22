let express=require('express')
let router=express.Router()
let userController= require('../controller/user/userController')


router.get('/',userController.loadHomePage)
router.get('/pageNotFound',userController.pageNotFound)
router.get('/signup',userController.loadSignup)
router.get('/signin',userController.loadSignin)
router.post('/signup',userController.signup)
router.get('/verifyOtp',userController.loadVerifyOtp)
router.post('/verifyOtp',userController.verifyOtp)
router.post('/resendOtp',userController.resendOtp)

module.exports=router