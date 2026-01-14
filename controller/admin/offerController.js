import Category from '../../model/categorySchema.js'
import Product from '../../model/productSchema.js'
import {logger} from '../../logger/logger.js'
import { STATUS } from '../../utils/statusCode.js'
import Offer from '../../model/offerSchema.js'


async function editOffer(req,res) {
    try {
        const data= req.body
        console.log(data)
        const {id}= req.params
        
        if(!data.offerName || !data.offerType || !data.availableFor || !data.description || data.offerPercentage===undefined || !data.startDate || !data.endDate){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"All fields are required!"})
        }
        const duplicateQuery={
            _id:{$ne:id},
            isActive:true,
            type:data.offerType
        }
        if(data.offerType==="product"){
            duplicateQuery.productId=data.availableFor
        }
        if(data.offerType==="category"){
            duplicateQuery.categoryId=data.availableFor
        }
        const existingOffer= await Offer.findOne(duplicateQuery)
        if(existingOffer){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Offer already exist for selected item"})
        }

        const newEndDate= new Date(data.endDate)
        const now= new Date()
        const isActiveStatus= newEndDate>now

        const updateOffer={
            title:data.offerName,
            type:data.offerType,
            description:data.description,
            startDate:new Date(data.startDate),
            endDate:new Date(data.endDate),
            isActive:isActiveStatus
        }
        
        if(data.offerType==='product'){
            updateOffer.productId=data.availableFor
            updateOffer.productOffer= Number(data.offerPercentage)
        }
        if(data.offerType==='category'){
            updateOffer.categoryId=data.availableFor
            updateOffer.categoryOffer=Number(data.offerPercentage)
        }
        
        const response=await Offer.findByIdAndUpdate(id,updateOffer,{new:true,runValidators:true})
        if(!response){
            logger.info("Not able to update the offer")
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Not able to update"})
        }
        return res.status(STATUS.OK).json({success:true,message:"Successfully updated"})
    } catch (error) {
        logger.error('Error from editOffer',error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function loadEditOffer(req,res) {
    try {
        const offerId= req.params.id
        if(!offerId){
            return res.status(STATUS.BAD_REQUEST).json({success:false,message:"Cannot find offerId"})
        }
        const offerEdit= await Offer.findById(offerId)
        .populate('productId','productName')
        .populate('categoryId','name')
        let selectedItem=null
        if(offerEdit.productId){
            selectedItem={
                id:offerEdit.productId._id,
                name:offerEdit.productId.productName
            }
        }
        if(offerEdit.categoryId){
            selectedItem={
                id:offerEdit.categoryId._id,
                name:offerEdit.categoryId.name
            }
        }                
        if(!offerEdit){
            return res.status(STATUS.NOT_FOUND).json({success:false,message:"Offer not found"})
        }
        const formattedEndDate= offerEdit.endDate.toISOString().split("T")[0]
        const formattedStartDate= offerEdit.startDate.toISOString().split("T")[0]
        return res.render('editOffer',{offerEdit,selectedItem,formattedEndDate,formattedStartDate})
    } catch (error) {
        logger.error('Error from offerController',error)
        return res.status(STATUS.OK).json({success:false,message:"Internal server error"})
    }
}

async function loadDeleteOffer(req,res) {
    try {
        const offerId= req.params.id
        await Offer.findByIdAndDelete(offerId)
        return res.redirect('/admin/offerlist')
    } catch (error) {
        logger.error("Error form loadDeleteOffer",error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function offerList(req,res) {
    try {
        const page= parseInt(req.query.page) || 1
        const search=req.query.search || ""        
        const limit=6
        const skip=(page-1)*limit

        await Offer.updateMany(
            {
                endDate:{$lt:new Date()},
                isActive:true
            },
            {$set:{isActive:false}}
        )
        let query={}
        if(search.trim()!==''){
            query.title={$regex: search,$options:"i"}
        }
        const offerData=await Offer.find(query)
        .populate('productId','productName') 
        .populate('categoryId','name')
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)

        const selectedItem= offerData.map(data=>{
            return{
                ...data.toObject(),
                appliedOn:
                    data.productId?.productName ||
                    data.categoryId?.name || null
            }
        })        
        const totalOffers= await Offer.countDocuments(query)
        const totalPages= Math.ceil(totalOffers/limit)

        return res.status(STATUS.OK).json({
            success:true,
            data:selectedItem,
            totalPages:totalPages,
            currentPage:page,
        })

    } catch (error) {
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({success:false,message:"Internal server error"})
    }
}

async function addOffer(req,res) {
    try {
        console.log("add offer");
        
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
         const newOfferData={
            title:offerName,
            description:description,
            type:offerType,
            startDate:startDate,
            endDate:endDate
         }
         if(offerType=="product"){
            newOfferData.productId=availableFor
            newOfferData.productOffer=Number(offerPercentage)
         }
         if(offerType=="category"){
            newOfferData.categoryId=availableFor
            newOfferData.categoryOffer= Number(offerPercentage)
         }
         const newOffer= new Offer(newOfferData)
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
    addOffer,
    offerList,
    loadEditOffer,
    loadDeleteOffer,
    editOffer
}