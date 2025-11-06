import User from '../../model/userSchema.js';

async function userInfo(req, res) {
  try {
    let filter = req.query.filter || 'all';
    let search = req.query.search || '';
    let page = parseInt(req.query.page) || 1;
    const limit = 3;

    const query = {
      isAdmin: false,
      $or: [
        { fullName: { $regex: '.*' + search + '.*' } },
        { email: { $regex: '.*' + search + '.*' } }
      ]
    };

    if (filter == 'blocked') query.isBlocked = true;
    else if (filter == 'active') query.isBlocked = false;

    const userData = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.find(query).countDocuments();

    res.render('userPage', {
      data: userData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      search,
      filter
    });
  } catch (error) {
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

export { userInfo, blockUser, unBlockUser };
