import Order from "../../model/orderSchema.js";
import Product from "../../model/productSchema.js";

async function restoreStokeForOrderItems(order,session) {
  try {
    for(const item of order.items){
      if(item.itemStatus=="Delivered") continue
      const product= await Product.findById(item.productId).session(session)
      if(!product)continue
      const variant= product.variants[item.variantIndex]
      if(!variant)continue
      variant.stock+=item.quantity
      await product.save({session})
    }    
  } catch (error) {
    return error
  }
}

async function isValidStatusTransition(currentStatus,newStatus) {
  const statusFlow=[
    "Ordered",
    "Processing",
    "Shipped",
    "Tracking",
    "Delivered",
    "Return Requested",
    "Cancelled",
    "Return-Approved",
    "Return-Rejected"
  ]

  const currentIndex= statusFlow.indexOf(currentStatus)
  const nextIndex= statusFlow.indexOf(newStatus)
  if(currentIndex==-1 || nextIndex==-1) return false
  if(currentIndex===nextIndex)return true
  return nextIndex>currentIndex
}

async function determineOrderStatusFromItems(items) {
  try {
    const statuses= items.map(item=>item.itemStatus)

    const allDelivered= statuses.every(s=>s ==="Delivered")
    const allCancelled= statuses.every(s=>s==="Cancelled")
    const allProcessing= statuses.every(s=>s==="Processing")
    const allTracking= statuses.every(s=>s==="Tracking")
    const allShipped= statuses.every(s=>s==="Shipped")
    const allRetured= statuses.every(s=>s==="Returned")
    const allReturnReq = statuses.every(s=>s==="Return Requested")

    const anyProcessing = statuses.includes("Processing")
    const anyShipped = statuses.includes("Shipped")
    const anyTracking= statuses.includes("Tracking")

    if(allProcessing){
      return "Processing"
    }
    if(allTracking){
      return "Tracking"
    }
    if(allShipped){
      return "Shipped"
    }
    if(allCancelled){
      return "Cancelled"
    }
    if(allDelivered){
      return "Delivered"
    }
    if(allRetured){
      return "Returned"
    }
    if(allReturnReq){
      return "Return Requested"
    }
    if(anyTracking){
      return "Tracking"
    }
    if(anyShipped){
      return "Shipped"
    }
    if(anyProcessing){
      return "Processing"
    }
    return "Pending"

  } catch (error) {
    logger.error("Error in determine Order Status From Items",error)
    return
  }
}

async function updateItemStatus(orderId,itemIndex,newStatus) {
    await Order.updateOne(
        { _id: orderId },
        { $set: { [`items.${itemIndex}.itemStatus`]: newStatus } }
    ); 
    const order= await Order.findOne({_id:orderId}).populate("items.productId")
    const item = order.items[itemIndex]

    return {item}
}

async function updateStockIfRetured(item,newStatus) {
    if(newStatus =="Return-Approved"){
        const product=item.productId
        const variantIndex= item.variantIndex

        product.variants[variantIndex].stock+=item.quantity
        await product.save()
    }
}

async function findOrderWithproductDetails(orderId) {
    return await Order.findById(orderId).populate("items.productId");
}

async function updateReturnStatus(order,itemIndex,newStatus) {
    order.items[itemIndex].itemStatus = newStatus;
    await order.save();
}

async function updateStockIfReturnApproved(item,newStatus) {
if(newStatus=="Return-Approved"){
    const product= item.productId   
    const variantIndex= item.variantIndex

    product.variants[variantIndex].stock+=item.quantity
    await product.save()
}
}

async function listOrders(page,search,status) {
    const limit=8
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

    return {
        orders,
        totalPages:Math.ceil(totalOrder/limit)
    }
}





export default {
    updateItemStatus,
    updateStockIfRetured,
    findOrderWithproductDetails,
    updateReturnStatus,
    updateStockIfReturnApproved,
    listOrders,
    determineOrderStatusFromItems,
    isValidStatusTransition,
    restoreStokeForOrderItems
}
