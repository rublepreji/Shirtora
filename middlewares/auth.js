const User= require('../model/userSchema')


async function userAuth(req,res,next){
    if(req.session.user){
        await User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next()
            }
            else{
                res.redirect('/signin')
            }
        })
        .catch(error=>{
            console.log("Error in userAuth middleware");
            res.status(500).send('Internal server error',error)
        })
    }
}

async function adminAuth(req,res,next) {
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next()
        }else{
            res.redirect('/admin/login')
        }
    })
    .catch(error=>{
        console.log('Error in adminAuth middleware');
        res.status(500).send('Internal server error',error)
    })
}


module.exports={userAuth,adminAuth}