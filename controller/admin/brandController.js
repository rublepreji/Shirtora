import Brand from '../../model/brandSchema.js';
import Product from '../../model/productSchema.js';
import cloudinary from '../../config/cloudinary.js';

async function editBrand(req, res) {
  try {
    const { id, name, description } = req.body;
    console.log(id, ' ', name, ' ', description);

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(400).json({success:false, message: 'Brand not found' });
    }

    let imageUrl = brand.brandImage;
    if (req.file) {
      imageUrl = req.file.path;
    }

    const updateBrand = await Brand.findByIdAndUpdate(
      id,
      { brandName: name, description: description, brandImage: imageUrl },
      { new: true }
    );

    if (updateBrand) {
      return res.status(200).json({success:true, message: 'Brand updated successfully' });
    } else {
      return res.status(400).json({success:false, message: 'Brand cannot be updated' });
    }
  } catch (err) {
    console.log('Error editBrand:', err);
    return res.status(500).json({success:false, message: 'Internal server error' });
  }
}

async function loadEditBrand(req, res) {
  try {
    const id = req.params.id;
    const brand = await Brand.findOne({ _id: id });
    return res.render('editBrand', { data: brand });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function blockBrand(req, res) {
  try {
    console.log('blocking');
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Brand not found' });
    }
    await Brand.updateOne({ _id: id }, { $set: { isBlocked: true } });
    return res.status(200).json({ success: true, message: 'Brand has been blocked!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function unBlockBrand(req, res) {
  try {
    console.log('unblocking');
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Brand not found' });
    }
    await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });
    return res.status(200).json({ success: true, message: 'Brand has been unBlocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function loadBrandPage(req, res) {
  try {
    res.render('brand');
  } catch (error) {
    res.status(500).json({ message: 'Brand page not found' });
  }
}

async function dataForBrandPage(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const query = {
      brandName: { $regex: '.*' + search + '.*' }
    };

    const brandData = await Brand.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBrand = await Brand.countDocuments(query);
    const totalPages = Math.ceil(totalBrand / limit);

    return res.json({
      status: true,
      data: brandData,
      currentPage: page,
      totalBrand,
      totalPages
    });
  } catch (error) {
    console.log('error', error);
    return res.redirect('/admin/pageError');
  }
}

async function loadAddbrand(req, res) {
  try {
    res.render('addBrand');
  } catch (error) {
    res.redirect('/admin/pageError');
  }
}

async function addBrand(req, res) {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: 'Please fill all the fields' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image is uploaded' });
    }

    console.log(req.file);

    const brand = await Brand.findOne({ brandName:{ $regex: new RegExp(`^${name}$`, "i") }});
    if (brand) {
      return res.status(400).json({ message: 'Brand already exist' });
    }

    const imageUrl = req.file.path;
    const newBrand = new Brand({
      brandName: name,
      description: description,
      brandImage: imageUrl
    });

    await newBrand.save();
    return res.status(200).json({ message: 'Brand added successfully' });
  } catch (error) {
    console.log('Error on uploading brand');
    return res.status(500).json({ message: 'Internal server error', error });
  }
}

export {
  loadBrandPage,
  loadAddbrand,
  addBrand,
  blockBrand,
  unBlockBrand,
  loadEditBrand,
  editBrand,
  dataForBrandPage
};
