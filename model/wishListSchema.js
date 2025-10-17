let mongoose=require('mongoose')

let wishListSchema=new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    products:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        addOn:{
            type: Date,
            default:Date.now
        }
    }]
})

let WishList=mongoose.model('WishList',wishListSchema)
module.exports=WishList