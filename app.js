require('dotenv').config()
let express=require('express')
let app=express()
let db=require('./config/db')
let path=require('path')
let userRoute=require('./routes/userRouter')


app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.set("view engine","ejs")
app.set('views',[path.join(__dirname,"view/user"),path.join(__dirname,"view/admin")])
app.use(express.static(path.join(__dirname,"public")))

app.use('/',userRoute)
db()
app.listen(process.env.port,()=>{
    console.log('server is running');
    
})