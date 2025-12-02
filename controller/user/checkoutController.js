import User from "../../model/userSchema.js";
import Product from "../../model/productSchema.js";
import Cart from "../../model/cartSchema.js";
import Address from "../../model/addressSchema.js";
import {STATUS} from '../../utils/statusCode.js'
import Order from '../../model/orderSchema.js'
import mongoose from "mongoose";



async function loadOrderFailed(req,res) {
   try {
      res.render('orderFailed')
   } catch (error) {
      res.redirect('/pageNotFound')
   }
}

async function orderSuccessPage(req,res) {
   try {
      const orderId= req.params.id
      res.render  ('orderSuccess',{orderId:orderId})
   } catch (error) {
      res.redirect('/pageNotFound')
   }
}


async function placeOrder(req, res) {
  const session = await mongoose.startSession();
  try {
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
      // 1️⃣ Get cart inside transaction
      const cart = await Cart.findOne({ userId })
        .populate("items.productId")
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // 2️⃣ Get address
      const addressDoc = await Address.findOne({ userId }).session(session);
      const selectedAddress = addressDoc.address[selectedAddressIndex];

      if (!selectedAddress) {
        throw new Error("Invalid address selected");
      }

      // 3️⃣ Calculate total
      let total = 0;
      for (const item of cart.items) {
        total += item.totalPrice; // assuming already calculated in cart
      }

      // 4️⃣ Check stock first
      for (const item of cart.items) {
        const product = item.productId;
        const variantIndex = item.variantIndex;
        const qty = item.quantity;

        if (product.variants[variantIndex].stock < qty) {
          throw new Error(`${product.productName} is out of stock`);
        }
      }

      // 5️⃣ Deduct stock
      for (const item of cart.items) {
        const product = item.productId;
        const variantIndex = item.variantIndex;
        const qty = item.quantity;

        product.variants[variantIndex].stock -= qty;
        await product.save({ session });
      }

      // 6️⃣ Create custom order id
      const customOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // 7️⃣ Create order
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

      // 8️⃣ Clear cart
      await Cart.updateOne(
        { userId },
        { $set: { items: [] } },
        { session }
      );

      // 9️⃣ After transaction block: redirect using saved orderId
      // NOTE: newOrder is an array because of Order.create([...])
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


async function loadCheckout(req,res) {
    try {
      console.log('inside loadcheckout');
      
       const userId= req.session.user._id
       const cart =await Cart.findOne({userId:userId})
       .populate({
         path:"items.productId",
         populate:[{path:"category"},{path:"brand"}]
      }).lean()
       
      const addressDoc= await Address.findOne({userId}).lean()
      const addresses= addressDoc ? addressDoc.address :[]
      const defaultAddress= addresses.find(a=>a.isDefault===true)

      const userDetail= await User.findById(userId).lean()
      const wishlistCount= userDetail.wishlist.length
      console.log('wishlistCount',wishlistCount);
      

      if(!cart || cart.items.length==0){
        return res.render('checkout',{
            user:req.session.user,
            cartItems:[],
            addresses,
            subtotal:0,
            grandTotal:0,
            defaultAddress,
         })
      }
      const filteredProducts=cart.items.filter((product)=>{
        return product.productId.isBlocked===false
      })

      let subtotal=0
      filteredProducts.forEach(item=>{
         subtotal+=item.productId.variants[item.variantIndex].price * item.quantity
      })
      
      const grandTotal= subtotal

     return res.render('checkout',{
         user:req.session.user,
         cartItems:filteredProducts,
         addresses,
         subtotal,
         grandTotal,
         defaultAddress,
      })

    } catch (error) {
       return res.redirect('/pageNotFound')
    }
}


export {loadCheckout, placeOrder, orderSuccessPage, loadOrderFailed}