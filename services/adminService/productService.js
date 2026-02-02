import Product from "../../model/productSchema.js";
import Category from "../../model/categorySchema.js";
import Brand from "../../model/brandSchema.js";

async function listProduct(page,search) {
    const limit=3
    const skip= (page-1)*limit
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
    return {
        productData,
        totalProduct,
        totalpages
    }
}

async function blockUnblockProduct(id,res) {
    await Product.findByIdAndUpdate(id,{isBlocked:res},{new:res})
}

async function productImageChange(productId,imageIndex,image) {
  return await Product.findByIdAndUpdate(productId,{$set:{[`productImage.${imageIndex-1}`]:image.path}},{new:true})
}

async function removeImage(imageid,productid) {
   return await Product.findByIdAndUpdate(productid,{$pull:{productImage:imageid }},{new:true})
}

async function findExistingProduct(productName,productId) {
   return await Product.findOne({productName:productName,_id:{$ne:productId}})
}

async function updateProducts(productId,productName,description,category,brand,colour,variants) {
    const updateFields={
          productName,
          description,
          category,
          brand,
          colour,
          variants:variants 
        }
    return await Product.findByIdAndUpdate(productId,updateFields,{new:true})
}

async function findByIdProduct(id) {
    return await Product.findById(id)
    .populate("category","name")
    .populate("brand","brandName")
}

async function fetchAllCategoryAndBrand() {
   const category=await Category.find({ isBlocked: false });
   const brand= await Brand.find({isBlocked:false})
   return {category,brand}
}

async function productExisting(productName) {
    return await Product.findOne({ productName: { $regex: new RegExp(`^${productName}$`, "i") } });
}

async function findCategory(categoryId) {
    return await Category.findOne({  _id: categoryId });
}

async function findBrand(brandId) {
   return await Brand.findOne({ _id: brandId });
}

async function createProduct(product,images) {
    const parsedVariants = JSON.parse(product.variants);
    
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
}
export default {
    listProduct,
    blockUnblockProduct,
    productImageChange,
    removeImage,
    findExistingProduct,
    updateProducts,
    findByIdProduct,
    fetchAllCategoryAndBrand,
    productExisting,
    findCategory,
    findBrand,
    createProduct
}
