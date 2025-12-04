import Order from "../../model/orderSchema.js"
import {STATUS}  from "../../utils/statusCode.js"
import {updateStatus} from "../../helpers/updateOrderStatus.js"


async function updateItemStatus(req,res) {
  try {
    console.log('Inside the updateItemstatus');
    
    const { orderId, itemIndex, newStatus } = req.body;

    await Order.updateOne(
      { _id: orderId },
      { $set: { [`items.${itemIndex}.itemStatus`]: newStatus } }
    ); 
    const order= await Order.findOne({_id:orderId}).populate("items.productId")
    const item = order.items[itemIndex]

    if(newStatus =="Return-Approved"){
        const product=item.productId
        const variantIndex= item.variantIndex

        product.variants[variantIndex].stock+=item.quantity
        await product.save()
    }

  res.status(STATUS.OK).json({ success: true });
  } catch (error) {
    console.log("Update item status error:", error);
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false });
  }
}


  async function updateReturnStatus(req, res) {
  try {
    const { orderId, itemIndex, newStatus } = req.body;

    if (!orderId || itemIndex === undefined || !newStatus) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const order = await Order.findById(orderId).populate("items.productId");

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    order.items[itemIndex].itemStatus = newStatus;

    await order.save();
    const item=order.items[itemIndex]

    if(newStatus=="Return-Approved"){
        const product= item.productId
        const variantIndex= item.variantIndex

        product.variants[variantIndex].stock+=item.quantity
        await product.save()
    }
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
        const order= await Order.findById(orderId)
        .populate({
            path:"items.productId"
        })          
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
        let limit = 8;

        let search = req.query.search || "";
        let status = req.query.status || "";

        let query = {};

        if (search.trim() !== "") {
            query.$or = [
                { orderId: { $regex: search, $options: "i" } },
                { "address.firstName": { $regex: search, $options: "i" } },
                { "address.lastName": { $regex: search, $options: "i" } },
            ];
        }

        if (status !== "") {
            query.status = status;
        }

        const totalOrder = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate("items.productId")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            success: true,
            orders,
            totalPages: Math.ceil(totalOrder / limit),
            currentPage: page
        });

    } catch (error) {
        console.log(error);
        return res.redirect("/pageNotFound");
    }
}

export {loadOrderList, loadOrderDetails, dataForOrderList, updateOrderStatus, updateReturnStatus, updateItemStatus}

