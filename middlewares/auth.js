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

function isAdminLogin(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    return res.redirect("/admin/login");
  }
}

function isAdminLogout(req, res, next) {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  } else {
    next();
  }
}



module.exports={userAuth,isAdminLogin,isAdminLogout}