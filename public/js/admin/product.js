document.querySelector("tbody").addEventListener("click", async (e) => {
    const btn = e.target.closest(".block-btn, .unblock-btn");
    if (!btn) return; 

    const action = btn.dataset.action;
    const productId = btn.dataset.id;

    const isBlock = action === "blockproduct";
    const titleText = isBlock ? "Block this product" : "Unblock this product";
    const confirmText = isBlock ? "Yes, block" : "Yes, unblock";
    const successText = isBlock
      ? "Product has been blocked"
      : "Product has been unblocked";

    const result = await Swal.fire({
      title: titleText,
      text: "Are you sure you want to proceed?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isBlock ? "#d33" : "#3085d6",
      cancelButtonColor: "#aaa",
      confirmButtonText: confirmText,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/admin/${action}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: productId }),
        });
        const data = await response.json();

        if (data.success) {
          // update button instantly
          if (isBlock) {
            btn.textContent = "Unblock";
            btn.className =
              "unblock-btn bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-medium";
            btn.dataset.action = "unblockproduct";
          } else {
            btn.textContent = "Block";
            btn.className =
              "block-btn text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md";
            btn.dataset.action = "blockproduct";
          }

          Swal.fire({
            title: "Success!",
            text: successText,
            icon: "success",
            timer: 1200,
            showConfirmButton: false,
          });
        } else {
          Swal.fire("Error!", "Action failed. Try again.", "error");
        }
      } catch (error) {
        console.error("Error in block/unblock:", error);
        Swal.fire("Error!", "Something went wrong!", "error");
      }
    }
  });



        //search
        const searchInput=document.getElementById('search')
        const productTable= document.querySelector('tbody')
        const pagination = document.getElementById('pagination')

        let currentPage=1
        let totalPages=1
        let searchTerm=""
        
        

      async function getData(page=1,search=""){
          const res= await fetch(`/admin/dataforproductpage?page=${page}&search=${search}`)
          const data=await res.json()
          console.log('data from server',data);
          
          if(data.success){
            currentPage=data.currentPage
            totalPages=data.totalpages
            renderTable(data.data)
            renderPagination()
          }
        
        }

        
        function renderTable(product){
          productTable.innerHTML=product.map((prod,i)=>`
              <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">
                  <img src="${prod.productImage[0]}" class="rounded-md w-12 h-12 object-cover" alt="" />
                </td>
                <td class="py-3 px-4">
                  <p class="font-semibold">${prod.productName}</p>
                </td>
                <td class="py-3 px-4">${prod.category?.name || 'No Category'}</td>
                <td class="py-3 px-4">${prod.brand?.brandName || 'No brand  '}</td>
                <td class="py-3 px-4">
                  ${prod.variants.map(val=>`
                  <p>Size: ${val.size}</p>
                  <p>Price: ${val.price}</p>
                  <p>Stock: ${val.stock}</p>
                `).join("")}
                  
                </td>
                <td class="py-3 px-4 text-center space-x-2">
                  <a href="/admin/editproduct/${prod._id}"><button class="text-blue-500 hover:text-blue-700"><i class="fa fa-edit"></i>✏️</button></a>

                  ${prod.isBlocked
                  ?`<button data-action="unblockproduct" data-id="${prod._id}" class="unblock-btn bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-medium">Unblock</button>`:
                    `<button data-action="blockproduct" data-id="${prod._id}" class="block-btn text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md">Block</button>`
                }
                </td>
              </tr>
          `).join("")
        }

        //search with debouncing

        let searchTimer;
        
        searchInput.addEventListener('input',()=>{
          clearTimeout(searchTimer)
          searchTimer= setTimeout(()=>{
            searchTerm= searchInput.value.trim()
            getData(1,searchTerm)
          },400)


        })
        getData()

        function renderPagination(){

          let pageButtons=""

          for(let i=1;i<=totalPages;i++){
            pageButtons+=`
            <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" data-page="${i}">${i}</button>
          `
          }

          pagination.innerHTML=`

          <button
          id="prevBtn"
          ${currentPage==1? "disabled":""} class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed">
          Previous
        </button>

        ${pageButtons}


        <button
        id="nextBtn"
        ${currentPage==totalPages?"disabled":""} class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Next
        </button>

          `

        document.getElementById('prevBtn').addEventListener('click',()=>{
          if(currentPage>1){
            getData(currentPage-1,searchTerm)
          }
        })
        document.getElementById('nextBtn').addEventListener('click',()=>{
          if(currentPage<totalPages){
            getData(currentPage+1,searchTerm)
          }
        })
        document.querySelectorAll("[data-page]").forEach((btn)=>{
          btn.addEventListener('click',()=>{
            let page= Number(btn.getAttribute('data-page'))
            console.log(page);
            
            getData(page,searchTerm)
          })
        })

        }


        const clearBtn = document.getElementById("clearSearch");
        searchInput.addEventListener("input", () => {
          if (searchInput.value.trim() !== "") {
            clearBtn.classList.remove("hidden");
          } else {
            clearBtn.classList.add("hidden");
          }
        });

        clearBtn.addEventListener("click", () => {
          searchInput.value = "";
          clearBtn.classList.add("hidden");
          getData(1, ""); 
        });
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const openSidebar = document.getElementById("openSidebar");

    openSidebar.addEventListener("click", () => {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    });
