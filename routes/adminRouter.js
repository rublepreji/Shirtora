const express =require('express')
const router= express.Router()
const adminController= require('../controller/admin/adminController')
const userController=require("../controller/admin/userController")
const categoryController= require('../controller/admin/categoryController')
const productController = require('../controller/admin/productController')
const brandController= require('../controller/admin/brandController')
const uploadTo= require('../middlewares/multerCloudinary')

const multer= require('multer')
const storage= require('../helpers/multer')
const uploads= multer({storage:storage})
const {isAdminLogin,isAdminLogout}=require('../middlewares/auth')


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
router.post('/deleteCategory/:id',categoryController.deleteCategory)

router.get('/editcategory/:id',isAdminLogin,categoryController.loadEditCategory)
router.post('/postEditCategory',categoryController.editCategory)
// Brand management
router.get('/brand',isAdminLogin,brandController.loadBrandPage)
router.get('/addbrand',isAdminLogin,brandController.loadAddbrand)
router.post('/postaddbrand',uploadTo('brands').single('image'),brandController.addBrand)
router.post('/blockbrand',brandController.blockBrand)
router.post('/unblockbrand',brandController.unBlockBrand)
router.get('/editBrand/:id',brandController.loadEditBrand)
router.put('/editBrand',uploadTo('brands').single('image'),brandController.editBrand)
router.get('/brand/data',brandController.dataForBrandPage)
//Product management
router.get('/product',isAdminLogin,productController.loadProductpage)
router.get('/addproduct',isAdminLogin,productController.loadAddProduct)
router.post('/addproduct',isAdminLogin,uploadTo('products').array('images',4),productController.addProduct)


module.exports=router