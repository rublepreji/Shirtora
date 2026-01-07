import { logger } from "../../logger/logger.js"
import Cart from "../../model/cartSchema.js"
import Coupon from "../../model/couponSchema.js"
import Usercoupon from "../../model/userCouponSchema.js"

async function applyCouponService(couponCode, userId) {
  try {
    if(!couponCode) return {success:false,message:"Enter a coupon code"}

    const cart=await Cart.findOne({userId})
    .populate("items.productId")

    if(!cart || cart.items.length==0){
      return {success:false,message:"Your cart is empty"}
    }

    let subtotal=0
    cart.items.forEach((item)=>{
      if(!item.productId?.isBlocked){
        subtotal+=item.pricePerUnit* item.quantity
      }
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

export {applyCouponService}