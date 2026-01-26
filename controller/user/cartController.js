import { STATUS } from "../../utils/statusCode.js";
import {logger} from '../../logger/logger.js'
import cartService from "../../services/userService/cartService.js";
import Product from "../../model/productSchema.js";
import userService from '../../services/userService/userService.js'

async function addToCart(req,res) {
  try {
    console.log("inside the controller");
    
    const userId = req.session.user._id;
    console.log(userId);
    
    if(!userId){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Please login to add items in cart"})
    }
    const { productId, variantIndex, qty } = req.body;
    const quantity = Number(qty);
    const product= await Product.findById(productId)
    const {offer,offerSource,orginalPrice,discountAmount,finalPrice}= await userService.offerCalculation(product,variantIndex)
    const result = await cartService.addToCartService(userId, productId, variantIndex, quantity, finalPrice);

    return res.status(result.status).json({
      success: result.success,
      message: result.message
    });
  } catch (err) {
    logger.error(err);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
}

 async function updateCartQty(req, res) {
  try { 
    const { productId, variantIndex, qty } = req.body;
    const userId = req.session.user._id;
    const result = await cartService.updateCartQtyService(userId, productId, variantIndex, qty);
    return res.json(result);
  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
}

async function removeFromCart(req, res) {
  try {
    const userId = req.session.user._id;
    const { productId, variantIndex } = req.body; 
    const result= await cartService.removeCartService(userId,productId,variantIndex)
    return res.json(result);
  } catch (err) {
    return res.json({ success: false });
  }
}

 async function loadCart(req, res) {
  try {
    const userId = req.session.user._id;
    const {products,grandTotal}=await cartService.loadCartService(userId)
    return res.render("cart", {
      products,
      user: req.session.user,
      grandTotal
    });
  } catch (err) {
    console.log(err);
    return res.redirect("/pageNotFound");
  }
}

export {loadCart, addToCart, removeFromCart, updateCartQty}