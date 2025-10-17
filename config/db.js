let mongoose= require('mongoose')
require('dotenv').config()

let connectDb=async ()=>{
    try{
       await  mongoose.connect(process.env.mongodbURL)
        console.log("DB is connected");
        
    }
    catch(err){
        console.log('DB connection error: ',err);
        process.exit(1)
    }
}
module.exports = connectDb


