import mongoose, { Schema } from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        // required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    wishlist:[{
        type:Schema.Types.ObjectId,
    }]
    ,
    phone: {
        type: Number,
        default: null
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    profileImg:{
        type:String,

    },
    password: {
        type: String,
        required: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    cart: [
        {
            type: Schema.Types.ObjectId,
            ref: "Cart"
        }
    ],
    wallet: [
        {
            // type: Schema.Types.ObjectId,
            // ref: "wallet"
        }
    ],
    orderHistory: [
        {
            // type: Schema.Types.ObjectId,
            // ref: "order"
        }
    ],
    createOn: {
        type: Date,
        // default: Date.now
    },
    referralCode: {
        type: String
    },
    redeemed: {
        type: Boolean
    },
    redeemedUsers: [
        {
            // type: Schema.Types.ObjectId,
            // ref: "User"
        }
    ],
    searchHistory: [
        {
            category: {
                // type: Schema.Types.ObjectId,
                // ref: "category"
            },
            brand: {
                type: String
            },
            searchOn: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

const User = mongoose.model('users', userSchema);

export default User;
