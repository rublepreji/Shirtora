import Brand from "../../model/brandSchema.js";

async function findBrandById(id) {
    return await Brand.findById(id);
}

async function findBrandByIdandUpdate(id,name,description,imageUrl) {
   return await Brand.findByIdAndUpdate(
          id,
          { brandName: name, description: description, brandImage: imageUrl },
          { new: true }
        );
}

async function blockUnblockBrand(id,res) {
   return await Brand.updateOne({ _id: id }, { $set: { isBlocked: res } });
}

async function getBrandList(page,limit,search) {
    const skip = (page - 1) * limit;
    const query={
        brandName:{$regex:search,$options:"i"}
    }
    const brandData = await Brand.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalBrand= await Brand.countDocuments(query)
    return {
        brandData,
        totalBrand,
        totalPages:Math.ceil(totalBrand/limit)
    }
}

async function findBrand(name) {
   await Brand.findOne({ brandName:{ $regex: new RegExp(`^${name}$`, "i") }});
}

async function createBrand(name,description,imageUrl) {
    const newBrand = new Brand({
        brandName: name,
        description: description,
        brandImage: imageUrl
    });

    return await newBrand.save(); 
}


export default {findBrandById, findBrandByIdandUpdate, blockUnblockBrand, getBrandList, findBrand, createBrand}