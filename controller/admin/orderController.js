import Order from "../../model/orderSchema.js"
import {STATUS}  from "../../utils/statusCode.js"
import {updateStatus} from "../../helpers/updateOrderStatus.js"
import {logger} from '../../logger/logger.js'
import orderService from '../../services/adminService/orderService.js'
import mongoose from "mongoose"
import { creditWallet } from "../../services/userService/walletService.js"

async function adminCancelOrder(req,res) {
  const session =await mongoose.startSession()
  try {
    const {orderId,reason}= req.body
    if(!orderId || !reason){
      return res.json({success:false,message:"Missing data"})
    }
    const orderDoc= await Order.findOne({orderId}).session(session)
    if(!orderDoc){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Order not found"})
    }
    if(orderDoc.status=="Delivered"){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Delivered order cannot be cancelled"})
    }
    if(orderDoc.status=="Cancelled"){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Order already cancelled"})
    }
    const hasDelivered= orderDoc.items.some(i=>i.itemStatus==="Delivered")
    const hasReturnApproved= orderDoc.items.some(i=>i.itemStatus==="Return-Approved")

    if(hasDelivered || hasReturnApproved){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Order contains delivered or returned items - full cancellation is not allowed"})
    }
    session.startTransaction()
    const order= await Order.findOne({orderId}).session(session)
    order.status="Cancelled"
    order.cancelReason=reason

    let refundAmount=0
    order.items.forEach((val)=>{
      if(val.itemStatus !== "Cancelled"){
        refundAmount+=val.totalPrice
      }
    })

    const itemShare=Math.round(refundAmount/order.totalAmount)
    const refund= order.discountAmount * itemShare
    refundAmount-=refund

    order.items.forEach((item)=>{
      if(item.itemStatus !=="Delivered"){
        item.itemStatus="Cancelled"
      }
    })

    console.log("refundAmount",refundAmount);
    
    await orderService.restoreStokeForOrderItems(order,session)

    if(order.paymentStatus==="Paid"){
      await creditWallet({
        userId:order.userId,
        amount:refundAmount,
        source:"ORDER_REFUND",
        orderId:order.orderId,
        reason:reason,
        session
      })
      order.paymentStatus="Refunded"
    }
    await order.save({session})
    await session.commitTransaction()
    session.endSession()
    return res.status(STATUS.OK).json({success:true,message:"Order cancelled successfully"})
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
   logger.error("Error from adminCancelOrder",error)
   return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"}) 
  }
}

async function updateItemStatus(req,res) {
  try {    
    const { orderId, itemIndex, newStatus } = req.body;
    const orders= await Order.findById(orderId)
    if(orders.paymentStatus==="Failed"){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Status cannot be changed"})
    }
    if(!orders){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Order not found"})
    }
    const findItem= orders.items[itemIndex]
    if(!findItem){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Item not found"})
    }
    const currentStatus= findItem.itemStatus

    if(!await orderService.isValidStatusTransition(currentStatus,newStatus)){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:`Cannot change status from ${currentStatus} to ${newStatus}`})
    }
    
    const {item}= await orderService.updateItemStatus(orderId,itemIndex,newStatus)

    await orderService.updateStockIfRetured(item,newStatus)

    const order=await Order.findOne({_id:orderId})
    order.status= await orderService.determineOrderStatusFromItems(order.items)
    if(order.status=="Delivered" && order.paymentMethod=="COD"){
      order.paymentStatus="Paid"
    }
    await order.save()
    return res.status(STATUS.OK).json({ success: true });
  } catch (error) {
    logger.error("Update item status error:", error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false });
  }
}

async function updateReturnStatus(req, res) {
  const session=await mongoose.startSession()
  try {
    session.startTransaction()
    const { orderId, itemIndex, newStatus } = req.body;

    if (!orderId || itemIndex === undefined || !newStatus) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const order = await Order.findById(orderId).populate("items.productId").session(session)
    if(!order){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Order not found"})
    }

    const item = order.items[itemIndex]
    
    if(!item){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Item not found"})
    }

    item.itemStatus=newStatus
    if(newStatus==="Return-Approved"){
      const product= item.productId

      product.variants[item.variantIndex].stock += item.quantity
      await product.save({session})

      const itemShare= item.totalPrice / order.totalAmount
      const discountShare= itemShare * order.discountAmount
      const refundAmount= Math.round(item.totalPrice- discountShare)

      console.log("order paymentstatus",order.paymentStatus);
      console.log("item isRefunded",item.isRefunded);
      

      if(order.paymentStatus ==="Paid" && !item.isRefunded){
        console.log("Inside credit wallet");
        
        await creditWallet({
          userId:order.userId,
          amount:refundAmount,
          source:"ORDER_RETURN_REFUND",
          orderId:order.orderId,
          reason:"Return approved",
          itemIndex,
          session
        })
        item.isRefunded=true
      }
    }
    
    order.status=await orderService.determineOrderStatusFromItems(order.items)
    await order.save({session})
    await session.commitTransaction()
    session.endSession()
    return res.json({ success: true });
  } catch (err) {
    await session.abortTransaction()
    session.endSession()
    return res.json({ success: false, message: "Server error" });
  }
};


async function updateOrderStatus(req,res) {
 try {    
    const { orderId, newStatus } = req.body;

    const order= await Order.findOne({orderId})

    if(!order){
      return res.status(STATUS.NOT_FOUND).json({success:false,message:"Order not found"})
    }

    if(order.status==="Delivered"){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Delivered order cannot be updated"})
    }
    order.status=newStatus
    if(newStatus==="Delivered" && order.paymentMethod==="COD"){
      order.paymentStatus="Paid"
    }
    await order.save()
    return res.status(STATUS.OK).json({success:true,message:"Status updated successfully"})
 } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
 }   
}

async function loadOrderDetails(req,res) {
    try {
        const orderId= req.params.id
        const order= await orderService.findOrderWithproductDetails(orderId)
        return res.render('adminOrderDetails',{order})
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

async function loadOrderList(req,res) {
    try {
        return res.render('adminOrderList')
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

async function dataForOrderList(req,res) {
    try {
        let page = parseInt(req.query.page) || 1;
        let search = req.query.search || "";
        let status = req.query.status || "";
        const result=await orderService.listOrders(page,search,status)

        return res.status(200).json({
            success: true,
            orders:result.orders,
            totalPages: result.totalPages,
            currentPage: page
        });

    } catch (error) {
        logger.error(error);
        return res.redirect("/pageNotFound");
    }
}

export {
  loadOrderList, 
  loadOrderDetails, 
  dataForOrderList, 
  updateOrderStatus, 
  updateReturnStatus, 
  updateItemStatus, 
  adminCancelOrder
}

