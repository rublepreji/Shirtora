import Brand from '../../model/brandSchema.js';
import {STATUS} from '../../utils/statusCode.js'
import BrandService from '../../services/adminService/brandService.js';


async function editBrand(req, res) {
  try {
    const { id, name, description } = req.body;

    const brand = await BrandService.findBrandById(id)
    if (!brand) {
      return res.status(STATUS.NOT_FOUND).json({success:false, message: 'Brand not found' });
    }

    let imageUrl = brand.brandImage;
    if (req.file) {
      imageUrl = req.file.path;
    }

    const updateBrand = await BrandService.findBrandByIdandUpdate(id,name,description,imageUrl)

    if (updateBrand) {
      return res.status(STATUS.OK).json({success:true, message: 'Brand updated successfully' });
    } else {
      return res.status(STATUS.BAD_REQUEST).json({success:false, message: 'Brand cannot be updated' });
    }
  } catch (err) {
    console.log('Error editBrand:', err);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false, message: 'Internal server error' });
  }
}

async function loadEditBrand(req, res) {
  try {
    const id = req.params.id;
    const brand = await BrandService.findBrandById(id);
    return res.render('editBrand', { data: brand });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
}

async function blockBrand(req, res) {
  try {
    console.log('blocking');
    const { id } = req.body;
    if (!id) {
      return res.status(STATUS.NOT_FOUND).json({ success: false, message: 'Brand not found' });
    }
    await BrandService.blockUnblockBrand(id, true)
    return res.status(STATUS.OK).json({ success: true, message: 'Brand has been blocked!' });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
  }
}

async function unBlockBrand(req, res) {
  try {
    console.log('unblocking');
    const { id } = req.body;
    if (!id) {
      return res.status(STATUS.NOT_FOUND).json({ success: false, message: 'Brand not found' });
    }
    await BrandService.blockUnblockBrand(id,false)
    return res.status(STATUS.OK).json({ success: true, message: 'Brand has been unBlocked' });
  } catch (error) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
  }
}

async function loadBrandPage(req, res) {
  try {
    res.render('brand');
  } catch (error) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Brand page not found' });
  }
}

async function dataForBrandPage(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;  
    const search = req.query.search || '';
    const result= await BrandService.getBrandList(page,limit,search)

    return res.json({
      status: true,
      data: result.brandData,
      currentPage: page,
      totalBrand:result.totalBrand,
      totalPages:result.totalPages
    });
  } catch (error) {
    logger.error('error', error);
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
      return res.status(STATUS.BAD_REQUEST).json({ message: 'Please fill all the fields' });
    }
    if (!req.file) {
      return res.status(STATUS.BAD_REQUEST).json({ message: 'No image is uploaded' });
    }

    console.log(req.file);

    const brand = await BrandService.findBrand(name)
    if (brand) {
      return res.status(STATUS.BAD_REQUEST).json({ message: 'Brand already exist' });
    }

    const imageUrl = req.file.path;
    await BrandService.createBrand(name,description,imageUrl)

    return res.status(STATUS.OK).json({ message: 'Brand added successfully' });
  } catch (error) {
    console.log('Error on uploading brand');
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error', error });
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
