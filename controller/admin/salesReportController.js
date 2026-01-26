import { STATUS } from "../../utils/statusCode.js"
import Order from "../../model/orderSchema.js"
import { logger } from "../../logger/logger.js"
import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"
import { downloadReportService, formatDate, drawRow, formatDateTime, salesReportService } from "../../services/adminService/salesReportService.js"

async function downloadReport(req, res) {
  try {

    const result = await downloadReportService(req.query)
    const {
      orders,
      summary,
      range,
      startDate,
      endDate,
      type,
      generatedAt
    }= result

    const {
      totalSales,
      totalProductDiscount,
      totalCouponDiscount,
      netPayable,
      totalOrders
    }= summary

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
  sheet.addRow(["Date & Time", formatDateTime(generatedAt)])
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

    const row = sheet.addRow([
      o.orderId,
      formatDate(o.createdAt),
      products,
      qty,
      o.offerAmount || o.totalAmount
    ])

    // Enable wrap for this row
    row.getCell(3).alignment = { wrapText: true }
    row.getCell(4).alignment = { wrapText: true }
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


      doc.fontSize(10)
   .text(`Date & Time : ${formatDateTime(generatedAt)}`,leftX, sY -15)
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



async function salesReport(req,res) {
  try {
    const {startDate, endDate, range} = req.query
    const page= Number(req.query.page)
    const result= await salesReportService(startDate, endDate, range, page)
    return res.status(result.status).json({success:result.success,message:result.message, orders:result.orders, totalSales:result.totalSales, totalOrders:result.totalOrders, totalProductDiscount:result.totalProductDiscount, totalCouponDiscount:result.totalCouponDiscount, totalPage:result.totalPage})
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