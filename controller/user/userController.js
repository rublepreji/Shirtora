import User from '../../model/userSchema.js';
import Category from '../../model/categorySchema.js';
import Product from '../../model/productSchema.js';
import Brand from '../../model/brandSchema.js';
import dotenv from 'dotenv';
import { generateOtp, sendEmailVerification, securePassword } from '../../utils/userUtils.js';
import { json } from 'express';
import bcrypt from 'bcrypt';

dotenv.config();



async function productDetails(req,res) {
  try {
    const user=req.session.user ?req.session.user :""    
    const userData=await User.findById(user._id)
    const productId= req.params.id    
    const product=await Product.findById(productId).populate('category').populate('brand','brandName')
    const findCategory= product.category
    const categoryOffer= findCategory?.categoryOffer || 0
    const productOffer= product?.productOffer || 0
    const totalOffer= categoryOffer+productOffer
    const relatedProduct= await Product.find({
      category:product.category._id,
      _id:{$ne:product._id}
    }).limit(4)
    res.render('productDetails',{
      user:userData,
      product,
      quantity:product.variants[0].stock,
      totalOffer:totalOffer,
      category:categoryOffer,
      relatedProduct
    })
  } catch (error) {
    return res.redirect('/pageNotFound')
  }
}

async function filterProduct(req,res) {
  try {
    const category= req.query.category ?req.query.category.split(",") : []
    const brand= req.query.brand ? req.query.brand.split(",") : []
    const price= req.query.price ?req.query.price.split(",") : []
    const sort= req.query.sort || ''
    const page= parseInt(req.query.page) || 1
    const limit=9
    const search= req.query.search || ''
    let sortOption={}
    
    
    const skip= (page-1)*limit
    const brands= await Brand.find({isBlocked:false})
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
    else{
      sortOption.createdAt=-1
    }
    let findProducts= await Product.find(query)
    .populate("category","name")
    .populate("brand","brandName")
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean()

    const totalProduct= await Product.countDocuments(query )
    const totalPage= Math.ceil(totalProduct/limit)

    res.status(200).json({
      success:true,
      product:findProducts,
      totalPage:totalPage,
      currentPage:page,
    })

  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

async function viewProducts(req,res) {
    try {
        const user= req.session.user
        const userData= await User.findOne({_id:user})
        const categories= await Category.find({isDeleted:false})
        const brand= await Brand.find({isBlocked:false})
        const categoryIds= categories.map(category=>category._id)
        const limit=9
        const page= req.query.page || 1
        const skip= (page-1)*limit
        const query={
          isBlocked:false,
          category:{$in:categoryIds},
          "variants.stock":{$gt:0}
        }
        const product=await Product.find(query)
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .lean()

        const totalProduct= await Product.countDocuments(query)
        const totalPages = Math.ceil(totalProduct/limit)
        const categoryWithIds= categories.map(cat=>({_id:cat._id,name:cat.name}))

        res.render('viewProduct',{
          user:userData,
          products:product,
          totalProducts:totalProduct,
          totalPages:totalPages,
          category:categoryWithIds,
          brands:brand,
          currentPage:page
        })
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}


async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log('Session destroy error', err);
        return res.redirect('/pageNotFound');
      }
    });
    return res.redirect('/signin');
  } catch (error) {
    console.log('Logout error', error);
    return res.redirect('/pageNotFound');
  }
}

async function signin(req, res) {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ isAdmin: 0, email: email });

    if (!findUser) {
      return res.render('signinPage', { message: 'User not found' });
    }
    if (findUser.isBlocked) {
      return res.render('signinPage', { message: 'User is blocked by admin' });
    }
    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render('signinPage', { message: 'Incorrect password' });
    }
    req.session.user = findUser;
    return res.redirect('/');  
  } catch (error) {
    console.log('login error:', error);
    return res.render('/signinPage', { message: 'login failed, Please try again later' });
  }
}

async function resendOtp(req, res) {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not found in session' });
    }
    const otp = generateOtp();
    req.session.userOtp = otp;
    const resendOtp = sendEmailVerification(email, otp);
    if (resendOtp) {
      console.log('Resend OTP ', otp);
      return res.status(200).json({ success: true, message: 'OTP resend successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Failed to resend otp. Please try again' });
    }
  } catch (error) {
    console.log('Error resending OTP');
    return res.status(500).json({ success: false, message: 'Internal Server Error. Please try again' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { otp } = req.body;
    if (otp == req.session.userOtp) {
      const user = req.session.userData;

      const passwordHash = await securePassword(user.password);
      const newUser = new User({
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: (user.firstName + user.lastName).toLowerCase(),
        phone: user.phone,
        email: user.email,
        password: passwordHash
      });
      await newUser.save();
      req.session.user = newUser._id;
      return res.json({ success: true, redirectUrl: '/signin' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP', error);
    return res.status(500).json({ success: false, message: 'An error occured' });
  }
}

const signup = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, cPassword } = req.body;

    if (password !== cPassword) {
      return res.render('signupPage', { message: 'Passwords do not match' });
    }
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render('signupPage', { message: 'User with this email already exists' });
    }

    const otp = generateOtp();
    console.log('Otp is ', otp);

    const emailSend = await sendEmailVerification(email, otp);
    if (!emailSend) {
      return res.json('email error');
    }
    req.session.userOtp = otp;
    req.session.userData = { firstName, lastName, phone, email, password };
    res.redirect('/verifyOtp');
    console.log('OTP Send');
  } catch (error) {
    console.log('SignUp error', error);
    return res.redirect('/pageNotFound');
  }
};

const loadSignin = async (req, res) => {
  const user = req.user || req.session.user
  if(user){
    res.redirect('/')
  }
  try {
    return res.render('signinPage');
  } catch (err) {
    console.log('signin page not loading ', err);
    return res.status(500).json('Server Error');
  }
};

const loadVerifyOtp = async (req, res) => {
  try {
    return res.render('verifyOtp');
  } catch (error) {
    console.log('Signup page not loading', error);
    return res.status(500).json('Server Error');
  }
};

const loadSignup = async (req, res) => {
  try {
    return res.render('signupPage');
  } catch (err) {
    console.log('Signup page not loading', err);
    return res.status(500).json('Server Error');
  }
};

const pageNotFound = async (req, res) => {
  try {
    return res.render('pageNotFound');
  } catch (err) {
    console.log(err);
    return res.status(500).json('Page not found: ', err);
  }
};

const loadHomePage = async (req, res) => {
  try {
    let user = req.session.user;
    let categories= await Category.find({isDeleted:false})

    let productData= await Product.find({
      isBlocked:false,
      category:{$in:categories.map(cat=>cat._id)},
      "variants.stock":{$gt:0}
    }).sort({createdAt:-1}).limit(4)

    let flashSales= await Product.find({
      isBlocked:false,
      category:{$in:categories.map(cat=>cat._id)},
      "variants.stock":{$gt:0}
    }).sort({"variants.price":-1}).limit(5)

    if (user) {
      const userData = await User.findOne({ _id: user._id});
      return res.render('homePage', { 
        user: userData, 
        newArrivals:productData,
        flashSales 
      })
    } else {
      res.render('homePage', {
        newArrivals:productData,
        flashSales
      });
    }
  } catch (error) {
    console.log('Home page is not loading:', error);
    return res.status(500).send('Server Error');
  }
};

const loadLandingPage = async (req, res) => {
  try {
    return res.render('landingPage');
  } catch (err) {
    return res.status(500).json('some error: ', err);
  }
};

export {
  loadHomePage,
  loadLandingPage,
  pageNotFound,
  loadSignup,
  loadSignin,
  signup,
  verifyOtp,
  loadVerifyOtp,
  resendOtp,
  signin,
  logout,
  viewProducts,
  filterProduct,
  productDetails
};
