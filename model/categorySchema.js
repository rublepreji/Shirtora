let mongoose= require('mongoose')

let categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    categoryOffer:{
        type:Number,
        default:0
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})
const Category=mongoose.model("Category",categorySchema)
module.exports=Category