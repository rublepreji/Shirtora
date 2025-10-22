let nodeMailer=require('nodemailer')
let bcrypt= require('bcrypt')

function generateOtp(){    
    return Math.floor(100000+Math.random()*900000)
}

async function sendEmailVerification(email,otp){    
    try {
        const transporter= nodeMailer.createTransport({
        service:'gmail',
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
            user:process.env.nodeMailerEmail,
            pass:process.env.nodeMailerPassword
        }
    })
    const info =await transporter.sendMail({
        from:process.env.nodeMailerEmail,
        to:email,
        subject:"Verify your account",
        text:`Your OTP is ${otp}`,
        html:`<b>Your OTP:${otp}</b>`
    })
    return info.accepted.length>0
    } catch (error) {
        console.log("Error on sending email ",error);
        return false
    }
}
async function securePassword(password){
    const hashedPassword= bcrypt.hash(password,10)
    return hashedPassword
}

module.exports={generateOtp,sendEmailVerification,securePassword}