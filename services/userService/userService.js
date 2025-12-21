import User from "../../model/userSchema.js"
import Product from "../../model/productSchema.js"
import Brand from "../../model/brandSchema.js";
import Category from "../../model/categorySchema.js";
import Offer from "../../model/offerSchema.js";
import { logger } from "../../logger/logger.js";
import bcrypt from 'bcrypt'
import { generateOtp, sendEmailVerification, securePassword } from '../../utils/userUtils.js';



async function offerCalculation(product,variantIndex=1) {
  let productOfferPercent=0
  let categoryOfferPercent=0

  const productOffer= await Offer.findOne({
    isActive:true,
    type:"product",
    productId:product._id
  })
  
  if(productOffer){
    productOfferPercent= productOffer.productOffer ||0
  }  

  const categoryOffer= await Offer.findOne({
    isActive:true,
    type:"category",
    categoryId:product.category?._id || product.category
  })
  if(categoryOffer){
    categoryOfferPercent= categoryOffer.categoryOffer || 0
  }

  const appliedOfferPercent= Math.max(productOfferPercent, categoryOfferPercent)

  let offerSource=null
  if(appliedOfferPercent>0){
    offerSource= productOfferPercent>categoryOfferPercent?"Product":"Category"
  }

  const orginalPrice= product.variants[variantIndex].price
  const discountAmount= (orginalPrice * appliedOfferPercent)/100;
  const finalPrice= orginalPrice-discountAmount

  return {
    offer:appliedOfferPercent,
    offerSource,
    orginalPrice,
    discountAmount,
    finalPrice
  }

}

async function productDetailsService(user,productId) {
    let userData= null
    if(user && user._id){
        userData=await User.findById(user._id);
    }
    const product=await Product.findById(productId).populate('category').populate('brand','brandName')
    if(!product){
        return {userData,product:null}
    }
    const findCategory= product.category
    const categoryOffer= findCategory?.categoryOffer || 0
    const productOffer= product?.productOffer || 0
    const totalOffer= categoryOffer+productOffer
    const relatedProduct= await Product.find({
      category:product.category._id,
      _id:{$ne:product._id}
    }).limit(4)
    const defaultVariant = product.variants[0] || null;
    return {
        userData,
        product,
        defaultVariant,
        totalOffer,
        categoryOffer,
        relatedProduct
    }
}

async function filterProductService(userQuery) {
    const {category,brand,price,sort,page,limit,search}= userQuery
    let sortOption={}
    const skip= (page-1)*limit
    const query={
      isBlocked:{$eq:false}
    }
    if(search){
      query.productName={$regex:search,$options:"i"}
    }
    if(category.length >0){
      query.category= {$in:category}
    }
    if(brand.length > 0){
      query.brand= {$in:brand}
    }
    if(price.length>0){
      const priceConditions= price.map(range=>{
      const [min ,max]=range.split('-').map(Number)
        return {
          "variants.price":{$gte:min,$lte:max}
        }
      })
      query.$or=priceConditions
    }
    
    if(sort=="low-high"){
      sortOption["variants.price"]=1
    }
    else if(sort ==="high-low"){
      sortOption["variants.price"]=-1
    }
    else if(sort=="A-Z"){
      sortOption.productName=1
    }
    else if(sort=="Z-A"){
      sortOption.productName=-1
    }
    else{
      sortOption.createdAt=-1
    }
    let findProducts= await Product.find(query)
    .populate({
      path:"category",
      match:{isBlocked:false}
    })
    .populate({
      path:"brand",
      match:{isBlocked:false}
    })
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean()

    findProducts=findProducts.filter(p=>p.category && p.brand)

    const totalProduct= await Product.countDocuments(query )
    const totalPage= Math.ceil(totalProduct/limit)

    return {
        findProducts,
        totalPage,
        page
    }
}

async function viewProductService(userId,page) {
    try {
        let userData=null;
    if(userId){
        userData= await User.findById(userId)
    }
    const categories= await Category.find({isBlocked:false})
    const brand= await Brand.find({isBlocked:false})
    const categoryIds= categories.map(category=>category._id)
    const brandIds= brand.map(b=>b._id)
    const limit=9
    
    const skip= (page-1)*limit
    const query={
        isBlocked:false,
        category:{$in:categoryIds},
        brand:{$in:brandIds},
        "variants.stock":{$gt:0}
    }
    let product=await Product.find(query)
    .populate({
        path:"category",
        match:{isBlocked:false}
    })
    .populate({
        path:"brand",
        match:{isBlocked:false}
    })
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)
    .lean()

    product=product.filter(p=>p.category && p.brand)

    const unblockedProducts= await Product.find(query)
    .populate({
        path:"category",
        match:{isBlocked:false}
    })
    .populate({
        path:"brand",
        match:{isBlocked:false}
    })

    const totalProduct= unblockedProducts.filter(p=>p.category && p.brand).length
    const totalPages = Math.ceil(totalProduct/limit)
    const categoryWithIds= categories.map(cat=>({_id:cat._id,name:cat.name}))
    return {
        userData,
        product,
        totalProduct,
        totalPages,
        categoryWithIds,
        brand,
        page
    }
    } catch (error) {
        logger.error('viewProductService error',error)
        throw error
    }
}

async function signinService(email,password) {
    const findUser = await User.findOne({ isAdmin:false, email: email });

    if (!findUser) {
        return {success:false,message:"User not found"}
    }
    if (findUser.isBlocked) {
        return {success:false,message:"User is blocked by admin"}
    }
    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return {success:false,message:"Incorrect password"}
    }
    return {success:true,findUser}
}

async function resendOtpService(email) {
    try {
    if (!email) {
        return { success: false, message: 'Email not found in session' }
    }
    const otp = generateOtp();
    const emailStatus =await sendEmailVerification(email, otp);
    if (emailStatus) {
        console.log('Resend OTP ', otp);
        return { success: true, message: 'OTP resend successfully', otp}
    } else {
        return { success: false, message: 'Failed to resend otp. Please try again' }
    }
    } catch (error) {
        logger.error('resendOtpService error',error)
        throw error
    }
}

async function verifyOtpService(otp,sessionOtp,userData) {
  try {
  if (String(otp) !== String(sessionOtp)) {
    return {success:false,message:"Invalid OTP"} 
  }
  if(!userData){
    return {success:false,message:"User session expired, Try again"}
  }
      const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: (userData.firstName + userData.lastName).toLowerCase(),
      phone: userData.phone,
      email: userData.email,
      password: userData.hashedPassword
  });
  await newUser.save();      
  return {success:true}
} catch (error) {
  logger.error("verifyOtpService error",error)
  throw error
}
}

async function signupService(password,cPassword,email) {
  try {
    if (password !== cPassword) {
      return {success:false, message: 'Passwords do not match' }
    }
    const findUser = await User.findOne({ email });
    if (findUser) {
      return {success:false, message: 'User with this email already exists' }
    }
    const otp = generateOtp();
    console.log('Otp is ', otp);

    const emailSend = await sendEmailVerification(email, otp);
    if (!emailSend) {
      return {success:false, message:"Not able to send OTP"}
    }
    const hashedPassword= await securePassword(password)
    return {success:true, otp,hashedPassword}
  } catch (error) {
    logger.error("signup Service error",error)
    throw error
  }
}

async function loadHomeService(userId) {
  try {
    let categories= await Category.find({isBlocked:false}).select('_id').lean()
    const categoryIds= categories.length?categories.map(cat=>cat._id):[]
    const baseQuery= {
      isBlocked:false,
      "variants.stock":{$gt:0},
      ...(categoryIds.length ? {category:{$in: categoryIds}}:{})
    }
    const [newArrivals,flashSales,userData]= await Promise.all([
     Product.find(baseQuery).sort({createdAt:-1}).limit(4).lean(),
     Product.find(baseQuery).sort({"variants.price":-1}).limit(5).lean(),
    userId ? User.findById(userId).lean():Promise.resolve(null)
    ])
    return {
      newArrivals:newArrivals ||[],
      flashSales: flashSales || [],
      userData : userData || null
    }
  } catch (error) {
    logger.error("loadHomeService",error)
    throw error
  }
}



export default {
    productDetailsService,
    filterProductService,
    viewProductService,
    signinService,
    resendOtpService,
    verifyOtpService,
    signupService,
    loadHomeService,
    offerCalculation
}