import {STATUS} from '../../utils/statusCode.js'
import {updateStatus} from "../../helpers/updateOrderStatus.js"
import {logger} from '../../logger/logger.js'
import checkoutService from "../../services/userService/checkoutService.js";

async function returnRequest(req,res) {
  try {
    const { orderId, productIndex, reason, newStatus } = req.body;        
    const result=await checkoutService.returnRequestService(orderId,productIndex,reason,newStatus)
    return res.json(result)
  } catch (error) {
    res.json({ success: false });
  }
}

async function cancelOrder(req,res) {
  try {
    const {orderId,newStatus}= req.body
    const result= await updateStatus(orderId,newStatus)
    if(result){
      await checkoutService.cancelOrderStockUpdateService(orderId)
      return res.status(STATUS.OK).json({success:true,message:"Updated successfully"})
    }
    else{
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Failed to update status"})
    }
  } catch (error) {
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
      res.status(STATUS.INTERNAL_SERVER_ERROR).send("Server error");
    }
  }
}

async function loadOrderList(req, res) {
  try {
    res.render("orderList", { user: req.session.user });
  } catch (error) {
    res.redirect("/pageNotFound");
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
      res.render('orderFailed')
   } catch (error) {
      res.redirect('/pageNotFound')
   }
}

async function orderSuccessPage(req,res) {
   try {
      const orderId= req.params.id
      res.render  ('orderSuccess',{orderId:orderId})
   } catch (error) {
      res.redirect('/pageNotFound')
   }
}

async function placeOrder(req, res) {
   try { 
    const userId = req.session.user._id;
    const { selectedAddressIndex, paymentMethod } = req.body; 
    if (!selectedAddressIndex) { 
      return res.status(STATUS.BAD_REQUEST).json({ success: false, message: "No address selected" });
     } 
     if (!paymentMethod) { 
      return res .status(STATUS.BAD_REQUEST) .json({ success: false, message: "No payment method selected"}); 
    } 
    const result=await checkoutService.placeOrderService(userId,selectedAddressIndex,paymentMethod) 
    if(!result.success){ 
      return res.redirect('/orderfailed') 
    } 
    return res.redirect(`/ordersuccess/${result.order.orderId}`); 
  } 
  catch (error) { 
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
    defaultAddress: result.defaultAddress
  });
} catch (error) {
  return res.redirect("/pageNotFound");
}
}

export {loadCheckout, placeOrder, orderSuccessPage, loadOrderFailed, loadOrderDetails, loadOrderList, loadOrderListData, downloadInvoice, cancelOrder, returnRequest}