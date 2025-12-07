import User from "../../model/userSchema.js";
import Product from "../../model/productSchema.js";
import Cart from "../../model/cartSchema.js";
import Address from "../../model/addressSchema.js";
import {STATUS} from '../../utils/statusCode.js'
import Order from '../../model/orderSchema.js'
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import {updateStatus} from "../../helpers/updateOrderStatus.js"
import {logger} from '../../logger/logger.js'


async function returnRequest(req,res) {
  try {
        const { orderId, productIndex, reason, newStatus } = req.body;
        console.log('inside the return request');
        console.log(newStatus);
        
        const order = await Order.findOne({ orderId });
        if (!order) return res.json({ success: false });

        order.items[productIndex].itemStatus = newStatus;
        order.items[productIndex].returnReason = reason;

        await order.save();

        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
}

async function cancelOrder(req,res) {
  try {
    const {orderId,newStatus}= req.body
    console.log("Form cancel order",orderId,newStatus);
    
    const result= await updateStatus(orderId,newStatus)

    if(result){
      const order= await Order.findOne({orderId}).populate("items.productId")
      for(const item of order.items){
        const product= item.productId
        const variantIndex= item.variantIndex

        product.variants[variantIndex].stock+=item.quantity
        await product.save()
      }
      return res.status(STATUS.OK).json({success:true,message:"Updated successfully"})
    }
    else{
      return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Failed to update status"})
    }
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

// Declare doc outside the try block so it's accessible in the catch block.
let doc = null; 

async function downloadInvoice(req, res) {
  try {
    const orderId = req.params.id;
    console.log('inside download', orderId);

    const order = await Order.findById(orderId)
     .populate({
        path: "items.productId",
        select: "productName variants"
      });

    if (!order) return res.status(404).send("Order not found");

    doc = new PDFDocument({ margin: 50 });

    const itemTotal = parseFloat(order.totalAmount) || 0;
    const shippingCharge = 0.00; // Adjusted to 0
    const taxAndOthers = 0.00;   // Adjusted to 0
    const grandTotal = itemTotal + shippingCharge + taxAndOthers;

    // --- SETUP PDF DOCUMENT ---
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${order.orderId}.pdf`
    );
     res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // --- PDF CONTENT START ---
    const pageMargin = 50;
    const pageWidth = 612; // Standard Letter/A4 width
    const contentWidth = pageWidth - 2 * pageMargin;

    // 1. HEADER (Invoice Title & Date)
    doc.fontSize(28)
    .fillColor('#333333')
    .text("SHIRTORA", pageMargin, 60, { align: "left" });

    doc.fontSize(10)
    .text(`Date: ${order.createdAt.toDateString()}`, pageMargin, 70, { align: "right" });

    doc.moveDown(3);

     // 2. SHIPPING ADDRESS SECTION
    let currentY = doc.y;

    doc.fontSize(14)
      .fillColor('#000000')
      .text("Shipping Details:", pageMargin, currentY, { underline: true });

     doc.fontSize(10).moveDown(0.5);

    if (order.address) {
      doc.text(`${order.address.firstName} ${order.address.lastName}`);
      doc.text(order.address.addressLine);
      doc.text(order.address.landMark || '');
      doc.text(`${order.address.city}, ${order.address.pincode}`);
      doc.text(`Phone: ${order.address.phone}`);
    } else {
     doc.text("Address not available");
    }

   // 3. ORDER DETAILS (Aligned to the right)
    const orderDetailsX = pageMargin + contentWidth / 2;
    doc.y = currentY; 

     doc.fontSize(14)
    .text("Order Info:", orderDetailsX, currentY, { underline: true });

    doc.fontSize(10).moveDown(0.5);
 
    doc.text("Order ID:", orderDetailsX, doc.y);
    doc.text(order.orderId, orderDetailsX + 70, doc.y - 10);
    doc.text("Ordered On:", orderDetailsX, doc.y);
    doc.text(order.createdAt.toDateString(), orderDetailsX + 70, doc.y - 10);
    
   //  ADJUSTMENT: Adding more vertical space here to move the table down
    doc.moveDown(4); 


    // 4. ITEMS TABLE HEADER
    const tableTop = doc.y; // Table starts lower now
    const col1X = pageMargin; // Product Name
    const col2X = pageMargin + 300; // Quantity (Moved left)
    const col3X = pageMargin + 400; // Price/Unit (Moved left)
    // const col4X = pageMargin + 500; // Total (Removed)

   // Draw a separator line
    doc.lineWidth(1)
       .strokeColor('#aaaaaa')
       .moveTo(pageMargin, tableTop)
       .lineTo(pageWidth - pageMargin, tableTop)
       .stroke();

    doc.fillColor('#000000')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text("Item / Description", col1X, tableTop + 5)
       .text("Qty", col2X, tableTop + 5, { width: 50, align: 'right' }) // Variant removed
       .text("Price/Unit", col3X, tableTop + 5, { width: 60, align: 'right' }); 
     // Total removed
  
    // Draw a separator line below header
     const itemsStart = tableTop + 25;
     doc.lineWidth(1)
     .moveTo(pageMargin, itemsStart)
     .lineTo(pageWidth - pageMargin, itemsStart)
     .stroke();
 let itemY = itemsStart + 10;
   doc.font('Helvetica'); // Reset font

   // 5. ITEMS TABLE BODY
   order.items.forEach((item, i) => {
     if (itemY + 30 > doc.page.height - pageMargin) {
      doc.addPage();
       itemY = pageMargin + 10;
    }

        if (!item.productId) {
       doc.fontSize(10).text(`${i + 1}. PRODUCT REMOVED`, col1X, itemY);
       } else {
       const variant = item.productId.variants[item.variantIndex];
        const price = variant ? parseFloat(variant.price) : NaN;

        // Displaying product name and variant name/index on separate lines for clarity
        doc.fontSize(10)
        .text(item.productId.productName, col1X, itemY);

        // Optional: Show variant index/name below product name if helpful
         const variantName = variant && variant.name ? variant.name : `Index: ${item.variantIndex}`;
         doc.fontSize(8).text(`Variant: ${variantName}`, col1X, itemY + 10);
         
         // Display Qty and Price
         doc.fontSize(10)
         .text(item.quantity, col2X, itemY, { width: 50, align: 'right' }) 
       .text(`₹${price.toFixed(2)}`, col3X, itemY, { width: 60, align: 'right' });
    }
    itemY += 35; // Increased spacing since we use two lines for product description
    doc.y = itemY; 
   });

   // 6. ORDER SUMMARY
    doc.moveDown(2);
   let summaryY = doc.y;

   // Final Separator Line
   doc.lineWidth(1)
   .moveTo(pageMargin, summaryY)
  .lineTo(pageWidth - pageMargin, summaryY)
   .stroke();

   summaryY += 10;

    const summaryLabelX = pageMargin + contentWidth - 200; 
    const summaryValueX = pageMargin + contentWidth - 80; 

   // Item Total
    doc.fontSize(10)
    .text(`Item Total:`, summaryLabelX, summaryY, { width: 100, align: 'right' })
    .text(`₹${itemTotal.toFixed(2)}`, summaryValueX, summaryY, { width: 80, align: 'right' });
    summaryY += 15;
    // Shipping (Now 0)
    doc.text(`Shipping Charge:`, summaryLabelX, summaryY, { width: 100, align: 'right' })
    .text(`₹${shippingCharge.toFixed(2)}`, summaryValueX, summaryY, { width: 80, align: 'right' });
   summaryY += 15;
 
  // Tax (Now 0)
    doc.text(`Tax & Others:`, summaryLabelX, summaryY, { width: 100, align: 'right' })
    .text(`₹${taxAndOthers.toFixed(2)}`, summaryValueX, summaryY, { width: 80, align: 'right' });
   summaryY += 15;

 // Grand Total Separator
     doc.lineWidth(1) 
     .moveTo(summaryLabelX, summaryY)
     .lineTo(pageWidth - pageMargin, summaryY)
     .stroke();
    summaryY += 5;

    // Grand Total
      // Grand Total
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(`TOTAL:`, summaryLabelX, summaryY, { width: 100, align: 'right' })
        .text(`₹${grandTotal.toFixed(1)}`, summaryValueX, summaryY, { width: 80, align: 'right' });

 
     doc.moveDown(3);

        // 7. FOOTER/THANK YOU
        doc.fontSize(10)
       .fillColor('#555555')
       .text("Thank you for your order!", pageMargin, doc.y, { align: 'center' });


   doc.end();

  } catch (error) {
   console.log("Invoice Error:", error);
    
    if (doc && !doc.ended) {
     doc.end();
    }
    if (!res.headersSent) {
      res.status(500).send("Server error");
    }
  }
}

async function loadOrderList(req, res) {
  try {
    res.render("orderList", { user: req.session.user });
  } catch (error) {
    res.redirect("/pageNotFound");
  }
}



async function loadOrderListData(req, res) {
  try {
    const userId = req.session.user._id;

    let page = parseInt(req.query.page) || 1;
    let limit = 5; 
    let search = req.query.search || "";

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

    return res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });

  } catch (err) {
    console.log(err);
    return res.json({ success: false });
  }
}



async function loadOrderDetails(req,res) {
  try {
    const orderId = req.params.id
    const order = await Order.findOne({orderId})
    .populate({
      path:"items.productId",
      populate:[{path:"category"},{path:"brand"}]
    }).lean()

    if(!order){
      return res.redirect('/pageNotFound')
    }
    const products=order.items.filter((product)=>{
     return product.productId.isBlocked==false
    })

    return res.render('orderDetails',{
      user:req.session.user,
      products,
      order
    })
  } catch (error) {
    return res.redirect('/pageNotFound')
  }
}

async function loadOrderFailed(req,res) {
   try {
      res.render('orderFailed')
   } catch (error) {
      res.redirect('/pageNotFound')
   }
}

async function orderSuccessPage(req,res) {
   try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
      const orderId= req.params.id
      res.render  ('orderSuccess',{orderId:orderId})
   } catch (error) {
      res.redirect('/pageNotFound')
   }
}


async function placeOrder(req, res) {
  const session = await mongoose.startSession();
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    console.log("Inside placeOrder");

    const userId = req.session.user._id;
    const { selectedAddressIndex, paymentMethod } = req.body;
   console.log(paymentMethod)
    if (!selectedAddressIndex) {
      return res
        .status(STATUS.BAD_REQUEST)
        .json({ success: false, message: "No address selected" });
    }

    if (!paymentMethod) {
      return res
        .status(STATUS.BAD_REQUEST)
        .json({ success: false, message: "No payment method selected" });
    }

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId })
        .populate("items.productId")
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const validItems=cart.items.filter((pro)=>{
        return pro.productId.isBlocked==false
      })

      const addressDoc = await Address.findOne({ userId }).session(session);
      const selectedAddress = addressDoc.address[selectedAddressIndex];

      if (!selectedAddress) {
        throw new Error("Invalid address selected");
      }

      let total = 0;
      for (const item of validItems) {
        total += item.totalPrice; // assuming already calculated in cart
      }

      for (const item of cart.items) {
        const product = item.productId;
        const variantIndex = item.variantIndex;
        const qty = item.quantity;

        if (product.variants[variantIndex].stock < qty) {
          throw new Error(`${product.productName} is out of stock`);
        }
      }

      for (const item of cart.items) {
        const product = item.productId;
        const variantIndex = item.variantIndex;
        const qty = item.quantity;

        product.variants[variantIndex].stock -= qty;
        await product.save({ session });
      }

      const customOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

      const newOrder = await Order.create(
        [
          {
            orderId: customOrderId,
            userId,
            items: cart.items,
            totalAmount: total,
            paymentMethod,
            address: selectedAddress,
            status: "Pending",
          },
        ],
        { session }
      );

      await Cart.updateOne(
        { userId },
        { $set: { items: [] } },
        { session }
      );

      res.redirect(`/ordersuccess/${newOrder[0].orderId}`);
    });

    session.endSession();
  } catch (error) {
    console.error("Place order error:", error.message);
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.redirect("/orderfailed");
  }
}


async function loadCheckout(req, res) {
    try {
        console.log('inside loadcheckout');

        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        const userId = req.session.user._id;

        const cart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                populate: [{ path: "category" }, { path: "brand" }]
            })
            .lean();

        const addressDoc = await Address.findOne({ userId }).lean();
        const addresses = addressDoc ? addressDoc.address : [];
        const defaultAddress = addresses.find(a => a.isDefault === true);

        const userDetail = await User.findById(userId).lean();
        const wishlistCount = userDetail.wishlist.length;
        console.log('wishlistCount', wishlistCount);

        if (!cart || cart.items.length === 0) {
            return res.render("checkout", {
                user: req.session.user,
                cartItems: [],
                addresses,
                subtotal: 0,
                grandTotal: 0,
                defaultAddress
            });
        }

        const filteredProducts = cart.items.filter((product) => {
            return product.productId.isBlocked === false;
        });

        let subtotal = 0;
        filteredProducts.forEach(item => {
            subtotal += item.productId.variants[item.variantIndex].price * item.quantity;
        });

        const grandTotal = subtotal;

        return res.render("checkout", {
            user: req.session.user,
            cartItems: filteredProducts,
            addresses,
            subtotal,
            grandTotal,
            defaultAddress
        });

    } catch (error) {
        return res.redirect("/pageNotFound");
    }
}



export {loadCheckout, placeOrder, orderSuccessPage, loadOrderFailed, loadOrderDetails, loadOrderList, loadOrderListData, downloadInvoice, cancelOrder, returnRequest}