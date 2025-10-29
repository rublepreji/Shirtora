const express =require('express')
const router= express.Router()
const adminController= require('../controller/admin/adminController')
const {userAuth,adminAuth,isAdminLogin,isAdminLogout}=require('../middlewares/auth')
const userController=require("../controller/admin/userController")
const categoryController= require('../controller/admin/categoryController')


router.get('/pageError',adminController.pageError)
router.get('/login',isAdminLogout,adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/',isAdminLogin,adminController.loadDashboard)
router.get('/adminlogout',adminController.adminLogout)
// User management
router.get('/users',isAdminLogin,userController.userInfo)
router.post('/blockuser',userController.blockUser)
router.post('/unblockuser',userController.unBlockUser)
// Category management
router.get('/category',isAdminLogin,categoryController.categoryInfo)
router.get('/addcategory',isAdminLogin,categoryController.loadAddCategory)
router.post('/addcategory',categoryController.addCategory)
router.post('/listCategory',categoryController.getlistCategory)
router.post('/unlistCategory',categoryController.unlistCategory)
router.get('/editcategory/:id',isAdminLogin,categoryController.loadEditCategory)
router.post('/postEditCategory',categoryController.editCategory)



module.exports=router