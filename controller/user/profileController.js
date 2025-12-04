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
import {logger} from '../../logger/logger.js'




async function updateDetails(req,res) {
  try {
    const data= req.body
    const userId= req.session.user._id
    const updateFields={
      firstName:data.firstName,
      lastName:data.lastName,
      phone:data.phone
    }
    if(req.file){
      const imageUrl=req.file.path
      updateFields.profileImg=imageUrl
    }
    const updateUser= await User.findByIdAndUpdate(userId,{$set:updateFields},{new:true})
    if(!updateUser){
      req.flash('error','Not able to update user data')
      return res.redirect('/userProfile')
    }
    req.session.user=updateUser
    req.flash('success','User Profile updated successfully')
    return res.redirect('/userProfile')
  } catch (error) {
    req.flash('error','Internal server error')
    res.redirect('/userProfile')
  }
}

async function resetPass(req,res) {
  try {
    const {currentPassword, newPassword, confirmPassword}= req.body
    const user= req.session.user._id
    if(!user){
      req.flash('error','Session expired')
      return res.redirect('/userProfile')
    }    
    const fetchUser= await User.findOne({_id:user})
    const isMatch= await bcrypt.compare(currentPassword,fetchUser.password)
    if(!isMatch){
      req.flash('error','Incorrect password')
      return res.redirect('/resetpass')
    }
    const hashedPassword=await utils.securePassword(newPassword)
    fetchUser.password=hashedPassword
    await fetchUser.save()
    req.flash('success','Password updated successfully')
    return res.redirect('/userProfile')
  } catch (error) {
    req.flash('error','Internal server error')
    res.redirect('/pageNotFound')
  }
}

async function loadResetPass(req,res) {
  try {
    res.render('resetPassword')
  } catch (error) {
    
  }
}

async function setNewEmail(req,res) {
  try {
    const {newEmail,confirmEmail}= req.body
    console.log(newEmail,' ',confirmEmail);
    
    if(newEmail !== confirmEmail){
      req.flash('error','Emails do not match!')
      return res.redirect('/loadnewemail')
    }
    const userId= req.session.user._id
    if(!userId){
      req.flash('error','Session expired')
      return res.redirect('/loadnewemail')
    }
    await User.findByIdAndUpdate(userId,{email:newEmail})
    req.flash('success','Email changed successfully')
    return res.redirect('/userProfile')
  } catch (error) {
    req.flash('error','Internal server error')
    res.redirect('/pageNotFound')
  }
}

async function newEmail(req,res) {
  try {
    res.render('newEmail')
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}


async function verifyChangeEmailOtp(req, res) {
  const { otp } = req.body;

  if (otp == req.session.changeEmailOtp) {
    req.session.isEmailVerifiedForChange = true;
    return res.redirect('/loadnewemail');
  }
console.log('otp error');

   req.flash('error', 'Invalid OTP');
   return res.redirect('/userProfile');
}


async function loadChangeEmailOtp(req, res) {
  try {
    const user = req.session.user;

    if (!user) {
      return res.redirect('/pageNotFound');
    }

    const otp = utils.generateOtp();  
    const email = user.email;

    console.log("Sending verification OTP to:", email);

    const emailSent = await utils.sendEmailVerification(email, otp);

    if (emailSent) {
      req.session.changeEmailOtp = otp;    
      req.session.currentEmail = email;     

      console.log("OTP sent:", otp);
      console.log("Stored OTP in session.");
      
      return res.render('changeEmailOtp');  
    } 
    else {
      req.flash('error', 'Failed to send OTP. Please try again.');
      return res.redirect('/userProfile');
    }

  } catch (error) {
    console.error("Error sending email:", error);
    return res.redirect('/pageNotFound');
  }
}

async function deleteAddress(req,res) {
  try {
    const user= req.session.user
    const addressId= req.params.id
    await Address.updateOne(
      {userId:user._id},
      {$pull:{address:{_id:addressId}}}
    )
    return res.status(STATUS.OK).json({success:true})
  } catch (error) {
    console.log('Error on delete address',error);
    
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false})
  }
}

async function editAddress(req, res) {
  try {
    const user = req.session.user;
    const addressId = req.params.addressId;

    if (!user) return res.redirect('/signin');

    const {
      "first-name": firstName,
      "last-name": lastName,
      email,
      district,
      "address-line": addressLine,
      state,
      landmark,
      "pin-code": pincode,
      phone,
      "address-type": addressType,
    } = req.body;

    const setDefault = req.body["set-default"] === "on";

    const addressDoc = await Address.findOne({ userId: user._id });
    const editAddress = addressDoc.address.id(addressId);

    if (!editAddress) {
      req.session.error = "Address not found!";
      return res.redirect("/addressbook");
    }


    editAddress.firstName = firstName;
    editAddress.lastName = lastName;
    editAddress.addressType = addressType;
    editAddress.city = district;
    editAddress.landMark = landmark;
    editAddress.addressLine = addressLine;
    editAddress.email = email;
    editAddress.state = state;
    editAddress.pincode = pincode;
    editAddress.phone = phone;
    editAddress.updatedAt = new Date();


    if (setDefault) {
      addressDoc.address.forEach(addr => addr.isDefault = false); 
      editAddress.isDefault = true;
    } 
    else if (editAddress.isDefault) {
      editAddress.isDefault = true; 
    }

    await addressDoc.save();

    req.session.message = "Address updated successfully!";
    return res.redirect('/addressbook');

  } catch (error) {
    console.log("editAddress error", error);
    req.session.error = "Failed to update address!";
    return res.redirect('/pageNotFound');
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

async function addNewAddress(req, res) {
  try {
    const user = req.session.user;
    if (!user) return res.redirect('/signin');

    const {
      "first-name": firstName,
      "last-name": lastName,
      email,
      phone,
      "address-line": addressLine,
      district,
      state,
      landmark,
      "pin-code": pincode,
      "address-type": addressType,
    } = req.body;

    const setDefault = req.body["set-default"] === "on";

    const existingAddressDoc = await Address.findOne({ userId: user._id });

    const newAddress = {
      addressType,
      firstName,
      lastName,
      city: district,
      landMark: landmark,
      addressLine,
      state,
      pincode,
      email,
      phone,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!existingAddressDoc) {
      newAddress.isDefault = true;

      const newAddressDoc = new Address({
        userId: user._id,
        address: [newAddress]
      });

      await newAddressDoc.save();
      req.session.message = "Address added successfully";
      return res.redirect('/addressbook');
    }

    if (setDefault) {
      existingAddressDoc.address.forEach(addr => addr.isDefault = false); 
      newAddress.isDefault = true;
    } 
    else if (existingAddressDoc.address.length === 0) {
      newAddress.isDefault = true;
    }

    existingAddressDoc.address.push(newAddress);
    await existingAddressDoc.save();

    req.session.message = "Address added successfully";
    return res.redirect('/addressbook');

  } catch (error) {
    console.log('Error on addNewAddress:', error);
    req.session.error = "Failed to add address";
    res.redirect('/pageNotFound');
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
    return res.render('addressFile',{addressDoc:addressDoc ||{address:[]},user})
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

async function loadUserDetails(req,res) {
  try {
    if(!req.session.user){
      return res.redirect('/signin')
    }
    const id= req.session.user._id
    const findUser=await User.findById(id)
    res.render('userProfile',{
      user:findUser
    })
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
    const {password,confirmPassword}=req.body
    if(password!=confirmPassword){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Passwords does not match"})
    }
    const email= req.session.email
    if (!email) {
      return res.status(400).json({ success: false, message: "Session expired. Try again." });
    }
    const findUser= await User.findOne({email})
    if(!findUser){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Cannot find user"})
    }

    const passwordHash= await utils.securePassword(password)
    const user=await User.updateOne({email:email},{$set:{password:passwordHash}})
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

export { loadForgotPassword, verifyEmail, verifyPassOtp, loadOTPpage, loadPasswordReset, resendOtps, resetPassword, loadAbout, loadContact, loadUserDetails, loadAddressBook, loadNewAddress, addNewAddress, loadEditAddress, editAddress, deleteAddress, loadChangeEmailOtp, verifyChangeEmailOtp, newEmail, setNewEmail, loadResetPass, resetPass, updateDetails};
