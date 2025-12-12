import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderId:{
    type:String,
    required:true,
    unique:true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
},
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product" 
      },
      quantity: Number,
      variantIndex: Number,
      itemStatus: {
        type: String,
        enum: ["Ordered", "Cancelled", "Returned", "Delivered", "Return-Approved", "Return-Rejected","Return Requested"],
        default: "Ordered"
      },
      returnReason:{
      type:String,
      default:null
    },
    }
  ],
  totalAmount: Number,
  paymentMethod: String,
  address: Object,
  status:{
    type:String,
    enum:['Pending','Processing','Shipped','Delivered','Cancelled','Return Requested','Returned'],
    default:'Pending'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("Order", orderSchema);
