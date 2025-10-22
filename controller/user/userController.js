const User=require('../../model/userSchema')
require('dotenv').config()
const {generateOtp,sendEmailVerification,securePassword}=require('../../utils/userUtils')
const { json } = require('express')


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
            
            res.status(200).json({success:true,message:"OTP resend successfully"})
        }
        else{
            res.status(400),json({success:false,message:"Failed to resend otp. Please try again"})
        }

    } catch (error) {
        console.log("Error resending OTP");
        
        res.status(500).json({success:false,message:"Internal Server Error. Please try again"})
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
        res.json({success:true,redirectUrl:"/"})
    }
    else{
        res.status(400).json({success:false,message:"Invalid OTP"}) 
    }
    } catch (error) {
        console.error('Error verifying   OTP',error)
        res.status(500).json({success:false,message:'An error occured'})
    }
}

const signup=async(req,res)=>{
    try {
        const {firstName,lastName,phone,email,password,cPassword}=req.body 
        console.log(firstName,' ',lastName);
               
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
        res.redirect('/pageNotFound')        
    }

}

const loadSignin=async(req,res)=>{
    try{

        res.render('signinPage')
    }
    catch(err){
        console.log("signin page not loading ",err);
        
       return res.status(500).json('Server Error')
    }
}
const loadVerifyOtp=async(req,res)=>{
    try {
        res.render('verifyOtp')
    } catch (error) {
        console.log("Signup page not loading", err);
       return res.status(500).json('Server Error')
    }
}

const loadSignup=async(req,res)=>{

    try{
        res.render('signupPage')
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
    try{
       return res.render('landingPage')
    }
    catch(err){
       return res.status(500).json('some error: ',err)
    }
}


module.exports={loadHomePage,pageNotFound,loadSignup,loadSignin,signup,verifyOtp,loadVerifyOtp,resendOtp}