import Order from "../../model/orderSchema.js"
import {STATUS}  from "../../utils/statusCode.js"
import {updateStatus} from "../../helpers/updateOrderStatus.js"
import {logger} from '../../logger/logger.js'
import orderService from '../../services/adminService/orderService.js'


async function updateItemStatus(req,res) {
  try {    
    const { orderId, itemIndex, newStatus } = req.body;

    const {item}= await orderService.updateItemStatus(orderId,itemIndex,newStatus)

    await orderService.updateStockIfRetured(item,newStatus)

    return res.status(STATUS.OK).json({ success: true });
  } catch (error) {
    logger.error("Update item status error:", error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false });
  }
}


  async function updateReturnStatus(req, res) {
  try {
    const { orderId, itemIndex, newStatus } = req.body;

    if (!orderId || itemIndex === undefined || !newStatus) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const order = await orderService.findOrderWithproductDetails(orderId)

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    await orderService.updateReturnStatus(order,itemIndex,newStatus)
    
    const item=order.items[itemIndex]

    await orderService.updateStockIfReturnApproved(item, newStatus)
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, message: "Server error" });
  }
};


async function updateOrderStatus(req,res) {
 try {    
    const { orderId, newStatus } = req.body;
    const result =await updateStatus(orderId, newStatus)
    if(result){
        return res.status(STATUS.OK).json({success:true,message:"Status updated successfully"})
    }
    else{
        return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Failed to update status"})
    }
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

export {loadOrderList, loadOrderDetails, dataForOrderList, updateOrderStatus, updateReturnStatus, updateItemStatus}

