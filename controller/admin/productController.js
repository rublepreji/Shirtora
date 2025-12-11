import Product from '../../model/productSchema.js';
import Category from '../../model/categorySchema.js';
import Brand from '../../model/brandSchema.js';
import {STATUS} from '../../utils/statusCode.js'
import { json } from 'stream/consumers';
import {logger} from '../../logger/logger.js'
import ProductService from '../../services/adminService/productService.js'
import productService from '../../services/adminService/productService.js';


async function dataForProductPage(req,res) {
  try {    
    const page= parseInt(req.query.page) || 1
    const search= req.query.search ||""

    const result=await ProductService.listProduct(page,search)

    res.status(STATUS.OK).json({
      success:true,
      data:result.productData,
      totalProduct:result.totalProduct,
      totalpages:result.totalpages,
      currentPage:page,
    })
  } catch (error) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function blockProduct(req,res) {
  try {
    const id=req.body.id
    if(id){
      await productService.blockUnblockProduct(id,true)
      return res.status(STATUS.OK).json({success:true,message:"Product blocked successfully"})
    }
    else{
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Failed to block Product"})
    }
  } catch (error) {
    console.log(error); 
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}
async function unblockProduct(req,res) {
  try {
    const id = req.body.id
    if(id){
    await productService.blockUnblockProduct(id,false)   
    return res.status(STATUS.OK).json({success:true,message:"Product unblocked successfully"})
    } 
    else{
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Failed to unblock product"})
    }
  } catch (error) {
    console.log(error);
    
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function imageChanges(req,res) {
  try {    
    const {productId, imageIndex}= req.body    
    const image= req.file    
    if(!productId || !imageIndex || !image){
      return res.status(STATUS.NOT_FOUND).json({success:true,message:"Missing datas"})
    }
    const updateImage= await productService.productImageChange(productId,imageIndex,image)
    if(updateImage){
      return res.status(STATUS.OK).json({success:true,message:"Image updated!"})
    }
    else{
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Not able to update"})
    }
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function removeImage(req,res) {
  try {
    const {imageid,productid}= req.query
    const image= await productService.removeImage(imageid,productid)
    if(!imageid || !productid){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"No Image"})
    }
    if(image){
      return res.status(STATUS.OK).json({success:true,message:"Image removed"})
    }
    else{
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Image cannot be removed"})
    }
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function editproduct(req,res) {
  try {    
    const {productId,productName,description,category,brand,colour,variants}= req.body    
    const existingProduct= await productService.findExistingProduct(productName,productId)
    
    if(existingProduct){
      return res.status(STATUS.UNAUTHORIZED).json({success:false,message:"Product with this name already exists .Please try with another name"})
    }
    const updated= await productService.updateProducts(productId,productName,description,category,brand,colour,variants)
    if(!updated){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Product not found"})
    }
    return res.status(STATUS.OK).json({success:true,message:"Product updated successfully"})
  } catch (error) {
    logger.error('Error on editProduct', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function loadeditproduct(req,res) {
  try {
    const id = req.params.id
    const existProduct= await productService.findByIdProduct(id)
    if(!existProduct){
      return res.status(STATUS.NOT_FOUND).json('Product not exist')
    }
    const result= await productService.fetchAllCategoryAndBrand()
    return res.render('editproduct',{brand:result.brand,category:result.category,product:existProduct})
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({message:"Internal server error"})
  }
}

async function addProduct(req, res) {
  try {
    const product = req.body;
    const existProduct = await productService.productExisting(product.name)
    if (existProduct) {
      return res.status(STATUS.BAD_REQUEST).json({ success: false, message: 'Product already exist' });
    }
    const images = req.files.map((file) => file.path);
    const category = await productService.findCategory(product.category)
    if (!category) {
      return res.status(STATUS.UNAUTHORIZED).json({ success: false  , message: 'Invalid category' });
    }

    const brand = productService.findBrand(product.brand)
    if (!brand) {
      return res.status(STATUS.UNAUTHORIZED).json({ success: false, message: 'Invalid brand' });
    }
    await productService.createProduct(product,images)
    return res.status(STATUS.OK).json({ success: true, message: 'Product added successfully' });
  } catch (error) {
    logger.error('Error add product', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
  }
}

async function loadAddProduct(req, res) {
  try {
    const result= await productService.fetchAllCategoryAndBrand()
    return res.render('addproduct', {
      category: result.category,
      brand: result.brand
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
  }
}

async function loadProductpage(req, res) {
  try {
    return res.render('product');
  } catch (error) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
  }
}

export { loadProductpage, loadAddProduct, addProduct, loadeditproduct, editproduct,removeImage, imageChanges, blockProduct, unblockProduct ,dataForProductPage};
