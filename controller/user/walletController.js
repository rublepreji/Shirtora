import Wallet from "../../model/walletSchema.js"
import Transaction from "../../model/transactionSchema.js"
import { instance } from "../../config/razorpay.js"
import dotenv from "dotenv"
import { logger } from "../../logger/logger.js"
import { STATUS } from "../../utils/statusCode.js"
import {verifyRazorpaySignature} from "../../utils/razorpayVerification.js"
import {placeOrderWithWallet} from "../../services/userService/walletService.js"


async function walletPay(req,res) {
    try {
        const userId= req.session.user._id
        const {selectedAddressIndex}= req.body

        const result = await placeOrderWithWallet(userId,selectedAddressIndex)
        if(!result.success){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:result.message})
        }
        return res.status(STATUS.OK).json({success:true,message:result.order})
    } catch (error) {
        console.log("Error from WalletPay",error);
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function walletPaymentVerify(req,res) {
    try {
        const{
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        }=req.body
        const verify= verifyRazorpaySignature(razorpay_order_id,razorpay_payment_id,razorpay_signature)
        if(!verify){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Wrong payment"})
        }
        await Wallet.updateOne(
            {userId:req.session.user._id},
            {$inc:{balance:Number(req.body.amount)}}
        )
        await Transaction.create({
            userId:req.session.user._id,
            amount:req.body.amount,
            type:"CREDIT",
            source:"WALLET_USAGE"
        })
        return res.status(STATUS.OK).json({success:false})
    } catch (error) {
        logger.error("walletPaymentVerify",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function walletAddMoney(req,res) {
    try {
        const {amount}=req.body
        const order= await instance.orders.create({
            amount:amount*100,
            currency:"INR",
            receipt:"wallet"+Date.now()
        })
        return res.json({
            orderId:order.id,
            amount,
            key:process.env.RAZORPAY_API_KEY
        })
    } catch (error) {
        logger.error('Error on wallAndMoney',error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Error creating order"})
    }
}

async function loadWallet(req,res) {
    try {
        let userId= req.session.user._id
        const wallet=await Wallet.findOne({userId})
        const transaction= await Transaction.find({userId})

        res.render('wallet',{balance:wallet.balance,transaction})
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

async function fetchWalletTx(req,res) {
    try {
        let userId= req.session.user._id
        const page= req.query.page
        const limit=8
        const skip= (page-1)*limit

        const totalTrans= await Transaction.countDocuments({userId})
        const totalPages= Math.ceil(totalTrans/limit)
        const transaction= await Transaction.find({userId})
        .sort({createdAt:-1}).skip(skip).limit(limit)

        return res.status(STATUS.OK).json({
            success:true,
            transaction,
            currentPage:page,
            totalPages
        })
    } catch (error) {
        logger.error("Error from fetchWallet",error)
        return res.json({success:false,message:"Internal server error"})
    }
}

export {
    loadWallet,
    walletAddMoney,
    walletPaymentVerify,
    walletPay,
    fetchWalletTx
}