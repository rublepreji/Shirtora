import { verifyRazorpaySignature} from "../../utils/razorpayVerification.js";
import Order from "../../model/orderSchema.js"
import Product from "../../model/productSchema.js";
import { STATUS } from "../../utils/statusCode.js";
import Cart from "../../model/cartSchema.js"
import { logger } from "../../logger/logger.js";
import mongoose from "mongoose";
import { instance } from "../../config/razorpay.js";




async function retryVerifyPaymentService(orderId,razorpay_payment_id,razorpay_order_id,razorpay_signature) {
    const session = await mongoose.startSession()
    try {
        session.startTransaction()
        if(!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature){
            throw {status:STATUS.BAD_REQUEST,success:false, message:"Invalid payment data"}
        }
        const isValid= verifyRazorpaySignature(razorpay_order_id,razorpay_payment_id,razorpay_signature)
        if(!isValid){
            throw {status:STATUS.BAD_REQUEST, success:false, message:"Payment verification failed"}
        }
        const order= await Order.findOne({orderId,paymentStatus:"Failed"}).session(session)
        if(!order){
            throw {status:STATUS.NOT_FOUND, success:false, message:"Order not found"}
        }
        order.paymentStatus="Paid"
        order.status="Pending"
        order.razorpayPaymentId= razorpay_payment_id
        order.razorpaySignature= razorpay_signature

        await order.save({session})

        //reduce stock
        for(let item of order.items){
            const product=await Product.findById(item.productId).session(session)
            if(!product) continue;
            const variant=product.variants[item.variantIndex]
            if(!variant) continue;
            if(variant.stock < item.quantity){
                throw {status:STATUS.BAD_REQUEST, message:"Insufficient stock"}
            }
            variant.stock-=item.quantity
            await product.save({session})
        }       
    //remove cart
    await Cart.updateOne({userId:order.userId},{$set:{items:[]}}).session(session)
    await session.commitTransaction()
    session.endSession()
    return {status:STATUS.OK, success:true}
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        logger.error("Error form retryverify payment service",error)
        return {status:STATUS.INTERNAL_SERVER_ERROR, success:false, message:"Internal server error"}
    }
}

async function retryCreateOrderService(orderId, userId) {
    try {
        const order= await Order.findOne({
            orderId,
            userId,
            paymentStatus:"Failed"
        })
        if(!order){
            return {status:STATUS.NOT_FOUND,success:false, message:"Order not found"}
        }
        if(order.paymentStatus=="Paid"){
            return {status:STATUS.BAD_REQUEST,success:false, message:"Payment already completed"}
        }
        const razorpayOrder= await instance.orders.create({
            amount:Math.round(order.offerAmount*100),
            currency:"INR",
            receipt:order.orderId
        })
        order.razorpayOrderId= razorpayOrder.id
    
        order.paymentFailureReason=null
        
        await order.save()
        return {
            success:true,   
            status:STATUS.OK,
            razorpayOrderId:razorpayOrder.id,
            amount:razorpayOrder.amount,
            currency:razorpayOrder.currency,
            message:"success"
        }
    } catch (error) {
        logger.error("Error from retry create order service",error)
        return {status:STATUS.INTERNAL_SERVER_ERROR, success:false, message:error.message || "Internal server error"}
    }
}

async function processPaymentService(userId) {
    try {
            const cart=await Cart.findOne({userId}).populate({
            path:'items.productId',
            populate:[
                {path:"category"},{path:"brand"}
            ]
        })        
        if(!cart || cart.items.length==0){
            return {status:STATUS.BAD_REQUEST, success:false,message:"Cart is empty"}
        }  
        
        const filteredProduct= cart.items.filter((item)=>{
            const p= item.productId
            if(!p) return false
            const variant= p.variants[item.variantIndex]
            const isBlocked= p?.isBlocked===true || p?.brand?.isBlocked===true || p?.category?.isBlocked===true
            const isStockAvailable= !variant?.stock || variant.stock<=0
            const stockAvailable= item.quantity <= p.variants[item.variantIndex].stock
            return !isBlocked && !isStockAvailable && stockAvailable
        })

        if(filteredProduct.length ===0){
            return {
                status: STATUS.BAD_REQUEST,
                success:false,
                message:"No valid products in cart"
            }
        }
              
        let grandTotal=0
        for(let item of filteredProduct){
            const product= item.productId
            const variant= product?.variants?.[item.variantIndex]
            grandTotal += item.pricePerUnit * item.quantity

            if(!variant){
                return {status:STATUS.BAD_REQUEST, success:false , message:"Invalid product in cart"}
            }
        }                
        if(cart.discountAmount>0){
            grandTotal-=cart.discountAmount
        }
        const amountInPaisa= Math.round(grandTotal*100)        
        const options={
            amount:amountInPaisa,
            currency:"INR",
            receipt: "order_rcptid_" + Date.now()
        }
        const order= await instance.orders.create(options)        
        return {
            status:STATUS.OK,
            success:true,
            message:"success",
            orderId:order.id,
            amount:order.amount,
            currency:order.currency
        }
    } catch (error) {
        return {success:false, status:error.status||STATUS.INTERNAL_SERVER_ERROR, message:error.message||"Internal server error"}
    }
}

export {
    retryVerifyPaymentService,
    retryCreateOrderService,
    processPaymentService
}