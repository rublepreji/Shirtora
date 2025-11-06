import User from '../../model/userSchema.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import session from 'express-session';
import * as utils from '../../utils/userUtils.js';

dotenv.config();

async function verifyPassOtp(req, res) {
  try {
    const { otp } = req.body;
  } catch (error) {
    console.error('Error verifying password OTP:', error);
  }
}

async function verifyEmail(req, res) {
  try {
    const { email } = req.body;

    const findUser = await User.findOne({ email: email });
    if (findUser) {
      const otp = utils.generateOtp();
      const emailSent = utils.sendEmailForgotPassword(email, otp);
      if (emailSent) {
        req.session.userOtp = otp;
        req.session.email = email;
        console.log('Forgot OTP:', otp);
        res.render('forgotOTP');
      } else {
        return res
          .status(400)
          .json({ success: false, message: 'Failed to send OTP. Please try again' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'User does not exist' });
    }
  } catch (error) {
    return res.redirect('/pageNotFound');
  }
}

async function loadForgotPassword(req, res) {
  try {
    return res.render('forgotPassword');
  } catch (error) {
    return res.redirect('/pageNotFound');
  }
}

export { loadForgotPassword, verifyEmail, verifyPassOtp };
