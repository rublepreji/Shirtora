
document.addEventListener('DOMContentLoaded',()=>{
const searchInput = document.getElementById("searchCategory");
  const clearBtn = document.getElementById("clearSearch");
  const categoryTable = document.querySelector("tbody");
  const pagination = document.getElementById("pagination");
console.log("CATEGORY.JS LOADED");
  let totalPage = 1;
  let currentPage = 1;
  let searchTerm = "";
  let searchTimer;
function blockUnblockListener(){
  document.querySelectorAll(".block-btn,.unblock-btn").forEach(btn=>{
    btn.addEventListener('click',async(e)=>{
        const target= e.currentTarget
        const action= target.dataset.action
        const categoryId= target.dataset.id

        const isBlock =action=='blockcategory'
        const titleText= isBlock?"Block this Category":"Unblock this Category"
        const confirmText= isBlock?"Yes, block":"Yes, Unblock"
        const successText= isBlock?"Category has been blocked!":"Category has been unblocked"

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
                    method:'put',
                    headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({id:categoryId})
                })
                const data= await response.json()
                if(data.success){
                    if(action=="blockcategory"){
                        target.textContent="Unblock"
                        target.classList="delete-btn text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-md hover:bg-green-200 transition unblock-btn"
                        target.action="unblockcategory"
                    }else{
                        target.textContent="block"
                        target.classList="delete-btn text-xs bg-red-100 text-orange-600 px-3 py-1 rounded-md hover:bg-green-200 transition block-btn"
                        target.action="blockcategory"
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
            } catch (error) {
                Swal.fire("Error!", "Something went wrong!", "error");
                console.error("Error on brand UI:", error);
            }
        }
    })
  })
}


  // Fetch and Render Data
  async function fetchData(search = "", page = 1) {
    try {
      const response = await fetch(`/admin/dataforcategory?search=${search}&page=${page}`);
      const data = await response.json();

      if (data.success) {
        renderTable(data.data);
        totalPage = data.totalPages;
        currentPage = data.currentPage;
        renderPagination(); 
        blockUnblockListener()
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }

  // Render Table
  function renderTable(category) {
    categoryTable.innerHTML = category
      .map(
        (cat, i) => `
      <tr class="border-t">
        <td class="px-4 py-3 font-medium">${i + 1}</td>
        <td class="px-4 py-3">${cat.name}</td>
        <td class="px-4 py-3">${cat.description}</td>
        <td class="py-3 px-4 text-center">
          <div class="flex justify-center items-center gap-2">
          ${cat.isBlocked ? `
              <button 
                class="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-md hover:bg-green-200 transition unblock-btn"
                data-id="${cat._id}" 
                data-action="unblockcategory">
                Unblock
              </button>
            ` : `
              <button 
                class="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-md hover:bg-red-200 transition block-btn"
                data-id="${cat._id}" 
                data-action="blockcategory">
                Block
              </button>
            `}
            <a href="/admin/editCategory/${cat._id}">
              <button 
                class="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-200 transition">
                Edit
              </button>
            </a>
          </div>
        </td>
      </tr>`
      )
      .join("");
    
  }

  // Render Pagination
  function renderPagination() {
    let pageButtons = "";

    for (let i = 1; i <= totalPage; i++) {
      pageButtons += `
        <button 
          class="px-3 py-1 rounded-md ${
            i === currentPage
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }" 
          data-page="${i}">
          ${i}
        </button>`;
    }

    pagination.innerHTML = `
      <button id="prevBtn" ${
        currentPage === 1 ? "disabled" : ""
      } class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed">
        Previous
      </button>
      ${pageButtons}
      <button id="nextBtn" ${
        currentPage === totalPage ? "disabled" : ""
      } class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
        Next
      </button>
    `;

    // Now safely attach event listeners
    document.getElementById("prevBtn").addEventListener("click", () => {
      if (currentPage > 1) fetchData(searchTerm, currentPage - 1);
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      if (currentPage < totalPage) fetchData(searchTerm, currentPage + 1);
    });

    document.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.getAttribute("data-page"));
        fetchData(searchTerm, page);
      });
    });
  }

  // Search Input with Debounce
  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value.trim();

    if (searchTerm) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      fetchData(searchTerm, 1);
    }, 500);
  });

  // Clear Search
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.classList.add("hidden");
    searchTerm = "";
    fetchData("", 1);
  });

  //Initial load
  fetchData();
  })