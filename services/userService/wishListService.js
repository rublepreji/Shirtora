import User from "../../model/userSchema.js";
import {STATUS} from "../../utils/statusCode.js"


async function removeFromWishlistService(productId,userId) {
    try {
        if (!userId) {
        return { success: false, message: "User not authenticated." }
        }
        if(!productId){
            return {success:false, message:"Product Id is required"}
        }
        const result= await User.updateOne({_id:userId},{$pull:{wishlist:productId}})
        if(result.modifiedCount==0){
            return { success: false, message: "Product not found in wishlist." }
        }
        return {success:true,message:"Product removed from wishlist"}
    } catch (error) {
        logger.error("RemoveFromWishlistService error",error)
        throw error
    }
}

async function addToWishlistService(productId,userId) {
    try {
        const user= await User.findById(userId)
        if(user.wishlist.includes(productId)){
            user.wishlist=user.wishlist.filter(id=>
                id.toString() !== productId.toString()
            )
            await user.save()
            return {success:false,message:"Product removed from wishlist"}
        }
        user.wishlist.push(productId)
        await user.save()
        return {success:true,message:"Product added to wishlist"}
    } catch (error) {
        logger.error("Add to wishlist service error",error)
        throw error
    }
}



export default {
    removeFromWishlistService,
    addToWishlistService
}