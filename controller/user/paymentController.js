import { STATUS } from "../../utils/statusCode.js";
import { logger } from "../../logger/logger.js";
import { retryVerifyPaymentService, retryCreateOrderService, processPaymentService } from "../../services/userService/paymentService.js";



async function retryVerifyPayment(req,res) {
    try {        
        const {orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature}= req.body
        const result = await retryVerifyPaymentService(orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature)
        return res.status(result.status).json({success:result.success,message:result.message})
    } catch (error) {
        logger.error("RetryVerifyPayment error",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function retryCreateOrder(req,res) {
    try {        
        const {orderId}= req.body
        const userId= req.session.user._id
        const result= await retryCreateOrderService(orderId, userId)
        return res.status(result.status).json({success:result.success, message:result.message, razorpayOrderId:result.razorpayOrderId, amount:result.amount, currency:result.currency})
    } catch (error) {
        logger.error("retryCreateOrder",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function processPayment(req,res) {
    try {                
        const userId= req.session.user._id
        const result= await processPaymentService(userId)
        return res.status(result.status).json({success:result.success, message:result.message, orderId:result.orderId, amount:result.amount, currency:result.currency})
    } catch (error) {
        logger.error("Error from process payment",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

export {processPayment, retryCreateOrder, retryVerifyPayment}