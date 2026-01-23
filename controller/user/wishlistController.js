import User from "../../model/userSchema.js";
import Product from "../../model/productSchema.js";
import {STATUS} from '../../utils/statusCode.js'
import {logger} from '../../logger/logger.js'
import wishListService from "../../services/userService/wishListService.js";


async function removeFromWishlist(req,res) {
    try {
        const productId= req.params.id                
        const userId= req.session.user?._id
        const result=await wishListService.removeFromWishlistService(productId,userId)
        if(!result.success){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:result.message})
        }
        return res.status(STATUS.OK).json({success:true,message:result.message})
    } catch (error) {
        logger.error('Remove wishlist error',error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}


async function addToWishlist(req,res) {
    try {        
        const productId= req.params.id
        const userId= req.session.user?._id
        if(!userId){
            return res.status(STATUS.UNAUTHORIZED).json({success:false,message:"User not authenticated"})
        }
        if(!productId){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Product is required"})
        }
        const result= await wishListService.addToWishlistService(productId,userId)
        return res.status(result.status).json({success:result.success,message:result.message})
    } catch (error) {
        logger.error('Add wishlist error', error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function loadWishlist(req,res) {
    try {
        const userId= req.session.user._id
        const user= await User.findById(userId)
        const latestProduct= await Product.find({isBlocked:false}).sort({createdAt:-1}).limit(4).lean()
        if(!user || !user.wishlist || user.wishlist.length==0){
            console.log('User not found or wishlist is empty');
            return res.render('wishlist',{products:[],user:req.session.user,latestProduct})
        }
        const product= await Product.find({_id:{$in:user.wishlist}}).populate('category').lean()
        return res.render('wishlist',{
            products:product,
            user,
            latestProduct
        })
    } catch (error) {
        console.error('Error on loading wishlist',error);
        return res.redirect('/pageNotFound')
    }
}


export {loadWishlist, addToWishlist, removeFromWishlist}