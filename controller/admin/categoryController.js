import { json } from 'express';
import Category from '../../model/categorySchema.js';


async function blockCategory(req,res) {
  try {
    const id= req.body.id
    if(id){
      await Category.findByIdAndUpdate(id,{isBlocked:true})
      return res.status(200).json({success:true,message:"Category blocked"})
    }else{
      return res.status(400),json({success:false,message:"Category Id cannot find"})
    }
  } catch (error) {
    return res.status(500).json({success:true,message:"Internal server error"})
  }
}

async function unblockCategory(req,res) {
  try {
    const id= req.body.id
    if(id){
      await Category.findByIdAndUpdate(id,{isBlocked:false},{new:true})
      return res.status(200).json({success:true,message:"Category Unblocked"})
    }
    else{
      return res.status(400).json({success:false,message:"Category id cannot find"})
    }
  } catch (error) {
    return res.status(500).json({success:false,message:"Internal server error"})
  }
}

async function dataForCategory(req,res) {
  try {
    const page= parseInt(req.query.page) || 1
    const limit=4
    const skip= (page-1)*limit
    const search= req.query.search || ""

    const query={
      name:{$regex:search,$options:"i"}
    }

    const CategoryData=await Category.find(query)
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)

    const totalCategory= await Category.countDocuments(query)
    const totalPages= Math.ceil(totalCategory/limit)

    res.status(200).json({
      success:true,
      data:CategoryData,
      totalPages,
      currentPage:page
    })
  } catch (error) {
    res.status(500).json({success:false,message:"Internal server error"})
  }
}

async function deleteCategory(req, res) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: 'Category not found' });
    }

    await Category.findByIdAndUpdate(id, { isDeleted: true });
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function editCategory(req, res) {
  try {
    const { name, description, id } = req.body;

    const existCategory = await Category.findById(id);
    if (!existCategory) {
      return res.status(200).json({ message: 'Category not found' });
    }

    const updateCategory = await Category.findByIdAndUpdate(
      id,
      { name: name, description: description },
      { new: true }
    );

    if (updateCategory) {
      return res.status(200).json({ message: 'Category updated successfully' });
    } else {
      return res.status(404).json({ error: 'Category cannot be updated' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function loadEditCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ _id: id });
    return res.render('editCategory', { category: category });
  } catch (error) {
    console.log('Error on load Edit category');
    return res.redirect('/pageError');
  }
}

async function categoryInfo(req, res) {
  try {
    let page = parseInt(req.query.page);
    const limit = 3;
    let skip = (page - 1) * limit;

    const categoryData = await Category.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    let totalCategory = await Category.countDocuments({ isDeleted: false });
    let totalPages = Math.ceil(totalCategory / limit);

    return res.render('category', {
      currentPage: page,
      category: categoryData,
      totalPages,
      totalCategory
    });
  } catch (error) {
    console.log('Error in:', error);
    return res.redirect('/pageError');
  }
}

async function addCategory(req, res) {
  try {
    const { name, description } = req.body;
    console.log(name,' ',description);
    
    const categoryExist = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }});
    
    if (categoryExist) {
      return res.status(400).json({success:false, message: 'Category already exist' });
    }

    const newCategory = new Category({
      name,
      description
    });

    await newCategory.save();
    console.log(name + ' ' + description);
    return res.status(200).json({success:true, message: 'Category added successfully' });
  } catch (error) {
    return res.status(500).json({success:false, message: 'Internal server error' });
  }
}

async function loadAddCategory(req, res) {
  try {
    return res.render('addCategory');
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export {
  categoryInfo,
  loadAddCategory,
  addCategory,
  deleteCategory,
  loadEditCategory,
  editCategory,
  dataForCategory,
  unblockCategory,
  blockCategory
};
