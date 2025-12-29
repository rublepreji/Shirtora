import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    couponCode:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    expireOn: {
        type: Date,
        required: true
    },
    discountPercent: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    upto:{
        type:Number,
        required:true
    },
    minimumPrice: {
        type: Number,
        required: true
    },
    totalUsageLimit:{
        type:Number
    },
    usageLimitPerUser:{
        type:Number,
        default:1
    },
    usedCount:{
        type:Number,
        default:0
    }, 
    isActive:{
        type:Boolean,
        default:true
    },
},{timestamps:true});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
