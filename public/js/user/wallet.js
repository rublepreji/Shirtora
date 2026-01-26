
let walletPage=1


async function loadWalletTrans(page=1) {
    const response= await fetch(`/wallet/transaction?page=${page}`)
    const data= await response.json()

    if(!data.success)return 
    renderTransactionTable(data.transaction)
    renderPagination(data.totalPages,data.currentPage)
}

function renderTransactionTable(data){
    const tbody= document.getElementById("walletBody")
    tbody.innerHTML= data.map(t=>`
        <tr class="hover:bg-gray-50/80 transition-colors">
            <td class="py-5 px-6">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-4">
                        <i class="${t.type ==="CREDIT" ? "fas fa-arrow-down text-green-600" : "fas fa-arrow-up text-red-600"}"></i>
                    </div>
                    <div>
                        <p class="font-bold text-gray-900">${t.source}</p>
                    </div>
                </div>
            </td>
            <td class="py-5 px-6 text-sm text-gray-600">${new Date(t.createdAt).toLocaleDateString()}</td>
            
            <td class="py-5 px-6">
            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                ${t.type === 'CREDIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} %>">
                
            ${t.type} 
            </span>
            </td>

            <td class="py-5 px-6 text-right font-bold 
            ${t.type === 'CREDIT' ? 'text-green-600': 'text-red-600'} %>">
            ${t.type === 'CREDIT' ? '+' : '-' } ₹${t.amount}
            </td>
        </tr>
    `).join("")
}

function renderPagination(total, current){
 const div=document.getElementById("walletPagination");
 let html="";

 if(current>1)
 html+=`<button onclick="loadWalletTrans(${current-1})"
 class="px-4 py-2 border rounded">Prev</button>`;

 for(let i=1;i<=total;i++){
 html+=`<button onclick="loadWalletTrans(${i})"
 class="px-4 py-2 border rounded
 ${i===current?"bg-black text-white":""}">
 ${i}</button>`;
 }

 if(current<total)
 html+=`<button onclick="loadWalletTrans(${current+1})"
 class="px-4 py-2 border rounded">Next</button>`;

 div.innerHTML=html;
}

loadWalletTrans()