import Product from '../../model/productSchema.js';
import Category from '../../model/categorySchema.js';
import Brand from '../../model/brandSchema.js';
import { json } from 'stream/consumers';



async function dataForProductPage(req,res) {
  try {    
    const page= parseInt(req.query.page) || 1
    const limit=3
    const skip= (page-1)*limit
    const search= req.query.search ||""
    let query={}

    if(search){
      const categories= await Category.find({
        name:{$regex:search,$options:"i"}
      }).select("_id")

      const brands= await Brand.find({
        brandName:{$regex:search,$options:"i"}
      }).select("_id")

      query={
        $or:[
          {productName:{$regex:search,$options:"i"}},
          {category:{$in:categories.map(cat=>cat._id)}},
          {brand:{$in:brands.map(brand=>brand._id)}}
        ]
      }
    }
    
    const productData=await Product.find(query)
    .populate("category","name")
    .populate("brand","brandName")
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)

    const totalProduct= await Product.countDocuments(query)
    const totalpages= Math.ceil(totalProduct/limit)

    res.status(200).json({
      success:true,
      data:productData,
      totalProduct,
      totalpages,
      currentPage:page,
    })
  } catch (error) {
    res.status(500).json({success:false,message:"Internal server error"})
  }
}


async function blockProduct(req,res) {
  try {
    const id=req.body.id
    if(id){
      await Product.findByIdAndUpdate(id,{isBlocked:true},{new:true})
      return res.status(200).json({success:true,message:"Product blocked successfully"})
    }
    else{
      return res.status(400).json({success:false,message:"Failed to block Product"})
    }
  } catch (error) {
    console.log(error); 
    return res.status(500).json({success:false,message:"Internal server error"})
  }
}
async function unblockProduct(req,res) {
  try {
    const id = req.body.id
    if(id){
    await Product.findByIdAndUpdate(id,{isBlocked:false},{new:true})   
    return res.status(200).json({success:true,message:"Product unblocked successfully"})
    } 
    else{
      return res.status(400).json({success:false,message:"Failed to unblock product"})
    }
  } catch (error) {
    console.log(error);
    
    return res.status(500).json({success:false,message:"Internal server error"})
  }
}

async function imageChanges(req,res) {
  try {    
    const {productId, imageIndex}= req.body    
    const image= req.file    
    if(!productId || !imageIndex || !image){
      return res.status(400).json({success:true,message:"Missing datas"})
    }
    const updateImage= await Product.findByIdAndUpdate(productId,{$set:{[`productImage.${imageIndex-1}`]:image.path}},{new:true})
    if(updateImage){
      return res.status(200).json({success:true,message:"Image updated!"})
    }
    else{
      return res.status(400).json({success:false,message:"Not able to update"})
    }
    
  } catch (error) {
    return res.status(500).json({success:false,message:"Internal server error"})
  }
}

async function removeImage(req,res) {
  try {
    const {imageid,productid}= req.query
    const image= await Product.findByIdAndUpdate(productid,{$pull:{productImage:imageid }},{new:true})
    if(!imageid || !productid){
      return res.status(400).json({success:false,message:"No Image"})
    }
    if(image){
      return res.status(200).json({success:true,message:"Image removed"})
    }
    else{
      return res.status(400).json({success:false,message:"Image cannot be removed"})
    }
  } catch (error) {
    return res.status(500).json({success:false,message:"Internal server error"})
  }
}

async function editproduct(req,res) {
  try {    
    const {productId,productName,description,category,brand,colour,variants}= req.body
    console.log('editproduct',req.body);
    let vari= req.body.variants
    console.log('type checking',typeof(vari));
    
    const existingProduct= await Product.findOne({productName:productName,_id:{$ne:productId}})
    
    if(existingProduct){
      return res.status(400).json({success:false,message:"Product with this name already exists .Please try with another name"})
    }
    const updateFields={
      productName,
      description,
      category,
      brand,
      colour,
      variants:variants
    }
    const updated=await Product.findByIdAndUpdate(productId,updateFields,{new:true})
    if(!updated){
      res.status(400).json({success:false,message:"Product not found"})
    }
    res.status(200).json({success:true,message:"Product updated successfully"})
  } catch (error) {
    console.log('Error on editProduct', error);
    
    res.status(500).json({success:false,message:"Internal server error"})
  }
}

async function loadeditproduct(req,res) {
  try {
    const id = req.params.id
    const existProduct= await Product.findOne({_id:id})
    .populate("category","name")
    .populate("brand","brandName")
    if(!existProduct){
      return res.status(400).json('Product not exist')
    }
    const category = await Category.find({ isBlocked: false });
    const brand = await Brand.find({ isBlocked: false });
    res.render('editproduct',{brand:brand,category:category,product:existProduct})
  } catch (error) {
    req.status(500).json({message:"Internal server error"})
  }
}

async function addProduct(req, res) {
  try {
    const product = req.body;
    const parsedVariants = JSON.parse(product.variants);
    const existProduct = await Product.findOne({ productName: { $regex: new RegExp(`^${product.name}$`, "i") } });
    if (existProduct) {
      return res.status(400).json({ success: false, message: 'Product already exist' });
    }
    console.log(req.files);
    
    const images = req.files.map((file) => file.path);

    const category = await Category.findOne({  _id: product.category });
    if (!category) {
      return res.status(400).json({ success: false  , message: 'Invalid category' });
    }

    const brand = await Brand.findOne({ _id: product.brand });
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
    const category = await Category.find({ isBlocked: false });
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
    return res.render('product');
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export { loadProductpage, loadAddProduct, addProduct, loadeditproduct, editproduct,removeImage, imageChanges, blockProduct, unblockProduct ,dataForProductPage};
