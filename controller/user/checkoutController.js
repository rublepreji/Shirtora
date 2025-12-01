import User from "../../model/userSchema.js";
import Product from "../../model/productSchema.js";
import Cart from "../../model/cartSchema.js";
import Address from "../../model/addressSchema.js";
import {STATUS} from '../../utils/statusCode.js'
import Order from '../../model/orderSchema.js'
import {generateOrderId} from '../../helpers/generateOrderId.js'


async function orderSuccessPage(req,res) {
   try {
      const orderId= req.params.id
      res.render('orderSuccess',{orderId:orderId})
   } catch (error) {
      res.redirect('/pageNotFound')
   }
}


async function placeOrder(req,res) {
   try {
      const userId= req.session.user._id
      const {selectedAddressIndex, paymentMethod}= req.body

      if(!selectedAddressIndex){
         return res.status(STATUS.BAD_REQUEST).json({success:false,message:"No address selected"})
      }

      if(!paymentMethod){
         return res.status(STATUS.BAD_REQUEST).json({success:false,message:"No payment method selected"})
      }

      const cart= await Cart.findOne({userId}).populate("items.productId")

      if(!cart || cart.items.length==0){
         return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Cart is empty"})
      }

      const addressDoc= await Address.findOne({userId})
      const selectedAddress= addressDoc.address[selectedAddressIndex]

      let total = 0;
      for (const item of cart.items) {
         total += item.totalPrice;   // GOOD
      }

      for(const item of cart.items){
         const product= item.productId
         const variantIndex= item.variantIndex
         const qty= item.quantity

         product.variants[variantIndex].stock-=qty

         if(product.variants[variantIndex].stock<0){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:`${product.productName} is out of stock`})
         }
         await product.save()
      }

      const orderId=await generateOrderId()

      const newOrder= new Order({
         orderId,
         userId,
         items:cart.items,
         totalAmount:total,
         paymentMethod,
         address:selectedAddress,
         status:"Pending"
      })
      await newOrder.save()
      await Cart.updateOne({userId},{$set:{items:[]}})
      return res.redirect(`/ordersuccess/${newOrder.orderId}`)
   } catch (error) {      
      return res.redirect('/pageNotFound')
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
         res.render('checkout',{
            user:req.session.user,
            cartItems:[],
            addresses,
            subtotal:0,
            grandTotal:0,
            defaultAddress,
         })
      }
      let subtotal=0
      cart.items.forEach(item=>{
         subtotal+=item.productId.variants[item.variantIndex].price * item.quantity
      })
      const grandTotal= subtotal

      res.render('checkout',{
         user:req.session.user,
         cartItems:cart.items,
         addresses,
         subtotal,
         grandTotal,
         defaultAddress
      })

    } catch (error) {
       return res.redirect('/pageNotFound')
    }
}


export {loadCheckout, placeOrder, orderSuccessPage}