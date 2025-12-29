import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ["CREDIT", "DEBIT"],
    required: true
  },
  source: {
    type: String,
    enum: [
      "ORDER_REFUND",
      "PAYMENT_FAILED",
      "CASHBACK",
      "WALLET_USAGE"
    ],
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null
  },
  reason: String,
  // createdAt:{
  //   type:Date,
  //   default:Date.now()
  // }
}, { timestamps: true });

export default mongoose.model("WalletTransaction", walletTransactionSchema);
