import Order from "../../model/orderSchema.js";
import Product from "../../model/productSchema.js";

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
    listOrders
}
