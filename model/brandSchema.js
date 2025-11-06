const mongoose=require('mongoose')

let brandSchema=new mongoose.Schema({
    brandName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brandImage:{
        type:String,
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

const Brand= mongoose.model('Brand',brandSchema)
module.exports=Brand