import User from "../../model/userSchema.js";
import Product from "../../model/productSchema.js";
import {STATUS} from '../../utils/statusCode.js'
import {logger} from '../../logger/logger.js'



async function removeFromWishlist(req,res) {
    try {
        const productId= req.params.id
        console.log(productId);
        
        const userId= req.session.user._id
        if (!req.session.user || !req.session.user._id) {
        return res.status(STATUS.UNAUTHORIZED).json({ success: false, message: "User not authenticated." });
        }
        const result= await User.updateOne({_id:userId},{$pull:{wishlist:productId}})
        if(result.modifiedCount==0){
            return res.status(STATUS.NOT_FOUND).json({ success: false, message: "Product not found in wishlist." });
        }
        return res.status(STATUS.OK).json({success:true,message:"Product removed from wishlist"})
    } catch (error) {
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}


async function addToWishlist(req,res) {
    try {        
        const productId= req.params.id
        const userId= req.session.user._id
        const user= await User.findById(userId)
        if(user.wishlist.includes(productId)){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Product already in wishlist"})
        }
        user.wishlist.push(productId)
        await user.save()
        return res.status(STATUS.OK).json({success:true,message:"Product added to wishlist"})
    } catch (error) {
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