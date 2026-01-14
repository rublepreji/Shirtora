import dotenv from 'dotenv';
import * as utils from '../../utils/userUtils.js';
import {generateOtp,sendEmailForgotPassword} from '../../utils/userUtils.js'
import {STATUS} from '../../utils/statusCode.js'
dotenv.config();
import {logger} from '../../logger/logger.js'
import profileService from '../../services/userService/profileService.js'
import Address from '../../model/addressSchema.js';

  async function updateUserProfile(req,res) {
    try {
      const userId= req.session.user._id
      const user= await profileService.findUserService(userId)
      res.render('updateUserDetails',user)
    } catch (error) {
      return res.redirect('/pageNotFound')
    }
  }

async function updateDetails(req,res) {
  try {    
    const data= req.body
    const userId= req.session.user._id
    const file= req.file
    const result=await profileService.updateUserService(data,userId,file)
    if(!result.success){
      return res.status(STATUS.BAD_REQUEST).json(result)
    }
    req.session.user=result.updateUser
    return res.status(STATUS.OK).json({success:true ,message:"Updated successfully"})
  } catch (error) { 
    logger.error('update details',error)
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal from server error"})
  }
}

async function resetPass(req,res) {
  try {
    const {currentPassword, newPassword}= req.body
    const user= req.session.user?._id
    if(!user){
      req.flash('error','Session expired')
      return res.redirect('/userProfile')
    }    
    const result= await profileService.resetPassService(user,currentPassword,newPassword)
    if(!result.success){
      req.flash("error",result.message)
      return res.redirect('/resetpass')
    }
    req.flash('success','Password updated successfully')
    return res.redirect('/userProfile')
  } catch (error) {
    req.flash('error','Internal server error')
    res.redirect('/pageNotFound')
  }
}

async function loadResetPass(req,res) {
  try {
    return res.render('resetPassword')
  } catch (error) {
    return res.redirect('/pageNotFound')
  }
}

async function setNewEmail(req,res) {
  try {
    const {newEmail,confirmEmail}= req.body
    const userId= req.session.user._id
    const result= await profileService.setNewEmailService(userId,newEmail,confirmEmail)
    if(!result.success){
      req.flash('error',result.message)
      return res.redirect('/loadnewemail')
    }
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

   req.flash('error', 'Invalid OTP');
   return res.redirect('/userProfile');
}


async function loadChangeEmailOtp(req, res) {
  try {
    const user = req.session.user;
    const result= await profileService.loadChangeEmailOtpService(user)
    if(!result.success){
      req.flash('error', result.message);
      return res.redirect('/pageNotFound');
    }
    if (result.success) {
      req.session.changeEmailOtp = result.otp;    
      req.session.currentEmail = result.email;     
      return res.render('changeEmailOtp')
    } 
    else {
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Failed to send OTP. Please try again."})
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
    const result= await profileService.deleteAddressService(user,addressId)
    if(!result.success){
     return res.status(STATUS.NOT_FOUND).json({success:false,message:result.message})
    }
    return res.status(STATUS.OK).json({success:true,message:result.message})
  } catch (error) {
    logger.error('Error on delete address',error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false})
  }
}

async function editAddress(req, res) {
  try {
    const user = req.session.user;
    const addressId = req.params.addressId;
    const body= req.body
    const setDefault= body["set-default"]==="on"
    if (!user) return res.redirect('/signin');

    const addressData={
      firstName:body["first-name"],
      lastName :body["last-name"],
      email :body.email,
      district: body.district,
      addressLine :body["address-line"],
      state:body.state,
      landmark:body.landmark,
      pincode: body["pin-code"],
      phone:body.phone,
      addressType: body["address-type"],
      setDefault
    }
    const result= await profileService.editAddressService(user._id,addressId, addressData)
    if(!result.success){
      req.session.message=result.message
      return res.redirect('/addressbook');
    }
    req.session.message = result.message;
    return res.redirect("/addressbook");

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
    const result= await profileService.loadEditAddressService(user._id,addressId)
    if(!result.success){
      return res.redirect('/addressbook')
    }
    return res.render("editAddress",{address:result.selectedAddress})
  } catch (error) {
    return res.redirect('/pageNotFound')
  }
}

async function addNewAddress(req, res) {
  try {
    const user = req.session.user;
    const body= req.body
    const setDefault= body["set-default"]=="on"
    if (!user) return res.redirect('/signin');

    const addressData= {
      firstName:body["first-name"],
      lastName:body["last-name"],
      email:body.email,
      phone:body.phone,
      addressLine:body["address-line"],
      district:body.district,
      state:body.state,
      landmark:body.landmark,
      pincode:body["pin-code"],
      addressType:body["address-type"],
      setDefault
    };

    const result= await profileService.addNewAddressService(user._id,addressData)
    if(!result.success){
      req.session.message= result.message
      return res.redirect('/addressbook')
    }
    req.session.message = result.message;
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
      return res.render('addressFile',{user})
    } catch (error) {
      logger.error("Error from loadAddressBook",error)
      return res.redirect('/pageNotFound')
    }
  }

  async function fetchAddress(req,res) {
    try {
      console.log("hitted fetchaddress");
      
      const page= Number(req.query.page) || 1 
      const userId= req.session.user._id
      const limit =4
      const skip= (page-1)*limit
      const addressDoc= await Address.findOne({userId})
      if(!addressDoc){
        return res.status(STATUS.NOT_FOUND).json({
        success:false,
        addressDoc:[],
        currentPage:1,
        totalPages:1})
      }
      const sorted= addressDoc.address.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
      const totalAddress=sorted.length
      const totalPages= Math.ceil(totalAddress/limit)
      const paginated= sorted.slice(skip,skip+limit)
      return res.status(STATUS.OK).json({
        success:true,
        addressDoc:paginated,
        currentPage:page,
        totalPages
      })
    } catch (error) {
      logger.error("Error from fetchAddress",error)
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
  }

async function loadUserDetails(req,res) {
  try {
    if(!req.session.user){
      return res.redirect('/signin')
    }
    const id= req.session.user._id
    const findUser=await profileService.findUserService(id)
    return res.render('userProfile',{
      user:findUser
    })
  } catch (error) {
    logger.error("Error from loadUserDetails",error)
    return res.redirect("/pageNotFound")
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
      return res.status(STATUS.BAD_REQUEST).json({ success: false, message: "Session expired. Try again." });
    }
    const findUser= await profileService.findUserByEmail(email)
    if(!findUser){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Cannot find user"})
    }

    const passwordHash= await utils.securePassword(password)
    const user=await profileService.updateUserPassword(email,passwordHash)
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
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function loadPasswordReset(req,res) {
  try {
    res.render('passwordReset')
  } catch (error) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function verifyPassOtp(req, res) {
  try {
    const { otp } = req.body;
    
    if(req.session.Otp==otp){
      return res.status(STATUS.OK).json({success:true,message:"OTP verified"})
    }
    else{
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"OTP not matching"})
    }
  } catch (error) {
    console.error('Error verifying password OTP:', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"An error occured. Please try again"})
  }
}

async function verifyEmail(req, res) {
  try {
    const { email } = req.query;
    console.log('entered email',email);
    
    const findUser = await profileService.verifyEmailService(email)
    if (findUser) {
      const otp = utils.generateOtp();
      const emailSent =await utils.sendEmailForgotPassword(email, otp);
      if (emailSent) {
        console.log('success');
        
        req.session.Otp = otp;
        req.session.email = email;
        console.log('Forgot OTP:', otp);
        return res.status(STATUS.OK).json({success:true})
      } else {
        return res
          .status(STATUS.BAD_REQUEST)
          .json({ success: false, message: 'Failed to send OTP. Please try again' });
      }
    } else {
      return res.status(STATUS.BAD_REQUEST).json({ success: false, message: 'User does not exist' });
    }
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"});
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

export { 
  loadForgotPassword, 
  verifyEmail, 
  verifyPassOtp, 
  loadOTPpage, 
  loadPasswordReset, 
  resendOtps, 
  resetPassword, 
  loadAbout, 
  loadContact, 
  loadUserDetails, 
  loadAddressBook, 
  fetchAddress,
  loadNewAddress, 
  addNewAddress, 
  loadEditAddress, 
  editAddress, 
  deleteAddress, 
  loadChangeEmailOtp, 
  verifyChangeEmailOtp, 
  newEmail, 
  setNewEmail, 
  loadResetPass, 
  resetPass, 
  updateDetails, 
  updateUserProfile
};
