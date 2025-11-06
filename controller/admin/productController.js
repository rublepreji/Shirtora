const Product= require('../../model/productSchema')
const Category= require('../../model/categorySchema')
const Brand= require('../../model/brandSchema')
const User= require('../../model/userSchema')
const fs= require('fs')
const path =require('path')
const sharp= require('sharp')
const { json } = require('stream/consumers')


async function addProduct(req,res) {
    try {
        const product= req.body
        console.log(product);
        console.log(req.files);
        
        const parsedVariants =JSON.parse(product.variants)
        const existProduct=await Product.findOne({productName:product.name})
        if(existProduct){
           return res.status(400).json({success:false,  message:"Product already exist"})
        }
        const images= req.files.map((file)=>file.path)

        const category= await Category.findOne({name:product.category})
        if(!category){
            return res.status(400).json({success:false,message:"Invalid category"})
        }
        const brand= await Brand.findOne({brandName:product.brand})
        if(!brand){
            return res.status(400).json({success:false,message:"Invalid brand"})
        }
        const newProduct= new Product({
            productName:product.name,
            description:product.description,
            brand:product.brand,
            category:product.category,
            variants:parsedVariants,
            colour:product.color,
            productImage:images,
        })
        await newProduct.save()
        return res.status(200).json({success:true,message:"Product added successfully"})
        
    } 
    catch (error) {
        console.log('Error add product',error);
        return res.status(500).json({success:false,message:"Internal server error"})
    }
}

async function loadAddProduct(req,res) {
    try {
        let category= await Category.find({isDeleted:false})
        let brand= await Brand.find({isBlocked:false})
        res.render('addproduct',{
            category:category,
            brand:brand
        } )
    } catch (error) {
        res.status(500).json({success:false, message:"Internal server error"})
    }
}

async function loadProductpage(req,res) {
    try {
        // const category= await Category.find({isListed:true})
        // const brand= await Brand.find({isBlocked:false})
        const product= await Product.find({isBlocked:false})
        return res.render('product',{product:product})
    } catch (error) {
        res.status(500).json({success:false,message:"Internal server error"})
    }
}



module.exports={loadProductpage,loadAddProduct,addProduct}