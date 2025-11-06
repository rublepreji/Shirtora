    let passpord=require('passport')
    let googleStrategy=require('passport-google-oauth20').Strategy
    let User= require('../model/userSchema')
    require('dotenv').config()

    passpord.use(new googleStrategy({
        clientID: process.env.GOOGLECLIENTID,
        clientSecret:process.env.GOOGLECLIENTSECRET,
        callbackURL:'http://localhost:3000/auth/google/callback',
    },

    async (accessToken,refreshToken,profile,done)=>{
        try {
            let fullName=profile.displayName.split(' ')
            let firstName=fullName[0]
            let lastName=fullName.slice(1).join('')
            let user= await User.findOne({googleId:profile.id})
            if(user){
                return done(null,user)
            }
            else{
                const user= new User({
                    firstName,
                    lastName,
                    email:profile.emails[0].value,
                    googleId:profile.id
                })
                await user.save()
                return done(null,user)
            }
        } catch (error) {
            return done(error,null)
        }
    }
    ))
    passpord.serializeUser((user,done)=>{
        done(null,user.id)
    })
    passpord.deserializeUser((id,done)=>{
        User.findById(id)
        .then(user=>{
            done(null,user)
        })
        .catch(err=>{
            done(err,null)
        })
    })

    module.exports=passpord
