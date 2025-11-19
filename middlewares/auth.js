import User from '../model/userSchema.js';

 function userAuth(req, res, next) {
  if (req.session.user ) {
    next()
  }else{
    return res.redirect('/signin')
  }
}

function userIsLogged(req,res,next){
  if(req.session.user){
    return res.redirect('/')
  }else{
    next()
  }
}

function adminAuth(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    return res.redirect('/admin/login');
  }
}

function adminLogged(req, res, next) {
  if (req.session.admin) {
    return res.redirect('/admin');
  } else {
    next();
  }
}

export { userAuth, userIsLogged, adminLogged, adminAuth};
