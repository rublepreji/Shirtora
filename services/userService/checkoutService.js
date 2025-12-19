import Cart from "../../model/cartSchema.js";
import Order from "../../model/orderSchema.js";
import Address from "../../model/addressSchema.js";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";


async function createFailedPaymentOrder(userId, reason, razorpayOrderId, selectedAddressIndex, paymentMethod) {
  const session =await mongoose.startSession();
  try {
    let orderDocument= null
    await session.withTransaction(async ()=>{
      const cart= await Cart.findOne({userId}).populate("items.productId").session(session);

      if(!cart || cart.items.length==0){
        throw new Error("Cart is empty")
      }
      const validItems= cart.items.filter((pro)=>{
        return pro.productId.isBlocked==false
      })
      const addressDoc= await Address.findOne({userId}).session(session)
      
      const selectedAddress= addressDoc.address[selectedAddressIndex]

      if(!selectedAddress){
        throw new Error("Invalid address selected")
      }
      let total=0;
      for(const item of validItems){
        total += item.totalPrice
      }
      const customOrderId= `ORD-${Date.now().toString(36).toUpperCase()}`

      const newOrder = await Order.create([{
        orderId:customOrderId,
        userId,
        items:validItems,
        totalAmount:total,
        paymentMethod,
        paymentStatus:"Failed",
        status:"Payment Failed",
        address:selectedAddress,
        razorpayOrderId,
        paymentFailureReason:reason
      }],{session})
      orderDocument= newOrder[0]
    })
    await session.endSession()
    return {success:true,order:orderDocument}
  } catch (error) {
    await session.endSession()
    console.log("create failed payment order service",error.message);
    return {success:false,message:error.message}
  }
}

async function returnRequestService(orderId,productIndex,reason,newStatus) {
    const order = await Order.findOne({ orderId });
    if (!order) return ({ success: false ,message:"Order not found"});

    order.items[productIndex].itemStatus = newStatus;
    order.items[productIndex].returnReason = reason;

    await order.save();

    return({ success: true });
}

async function cancelOrderStockUpdateService(orderId) {
    const order= await Order.findOne({orderId}).populate("items.productId")
    for(const item of order.items){
    const product= item.productId
    const variantIndex= item.variantIndex
    product.variants[variantIndex].stock+=item.quantity
    await product.save()
}
return true;
}

 async function downloadInvoiceService(orderId) {

  const order = await Order.findById(orderId)
    .populate({
      path: "items.productId",
      select: "productName variants"
    });

  if (!order) return null;

  const doc = new PDFDocument({ margin: 50 });

  const itemTotal = parseFloat(order.totalAmount) || 0;
  const shippingCharge = 0.00;
  const taxAndOthers = 0.00;
  const grandTotal = itemTotal + shippingCharge + taxAndOthers;

  // ---------- PAGE DIMENSIONS ----------
  const pageMargin = 50;
  const pageWidth = 612;
  const contentWidth = pageWidth - (2 * pageMargin);

  // ---------- HEADER ----------
  doc.fontSize(28)
    .fillColor("#333333")
    .text("SHIRTORA", pageMargin, 60, { align: "left" });

  doc.fontSize(10)
    .text(`Date: ${order.createdAt.toDateString()}`, pageMargin, 70, { align: "right" });

  doc.moveDown(3);

  // ---------- SHIPPING DETAILS ----------
  let currentY = doc.y;

  doc.fontSize(14)
    .fillColor("#000000")
    .text("Shipping Details:", pageMargin, currentY, { underline: true });

  doc.fontSize(10).moveDown(0.5);

  if (order.address) {
    doc.text(`${order.address.firstName} ${order.address.lastName}`);
    doc.text(order.address.addressLine);
    doc.text(order.address.landMark || "");
    doc.text(`${order.address.city}, ${order.address.pincode}`);
    doc.text(`Phone: ${order.address.phone}`);
  } else {
    doc.text("Address not available");
  }

  // ---------- ORDER INFO (Right Side) ----------
  const orderDetailsX = pageMargin + contentWidth / 2;
  doc.y = currentY;

  doc.fontSize(14)
    .text("Order Info:", orderDetailsX, currentY, { underline: true });

  doc.fontSize(10).moveDown(0.5);

  doc.text("Order ID:", orderDetailsX, doc.y);
  doc.text(order.orderId, orderDetailsX + 70, doc.y - 10);
  doc.text("Ordered On:", orderDetailsX, doc.y);
  doc.text(order.createdAt.toDateString(), orderDetailsX + 70, doc.y - 10);

  doc.moveDown(4);

  // ---------- TABLE HEADER ----------
  const tableTop = doc.y;
  const col1X = pageMargin;
  const col2X = pageMargin + 300;
  const col3X = pageMargin + 400;

  doc.lineWidth(1)
    .strokeColor("#aaaaaa")
    .moveTo(pageMargin, tableTop)
    .lineTo(pageWidth - pageMargin, tableTop)
    .stroke();

  doc.fillColor("#000000")
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Item / Description", col1X, tableTop + 5)
    .text("Qty", col2X, tableTop + 5, { width: 50, align: "right" })
    .text("Price/Unit", col3X, tableTop + 5, { width: 60, align: "right" });

  const itemsStart = tableTop + 25;

  doc.lineWidth(1)
    .moveTo(pageMargin, itemsStart)
    .lineTo(pageWidth - pageMargin, itemsStart)
    .stroke();

  let itemY = itemsStart + 10;
  doc.font("Helvetica");

  // ---------- TABLE BODY ----------
  order.items.forEach((item, i) => {
    if (itemY + 30 > doc.page.height - pageMargin) {
      doc.addPage();
      itemY = pageMargin + 10;
    }

    if (!item.productId) {
      doc.fontSize(10)
        .text(`${i + 1}. PRODUCT REMOVED`, col1X, itemY);
    } else {
      const variant = item.productId.variants[item.variantIndex];
      const price = variant ? parseFloat(variant.price) : 0;
      const variantName = variant?.name || `Index: ${item.variantIndex}`;

      doc.fontSize(10)
        .text(item.productId.productName, col1X, itemY);

      doc.fontSize(8)
        .text(`Variant: ${variantName}`, col1X, itemY + 10);

      doc.fontSize(10)
        .text(item.quantity, col2X, itemY, { width: 50, align: "right" })
        .text(`₹${price.toFixed(2)}`, col3X, itemY, { width: 60, align: "right" });
    }

    itemY += 35;
    doc.y = itemY;
  });

  // ---------- SUMMARY ----------
  doc.moveDown(2);
  let summaryY = doc.y;

  doc.lineWidth(1)
    .moveTo(pageMargin, summaryY)
    .lineTo(pageWidth - pageMargin, summaryY)
    .stroke();

  summaryY += 10;
  const summaryLabelX = pageMargin + contentWidth - 200;
  const summaryValueX = pageMargin + contentWidth - 80;

  doc.fontSize(10)
    .text("Item Total:", summaryLabelX, summaryY)
    .text(`₹${itemTotal.toFixed(2)}`, summaryValueX, summaryY);

  summaryY += 15;

  doc.text("Shipping Charge:", summaryLabelX, summaryY)
    .text(`₹${shippingCharge.toFixed(2)}`, summaryValueX, summaryY);

  summaryY += 15;

  doc.text("Tax & Others:", summaryLabelX, summaryY)
    .text(`₹${taxAndOthers.toFixed(2)}`, summaryValueX, summaryY);

  summaryY += 15;

  doc.lineWidth(1)
    .moveTo(summaryLabelX, summaryY)
    .lineTo(pageWidth - pageMargin, summaryY)
    .stroke();

  summaryY += 5;

  doc.fontSize(14)
    .font("Helvetica-Bold")
    .text("TOTAL:", summaryLabelX, summaryY)
    .text(`₹${grandTotal.toFixed(2)}`, summaryValueX, summaryY);

  doc.moveDown(3);

  // ---------- FOOTER ----------
  doc.fontSize(10)
    .fillColor("#555555")
    .text("Thank you for your order!", pageMargin, doc.y, { align: "center" });

  return doc;
}

async function loadOrderListService(userId,page,search) {
  let limit = 5; 
  let query = { userId };
  if (search.trim() !== "") {
      query.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { "address.firstName": { $regex: search, $options: "i" } },
      { "address.lastName": { $regex: search, $options: "i" } }
      ];
  }
  
  const total = await Order.countDocuments(query);
  
  const orders = await Order.find(query)
      .populate({
      path: "items.productId",
      select: "productImage variants productName",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  return {
      totalPages:Math.ceil(total/limit),
      orders
  }
}

async function getOrderDetailsService(orderId) {
  const order = await Order.findOne({orderId})
  .populate({
    path:"items.productId",
    populate:[{path:"category"},{path:"brand"}]
  }).lean()

  if(!order){
    return {success:false,message:"Order not found"}
  }
  const products=order.items.filter((product)=>{
    return product.productId.isBlocked==false
  })
  return {success:true,order,products}
}


async function placeOrderService(userId, selectedAddressIndex, paymentMethod, razorpayData = null) { 
    const session = await mongoose.startSession();
    try { 
        let orderDocument = null;
        await session.withTransaction(async () => {
            const cart = await Cart.findOne({ userId })
              .populate("items.productId")
              .session(session); 
            
            if (!cart || cart.items.length === 0){ 
              throw new Error("Cart is empty"); 
            }
            
            const validItems = cart.items.filter((pro) => {
              return pro.productId.isBlocked == false;
            });

            const addressDoc = await Address.findOne({ userId }).session(session);
            const selectedAddress = addressDoc.address[selectedAddressIndex];
            if (!selectedAddress) { 
              throw new Error("Invalid address selected");
            } 
            
            let total = 0; 
            for (const item of validItems) { 
              total += item.totalPrice; 
            } 
            
            // Stock validation
            for (const item of validItems) {
              const product = item.productId;
              const variantIndex = item.variantIndex;
              const qty = item.quantity;
              if (product.variants[variantIndex].stock < qty) {
                throw new Error(`${product.productName} is out of stock`);
              } 
            }
            
            // Deduct stock
            for (const item of validItems) {
              const product = item.productId;
              const variantIndex = item.variantIndex;
              const qty = item.quantity;
              product.variants[variantIndex].stock -= qty;
              await product.save({ session }); 
            } 
            
            const customOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
            
            // Determine order status based on payment method
            let orderStatus = "Pending";
            let paymentStatus = "Pending";
            
            if (paymentMethod === "Cash on Delivery") {
              orderStatus = "Pending";
              paymentStatus = "Pending";
            } else if (paymentMethod === "UPI Method" && razorpayData) {
              orderStatus = "Pending";
              paymentStatus = "Paid";
            }
            
            const newOrder = await Order.create([{
              orderId: customOrderId,
              userId,
              items: validItems,
              totalAmount: total,
              paymentMethod,
              paymentStatus,
              address: selectedAddress,
              status: orderStatus,
              razorpayOrderId: razorpayData?.razorpay_order_id || null,
              razorpayPaymentId: razorpayData?.razorpay_payment_id || null,
              razorpaySignature: razorpayData?.razorpay_signature || null,
            }], { session });
            
            await Cart.updateOne(
              { userId }, 
              { $set: { items: [] } }, 
              { session }
            ); 
            
          orderDocument = newOrder[0];
        });
        
        await session.endSession();
        return { success: true, order: orderDocument };
        
    } catch (error) { 
      await session.abortTransaction().catch(() => {});
      await session.endSession();
      return { success: false, message: error.message };
    } 
}

async function loadCheckoutService(userId) {
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        populate: [{ path: "category" }, { path: "brand" }]
      })
      .lean();

    const addressDoc = await Address.findOne({ userId }).lean();
    const addresses = addressDoc ? addressDoc.address : [];
    const defaultAddress = addresses.find(a => a.isDefault === true);

    if (!cart || cart.items.length === 0) {
      return {
        cartItems: [],
        addresses,
        subtotal: 0,
        grandTotal: 0,
        defaultAddress
    };
  }

  const filteredProducts = cart.items.filter((product) => {
    return product.productId.isBlocked === false;
  });

  if (filteredProducts.length === 0) {
  return {
    cartItems: [],
    addresses,
    subtotal: 0,
    grandTotal: 0,
    defaultAddress,
    message: "Some products were unavailable and removed from your cart."
  };
}

  let subtotal = 0;
  filteredProducts.forEach(item => {
    subtotal += item.productId.variants[item.variantIndex].price * item.quantity;
  });

  const grandTotal = subtotal;
  return {
    cartItems:filteredProducts,
    addresses,
    subtotal,
    grandTotal,
    defaultAddress
  }
}


export default{placeOrderService,returnRequestService,cancelOrderStockUpdateService,downloadInvoiceService,loadOrderListService,getOrderDetailsService,loadCheckoutService,createFailedPaymentOrder}





