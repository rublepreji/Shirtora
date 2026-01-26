import Order from "../../model/orderSchema.js"
import { STATUS } from "../../utils/statusCode.js"

async function downloadReportService({range, startDate, endDate, type}) {
        let filter = { status: "Delivered" }
    
        // Date filter
        const today = new Date()
        let start, end
    
        if (range && range !== "all") {
    
            if (range === "today") {
            start = new Date()
            start.setHours(0, 0, 0, 0)
            end = new Date()
            end.setHours(23, 59, 59, 999)
            }
    
            else if (range === "weekly") {
            start = new Date()
            start.setDate(today.getDate() - 7)
            end = today
            }
    
            else if (range === "monthly") {
            start = new Date(today.getFullYear(), today.getMonth(), 1)
            end = today
            }
    
            else if (range === "yearly") {
            start = new Date(today.getFullYear(), 0, 1)
            end = today
            }
    
            else if (range === "custom" && startDate && endDate) {
            start = new Date(startDate)
            end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            }
    
            if (start && end) {
            filter.createdAt = { $gte: start, $lte: end }
            }
        }
    
        const orders = await Order.find(filter)
            .populate("items.productId")
            .sort({ createdAt: -1 })
    
        // Totals
        let totalSales = 0
        let totalProductDiscount = 0
        let totalCouponDiscount = 0
    
        orders.forEach(o => {
            totalSales += Number(o.offerAmount || o.totalAmount || 0)
            totalProductDiscount += Number(o.totalOffer || 0)
            totalCouponDiscount += Number(o.discountAmount || 0)
        })
    
        const totalOrders = orders.length
        const netPayable =
            totalSales - totalProductDiscount - totalCouponDiscount
        const generatedAt= new Date()
        return {
            orders,
            summary:{
                totalSales,
                totalProductDiscount,
                totalCouponDiscount,
                netPayable,
                totalOrders
            },
            range,
            startDate,
            endDate,
            type,
            generatedAt
        }

}


function formatDateTime(date){
  const d = new Date(date)

  const day = String(d.getDate()).padStart(2,"0")
  const month = String(d.getMonth()+1).padStart(2,"0")
  const year = d.getFullYear()

  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2,"0")
  const ampm = hours >= 12 ? "PM" : "AM"

  hours = hours % 12 || 12

  return `${day}/${month}/${year}  ${hours}:${minutes} ${ampm}`
}


function drawRow(doc, y, h, c1, c2, c3, c4, c5) {

  const cols = [
    { x: 40,  w: 90 },
    { x: 130, w: 80 },
    { x: 210, w: 150 },
    { x: 360, w: 60 },
    { x: 420, w: 90 }
  ]

  drawCell(doc, cols[0], y, h, c1)
  drawCell(doc, cols[1], y, h, c2)
  drawCell(doc, cols[2], y, h, c3)
  drawCell(doc, cols[3], y, h, c4)
  drawCell(doc, cols[4], y, h, c5)
}

function drawCell(doc, col, y, h, text) {

  doc
    .rect(col.x, y, col.w, h)
    .stroke()

  doc.text(text, col.x + 5, y + 5, {
    width: col.w - 10
  })
}

function formatDate(date) {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}



async function salesReportService(startDate,endDate,range,page) {
    page= Number(page) || 1
    const today= new Date()
    if(startDate && endDate){
        if(new Date(startDate)>new Date(endDate)){
        return {status:STATUS.BAD_REQUEST,success:false,message:"Start date must be before end date"}
    }
    }
    
    let start
    let end
    let filter={"items.itemStatus":"Delivered"}
    if(range){
    if(range==="today"){
      start= new Date()
      start.setHours(0,0,0,0)

      end= new Date()
      end.setHours(23,59,59,999)
    }
    else if(range==="weekly"){
      start= new Date()
      start.setDate(today.getDate() -7)
      end= today
    }else if(range === "monthly"){
      start= new Date(today.getFullYear(), today.getMonth(),1)
      end= today
    }else if(range === "yearly"){
      start= new Date(today.getFullYear(),0,1)
      end= today
    }else if(range === "custom" && startDate && endDate){
      start = new Date(startDate)
      end = new Date(endDate)
      end.setHours(23,59,59,999)
    }
    if(start && end){
      filter.createdAt= {$gte:start, $lte:end}
    }
  }
    const limit=5
    const skip= (page-1)*limit
    const orders= await Order.find(filter).populate("items.productId").sort({createdAt:-1}).limit(limit).skip(skip)
    
    let totalSales=0
    let totalOrders= await Order.countDocuments(filter)
    let totalProductDiscount =0
    let totalCouponDiscount =0

    const totalPage= Math.ceil(totalOrders/limit)

    const order= await Order.find({status:"Delivered"})

    order.forEach((order)=>{
      let totalAmount= order.totalAmount
      let discountAmounts= order.discountAmount
    order.items.forEach((item)=>{
      if(item.itemStatus==="Delivered"){
        totalSales+=Number(item.totalPrice ||0)
        totalProductDiscount+=Number(item.discountAmount || 0)
        const itemShare= item.totalPrice / totalAmount
        const discountAmount= itemShare * discountAmounts
        totalCouponDiscount += discountAmount
      }
      })
      
    })
   return {
    status:STATUS.OK,
    success:true,
    orders,
    totalSales,
    totalOrders,
    totalProductDiscount,
    totalCouponDiscount,
    totalPage,
    message:"success"
   }
}


export {
    downloadReportService,
    formatDate,
    drawRow,
    formatDateTime,
    salesReportService
}