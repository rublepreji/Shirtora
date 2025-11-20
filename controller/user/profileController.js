import User from '../../model/userSchema.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import session from 'express-session';
import * as utils from '../../utils/userUtils.js';
import {generateOtp,sendEmailForgotPassword} from '../../utils/userUtils.js'
import {STATUS} from '../../utils/statusCode.js'

dotenv.config();


async function loadContact(req,res) {
  try {
    res.render('contact')
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

async function loadAbout(req,res) {
  try {
    res.render('about')
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

async function resetPassword(req,res) {
  try {
    console.log('resetpassword');
    
    const {password,confirmPassword}=req.body
    console.log(req.body);
    
    
    if(password!=confirmPassword){
      return res.status(STATUS.UNAUTHORIZED).json({success:false,message:"Passwords does not match"})
    }
    const email= req.session.email
    const findUser= await User.findOne({email})
    if(!findUser){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Cannot find user"})
    }

    const passwordHash= await utils.securePassword(password)
    const user=await User.updateMany({email:email},{$set:{password:passwordHash}})
    if(user){
      res.status(STATUS.OK).json({success:true,message:"Your password has been reset successfully"})
    }

  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function resendOtps(req,res) {
  try {
    const email= req.session.email
    
    if(!email){
      return res.status(STATUS.UNAUTHORIZED).json({success:false,message:"Email is not in session"})
    }
    const otp = generateOtp()
    req.session.Otp= otp
    const emailSend= await sendEmailForgotPassword(email ,otp)
    if(emailSend){
      console.log('Resend OTP',otp);
      return res.status(STATUS.OK).json({success:true,message:"Resend OTP Successfully"})
    }

  } 
  catch (error) {
    return res.status(500).json({success:false,message:"Internal server error"})
  }
}

async function loadPasswordReset(req,res) {
  try {
    res.render('passwordReset')
  } catch (error) {
    res.status(500).json({success:false,message:"Internal server error"})
  }
}

async function verifyPassOtp(req, res) {
  try {
    const { otp } = req.body;
    
    if(req.session.Otp==otp){
      return res.status(200).json({success:true,message:"OTP verified"})
    }
    else{
      return res.status(400).json({success:false,message:"OTP not matching"})
    }
  } catch (error) {
    console.error('Error verifying password OTP:', error);
    return res.status(500).json({success:false,message:"An error occured. Please try again"})
  }
}

  async function verifyEmail(req, res) {
    try {
      const { email } = req.query;
      console.log('entered email',email);
      
      const findUser = await User.findOne({ email: email ,isAdmin:false});
      if (findUser) {
        const otp = utils.generateOtp();
        const emailSent =await utils.sendEmailForgotPassword(email, otp);
        if (emailSent) {
          console.log('success');
          
          req.session.Otp = otp;
          req.session.email = email;
          console.log('Forgot OTP:', otp);
          return res.status(200).json({success:true})
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'Failed to send OTP. Please try again' });
        }
      } else {
        return res.status(400).json({ success: false, message: 'User does not exist' });
      }
    } catch (error) {
      return res.status(500).json({success:false,message:"Internal server error"});
    }
  }

async function loadOTPpage(req,res) {
  try {
    const email= req.session.email
    if(!email){
      return res.redirect('/forgotpassword')
    }
    res.render('forgotOTP')
  } catch (error) {
    return res.redirect('/pageNotFound')
  }
}

async function loadForgotPassword(req, res) {
  try {
    return res.render('forgotPassword');
  } catch (error) {
    return res.redirect('/pageNotFound');
  }
}

export { loadForgotPassword, verifyEmail, verifyPassOtp, loadOTPpage, loadPasswordReset, resendOtps, resetPassword, loadAbout, loadContact};
