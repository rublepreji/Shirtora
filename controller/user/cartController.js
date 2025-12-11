import Cart from "../../model/cartSchema.js";
import User from "../../model/userSchema.js";
import Product from "../../model/productSchema.js";
import { STATUS } from "../../utils/statusCode.js";
import {logger} from '../../logger/logger.js'
import cartService from "../../services/userService/cartService.js";

async function addToCart(req, res) {
  try {
    const userId = req.session.user._id;
    const { productId, variantIndex, qty } = req.body;
    const quantity = Number(qty);
    const result = await cartService.addToCartService(userId, productId, variantIndex, quantity);
    return res.status(result.status).json({
      success: result.success,
      message: result.message
    });
  } catch (err) {
    console.error(err);
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