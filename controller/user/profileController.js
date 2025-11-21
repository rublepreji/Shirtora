import User from '../../model/userSchema.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import session from 'express-session';
import * as utils from '../../utils/userUtils.js';
import {generateOtp,sendEmailForgotPassword} from '../../utils/userUtils.js'
import {STATUS} from '../../utils/statusCode.js'
import Address from '../../model/addressSchema.js';
dotenv.config();



async function editAddress(req,res) {
  try {
    const addressData= req.body
    const user =req.session.user
    const addressId= req.params.addressId
    
    const {
      "first-name": firstName,
      "last-name": lastName,
      email,
      district,
      "address-line":addressLine,
      state,
      landmark,
      "pin-code": pincode,
      phone,
      "address-type": addressType
    }=req.body

    const addressDoc= await Address.findOne({userId:user._id})
    const editAddress= addressDoc.address.id(addressId)

    editAddress.firstName=firstName
    editAddress.lastName=lastName
    editAddress.addressType=addressType
    editAddress.city=district
    editAddress.landMark=landmark
    editAddress.addressLine=addressLine
    editAddress.email=email
    editAddress.state=state
    editAddress.pincode=pincode
    editAddress.phone=phone
    editAddress.updatedAt=new Date()

    await addressDoc.save()
    req.session.message = "Address updated successfully!";
    return res.redirect('/addressbook')    
  } catch (error) {
    req.session.message = "something went wrong!";
    console.log('editAddress error',error);
    req.session.message="Failed to update address"
    return res.redirect('/pageNotFound')
  }
}


async function loadEditAddress(req,res) {
  try {
    const addressId=req.params.addressId
    const user= req.session.user
    const addressDoc= await Address.findOne({userId:user._id})

    if(!addressDoc){
      return res.redirect('/addressbook')
    }
    const selectedAddress=addressDoc.address.id(addressId)
    
    return res.render('editAddress',{address:selectedAddress})
  } catch (error) {
    return res.redirect('/pageNotFound')
  }
}

async function addNewAddress(req,res) {
  try {
    const user=req.session.user
      if(!user){
        return res.redirect('/signin')
      }
      const {
        "first-name":firstName,
        "last-name":lastName,
        email,
        phone,
        "address-line":addressLine,
        district,
        state,
        landmark,
        "pin-code":pincode,
        "address-type":addressType,
      }=req.body
      const existingAddressDoc= await Address.findOne({userId:user._id})
      const newAddress={
        addressType,
        firstName,
        lastName,
        city:district,
        landMark:landmark,
        addressLine,
        state,
        pincode,
        email,
        phone,
        isDefault:false,
        createdAt:new Date(),
        updatedAt:new Date()
      }
    if(!existingAddressDoc){
      newAddress.isDefault=true

      const newAddressDoc=new Address({
        userId:user._id,
        address:[newAddress]
      })
      await newAddressDoc.save()
      req.session.message="Address added successfull"
      return res.redirect('/addressbook')
    }
    if(existingAddressDoc.address.length==0){
      newAddress.isDefault=true
    }
    existingAddressDoc.address.push(newAddress)
    await existingAddressDoc.save()
    req.session.message="Address added successfull"
    return res.redirect('/addressbook')
    
  } catch (error) {
    console.log('error on add New Address',error);
    req.session.message="Failed to add address"
    res.redirect('/pageNotFound')
  }
}

async function loadNewAddress(req,res) {
  try {
    res.render('addNewAddress')
  } catch (error) {
    console.log('error on loadNewAddress',error);
    
  }
}

async function loadAddressBook(req,res) {
  try {
    
    const user= req.session.user
    if(!user) {
      return res.redirect('/signin')
    }
    const addressDoc= await Address.findOne({userId:user._id})  
    return res.render('addressFile',{addressDoc,user})
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

async function loadUserDetails(req,res) {
  try {
    if(req.session.user){
      const id= req.session.user._id
      const findUser=await User.findById(id)
      console.log(findUser);
      
    }
    
    res.render('userProfile')
  } catch (error) {
    
  }
}

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

export { loadForgotPassword, verifyEmail, verifyPassOtp, loadOTPpage, loadPasswordReset, resendOtps, resetPassword, loadAbout, loadContact, loadUserDetails, loadAddressBook, loadNewAddress, addNewAddress, loadEditAddress, editAddress};
