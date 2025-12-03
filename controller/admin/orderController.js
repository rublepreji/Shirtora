import Order from "../../model/orderSchema.js"



async function loadOrderDetails(req,res) {
    try {
        const orderId= req.params.id
        const order=await Order.findById(orderId)
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
        const orders= await Order.find()
        .populate({
            path:"items.productId",
            select:"productName"
        })
       return res.render('adminOrderList',{orders})
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

export {loadOrderList, loadOrderDetails}

