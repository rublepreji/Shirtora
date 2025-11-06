let mongoose=require('mongoose')

let productSchema=new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    variants:{
        type: [],
        required:true
    },
    productOffer:{
        type:Number,
        required:false
    },
    colour:{
        type:String,
        required:true
    },
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","out of stock","Discountinued"],
        required:true,
        default:"Available"
    }
},{timestamps:true})

const Product=mongoose.model('Product',productSchema)
module.exports=Product