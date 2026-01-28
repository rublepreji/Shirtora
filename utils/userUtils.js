import nodeMailer from 'nodemailer';
import bcrypt from 'bcrypt';

function generateOtp() {    
    return Math.floor(100000 + Math.random() * 900000);
}

async function sendEmailVerification(email, otp) {    
    try {
        const transporter = nodeMailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILEREMAIL,
                pass: process.env.NODEMAILERPASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILEREMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP:${otp}</b>`
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.log("NODEMAILER ERROR FULL:", error);
        console.log("NODEMAILER MESSAGE:", error?.message);
        console.log("NODEMAILER CODE:", error?.code);
        return false;
    }

}

async function sendEmailForgotPassword(email, otp) {    
    try {
        const transporter = nodeMailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILEREMAIL,
                pass: process.env.NODEMAILERPASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILEREMAIL,
            to: email,
            subject: "Your OTP for Password reset",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP:${otp}</b>`
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.log("Error on sending email ", error);
        return false;
    }
}

async function securePassword(password) {
    const hashedPassword = bcrypt.hash(password, 10);
    return hashedPassword;
}

export { generateOtp, sendEmailVerification, securePassword, sendEmailForgotPassword };