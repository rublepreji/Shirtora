const table= document.querySelector('tbody')
    const pagination= document.getElementById('pagination')
    const searchInput= document.getElementById('search')
    const clearBtn= document.getElementById('clearSearch')

    let totalPage=1
    let currentPage=1
    let searchTerm=''
    let filter='all'

  async function fetchData(search="",page=1,filter="all") {
  const response = await fetch(`/admin/dataForUserPage?search=${search}&page=${page}&filter=${filter}`);
  console.log('page',page);
  
  const data = await response.json();
    console.log(data);
    
  if(data.success){
    renderTable(data.data);
    totalPage=Number(data.totalPages);
    currentPage=Number(data.currentPage);
    renderPagination()
  }
}

//search
let searchTimer;
searchInput.addEventListener('input',()=>{
  searchTerm=searchInput.value.trim()
  if(searchInput.value.trim()!==""){
    clearBtn.classList.remove('hidden')
  }else{
    clearBtn.classList.add('hidden')
  }

  clearTimeout(searchTimer)
  searchTimer=setTimeout(()=>{
    currentPage=1
    fetchData(searchTerm,currentPage,filter)
  },400)
})

function renderTable(users) {
  table.innerHTML = users.map((val, i) => `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-4">${i + 1}</td>
      <td class="py-3 px-4">${val.fullName}</td>
      <td class="py-3 px-4">${val.email}</td>
      <td class="py-3 px-4">${val.phone || ""}</td>
      <td class="py-3 px-4">
        ${!val.isBlocked
          ? `<button class="block-btn text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md"
                  data-id="${val._id}" data-action="blockuser">Block</button>`
          : `<button class="unblock-btn text-xs bg-green-100 text-green-600 px-2 py-1 rounded-md"
                  data-id="${val._id}" data-action="unblockuser">Unblock</button>`
        }
      </td>
    </tr>
  `).join("");
}

// Event Delegation for block/unblock
table.addEventListener("click", async (e) => {
  if (!e.target.matches(".block-btn, .unblock-btn")) return;

  const userId = e.target.dataset.id;
  const action = e.target.dataset.action;

  const isBlock = action === "blockuser";

  const result = await Swal.fire({
    title: isBlock ? "Block this user" : "Unblock this user",
    text: "Are you sure?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: isBlock ? "#d33" : "#3085d6",
    cancelButtonColor: "#aaa",
    confirmButtonText: isBlock ? "Yes, block" : "Yes, unblock",
  });

  if (!result.isConfirmed) return;

  const response = await fetch(`/admin/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: userId })
  });

  const data = await response.json();

  if (data.success) {
    fetchData(searchTerm, currentPage, filter);
  }
});

function renderPagination() {
  let paginationButton=''

  for(let i=1;i<=totalPage;i++){
    paginationButton+=`
      <button data-page="${i}" class="px-3 py-1 border rounded-md ${ i == currentPage ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100' }" >
      ${i}
    </button>
    `
  }
  pagination.innerHTML=`
    <button id="prevBtn" ${currentPage==1 ?"disabled":""} class="px-3 py-1 border rounded-md text-gray-600 hover:bg-gray-100">
      Previous
    </button>

    ${paginationButton}

    <button id="nextBtn" ${currentPage==totalPage ?"disabled":""} class="px-3 py-1 border rounded-md text-gray-600 hover:bg-gray-100">
      Next
    </button>
  `


  document.getElementById('prevBtn').addEventListener('click',()=>{
    if(currentPage>1){
      fetchData(searchTerm,currentPage-1,filter)
    }
  })
  document.getElementById('nextBtn').addEventListener('click',()=>{
    if(currentPage<totalPage){
      fetchData(searchTerm,currentPage+1,filter)
    }
  })
  document.querySelectorAll("[data-page]").forEach((btn)=>{
    btn.addEventListener('click',()=>{
      currentPage=parseInt(btn.getAttribute('data-page'))
      fetchData(searchTerm,currentPage,filter)
    })
  })

}

document.getElementById('filter').addEventListener('change', function () {
  filter = this.value;
  currentPage=1
  fetchData(searchTerm,currentPage,filter)
});


clearBtn.addEventListener('click',()=>{
  searchInput.value=""
  clearBtn.classList.add('hidden')
  fetchData("",currentPage,filter)
})
fetchData();
