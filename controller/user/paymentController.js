import { instance } from "../../config/razorpay.js";
import Cart from "../../model/cartSchema.js";
import { STATUS } from "../../utils/statusCode.js";
import Order from "../../model/orderSchema.js"
import { logger } from "../../logger/logger.js";
import Product from "../../model/productSchema.js"
import { verifyRazorpaySignature} from "../../utils/razorpayVerification.js";


async function retryVerifyPayment(req,res) {
    try {        
        const {orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature}= req.body
        if(!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature){
            return res.json({success:false,message:"Invalid payment data"})
        }
        const isValid= verifyRazorpaySignature(razorpay_order_id,razorpay_payment_id,razorpay_signature)
        if(!isValid){
            return res.json({success:false,message:"Payment verification failed"})
        }
        const order= await Order.findOne({orderId,paymentStatus:"Failed"})
        if(!order){
            return res.status(STATUS.NOT_FOUND).json({success:false,message:"Order not found"})
        }
        order.paymentStatus="Paid"
        order.status="Pending"
        order.razorpayPaymentId= razorpay_payment_id
        order.razorpaySignature= razorpay_signature

        await order.save()

        //reduce stock
        for(let item of order.items){
            const product=await Product.findById(item.productId)
            if(!product) continue;
            const variant=product.variants[item.variantIndex]
            if(!variant) continue;
            variant.stock-=item.quantity
            await product.save()
        }       

    //remove cart
    await Cart.updateOne({userId:order.userId},{$set:{items:[]}})
    return res.status(STATUS.OK).json({success:true})
    } catch (error) {
        logger.error("RetryVerifyPayment error",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function retryCreateOrder(req,res) {
    try {
        const {orderId}= req.body
        const userId= req.session.user._id

        const order= await Order.findOne({
            orderId,
            userId,
            paymentStatus:"Failed"
        })
        if(!order){
            return res.json({success:false,message:"Order not found"})
        }
        if(order.paymentStatus=="Paid"){
            return res.json({success:false,message:"Payment already completed"})
        }
        const razorpayOrder= await instance.orders.create({
            amount:Math.round(order.offerAmount*100),
            currency:"INR",
            receipt:order.orderId
        })
        order.razorpayOrderId= razorpayOrder.id
    
        order.paymentFailureReason=null
        
        await order.save()
        return res.json({
            success:true,
            razorpayOrderId:razorpayOrder.id,
            amount:razorpayOrder.amount,
            currency:razorpayOrder.currency
        })
    } catch (error) {
        logger.error("retryCreateOrder",error)
        return res.json({success:false,message:"Internal server error"})
    }
}

async function processPayment(req,res) {
    try {                
        const userId= req.session.user._id
        const cart=await Cart.findOne({userId}).populate({
            path:'items.productId',
            populate:[
                {path:"category"},{path:"brand"}
            ]
        })        
        if(!cart || cart.items.length==0){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Cart is empty"})
        }  
        
        const filteredProduct= cart.items.filter((item)=>{
            const p= item.productId
            if(!p) return false
            const variant= p.variants[item.variantIndex]
            const isBlocked= p?.isBlocked===true || p?.brand?.isBlocked===true || p?.category?.isBlocked===true
            const isStockAvailable= !variant?.stock || variant.stock<=0
            const stockAvailable= item.quantity < p.variants[item.variantIndex].stock
            return !isBlocked && !isStockAvailable && stockAvailable
        })
              
        let grandTotal=0
        for(let item of filteredProduct){
            const product= item.productId
            const variant= product?.variants?.[item.variantIndex]
            grandTotal += item.pricePerUnit * item.quantity

            if(!variant){
                return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Invalid product in cart"})
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
        return res.status(STATUS.OK).json({
            success:true,
            orderId:order.id,
            amount:order.amount,
            currency:order.currency
        })
    } catch (error) {
        logger.error("Error from process payment",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

export {processPayment, retryCreateOrder, retryVerifyPayment}