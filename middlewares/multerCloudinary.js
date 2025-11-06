const multer= require('multer')
const {CloudinaryStorage}= require('multer-storage-cloudinary')
const cloudinary= require('../config/cloudinary')

const uploadto= (foldername)=>{
    const storage= new CloudinaryStorage({
        cloudinary:cloudinary,
        params:{
            folder:`shirtora/${foldername}`,
            allowed_formats:['jpg','jpeg','png','webp'],
            transformation:[{width:1200,crop:'limit'}]
        },   
    })
    return multer({storage})
}

 module.exports=uploadto
