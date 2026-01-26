function getDateFilter(range){
  const now = new Date()
  let filter = {}

  if(range === "yearly"){
    filter.createdAt = {
      $gte:new Date(now.getFullYear(),0,1),
      $lte:new Date(now.getFullYear(),11,31,23,59,59)
    }
  }

  if(range === "monthly"){
    filter.createdAt = {
      $gte:new Date(now.getFullYear(),now.getMonth(),1),
      $lte:new Date(now.getFullYear(),now.getMonth()+1,0,23,59,59)
    }
  }

  if(range === "weekly"){
    const first = new Date(now)
    first.setDate(now.getDate() - now.getDay())
    const last = new Date(first)
    last.setDate(first.getDate()+6)

    filter.createdAt = { $gte:first, $lte:last }
  }

  return filter
}

export default getDateFilter
