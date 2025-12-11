import User from '../../model/userSchema.js'
import bcrypt from 'bcrypt'

async function verifyPassword(inputPassword, hashedPassword) {
   return await bcrypt.compare(inputPassword,hashedPassword)
}

async function findAdminByEmail(email) {
    return await User.findOne({email,isAdmin:true})
}


export default {verifyPassword, findAdminByEmail}
