import { STATUS } from "../../utils/statusCode.js"
import Order from "../../model/orderSchema.js"
import { logger } from "../../logger/logger.js"
import User from "../../model/userSchema.js"
import getDateFilter from "../../utils/getDateFilter.js"

async function getDashboardData(req,res){
  try{
    const { range } = req.query

    const now = new Date()

    let match = { status:"Delivered" }
    let group = {}
    let sortField = "_id.month"

    // date filter
    let dateFilter = {}

    if(range === "yearly"){
      dateFilter.createdAt = {
        $gte: new Date(now.getFullYear(),0,1),
        $lte: new Date(now.getFullYear(),11,31,23,59,59)
      }
    }

    if(range === "monthly"){
      dateFilter.createdAt = {
        $gte: new Date(now.getFullYear(),now.getMonth(),1),
        $lte: new Date(now.getFullYear(),now.getMonth()+1,0,23,59,59)
      }
    }

    if(range === "weekly"){
      const first = new Date(now)
      first.setDate(now.getDate() - now.getDay())

      const last = new Date(first)
      last.setDate(first.getDate() + 6)

      dateFilter.createdAt = { $gte:first, $lte:last }
    }

    match = { ...match, ...dateFilter }

    const dateFilters = getDateFilter(range)

const topProducts = await Order.aggregate([
    { $match:{ status:"Delivered", ...dateFilters }},
    { $unwind:"$items" },
    { $match:{ "items.itemStatus":"Delivered" }},
    {
      $group:{
        _id:"$items.productId",
        totalQty:{ $sum:"$items.quantity" }
      }
    },
    { $sort:{ totalQty:-1 }},
    { $limit:10 },
    {
      $lookup:{
        from:"products",
        localField:"_id",
        foreignField:"_id",
        as:"product"
      }
    },
    { $unwind:"$product" }
  ])

const topCategories = await Order.aggregate([
  { $match:{ status:"Delivered", ...dateFilter }},
  { $unwind:"$items" },
  { $match:{ "items.itemStatus":"Delivered" }},

  {
    $lookup:{
      from:"products",
      localField:"items.productId",
      foreignField:"_id",
      as:"prod"
    }
  },
  { $unwind:"$prod" },

  {
    $group:{
      _id:"$prod.category", 
      totalQty:{ $sum:"$items.quantity" }
    }
  },

  // Lookup category name
  {
    $lookup:{
      from:"categories",
      localField:"_id",
      foreignField:"_id",
      as:"category"
    }
  },
  { $unwind:"$category" },

  {
    $project:{
      _id:0,
      name:"$category.name",
      totalQty:1
    }
  },

  { $sort:{ totalQty:-1 }},
  { $limit:10 }
])


const topBrands = await Order.aggregate([
  { $match:{ status:"Delivered", ...dateFilter }},
  { $unwind:"$items" },
  { $match:{ "items.itemStatus":"Delivered" }},

  {
    $lookup:{
      from:"products",
      localField:"items.productId",
      foreignField:"_id",
      as:"prod"
    }
  },
  { $unwind:"$prod" },

  {
    $group:{
      _id:"$prod.brand", 
      totalQty:{ $sum:"$items.quantity" }
    }
  },

  // lookup brand name
  {
    $lookup:{
      from:"brands",
      localField:"_id",
      foreignField:"_id",
      as:"brand"
    }
  },
  { $unwind:"$brand" },

  {
    $project:{
      _id:0,
      name:"$brand.brandName",
      totalQty:1
    }
  },

  { $sort:{ totalQty:-1 }},
  { $limit:10 }
])

  // grouping logic

  if(range === "yearly"){
    group = {
      _id:{ month:{ $month:"$createdAt" }},
      totalOrders:{ $sum:1 }
    }
    sortField="_id.month"
  }

  if(range === "monthly"){
    group = {
      _id:{ week:{ $week:"$createdAt" }},
      totalOrders:{ $sum:1 }
    }
    sortField="_id.week"
  }

  if(range === "weekly"){
    group = {
      _id:{ day:{ $dayOfWeek:"$createdAt" }},
      totalOrders:{ $sum:1 }
    }
    sortField="_id.day"
  }

  // chart data
  const chartData = await Order.aggregate([
    { $match: match },
    { $group: group },
    { $sort: { [sortField]:1 } }
  ])

  // Total users
  let userMatch = {}

  if(range === "yearly"){
    userMatch.createdAt = {
      $gte:new Date(now.getFullYear(),0,1),
      $lte:new Date(now.getFullYear(),11,31,23,59,59)
    }
  }

  if(range === "monthly"){
    userMatch.createdAt = {
      $gte:new Date(now.getFullYear(),now.getMonth(),1),
      $lte:new Date(now.getFullYear(),now.getMonth()+1,0,23,59,59)
    }
  }

  if(range === "weekly"){
    const first = new Date(now)
    first.setDate(now.getDate() - now.getDay())
    const last = new Date(first)
    last.setDate(first.getDate() + 6)

    userMatch.createdAt = { $gte:first, $lte:last }
  }

  const totalUsers = await User.countDocuments({...userMatch,isAdmin:false})

  // summary
  const summaryAgg = await Order.aggregate([
  { $match: match },

  { $unwind: "$items" },

  {
    $match: {
      "items.itemStatus": "Delivered"
    }
  },

  {
    $group: {
      _id: "$_id",
      orderTotal: { $sum: "$items.totalPrice" }
    }
  },

  {
    $group: {
      _id: null,
      totalSales: { $sum: "$orderTotal" },
      totalOrders: { $sum: 1 }
    }
  }
]);


  const summary = summaryAgg[0] || { totalSales:0, totalOrders:0 }

  return res.status(STATUS.OK).json({ 
    success:true, 
    chartData, 
    summary,
    totalUsers,
    topProducts,
    topCategories,
    topBrands
  })
  }catch(error){
    logger.error("Error from getDashboardData",error)
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success:false,
      message:"Internal server error"
    })
  }
}


async function loadDashboard(req, res) {
  try {
    if (req.session.admin) {
        const bestProducts = await Order.aggregate([
        { $unwind:"$products" },
        { $group:{
            _id:"$products.productId",
            totalQty:{ $sum:"products.quantity" }
        }},
        { $sort:{ totalQty:-1 }},
        { $limit:10 },
        { $lookup:{
            from:"products",
            localField:"_id",
            foreignField:"_id",
            as:"product"
        }},
        { $unwind:"$product" }
        ])

        const bestCategories = await Order.aggregate([
        { $unwind:"$products" },
        { $lookup:{
            from:"products",
            localField:"products.productId",
            foreignField:"_id",
            as:"prod"
        }},
        { $unwind:"$prod" },
        { $group:{
            _id:"$prod.category",
            total:{ $sum:"$products.quantity" }
        }},
        { $sort:{ total:-1 }},
        { $limit:10 }
        ])
        
        const bestBrands = await Order.aggregate([
        { $unwind:"$products" },
        { $lookup:{
            from:"products",
            localField:"products.productId",
            foreignField:"_id",
            as:"prod"
        }},
        { $unwind:"$prod" },
        { $group:{
            _id:"$prod.brand",
            total:{ $sum:"$products.quantity" }
        }},
        { $sort:{ total:-1 }},
        { $limit:10 }
        ])

      return res.render('dashboard',{bestProducts,bestCategories,bestBrands});
    }
  } catch (error) {
    logger.error("Error from loadDashboard",error)
    return res.redirect('/pageNotFound');
  }
}

export {
    getDashboardData,
    loadDashboard
}