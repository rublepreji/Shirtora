import User from "../../model/userSchema.js";


async function userList(page,search,filter) {
    const limit=4
    const skip= (page-1)*limit

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

    return {
        userData,
        totalPages
    }
}

async function blockAndUnblockUser(id,res) {
    await User.updateOne({ _id: id }, { $set: { isBlocked: res } });
}

export default {
    userList,
    blockAndUnblockUser
}