import mongoose, { Schema } from 'mongoose';

const addressSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    address: [
        {
            addressType: {
                type: String,
                required: true
            },
            firstName: {
                type: String,
                required: true
            },
            lastName:{
                type:String,
                required:true
            },
            city: {
                type: String,
                required: true
            },
            landMark: {
                type: String,
            },
            addressLine:{
                type:String,
                required:true
            },
            email:{
                type:String,
                required:true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: Number,
                required: true
            },
            phone: {
                type: String,
                required: true
            },
            isDefault:{
                type:Boolean,
                default:false
            },
            createdAt:{
                type:Date,
                default:Date.now
            },
            updatedAt:{
                type:Date,
                default:Date.now
            }
        }
    ]
});

const Address = mongoose.model('Address', addressSchema);

export default Address;
