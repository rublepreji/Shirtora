import express from 'express';
import { 
    loadLogin, 
    login, 
    loadDashboard,
    pageError, 
    adminLogout,
    } from '../controller/admin/adminController.js';

import { 
    userInfo,
    blockUser,
    unBlockUser
     } from '../controller/admin/userController.js';
import {
    categoryInfo,
    loadAddCategory,
    addCategory,
    deleteCategory,
    loadEditCategory,
    editCategory
    } from '../controller/admin/categoryController.js';
import { 
    loadProductpage, 
    loadAddProduct,
    addProduct,
    loadeditproduct,
    editproduct
    } from '../controller/admin/productController.js';
import {
    loadAddbrand,
    loadBrandPage,
    addBrand,
    blockBrand,
    unBlockBrand,
    loadEditBrand,
    editBrand,
    dataForBrandPage,
    
    } from '../controller/admin/brandController.js';
import uploadTo from '../middlewares/multerCloudinary.js';
import multer from 'multer';
import {storage} from '../helpers/multer.js';
import { 
    isAdminLogin,
     isAdminLogout 
    } from '../middlewares/auth.js';

const router = express.Router();
const uploads = multer({ storage: storage });

router.get('/pageError',pageError);
router.get('/login', isAdminLogout, loadLogin);
router.post('/login',login);
router.get('/', isAdminLogin,loadDashboard);
router.get('/adminlogout',adminLogout);

// User management
router.get('/users', isAdminLogin,userInfo);
router.post('/blockuser',blockUser);
router.post('/unblockuser',unBlockUser);

// Category management
router.get('/category', isAdminLogin, categoryInfo);
router.get('/addcategory', isAdminLogin, loadAddCategory);
router.post('/addcategory', addCategory);
router.post('/deleteCategory/:id', deleteCategory);
router.get('/editcategory/:id', isAdminLogin, loadEditCategory);
router.post('/postEditCategory', editCategory);

// Brand management
router.get('/brand', isAdminLogin,loadBrandPage);
router.get('/addbrand', isAdminLogin,loadAddbrand);
router.post('/postaddbrand', uploadTo('brands').single('image'),addBrand);
router.post('/blockbrand',blockBrand);
router.post('/unblockbrand', unBlockBrand);
router.get('/editBrand/:id',loadEditBrand);
router.put('/editBrand', uploadTo('brands').single('image'), editBrand);
router.get('/brand/data', dataForBrandPage);

// Product management
router.get('/product', isAdminLogin, loadProductpage);
router.get('/addproduct', isAdminLogin, loadAddProduct);
router.post('/addproduct', isAdminLogin, uploadTo('products').array('images', 4),addProduct);
router.get('/editproduct/:id', isAdminLogin,loadeditproduct)
router.post('/editproduct',isAdminLogin,editproduct)

export default router;
