import mongoose from "mongoose";

const userCouponSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    couponId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Coupon",
        required:true
    },
    usedCount:{
        type:Number,
        default:0
    }
})

const Coupon= mongoose.model("Usercoupon",userCouponSchema)
export default Coupon