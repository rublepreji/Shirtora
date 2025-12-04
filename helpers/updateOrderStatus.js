import Order from '../model/orderSchema.js'


async function updateStatus(orderId,newStatus) {
 try {
    await Order.findOneAndUpdate(
        { orderId },
        { status: newStatus },
        { new: true }
    );

    return true
 } catch (error) {
    console.log(error);
    return false
 }   
}


export {updateStatus}