import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description:{
    type:String,
    required:true
  },
  type: {
    type: String,
    enum: ["product", "category"],
    required: true
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null
  },

  discountPercentage: {
    type: Number,
    required: true,
    min: 1,
    max: 90
  },

  isActive: {
    type: Boolean,
    default: true
  },

  startDate: Date,
  endDate: Date
}, { timestamps: true });

export default mongoose.model("Offer", offerSchema);
