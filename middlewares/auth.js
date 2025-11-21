import { log } from 'console';
import User from '../model/userSchema.js';

 function userAuth(req, res, next) {
  try {
    if (req.session.user ) {
    next()
  }else{
    return res.redirect('/signin')
  }
  } catch (error) {
    console.log('something happen on userAuth',error);
  }
}

function userIsLogged(req,res,next){
  try {
    if(req.session.user){
    return res.redirect('/')
  }else{
    next()
  }
  } catch (error) {
    console.log('something happen on userIsLogged',error);
  }
}

function adminAuth(req, res, next) {
  try {
    if (req.session.admin) {
    next();
  } else {
    return res.redirect('/admin/login');
  }
  } catch (error) {
    console.log('something happen on adminAuth',error);
  }
}

function adminLogged(req, res, next) {
  try {
    if (req.session.admin) {
    return res.redirect('/admin');
  } else {
    next();
  }
  } catch (error) {
    console.log('somthing happen on adminLogged',error);
    
  }
}

export { userAuth, userIsLogged, adminLogged, adminAuth};
