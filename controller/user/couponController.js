import { STATUS } from "../../utils/statusCode.js";
import {applyCouponService} from "../../services/userService/couponService.js"
import Cart from "../../model/cartSchema.js";
import { logger } from "../../logger/logger.js";


async function applyCoupon(req,res) {
    try {
        console.log('Inside apply coupon');
        
        const userId= req.session.user._id
        const couponCode= req.body.couponCode
        const result=await applyCouponService(couponCode,userId)
        if(!result.success){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Not able to apply coupon"})
        }
        
        return res.status(STATUS.OK).json({success:true,grandTotal:result.grandTotal,discountAmount:result.discountAmount})
    } catch (error) {
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function removeCoupon(req,res) {
    try {        
        const userId= req.session.user._id
        const cart= await Cart.findOne({userId}).populate("items.productId")
        if(!cart){
            return res.status(STATUS.NOT_FOUND).json({success:false,message:"Cart not found"})
        }
        let subTotal=0
        for(let item of cart.items){
            if(!item?.productId?.isBlocked){
                subTotal += item.totalPrice
            }
        }
        cart.grandTotal=subTotal
        cart.discountAmount=0
        await cart.save()

        return res.status(STATUS.OK).json({success:true,message:"Coupon removed",grandTotal:subTotal})

    } catch (error) {
        logger.error("Error on remove coupon",error)
        return res.json(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

export {applyCoupon,removeCoupon}