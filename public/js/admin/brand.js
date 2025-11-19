document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.getElementById('sidebar');

    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });
});

document.addEventListener('DOMContentLoaded',()=>{
function blockUnblockListener(){    
    const buttons= document.querySelectorAll('.block-btn,.unblock-btn');
    buttons.forEach(button=>{
    button.addEventListener('click', async (e)=>{
            
    const target= e.currentTarget
    const brandId = target.dataset.id               
    const action= target.dataset.action
            
    const isBlock= action=="blockbrand"
    const titleText= isBlock?"Block this user":"Unblock this user"
    const confirmText= isBlock?"Yes, block":"Yes, Unblock"
    const successText= isBlock?"Brand has been blocked!":"Brand has been unblocked"

    const result = await Swal.fire({
    title: titleText,
    text: "Are you sure you want to proceed?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: isBlock ? "#d33" : "#3085d6",
    cancelButtonColor: "#aaa",
    confirmButtonText: confirmText,
    });
            
if(result.isConfirmed){
try {
    const response= await fetch(`/admin/${action}`,{
        method:"post",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:brandId})
    })
    const data=await response.json()
    
        if(data.success){
        if(action =="blockbrand"){
            target.textContent="Unblock"
            target.className = "text-xs bg-green-100 text-green-600 px-2 py-1 rounded-md unblock-btn";
            target.dataset.action="unblockbrand"
        }
        else{
            target.textContent="Block"
            target.className = "text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md block-btn";
            target.dataset.action="blockbrand"
        }
        Swal.fire({
        title: "Success!",
        text: successText,
        icon: "success",
        timer: 1200,
        showConfirmButton: false
        })
    }
    else{
        Swal.fire("Error!", "Action failed. Try again.", "error");
    }
}
 catch (error) {
    Swal.fire("Error!", "Something went wrong!", "error");
    console.error("Error on brand UI:", error);
    }
}
})
})
}
    const searchInput= document.getElementById('search')
    const brandTable= document.querySelector('tbody')
    const pagination = document.getElementById('pagination')

    let currentPage=1
    let totalPages=1
    let searchTerm=""

    async function fetchBrands(page=1,search="") {
    const res= await fetch(`/admin/brand/data?page=${page}&search=${search}`)
    const data=await res.json()

    if(res.ok){
        renderTable(data.data)
        currentPage= data.currentPage
        totalPages= data.totalPages
        renderPagination()
        blockUnblockListener()
    }
    }

function renderTable(brands) {
brandTable.innerHTML = brands.map((val, i) => `
<tr class="hover:bg-gray-50">
    <td class="px-6 py-4 text-sm font-medium text-gray-900">${i + 1}</td>
    <td class="px-6 py-4">
    <img src="${val.brandImage}" alt="Logo" class="h-10 w-10 rounded-full object-cover"/>
    </td>
    <td class="px-6 py-4 text-sm text-gray-800">${val.brandName}</td>
    <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${val.description}</td>
    <td class="px-6 py-4 text-center space-x-2">

    <a href="/admin/editBrand/${val._id}">
        <button class="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-200 transition">
        Edit
        </button>
    </a>

    ${val.isBlocked 
        ? `<button data-id="${val._id}" data-action="unblockbrand"
            class="unblock-btn text-xs bg-green-100 text-green-600 px-3 py-1 rounded-md hover:bg-green-200 transition">
            Unblock
            </button>`
        : `<button data-id="${val._id}" data-action="blockbrand"
            class="block-btn text-xs bg-red-100 text-red-600 px-3 py-1 rounded-md hover:bg-red-200 transition">
            Block
            </button>`}
    </td>
</tr>
`).join('');
}

function renderPagination(){
    let pagesHTML=""
    for(let i=1;i<=totalPages;i++){
    pagesHTML+=`
        <button class="px-3 py-1 border rounded-md ${i == currentPage ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100' }"
        data-page="${i}">
        ${i}
        </button>`
    }

    pagination.innerHTML=`
    <div class="flex justify-center mt-6">
        <button
        id="prevBtn" 
        ${currentPage==1?"disabled":""} class="px-3 py-1 border rounded-md text-gray-600 hover:bg-gray-100">
        Previous
        </button>

        ${pagesHTML}

        <button
        ${currentPage === totalPages ? "disabled" : ""}
        id="nextBtn"
        class="px-3 py-1 border rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
    >
        Next
    </button>
    </div>
    `



document.getElementById('prevBtn')?.addEventListener('click',()=>{
        if(currentPage>1) fetchBrands(currentPage-1,searchTerm)
    })
document.getElementById('nextBtn').addEventListener('click',()=>{
    if(currentPage<totalPages) fetchBrands(currentPage+1,searchTerm)
})
document.querySelectorAll("[data-page]").forEach((btn)=>{
    btn.addEventListener('click',()=>{
    const page= Number(btn.getAttribute('data-page'))
    fetchBrands(page,searchTerm)
    })
})
}


let searchTimer;
searchInput.addEventListener('input',()=>{
    clearTimeout(searchTimer)
    searchTimer= setTimeout(()=>{
        searchTerm= searchInput.value.trim()
    fetchBrands(1,searchTerm)
    },400)
})
fetchBrands()

})