import User from "../../model/userSchema.js"
import Product from "../../model/productSchema.js"
import { STATUS } from "../../utils/statusCode.js"




async function removeFromCart(req,res) {
    try {
        const productId= req.params.id
        const userId= req.session.user._id
        if (!req.session.user || !req.session.user._id) {
        return res.status(STATUS.UNAUTHORIZED).json({ success: false, message: "User not authenticated." });
        }
        const result= await User.updateOne({_id:userId},{$pull:{cart:productId}})
        if(result.modifiedCount==0){
            return res.status(STATUS.NOT_FOUND).json({ success: false, message: "Product not found in cart." });
        }
        return res.status(STATUS.OK).json({success:true,message:"Product removed from cart"})
    } catch (error) {
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function addToCart(req,res) {
    try {
        const productId= req.params.id
        const userId= req.session.user._id
        const user= await User.findById(userId)
        if(user.cart.includes(productId)){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Product already in cart"})
        }
        user.cart.push(productId)
        await user.save()
        return res.status(STATUS.OK).json({success:true,message:"Product added to cart"})
    } catch (error) {
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:true,message:"Internal server error"})
    }
} 

async function loadCart(req,res) {
    try {
        const userId= req.session.user._id
        const user= await User.findById(userId)
        if(!user || !user.cart || user.cart.length==0){
            console.log('user or cart is empty');
            return res.render('cart',{products:[],user:req.session.user})
        }
        const product= await Product.find({_id:{$in:user.cart}}).populate('category').lean()
        return res.render('cart',{
            products:product,
            user:user
        })
    } catch (error) {
        console.error('Error on loading cart',error)
        res.redirect('/pageNotFound')
    }
}



export {loadCart, addToCart, removeFromCart}