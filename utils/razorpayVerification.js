import crypto from 'crypto'
import dotenv from 'dotenv';
dotenv.config()

function verifyRazorpaySignature(orderId, paymentId, signature) {
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_API_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    
    return generatedSignature === signature;
}

export {verifyRazorpaySignature}