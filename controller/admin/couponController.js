import { logger } from "../../logger/logger.js"
import Coupon from "../../model/couponSchema.js"
import { STATUS } from "../../utils/statusCode.js"

async function editCoupon(req,res) {
    try {
        const data= req.body
        console.log("data",data);
        
        if(!data){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Creditials not found"})
        }
        const result=await Coupon.updateOne({couponCode:data.couponCode},{$set:{
          discountPercent: data.discount,
          totalUsageLimit: data.totalLimit,
          usageLimitPerUser: data.perUserLimit,
          minimumPrice: data.minPurchase,
          upto: data.upto,
          createdOn: new Date(data.startDate),
          expireOn: new Date(data.endDate)
        }})
        if (result.matchedCount === 0) {
            return res.status(STATUS.NOT_FOUND).json({
            success: false,
            message: "Coupon not found"
        });
    }
        return res.status(STATUS.OK).json({success:true,message:"Edited successfully"})
    } catch (error) {
        logger.error("Error from editCoupon",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function loadEditCoupon(req,res) {
    try {
        const id=req.params.id        
        const selectedCoupon= await Coupon.findById(id)
        const startDate= selectedCoupon.createdOn.toISOString().split("T")[0]  
        const endDate= selectedCoupon.expireOn.toISOString().split("T")[0]     
        return res.render("editCoupon",{selectedCoupon,startDate,endDate})
    } catch (error) {
        logger.error("Error from loadEditCoupon",error)
        return res.redirect("/pageNotFound")
    }
}

async function deleteCoupon(req,res) {
    try {
        const id= req.query.id
        const result=await Coupon.findByIdAndDelete(id)
        if(!result){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Not able to delete the coupon"})
        }  
        return res.status(STATUS.OK).json({success:true,message:"Coupon deleted successfully"})      
    } catch (error) {
        logger.error("Error from delete coupon",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function dataForCouponPage(req,res) {
    try {
        const page= parseInt(req.query.page) || 1
        const search= req.query.search || ''
        const limit=1
        const skip= (page-1)*limit

        const query={couponCode:{$regex:search,$options:"i"}}
        const couponData=await Coupon.find(query)
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)

        const totalCoupons= await Coupon.countDocuments(query)
        const totalPages= Math.ceil(totalCoupons/limit)

        return res.status(STATUS.OK).json({
            success:true,
            data:couponData,
            totalPages,
            currentPage:page
        })
    } catch (error) {
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function addCoupon(req,res) {
    try {
        const {
            couponCode,
            discount,
            totalLimit,
            perUserLimit,
            minPurchase,
            upto,
            startDate,
            endDate
        }= req.body
        const existingCoupon= await Coupon.findOne({couponCode:{$regex:new RegExp(`^${couponCode}$`,"i")}})

        if(existingCoupon){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"A coupon with this code already exists."})
        }

        const newCoupon= new Coupon({
            couponCode:couponCode.trim().toUpperCase(),
            discountPercent:Number(discount),
            totalUsageLimit:Number(totalLimit),
            usageLimitPerUser:Number(perUserLimit),
            minimumPrice:Number(minPurchase),
            upto:Number(upto),
            createdOn:new Date(startDate),
            expireOn: new Date(endDate)
        })
        await newCoupon.save()
        return res.status(STATUS.OK).json({success:true,message:"Coupon added successfully"})
    } catch (error) {
        logger.error("Error from addCoupon ",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}


async function getAddCoupon(req,res) {
    try {
        res.render('addCoupon')
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

async function loadCoupon(req,res) {
    try {
        res.render("couponList")
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

export {loadCoupon, getAddCoupon, addCoupon, dataForCouponPage, deleteCoupon, loadEditCoupon, editCoupon}