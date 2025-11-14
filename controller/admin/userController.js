import User from '../../model/userSchema.js';


async function dataForUserPage(req,res) {
  try {
    const page= parseInt(req.query.page) || 1
    
    const limit=4
    const skip= (page-1)*limit
    const search= req.query.search
    const filter= req.query.filter
    const query= {
      isAdmin:false,
      ...(search?{fullName:{$regex:search,$options:"i"}}:{})
    }
    if(filter=='blocked') query.isBlocked=true
    else if(filter=='active') query.isBlocked=false

    const userData= await User.find(query)
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)

    const totalUser= await User.countDocuments(query)
    const totalPages= Math.ceil(totalUser/limit)
    res.status(200).json({
      success:true,
      data:userData,
      totalPages:totalPages,
      currentPage:page
    })

  } catch (error) {
    res.status(500).json({success:true,message:"Internal server error"})
  }
}

async function userInfo(req, res) {
  try {
    res.render('userPage');
  } catch (error) {
    res.status(500).json({success:false,message:"Internal server error"})
    console.error('Error loading user info:', error);
  }
}

async function blockUser(req, res) {
  try {
    const { id } = req.body;
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false });
  }
}

async function unBlockUser(req, res) {
  try {
    const { id } = req.body;
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    return res.json({ success: true });
  } catch (error) {
    return res.redirect({ success: false });
  }
}

export { userInfo, blockUser, unBlockUser, dataForUserPage};
