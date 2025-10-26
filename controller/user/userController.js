const User=require('../../model/userSchema')
require('dotenv').config()
const {generateOtp,sendEmailVerification,securePassword}=require('../../utils/userUtils')
const { json } = require('express')
const bcrypt= require('bcrypt')


async function logout(req,res){
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("Session destroy error",err);
                return res.redirect('/pageNotFound')
            }
        })
        return res.redirect('/signin')
    } catch (error) {
        console.log('Logout error',error);
        return res.redirect('/pageNotFound')
    }
}

async function signin(req,res) {
    try {
        const {email,password}=req.body
        const findUser=await User.findOne({isAdmin:0,email:email})
       
        if(!findUser){
            return res.render('signinPage',{message:"User not found"})
        }
        if(findUser.isBlocked){
            return res.render('signinPage',{message:"User is blocked by admin"})
        }
        const passwordMatch= await bcrypt.compare(password,findUser.password)
        if(!passwordMatch){
            return res.render('signinPage',{message:"Incorrect password"})
        }
        req.session.user=findUser
        return res.redirect('/')
    } catch (error) {
        console.log("login error:",error);
        return res.render('/signinPage',{message:"login failed, Please try again later"})
    }
}

async function resendOtp(req,res) {
    try {
        const {email}=req.session.userData
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }
        const otp=generateOtp()
        req.session.userOtp=otp
        const resendOtp= sendEmailVerification(email,otp)
        if(resendOtp){
            console.log("Resend OTP ",otp);
            
           return res.status(200).json({success:true,message:"OTP resend successfully"})
        }
        else{
           return res.status(400),json({success:false,message:"Failed to resend otp. Please try again"})
        }

    } catch (error) {
        console.log("Error resending OTP");
        
       return res.status(500).json({success:false,message:"Internal Server Error. Please try again"})
    }
}

async function verifyOtp(req,res){
    try {
        const {otp}= req.body        
        if(otp==req.session.userOtp){
        const user= req.session.userData
        
        const passwordHash= await securePassword(user.password)
        const newUser= new User({
            firstName:user.firstName,
            lastName:user.lastName,
            phone:user.phone,
            email:user.email,
            password:passwordHash
        })
        await newUser.save()
        req.session.user=newUser._id
       return res.json({success:true,redirectUrl:"/signin"})
    }
    else{
        res.status(400).json({success:false,message:"Invalid OTP"}) 
    }
    } catch (error) {
        console.error('Error verifying   OTP',error)
       return res.status(500).json({success:false,message:'An error occured'})
    }
}

const signup=async(req,res)=>{
    try {
        const {firstName,lastName,phone,email,password,cPassword}=req.body 
               
        if(password !==cPassword){
           return res.render('signupPage',{message:'Passwords do not match'})
        }
        const findUser= await User.findOne({email})
        if(findUser){
           return res.render('signupPage',{message:'User with this email already exists'})
        }
        
        const otp= generateOtp()
        console.log('Otp is ',otp);
        
        const emailSend= await sendEmailVerification(email,otp)
        if(!emailSend){
           return res.json('email error')
        }
        req.session.userOtp=otp
        req.session.userData={firstName,lastName,phone,email,password}
        res.redirect('/verifyOtp')
        console.log("OTP Send");

    } catch (error) {
        console.log("SignUp error",error);
       return res.redirect('/pageNotFound')        
    }

}

const loadSignin=async(req,res)=>{
    try{

        return res.render('signinPage')
    }
    catch(err){
        console.log("signin page not loading ",err);
        
       return res.status(500).json('Server Error')
    }
}
const loadVerifyOtp=async(req,res)=>{
    try {
       return res.render('verifyOtp')
    } catch (error) {
        console.log("Signup page not loading", err);
       return res.status(500).json('Server Error')
    }
}

const loadSignup=async(req,res)=>{

    try{
        return res.render('signupPage')
    }
    catch(err){
        console.log("Signup page not loading", err);
       return res.status(500).json('Server Error')
        
    }
}

const pageNotFound= async(req,res)=>{
    try{
       return res.render('pageNotFound')
    }
    catch(err){
        console.log(err);
       return res.status(500).json('Page not found: ',err)
        
    }
}
const loadHomePage= async(req,res)=>{
    try {
        let user= req.session.user
        if(user){
            const userData= await User.findOne({_id:user._id})
           return res.render('homePage',{user:userData})
        }
        else{
            res.render('homePage')
        }
    } catch (error) {
        console.log("Home page is not loading:",error);
        return res.status(500).send("Server Error")
    }
}

const loadLandingPage= async(req,res)=>{
    try{
       return res.render('landingPage')
    }
    catch(err){
       return res.status(500).json('some error: ',err)
    }
}


module.exports={loadHomePage,loadLandingPage,pageNotFound,loadSignup,loadSignin,signup,verifyOtp,loadVerifyOtp,resendOtp,signin,logout}