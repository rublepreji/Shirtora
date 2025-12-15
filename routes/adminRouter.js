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
    unBlockUser,
    dataForUserPage
     } from '../controller/admin/userController.js';
import {
    categoryInfo,
    loadAddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    dataForCategory,
    blockCategory,
    unblockCategory
    } from '../controller/admin/categoryController.js';
import { 
    loadProductpage, 
    loadAddProduct,
    addProduct,
    loadeditproduct,
    editproduct,
    removeImage,
    imageChanges,
    blockProduct,
    unblockProduct,
    dataForProductPage
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
import {
    loadOrderList,
    loadOrderDetails,
    dataForOrderList,
    updateOrderStatus,
    updateReturnStatus,
    updateItemStatus
} from '../controller/admin/orderController.js'
import {
    loadOfferList,
    loadAddOffer,
    getOfferTargets,
    addOffer,
    offerList,
    loadEditOffer,
    loadDeleteOffer,
    editOffer
} from "../controller/admin/offerController.js"
import uploadTo from '../middlewares/multerCloudinary.js';
import multer from 'multer';
import {storage} from '../helpers/multer.js';
import {adminAuth ,adminLogged} from '../middlewares/auth.js'


const router = express.Router();
const uploads = multer({ storage: storage });

router.get('/pageError',pageError);
router.get('/login',adminLogged, loadLogin);
router.post('/login',login);

router.get('/',adminAuth ,loadDashboard);
router.get('/adminlogout',adminLogout);

// User management
router.get('/users',adminAuth ,userInfo);
router.post('/blockuser',adminAuth,blockUser);
router.post('/unblockuser',adminAuth,unBlockUser);
router.get('/dataForuserpage',dataForUserPage)

// Category management
router.get('/category', adminAuth,categoryInfo);
router.get('/addcategory',adminAuth, loadAddCategory);
router.post('/addcategory',adminAuth ,addCategory);
router.get('/editcategory/:id', adminAuth,loadEditCategory);
router.post('/postEditCategory',adminAuth, editCategory);
router.get('/dataforcategory',dataForCategory)
router.put('/unblockcategory',adminAuth,unblockCategory)
router.put('/blockcategory',adminAuth,blockCategory)

// Brand management
router.get('/brand',adminAuth,loadBrandPage);
router.get('/addbrand',adminAuth,loadAddbrand);
router.post('/postaddbrand',adminAuth, uploadTo('brands').single('image'),addBrand);
router.post('/blockbrand',adminAuth,blockBrand);
router.post('/unblockbrand',adminAuth,unBlockBrand);
router.get('/editBrand/:id',adminAuth,loadEditBrand);
router.put('/editBrand',adminAuth, uploadTo('brands').single('image'), editBrand);
router.get('/brand/data', adminAuth,dataForBrandPage);


// Product management
router.get('/product',adminAuth, loadProductpage);
router.get('/addproduct',adminAuth, loadAddProduct);
router.post('/addproduct',adminAuth, uploadTo('products').array('images', 4),addProduct);
router.get('/editproduct/:id',adminAuth,loadeditproduct)
router.put('/editproduct',adminAuth,editproduct)
router.delete('/removeimg',adminAuth,removeImage)
router.put('/imagechanges',adminAuth,uploadTo('products').single('image') , imageChanges)
router.put('/blockproduct',adminAuth ,blockProduct)
router.put('/unblockproduct',adminAuth,unblockProduct)
router.get('/dataforproductpage',adminAuth,dataForProductPage)

//Order management
router.get('/orderlist',adminAuth,loadOrderList)
router.get('/dataForOrderList',adminAuth,dataForOrderList)
router.get('/orderdetails/:id',adminAuth,loadOrderDetails)
router.put('/updateOrderStatus',adminAuth,updateOrderStatus)
router.put('/updateReturnStatus',adminAuth,updateReturnStatus)
router.put("/updateItemStatus", adminAuth, updateItemStatus);

//Offer management
router.get('/offerlist',adminAuth,loadOfferList)
router.get('/addoffer',adminAuth,loadAddOffer)
router.get('/getoffertargets',adminAuth,getOfferTargets)
router.post('/addoffer',adminAuth,addOffer)
router.get('/dataforofferlist',adminAuth,offerList)
router.get('/editoffer/:id',adminAuth,loadEditOffer)
router.put('/editoffer/:id',adminAuth,editOffer)
router.get('/deleteoffer/:id',adminAuth,loadDeleteOffer)


export default router;
