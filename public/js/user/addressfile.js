console.log('this is script');

async function fetchaddress(page=1) {
    const response= await fetch(`/fetchaddress?page=${page}`,{
        credentials:"include"
    })
    const contentType= response.headers.get("content-type")
    if(!contentType || !contentType.includes("application/json")){
        window.location.href="/signin"
        return
    }
    const data= await response.json()
    console.log("fetch address",data);
    
    if(!data.success) return
    renderAddress(data.addressDoc)
    renderPagination(data.currentPage,data.totalPages)
}

function renderAddress(data) {
    const addressDiv = document.getElementById("addressDiv");
    addressDiv.innerHTML = data.map(address => `
        <div class="border border-gray-300 rounded-xl p-5 shadow-sm hover:shadow-md transition duration-150">
            <div class="flex justify-between items-start mb-4">
                <div class="text-gray-800 leading-relaxed">
                    <p class="text-lg font-semibold">${address.firstName}</p>
                    <p class="text-gray-600">${address.city} ${address.landMark}, ${address.state}</p>
                    <p class="text-gray-600">Pin Code: ${address.pincode}</p>
                    <p class="mt-2 text-sm font-medium">Contact: +91${address.phone}</p>
                </div>
                ${address.isDefault ? `
                <span class="flex-none self-start inline-flex items-center text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Default
                </span>` : ""}
            </div>
            <div class="flex gap-3 mt-4 pt-3 border-t">
                <a href="/editaddress/${address._id}">
                    <button class="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-black transition">Edit</button>
                </a>
                <button onclick="deleteAddress('${address._id}')" class="px-4 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition">Delete</button>
            </div>
        </div>
    `).join("");
}

function renderPagination(current, totalPage){
    const div=document.getElementById("addressPagination");
    let html="";

 if(current>1)
 html+=`<button onclick="fetchaddress(${current-1})"
 class="px-4 py-2 border rounded">Prev</button>`;

 for(let i=1;i<=totalPage;i++){
 html+=`<button onclick="fetchaddress(${i})"
 class="px-4 py-2 border rounded
 ${i===current?"bg-black text-white":""}">
 ${i}</button>`;
 }

 if(current<totalPage)
 html+=`<button onclick="fetchaddress(${current+1})"
 class="px-4 py-2 border rounded">Next</button>`;

 div.innerHTML=html;
}

fetchaddress()