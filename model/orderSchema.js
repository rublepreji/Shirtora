import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId:{
        type:String,
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
        ref: "Product" },
        quantity: Number,
        variantIndex: Number
    }
  ],
  totalAmount: Number,
  paymentMethod: String,
  address: Object,
  status: {
    type: String,
    default: "Pending"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", orderSchema);
