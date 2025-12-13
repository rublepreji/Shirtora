import Category from '../../model/categorySchema.js'
import Product from '../../model/productSchema.js'
import {logger} from '../../logger/logger.js'
import { STATUS } from '../../utils/statusCode.js'
import Offer from '../../model/offerSchema.js'

async function addOffer(req,res) {
    try {
        const {
            offerName,
            offerType,
            availableFor,
            description,
            offerPercentage,
            startDate,
            endDate
        }=req.body
        if(!offerName||!description||!offerPercentage||!startDate||!endDate||!offerType||!availableFor){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"All fields are required"})
        }
        const query={
            isActive:true
        }
        if(offerType=='product'){
            query.productId=availableFor
        }else if(offerType=='category'){
            query.categoryId=availableFor
        }
        const existingOffer= await Offer.findOne(query);
        if(existingOffer){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Active offer already exists"})
        }
         const newOffer=new Offer({
            title:offerName,
            description:description,
            type:offerType,
            productId:offerType=='product'?availableFor :null,
            categoryId:offerType=='category'?availableFor:null,
            discountPercentage:Number(offerPercentage),
            startDate:startDate,
            endDate:endDate
         })
        await newOffer.save()
        return res.status(STATUS.OK).json({success:true,message:"Offer added successfully"})
    } catch (error) {
        logger.error('Error from addOffer',error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function getOfferTargets(req,res) {
    try {
        const {type}= req.query
        let data=[]
        if(type==="category"){
            data=await Category.find({isBlocked:false},{name:1})
        }
        if(type==="product"){
            data=await Product.find({isBlocked:false},{productName:1})
        }
        return res.status(STATUS.OK).json({success:true,data})
    } catch (error) {
        logger.info("Error form getOfferTargets",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function loadAddOffer(req,res) {
    try {
        return res.render('addOffer')
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

async function loadOfferList(req,res) {
    try {
       return res.render('offerList')
    } catch (error) {
       return res.redirect('/pageNotFound')
    }
}

export {
    loadOfferList,
    loadAddOffer,
    getOfferTargets,
    addOffer
}