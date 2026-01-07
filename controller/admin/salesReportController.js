import { STATUS } from "../../utils/statusCode.js"
import Order from "../../model/orderSchema.js"
async function loadSalesReport(req,res)
 {
 try {
    const orders=await Order.find({ status: "Delivered" })
    return res.render('salesReport',{orders})
 } catch (error) {
    return res.redirect('/pageNotFound')
 }   
}

export {
    loadSalesReport
}