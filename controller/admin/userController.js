import {STATUS} from '../../utils/statusCode.js'
import {logger} from '../../logger/logger.js'
import userService from '../../services/adminService/userService.js';

async function dataForUserPage(req,res) {
  try {
    const page= parseInt(req.query.page) || 1
    const search= req.query.search
    const filter= req.query.filter
   
    const result= await userService.userList(page,search,filter)

    return res.status(STATUS.OK).json({
      success:true,
      data:result.userData,
      totalPages:result.totalPages,
      currentPage:page
    })

  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:true,message:"Internal server error"})
  }
}

async function userInfo(req, res) {
  try {
    res.render('userPage');
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
  }
}

async function blockUser(req, res) {
  try {
    const { id } = req.body;
    await userService.blockAndUnblockUser(id,true)
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false });
  }
}

async function unBlockUser(req, res) {
  try {
    const { id } = req.body;
    await userService.blockAndUnblockUser(id,false)
    return res.json({ success: true });
  } catch (error) {
    return res.redirect({ success: false });
  }
}

export { userInfo, blockUser, unBlockUser, dataForUserPage};
