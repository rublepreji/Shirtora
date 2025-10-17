const pageNotFound= async(req,res)=>{
    try{
        res.render('pageNotFound')
    }
    catch(err){
        console.log(err);
        res.status(500).json('Page not found: ',err)
        
    }
}

const loadHomePage= async(req,res)=>{
    try{
        res.render('landingPage')
    }
    catch(err){
        res.status(500).json('some error: ',err)
    }
}


module.exports={loadHomePage,pageNotFound}