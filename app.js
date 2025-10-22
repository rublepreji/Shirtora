require('dotenv').config()
const express=require('express')
const app=express() 
const session= require('express-session')  
const db=require('./config/db')
const path=require('path')
const userRoute=require('./routes/userRouter')


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret:process.env.sessionSecret,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*100
    }
}))

app.set("view engine","ejs")
app.set('views',[path.join(__dirname,"view/user"),path.join(__dirname,"view/admin")])
app.use(express.static(path.join(__dirname,"public")))

app.use('/',userRoute)
db()
app.listen(process.env.port,()=>{
    console.log('server is running');
    
})