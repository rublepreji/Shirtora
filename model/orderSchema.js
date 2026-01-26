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
      totalPrice: {
        type: Number,
        required: true
      },
      pricePerUnit: { 
          type: Number,
          required: true
      },
      originalPrice:Number,
      discountAmount:Number,
      finalPrice:Number,
      quantity: Number,
      variantIndex: Number,
      itemStatus: {
        type: String,
        enum: ["Ordered","Processing", "Tracking", "Shipped","Cancelled", "Delivered", "Return-Approved", "Return-Rejected","Return Requested"],
        default: "Ordered"
      },
      returnReason:{  
      type:String,
      default:null 
    },
    isRefunded:{
      type:Boolean,
      default:false
    }
    }
  ],
  totalAmount: Number,
  offerAmount:Number, 
  totalOffer:Number, //offer
  discountAmount:{ //coupon
   type: Number,
   default:0
  },
  paymentMethod: String,
  address: Object,
  status:{
    type:String,
    enum:['Pending','Processing', 'Tracking','Ordered','Shipped','Delivered','Cancelled','Return Requested','Returned','Payment Failed','Mixed Status','Partially Completed','Partially Returned','Partially Cancelled'],
    default:'Pending'
  },
  paymentStatus:{
    type:String,
    enum:['Pending','Paid','Failed','Refunded'],
    default:'Pending'
  },
  razorpayOrderId:String,
  razorpayPaymentId:String,
  razorpaySignature:String,
  paymentFailureReason:String,
  cancelReason:String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  isStockRestored:{
    type:Boolean,
    default:false
  }
});

export default mongoose.model("Order", orderSchema);
