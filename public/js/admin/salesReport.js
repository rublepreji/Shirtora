
document.getElementById('table').addEventListener('submit',async(e)=>{
    e.preventDefault()
    loadData()
})

async function loadData(page=1) {
    const range = document.querySelector("select[name='range']").value
    const startDate= document.querySelector("input[name='startDate']").value
    const endDate= document.querySelector("input[name='endDate']").value

    const params=new URLSearchParams({
        range,startDate,endDate,page
    })
    const res= await fetch(`/admin/sales-report-data?${params}`,{
        headers:{
        "Accept":"application/json"
        }
    })
    const data= await res.json()
    if(data.success){
        updateTable(data.orders)
        updateCards(data)
        loadPagination(data.currentPage, data.totalPage)
        console.log("currentPage",data.currentPage,"totalPage",data.totalPage);
        
    }
    else{
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: data.message || "Something went wrong",
            confirmButtonColor: "#e11d48" 
        })
    }
}

function updateCards(data){
    document.getElementById('totalOrders').innerHTML=data.totalOrders
    document.getElementById('totalSales').innerHTML=data.totalSales
    document.getElementById('productDiscount').innerHTML=data.totalProductDiscount
    document.getElementById('couponDiscount').innerHTML=data.totalCouponDiscount
}

function updateTable(orders){
    let tbody= document.getElementById("tableBody")
    tbody.innerHTML=""

    if(orders.length==0){
        tbody.innerHTML = `
        <tr>
        <td colspan="5" class="text-center py-12 text-gray-400">
            No data available
        </td>
        </tr>`
        return
    }

    orders.forEach(order=>{
        let products= order.items.map(i=>i.productId.productName).join("<br>")
        let qty= order.items.map(i=>i.quantity).join("<br>")

        tbody.innerHTML +=`
        <tr>
          <td class="px-6 py-4">${order.orderId}</td>
          <td class="px-6 py-4">${new Date(order.createdAt).toLocaleDateString()}</td>
          <td class="px-6 py-4">${products}</td>
          <td class="px-6 py-4">${qty}</td>
          <td class="px-6 py-4 text-right">₹${order.offerAmount || order.totalAmount}</td>
        </tr>
        `
    })

}

function loadPagination(current,totalPage) {
    const div= document.getElementById('pagination')
    let html=""
    if(totalPage<=1){
        return 
    }
    if(current >1){
    html+=`<button onclick="loadData(${current-1})" class="px-3 py-1 border rounded mr-1">prev</button>`
    }

    for(let i=1;i<=totalPage;i++){
        html+=`<button onclick="loadData(${i})" class="px-3 py-1 border rounded mr-1
        ${current==i?'bg-black text-white':''}">${i}</button>`
    }

    if(current < totalPage){
        html += `<button onclick="loadData(${current+1})" class="px-3 py-1 border rounded">next</button>`
    }
    div.innerHTML=html
}

loadData()


document.getElementById("excel").addEventListener('click',()=>{
    downloadReport("excel")
})
document.getElementById("pdf").addEventListener('click',()=>{
    downloadReport("pdf")
})

function downloadReport(type) {
    const range= document.querySelector("select[name='range']").value
    const startDate= document.querySelector("input[name='startDate']").value
    const endDate= document.querySelector("input[name='endDate']").value

    const params= new URLSearchParams({
        range,startDate,endDate,type
    })
    window.location.href=`/admin/download-report?${params}`
}
