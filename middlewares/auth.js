import { log } from 'console';
import User from '../model/userSchema.js';


async function userAuth(req, res, next) {
  try {
      if (!req.session.user || !req.session.user._id) {
          return res.redirect('/signin');
      }
      const userId = req.session.user._id;
      const user = await User.findById(userId);

      if (!user) {
          req.session.destroy();
          return res.redirect('/signin');
      }
      if (user.isBlocked) {
          console.log(`Blocked user attempted access: ${user.email}`);
          req.session.destroy();
          return res.redirect('/signin'); 
      }
      req.user = user; 
      next();

  } catch (error) {
      console.error('Error in userAuth middleware:', error);
      req.session.destroy(); 
      return res.redirect('/signin'); 
  }
}

async function userIsLogged(req, res, next) {
try {
    if (req.session.user && req.session.user._id) {
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        if (user && user.isBlocked) {
            req.session.destroy();
            return next(); 
        }
        return res.redirect('/'); 
    } 
      next();

} catch (error) {
    console.error('Error in userIsLogged middleware:', error);
    next();
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
