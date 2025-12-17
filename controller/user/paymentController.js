import { instance } from "../../config/razorpay.js";
import Cart from "../../model/cartSchema.js";
import { STATUS } from "../../utils/statusCode.js";
import crypto from 'crypto'


async function processPayment(req,res) {
    try {
        console.log("inside payment controller");
        
        const userId= req.session.user._id
        const cart=await Cart.findOne({userId}).populate('items.productId')
        if(!cart || cart.items.length==0){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Cart is empty"})
        }        
        let grandTotal=0
        for(let item of cart.items){
            const product= item.productId
            const variant= product?.variants?.[item.variantIndex]
            grandTotal += variant.price * item.quantity

            if(!variant){
                return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Invalid product in cart"})
            }
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
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

export {processPayment}