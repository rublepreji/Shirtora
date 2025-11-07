import Product from '../../model/productSchema.js';
import Category from '../../model/categorySchema.js';
import Brand from '../../model/brandSchema.js';
import User from '../../model/userSchema.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { json } from 'stream/consumers';



async function editproduct(req,res) {
  try {
    console.log(req.body)
  } catch (error) {
    
  }
}

async function loadeditproduct(req,res) {
  try {
    const id = req.params.id
    const existProduct= await Product.findOne({_id:id})
    if(!existProduct){
      return res.status(400).json('Product not exist')
    }
    const category = await Category.find({ isDeleted: false });
    const brand = await Brand.find({ isBlocked: false });
    res.render('editproduct',{brand:brand,category:category,product:existProduct})
  } catch (error) {
    req.status(500).json({message:"Internal server error"})
  }
}

async function addProduct(req, res) {
  try {
    const product = req.body;
    console.log(product);
    console.log(req.files);

    const parsedVariants = JSON.parse(product.variants);
    const existProduct = await Product.findOne({ productName: product.name });
    if (existProduct) {
      return res.status(400).json({ success: false, message: 'Product already exist' });
    }

    const images = req.files.map((file) => file.path);

    const category = await Category.findOne({ name: product.category });
    if (!category) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const brand = await Brand.findOne({ brandName: product.brand });
    if (!brand) {
      return res.status(400).json({ success: false, message: 'Invalid brand' });
    }

    const newProduct = new Product({
      productName: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      variants: parsedVariants,
      colour: product.color,
      productImage: images
    });

    await newProduct.save();
    return res.status(200).json({ success: true, message: 'Product added successfully' });
  } catch (error) {
    console.log('Error add product', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function loadAddProduct(req, res) {
  try {
    const category = await Category.find({ isDeleted: false });
    const brand = await Brand.find({ isBlocked: false });
    res.render('addproduct', {
      category: category,
      brand: brand
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function loadProductpage(req, res) {
  try {
    const product = await Product.find({ isBlocked: false });
    return res.render('product', { product: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export { loadProductpage, loadAddProduct, addProduct, loadeditproduct, editproduct};
