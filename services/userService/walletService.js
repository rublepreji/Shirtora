import Wallet from "../../model/walletSchema.js"
import WalletTransaction from "../../model/transactionSchema.js"
import mongoose from "mongoose";
import Cart from "../../model/cartSchema.js";
import Address from "../../model/addressSchema.js";
import Order from "../../model/orderSchema.js";


async function placeOrderWithWallet(userId,addressIndex) {
  const session = await mongoose.startSession()
  try {
    let orderDocument=null
    await session.withTransaction(async ()=>{
      const cart= await Cart.findOne({userId})
      .populate("items.productId")
      .session(session)

      if(!cart || cart.items.length==0){
        throw new Error("Cart is empty")
      }

      const wallet = await Wallet.findOne({userId}).session(session)
      if(!wallet) throw new Error("Wallet not found")

      const validItems= cart.items.filter((i)=>{
        return i.productId?.isBlocked===false
      })

      if(validItems.length===0) throw new Error("All products are blocked")

      const addressDoc= await Address.findOne({userId}).session(session)
      const selectedAddress= addressDoc.address[addressIndex]

      if(!selectedAddress) throw new Error("Invalid address selected")

      let total =0
      for(let item of validItems){
        total += item.totalPrice
      }

      let offerAmount= total
      if(cart.discountAmount>0){
        offerAmount-= cart.discountAmount
      }

      if(wallet.balance < offerAmount){
        throw new Error("Insufficient wallet balance")
      }

      for(let item of validItems){
        const product= item.productId
        product.variants[item.variantIndex].stock -= item.quantity
        await product.save({session})
      }

      wallet.balance -= offerAmount
      await wallet.save({session})

      const customOrderId=`ORD-${Date.now().toString(36).toUpperCase()}`

      const orderItems= validItems.map((i)=>({
        productId:i.productId._id,
        variantIndex:i.variantIndex,
        quantity:i.quantity,
        pricePerUnit:i.pricePerUnit,
        totalPrice:i.totalPrice
      }))
      
      const newOrder= await Order.create([{
        orderId:customOrderId,
        userId,
        items:orderItems,
        offerAmount,
        totalAmount:total,
        discountAmount:cart.discountAmount,
        paymentMethod: "WALLET",
        paymentStatus:"Paid",
        status:"Pending",
        address:selectedAddress
      }],{session})
      
      await WalletTransaction.create([{
        userId,
        amount:offerAmount,
        type:"DEBIT",
        source:"WALLET_USAGE",
        orderId:customOrderId
      }],{session})

      await Cart.updateOne({userId},{$set:{items:[],discountAmount:0,grandTotal:0}},{session})
      orderDocument= newOrder[0]
    })
    await session.endSession()
    return {success:true,order:orderDocument}
  } catch (error) {
    await session.abortTransaction().catch(()=>{})
    await session.endSession()
    return {success:false,message:error.message}
  }
}

async function debitWallet({ userId, amount, orderId }) {

  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;
  await wallet.save();

  await WalletTransaction.create({
    userId,
    amount,
    type: "DEBIT",
    source: "WALLET_USAGE",
    orderId,
    description: "Used wallet balance for order"
  });
}

async function creditWallet({ userId, amount, source, orderId, reason, itemIndex,session }) {
  console.log("credit wallet");
  
  const existingTxn= await WalletTransaction.findOne({
    userId,
    orderId,  
    source,
    itemIndex
  }).session(session)
  if(existingTxn) return 
  const wallet = await createWalletIfNotExists(userId,session);

  wallet.balance += Number(amount);
  await wallet.save({session});

  await WalletTransaction.create([{
    userId,
    amount,
    type: "CREDIT",
    source,
    orderId,
    reason,
    itemIndex
  }],{session});
}


async function createWalletIfNotExists(userId,session) {
  console.log("wallet creating");
  
  let wallet = await Wallet.findOne({ userId }).session(session);
  if (!wallet) {
    wallet = await Wallet.create([{ userId, balance:0 }],{session});
    wallet= wallet[0]
  }
  return wallet;
}


export{
    createWalletIfNotExists,
    creditWallet,
    debitWallet, 
    placeOrderWithWallet
}