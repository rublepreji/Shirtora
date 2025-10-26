const express =require('express')
const router= express.Router()
const adminController= require('../controller/admin/adminController')
const {userAuth,adminAuth}=require('../middlewares/auth')


router.get('/pageError',adminController.pageError)
router.get('/login',adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/',adminAuth,adminController.loadDashboard)
router.get('/adminlogout',adminController.adminLogout)

module.exports=router