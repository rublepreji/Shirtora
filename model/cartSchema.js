import mongoose, { Schema } from 'mongoose';

const cartSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },

            variantIndex: {                     
                type: Number,
                required: true
            },

            quantity: {
                type: Number,
                default: 1
            },
            totalPrice: {
                type: Number,
                required: true
            },
            pricePerUnit: { 
                type: Number,
                required: true
            },
            status: {
                type: String,
                default: "placed"
            }
        }
    ],
    grandTotal: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
