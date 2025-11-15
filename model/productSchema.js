import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    brand: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Brand",
        required:true
    },
    category: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    variants: {
        type: [
            {
                size:{type:String, required:true},
                price:{type:Number, required:true},
                stock:{type:Number, required:true}
            }
        ],
        required:true
    },
    productOffer: {
        type: Number,
        required: false
    },
    colour: {
        type: String,
        required: true
    },
    productImage: {
        type: [String],
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Available", "out of stock", "Discountinued"],
        required: true,
        default: "Available"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
