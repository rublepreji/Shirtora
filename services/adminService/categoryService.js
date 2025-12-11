import Category from "../../model/categorySchema.js";

async function blockAndUnblockCategory(id,res) {
    return await Category.findByIdAndUpdate(id,{isBlocked:res})
}

async function getCategoryList(page,search) {
    const limit=4
    const skip= (page-1)*limit
    const query={
      name:{$regex:search,$options:"i"}
    }
    const categoryData=await Category.find(query)
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)

    const totalCategory= await Category.countDocuments(query)
    const totalPages= Math.ceil(totalCategory/limit)

    return {
        categoryData,
        totalPages
    }
}

async function findCategory(name) {
   return await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }});
}

async function createCategory(name,description) {
    const newCategory = new Category({
      name,
      description
    });

    return await newCategory.save();
}


export default {
    blockAndUnblockCategory,
    getCategoryList,
    findCategory,
    createCategory
}
