import { STATUS } from "../../utils/statusCode.js";
import {applyCouponService} from "../../services/userService/couponService.js"
import Cart from "../../model/cartSchema.js";
import { logger } from "../../logger/logger.js";
import {removeCouponService} from "../../services/userService/couponService.js"


async function applyCoupon(req,res) {
    try {                
        const userId= req.session.user._id
        const couponCode= req.body.couponCode        
        const result=await applyCouponService(couponCode,userId)
        if(!result.success){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:result.message ||"Not able to apply coupon"})
        }
        return res.status(STATUS.OK).json({success:result.success,grandTotal:result.grandTotal,discountAmount:result.discountAmount,message:result.message})
    } catch (error) {
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function removeCoupon(req,res) {
    try {        
        const userId= req.session.user._id
        const result = await removeCouponService(userId)
        return res.status(result.status).json({success:result.success,message:result.message,grandTotal:result.grandTotal})
    }
     catch (error) {
        logger.error("Error on remove coupon",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

export {applyCoupon,removeCoupon}