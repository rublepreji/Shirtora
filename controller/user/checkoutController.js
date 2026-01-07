import {STATUS} from '../../utils/statusCode.js'
import {updateStatus} from "../../helpers/updateOrderStatus.js"
import {logger} from '../../logger/logger.js'
import checkoutService from "../../services/userService/checkoutService.js";
import {verifyRazorpaySignature} from '../../utils/razorpayVerification.js'
import Order from '../../model/orderSchema.js';
import mongoose from 'mongoose';
import {creditWallet} from "../../services/userService/walletService.js"
import Product from '../../model/productSchema.js';
import orderService from '../../services/adminService/orderService.js';


async function cancelItem(req,res) {
  try {
    const {orderId,itemIndex}= req.body
    console.log("Hit the cancel item",orderId, itemIndex);
    
    if(!orderId || itemIndex===undefined){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Invalid request"})
    }
    const order= await Order.findOne({orderId})
    if(!order){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Order not found"})
    }
    if(order.status==="Cancelled"){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Order is already cancelled"})
    }
    const item = order.items[itemIndex]

    if(!item){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Item not found"})
    }
    if(item.itemStatus==="Delivered"){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Delivered item cannot be cancelled"})
    }
    if(item.itemStatus==="Return-Approved"){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Returned item cannot be cancelled"})
    }
    if(item.itemStatus==="Cancelled"){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Item already cancelled"})
    }
    item.itemStatus="Cancelled"
    console.log(item.productId);
    
    const product=await Product.findById(item.productId)
    
    product.variants[item.variantIndex].stock+=item.quantity
    await product.save()

    order.status= await orderService.determineOrderStatusFromItems(order.items)

    // if(order.paymentStatus==="Paid"){
    //   order.paymentStatus="Pending"
    // }
    await order.save()
    return res.status(STATUS.OK).json({success:true,message:"Item cancelled successfully"})
  } catch (error) {
    logger.error("Error from cancel item",error)
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function handlePaymentFailed(req, res) {
  
  try {
    const { orderId, reason, selectedAddressIndex,  } = req.body;
    const userId = req.session.user._id
    
    const result= await checkoutService.createFailedPaymentOrder(userId,reason,orderId,selectedAddressIndex,paymentMethod)

    return res.json({ success: result.success }); 
  } catch (error) {
    console.error("Payment failed handler error:", error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error handling payment failure" });
  }
}

async function returnRequest(req,res) {
  try {
    const { orderId, productIndex, reason, newStatus } = req.body;        
    const result=await checkoutService.returnRequestService(orderId,productIndex,reason,newStatus)
    return res.json(result)
  } catch (error) {
    return res.json({ success: false });
  }
}

async function cancelOrder(req,res) {  
  const session= await mongoose.startSession()
  try {
    session.startTransaction()
    const {orderId,newStatus}= req.body
    
    const order= await Order.findOne({orderId}).session(session)

    if(!order){
      await session.abortTransaction()
      session.endSession()
      return res.status(STATUS.BAD_REQUEST) .json({success:false,message:"Order not found"})
    }

    if(newStatus!=="Cancelled"){
      await session.abortTransaction()
      session.endSession()
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Invalid status update"})
    }

    if (order.status === "Cancelled") {
      await session.abortTransaction()
      session.endSession()
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "Order already cancelled"
      });
    }
    order.status= newStatus
    await order.save({session})

    
    await checkoutService.cancelOrderStockUpdateService(orderId,session)

    const paymentMethod= order.paymentMethod?.trim()
    const paymentStatus= order.paymentStatus?.trim()

    console.log(paymentMethod,paymentStatus);
    

    if(paymentMethod!=="COD" && paymentStatus==="Paid"){
      await creditWallet({
        userId:order.userId,
        amount:order.offerAmount,
        orderId:order._id,
        source:"ORDER_REFUND",
        reason:"Refund for cancelled order",
        session
      })
    }
    await session.commitTransaction()
    session.endSession()

    return res.status(STATUS.OK).json({success:true,message:"Order cancelled and refund processed"})
  } catch (error) {
    logger.error("Error on cancel order controller",error)
    await session.abortTransaction()
    session.endSession()
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function downloadInvoice(req, res) {
  try {
    const orderId = req.params.id;
    const doc= await checkoutService.downloadInvoiceService(orderId)
    if(!doc){
      return res.status(STATUS.NOT_FOUND).send("Order not found")
    }
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${orderId}.pdf`
    )
    res.setHeader("Content-Type","application/pdf")
    doc.pipe(res)
    doc.end();

  } catch (error) {
   console.log("Invoice Error:", error);
    if (!res.headersSent) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).send("Server error");
    }
  }
}

async function loadOrderList(req, res) {
  try {
    return res.render("orderList", { user: req.session.user });
  } catch (error) {
    return res.redirect("/pageNotFound");
  }
}

async function loadOrderListData(req, res) {
  try {
    let search = req.query.search || "";
    let page = parseInt(req.query.page) || 1;
    const userId = req.session.user?._id;
    const {totalPages,orders}= await checkoutService.loadOrderListService(userId,page,search)
    return res.json({
      success: true,
      orders,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    logger.error(err);
    return res.json({ success: false });
  }
}

async function loadOrderDetails(req,res) {
  try {
    const orderId = req.params.id
    const result=await checkoutService.getOrderDetailsService(orderId)
    if(!result.success){
      return res.redirect('/pageNotFound')
    }
    return res.render('orderDetails',{
      user:req.session.user,
      products:result.products,
      order:result.order
    })
  } catch (error) {
    return res.redirect('/pageNotFound')
  }
}

async function loadOrderFailed(req,res) {
   try {
      return res.render('orderFailed')
   } catch (error) {
      return res.redirect('/pageNotFound')
   }
}

async function orderSuccessPage(req,res) {
   try {
      const orderId= req.params.id
      return res.render  ('orderSuccess',{orderId:orderId})
   } catch (error) {
      return res.redirect('/pageNotFound')
   }
}


async function placeOrder(req, res) {
  try {     
    const userId = req.session.user._id;
    const { 
      selectedAddressIndex, 
      paymentMethod,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;     

    let normalizedPaymentMethod;

    if (paymentMethod === "UPI Method") {
      normalizedPaymentMethod = "UPI";
    } else if (paymentMethod === "Cash On Delivery") {
      normalizedPaymentMethod = "COD";
    } else {
      normalizedPaymentMethod = paymentMethod?.trim();
    }

    if (!selectedAddressIndex) { 
      return res.status(STATUS.BAD_REQUEST).json({ 
        success: false, 
        message: "No address selected" 
      });
    } 
    
    if (!normalizedPaymentMethod) { 
      return res.status(STATUS.BAD_REQUEST).json({ 
        success: false, 
        message: "No payment method selected"
      }); 
    }
    
    // UPI payment
    if (normalizedPaymentMethod === "UPI") {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid payment data"
        });
      }
        
        const isValid = verifyRazorpaySignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        );
        
        if (!isValid) {
          return res.status(STATUS.BAD_REQUEST).json({
            success: false,
            message: "Payment verification failed"
          });
        }
        
        // Payment verified
        const razorpayData = {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature
        };  
        
        const result = await checkoutService.placeOrderService(
          userId,
          selectedAddressIndex,
          normalizedPaymentMethod,
          razorpayData
        );
        
        if (!result.success) { 
          return res.redirect('/orderfailed');
        } 
        
      return res.redirect(`/ordersuccess/${result.order.orderId}`);
    }
    
    // cod flow
    const result = await checkoutService.placeOrderService(
      userId,
      selectedAddressIndex,
      normalizedPaymentMethod
    ); 
    
    if (!result.success) { 
      return res.redirect('/orderfailed');
    } 
    
    return res.redirect(`/ordersuccess/${result.order.orderId}`); 
      
  } catch (error) { 
    console.error("Place order error:", error.message); 
    return res.redirect("/pageNotFound"); 
  } 
}

async function loadCheckout(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const userId = req.session.user._id;
    const result= await checkoutService.loadCheckoutService(userId)

  return res.render("checkout", {
    user: req.session.user,
    cartItems: result.cartItems,
    addresses:result.addresses,
    subtotal: result.subtotal,
    grandTotal: result.grandTotal,
    defaultAddress: result.defaultAddress,
    availableCoupons:result.coupons
  });
} catch (error) {
  return res.redirect("/pageNotFound");
}
}

export {loadCheckout, placeOrder, orderSuccessPage, loadOrderFailed, loadOrderDetails, loadOrderList, loadOrderListData, downloadInvoice, returnRequest, handlePaymentFailed, cancelItem}