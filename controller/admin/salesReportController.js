import { STATUS } from "../../utils/statusCode.js"
import Order from "../../model/orderSchema.js"
import { logger } from "../../logger/logger.js"
import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"

async function downloadReport(req, res) {
  try {

    const { range, startDate, endDate, type } = req.query
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

// Excel
if (type === "excel") {

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Sales Report")

  sheet.getColumn(1).width = 25
  sheet.getColumn(2).width = 18
  sheet.getColumn(3).width = 40
  sheet.getColumn(4).width = 12
  sheet.getColumn(5).width = 15

  // Title
  sheet.mergeCells("A1:E1")
  sheet.getCell("A1").value = "SALES REPORT"
  sheet.getCell("A1").font = { bold: true, size: 16 }
  sheet.getCell("A1").alignment = { horizontal: "center" }

  // Period
  let periodText = "All Time"

  if (range === "today") periodText = "Today"
  else if (range === "weekly") periodText = "Last 7 Days"
  else if (range === "monthly") periodText = "This Month"
  else if (range === "yearly") periodText = "This Year"
  else if (range === "custom" && startDate && endDate) {
    periodText = `${formatDate(startDate)} to ${formatDate(endDate)}`
  }

  // Summary
  sheet.addRow([])
  sheet.addRow(["Period", periodText])
  sheet.addRow(["Total Orders", totalOrders])
  sheet.addRow(["Total Sales", `₹${totalSales.toFixed(2)}`])
  sheet.addRow(["Product Discount", `₹${totalProductDiscount.toFixed(2)}`])
  sheet.addRow(["Coupon Discount", `₹${totalCouponDiscount.toFixed(2)}`])
  sheet.addRow(["Net Payable", `₹${netPayable.toFixed(2)}`])

  sheet.addRow([])

  // Table header
  const headerRow = sheet.addRow([
    "Order ID",
    "Date",
    "Products",
    "Qty",
    "Amount"
  ])

  headerRow.font = { bold: true }

  // Table body
  orders.forEach(o => {

    const products = o.items
      .map(i => "• " + i.productId.productName)
      .join("\n")

    const qty = o.items
      .map(i => "• " + i.quantity)
      .join("\n")

    sheet.addRow([
      o.orderId,
      formatDate(o.createdAt),
      products,
      qty,
      o.offerAmount || o.totalAmount
    ])
  })

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales-report.xlsx"
  )

  await workbook.xlsx.write(res)
  return res.end()
}

    // PDF
    if (type === "pdf") {

      const doc = new PDFDocument({ margin: 40 })

      res.setHeader("Content-Type", "application/pdf")
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.pdf"
      )

      doc.pipe(res)

      // Title
      doc.font("Helvetica-Bold")
        .fontSize(20)
        .text("Sales Report", { align: "center" })

      doc.moveDown()

      // Period
      let periodText = "All Time"

      if (range === "today") periodText = "Today"
      else if (range === "weekly") periodText = "Last 7 Days"
      else if (range === "monthly") periodText = "This Month"
      else if (range === "yearly") periodText = "This Year"
      else if (range === "custom" && startDate && endDate) {
        periodText = `${formatDate(startDate)} to ${formatDate(endDate)}`
      }

      // Summary 2
      doc.font("Helvetica").fontSize(10)

      const leftX = 40
      const rightX = 320
      let sY = doc.y

      doc.text(`Period: ${periodText}`, leftX, sY)
      doc.text(`Total Sales: ₹${totalSales.toFixed(2)}`, leftX, sY + 15)
      doc.text(`Coupon Discount: ₹${totalCouponDiscount.toFixed(2)}`, leftX, sY + 30)

      doc.text(`Orders: ${totalOrders}`, rightX, sY)
      doc.text(`Product Discount: ₹${totalProductDiscount.toFixed(2)}`, rightX, sY + 15)
      doc.text(`Net Payable: ₹${netPayable.toFixed(2)}`, rightX, sY + 30)

      doc.moveTo(40, sY + 50)
        .lineTo(550, sY + 50)
        .stroke()

      doc.moveDown(3)

      // Table
      let tableY = doc.y

      doc.font("Helvetica-Bold")
      const headerHeight = 25
      drawRow(doc, tableY, headerHeight,
        "Order ID", "Date", "Product", "Qty", "Amount"
      )

      tableY += headerHeight
      doc.font("Helvetica")

      orders.forEach(order => {

        const products = order.items
          .map(i => "• " + i.productId.productName)
          .join("\n")

        const qty = order.items
          .map(i => "• " + i.quantity)
          .join("\n")

        const amount = order.offerAmount || order.totalAmount

        const rowHeight = Math.max(
          doc.heightOfString(products, { width: 150 }),
          22
        )

        drawRow(
          doc,
          tableY,
          rowHeight,
          order.orderId,
          formatDate(order.createdAt),
          products,
          qty,
          `₹${amount}`
        )

        tableY += rowHeight

        if (tableY > 720) {
          doc.addPage()
          tableY = 50

          doc.font("Helvetica-Bold")
          drawRow(doc, tableY, headerHeight,
            "Order ID", "Date", "Product", "Qty", "Amount"
          )
          tableY += headerHeight
          doc.font("Helvetica")
        }
      })

      doc.end()
      return
    }

  } catch (error) {
    logger.error("Error from download Report", error)
    return res.redirect('/pageNotFound')
  }
}

// Helpers

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

async function salesReport(req,res) {
  try {
    const {startDate, endDate, range} = req.query
    const page= Number(req.query.page)
    const today= new Date()

    if(startDate>endDate){
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Start date must be before end date"})
    }
    let start
    let end
    let filter={status:"Delivered"}
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
    console.log("orders",orders);
    
    let totalSales=0
    let totalOrders= await Order.countDocuments(filter)
    let totalProductDiscount =0
    let totalCouponDiscount =0

    const totalPage= Math.ceil(totalOrders/limit)

    orders.forEach((order)=>{
      totalSales+=Number(order.offerAmount ||0)
      totalProductDiscount+=Number(order.totalOffer || 0)
      totalCouponDiscount+=Number(order.discountAmount || 0)
    })
   
    return res.status(STATUS.OK).json({
      success:true,
      orders,
      totalSales,
      totalOrders,
      totalProductDiscount,
      totalCouponDiscount,
      totalPage,
      currentPage:page
   })
 } catch (error) {
    logger.error("Error from salesReport",error)
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
 } 
}


async function loadSalesReport(req,res)
 {
 try {

    return res.render('salesReport')
 } catch (error) {
    logger.error("Error from loadSalesReport",error);
    return res.redirect('/pageNotFound')
 }   
}



export {
    loadSalesReport,
    salesReport,
    downloadReport
}