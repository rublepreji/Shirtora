const User= require('../../model/userSchema')
const bcrypt= require('bcrypt')


async function adminLogout(req,res){
    try {
        console.log('logout');
        
        req.session.destroy(err=>{
            if(err){
                console.log("Error occur during logout(Session destroy)");
                return res.redirect('/admin/pageError')
            }
            return res.redirect('/admin/login')
        })
    } catch (error) {
        console.log("unexpected error in logout");
        res.redirect('/admin/pageError')
    }
}

async function pageError(req,res){
    try {
        return res.render('pageError')
    } catch (error) {
        console.log("Error in rendering errorPage");
        res.status(500).send('Internal server error')        
    }
}
async function loadLogin(req,res){
    try {
        if(req.session.admin){
            return res.redirect('/admin/dashboard')
        }
        return res.render('adminLogin')
    } catch (error) {
        console.log("Error in loadLogin",error);
        
        return res.redirect('/admin/pageError')
    }
}
async function login(req,res){
    try {
        const {email,password}=req.body
        console.log(email+' '+password);
        
        const admin= await User.findOne({email:email,isAdmin:true})

        if(admin){
            const passwordMatch=await bcrypt.compare(password, admin.password)
            if(passwordMatch){
                req.session.admin=true
                return res.redirect('/admin')
            }
            else{
                console.log("Password do not match");
                
                return res.redirect('/admin/login')
            }
        }
        else{
            console.log("Cannot find admin");
            return res.redirect('/admin/login')
        }
    } catch (error) {
        console.log("Login error",error);
        return res.redirect('/pageError')
    }
}

async function loadDashboard(req,res){
    try {
        if(req.session.admin){
           return res.render('dashboard')
        }
    } catch (error) {
        return res.redirect('/pageError')
    }
}



module.exports={loadLogin,login,loadDashboard,pageError,adminLogout}