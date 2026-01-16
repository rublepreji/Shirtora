import User from "../../model/userSchema.js";
import Address from "../../model/addressSchema.js";
import bcrypt from 'bcrypt'
import * as utils from '../../utils/userUtils.js'
import { logger } from "../../logger/logger.js";




async function findUserService(userId) {
    const user= await User.findOne({_id:userId})
    if(!user.referralCode){
      user.referralCode="REF" + user._id.toString().slice(-6).toUpperCase()
      await user.save()
    }
    return user
}

async function updateUserService(data,user,file) {
    const updateFields={
      firstName:data.firstName,
      lastName:data.lastName,
      phone:data.phone
    }
    if(file){
        const imageUrl=file.path
        updateFields.profileImg=imageUrl
    }
    const updateUser= await User.findByIdAndUpdate(user,{$set:updateFields},{new:true})
    if(!updateUser){
      return {success:false,message:"Not able to update"}
    }
    return {success:true,updateUser}
}

async function resetPassService(user,currentPassword,newPassword) {
    const fetchUser= await User.findOne({_id:user})
    if(!fetchUser){
      return {success:false,message:"User not found"}
    }
    const isMatch=await bcrypt.compare(currentPassword, fetchUser.password)
    if(!isMatch){
      return {success:false,message:"Incorrect Password"}
    }
    const hashedPassword=await utils.securePassword(newPassword)
    fetchUser.password=hashedPassword
    await fetchUser.save()
    return {success:true,message:"Password updated"}
}

async function setNewEmailService(userId,newEmail,confirmEmail) {
    if(newEmail !== confirmEmail){
      return {success:false,message:"Emails do not match!"}
    }
    if(!userId){
      return {success:false,message:"Session expired"}
    }
    await User.findByIdAndUpdate(userId,{email:newEmail})
    return {success:true}
}

async function loadChangeEmailOtpService(user) {
    if (!user) {
      return {success:false,message:"Session expired!"}
    }
    const otp = utils.generateOtp();  
    const email = user.email;
    const emailSent = await utils.sendEmailVerification(email, otp);
    if(!emailSent){
      return {success:false,message:"Not able to send the email"}
    }
    console.log("Otp",otp);
    
    return {success:true,otp,email}
}

async function deleteAddressService(user,addressId) {
    const response=await Address.updateOne(
        {userId:user._id},
        {$pull:{address:{_id:addressId}}}
    )
    if(response.matchedCount==0){
        return {success:false,message:"User Not Found"}
    }
    if(response.modifiedCount==0){
        return {success:false,message:"Address Not found"}
    }
    return {success:true,message:"Address deleted successfully"}
}

async function editAddressService(userId,addressId,addressData) {
    try {
    const addressDoc = await Address.findOne({ userId });
    if(!addressDoc){
        return {success:false,message:"No address record found"}
    }
    const editAddress = addressDoc.address.id(addressId);

    if (!editAddress) {
      return {success:false,message:"Address not found"}
    }

    editAddress.firstName = addressData.firstName;
    editAddress.lastName = addressData.lastName;
    editAddress.addressType = addressData.addressType;
    editAddress.city = addressData.district;
    editAddress.landMark = addressData.landmark;
    editAddress.addressLine = addressData.addressLine;
    editAddress.email = addressData.email;
    editAddress.state = addressData.state;
    editAddress.pincode = addressData.pincode;  
    editAddress.phone = addressData.phone;
    editAddress.updatedAt = new Date();

    if (addressData.setDefault) {
      addressDoc.address.forEach(addr => addr.isDefault = false); 
      editAddress.isDefault = true;
    } 
    await addressDoc.save();
    return {success:true,message:"Address Updated Successfully"}
    } catch (error) {
        return {success:false,message:"Internal server error!"}
    }
}

async function loadEditAddressService(userId,addressId) {
    const addressDoc= await Address.findOne({userId})
    if(!addressDoc){
      return {success:false}
    }
    const selectedAddress=addressDoc.address.id(addressId)
    if(!selectedAddress) return {success:false}
    return {success:true,selectedAddress}
}

async function addNewAddressService(userId,addressData) {
    try {
        const existingAddressDoc = await Address.findOne({ userId });

    const newAddress = {
      addressType:addressData.addressType,
      firstName:addressData.firstName,
      lastName:addressData.lastName,
      city: addressData.district,
      landMark: addressData.landmark,
      addressLine:addressData.addressLine,
      state:addressData.state,
      pincode:addressData.pincode,
      email:addressData.email,
      phone:addressData.phone,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!existingAddressDoc) {
      newAddress.isDefault = true;

      const newAddressDoc = new Address({
        userId,
        address: [newAddress]
      });

      await newAddressDoc.save();
      return {success:true,message:"Address added successfully"}
    }

    if(addressData.setDefault) {
      existingAddressDoc.address.forEach(addr => addr.isDefault = false); 
      newAddress.isDefault = true;
    } 
    else if (existingAddressDoc.address.length === 0) {
      newAddress.isDefault = true;
    }

    existingAddressDoc.address.push(newAddress);
    await existingAddressDoc.save();
    return {success:true,message:"Address added successfully"}
    } catch (error) {
        logger.error(error)
        return {success:false,message:"Internal server error"}
    }
}

async function findAddressService(userId) {
    try {
        return await Address.findOne({userId}) 
    } catch (error) {
        logger.error(error)
        return null
    } 
}

async function findUserByEmail(email) {
    return await User.findOne({email})
}

async function updateUserPassword(email,passwordHash) {
    return await User.updateOne({email:email},{$set:{password:passwordHash}})
}

async function verifyEmailService(email) {
   return await User.findOne({ email: email ,isAdmin:false});
}


export default {
    findUserService,
    updateUserService,
    resetPassService,
    setNewEmailService,
    loadChangeEmailOtpService,
    deleteAddressService,
    editAddressService,
    loadEditAddressService,
    addNewAddressService,
    findAddressService,
    findUserByEmail,
    updateUserPassword,
    verifyEmailService
}