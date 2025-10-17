let express=require('express')
let router=express.Router()
let userController= require('../controller/user/userController')


router.get('/',userController.loadHomePage)
router.get('/pageNotFound',userController.pageNotFound)

module.exports=router