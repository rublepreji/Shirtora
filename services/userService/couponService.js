import { logger } from "../../logger/logger.js"
import Cart from "../../model/cartSchema.js"
import Coupon from "../../model/couponSchema.js"
import Usercoupon from "../../model/userCouponSchema.js"
import { STATUS } from "../../utils/statusCode.js"

async function removeCouponService(userId) {
  try {
    const cart= await Cart.findOne({userId})
    .populate({
    path: "items.productId",
    populate: [{ path: "category" }, { path: "brand" }]
})
    if(!cart){
      return {status:STATUS.NOT_FOUND, success:false, message:"Cart not found"}
    }
    const filteredProduct= cart.items.filter((item)=>{
        const p = item.productId
        if(!p) return false
        const variant= p.variants[item.variantIndex]
        const isBlocked= p.isBlocked===true || p?.brand?.isBlocked===true || p?.category?.isBlocked===true
        const isStockAvailable= !variant.stock || variant.stock<=0
        const isSufficientStock= item.quantity <= variant.stock
        
        return !isBlocked && !isStockAvailable && isSufficientStock
    })
    let subTotal=0
    for(let item of filteredProduct){
        subTotal += item.totalPrice
    }
    cart.grandTotal=subTotal
    cart.discountAmount=0
    await cart.save()

    return {status:STATUS.OK, success:true, message:"Coupon removed",grandTotal:subTotal}    
  } catch (error) {
    logger.error("Error from couponService",error)
    return {status:STATUS.INTERNAL_SERVER_ERROR, success:false,message:"Internal server error"}
  }
}

async function applyCouponService(couponCode, userId) {
  try {
    if(!couponCode) return {success:false,message:"Enter a coupon code"}

    const cart=await Cart.findOne({userId})
    .populate({
      path: "items.productId",
      populate: [{ path: "category" }, { path: "brand" }]
    })    

    if(!cart || cart.items.length==0){
      return {success:false,message:"Your cart is empty"}
    }

    const filteredProduct= cart.items.filter(item=>{
      const p= item.productId
      if(!p) return false
      const variant= p.variants[item.variantIndex]
      const isBlocked= 
      p.isBlocked===true || p?.brand?.isBlocked===true || p?.category?.isBlocked===true
      
      const isOutOfStock= !variant.stock || variant.stock<=0
      const inSufficientStock= item.quantity <= variant.stock 

      return !isBlocked && !isOutOfStock && inSufficientStock
    })    

    let subtotal=0
    filteredProduct.forEach((item)=>{
      subtotal+=item.pricePerUnit* item.quantity
    })
        
    if(subtotal<=0){
      return {success:false,message:"Your cart contains blocked products only"}
    }

    const today= new Date()

    const coupon= await Coupon.findOne({
      couponCode,
      createdOn:{$lte:today},
      expireOn:{$gte:today},
      minimumPrice:{$lte:subtotal},
      $expr:{$lt:["$usedCount","$totalUsageLimit"]}
    })

    if(!coupon){
      return {success:false,message:"Invalid or expired coupon"}
    } 

    let userCoupon = await Usercoupon.findOne({
      userId,
      couponId:coupon._id
    })

    if(userCoupon && userCoupon.usedCount>= coupon.usageLimitPerUser){
      return {success:false,message:"You have already used this coupon"}
    }

    let discountAmount= Math.floor(subtotal*(coupon.discountPercent/100))

    if(discountAmount>coupon.upto){
      discountAmount=coupon.upto
    }

    const grandTotal= subtotal-discountAmount

    cart.grandTotal=grandTotal
    cart.discountAmount=discountAmount
    cart.appliedCoupon= coupon._id
    await cart.save()

    return {
      success:true,
      grandTotal,
      discountAmount,
      message:"Coupon applied successfully"
    }
    
  } catch (error) {
    logger.error("Error from applyCoupon service",error)
    return {success:false,message:"Something went wrong"}
  }
}

export {
  applyCouponService,
  removeCouponService
}