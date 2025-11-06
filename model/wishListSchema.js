import mongoose, { Schema } from 'mongoose';

const wishListSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        addOn: {
            type: Date,
            default: Date.now
        }
    }]
});

const WishList = mongoose.model('WishList', wishListSchema);

export default WishList;
