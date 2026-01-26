 const openBtn = document.getElementById("openFilterBtn");
        const closeBtn = document.getElementById("closeFilterBtn");
        const sidebar = document.getElementById("filterSidebar");

        openBtn?.addEventListener("click", () => {
            sidebar.classList.add("mobile-active");
            sidebar.classList.remove("hidden");
        });

        closeBtn?.addEventListener("click", () => {
            sidebar.classList.remove("mobile-active");
            sidebar.classList.add("hidden");
        });


        const productContainer= document.getElementById('productContainer')
        const paginationContainer= document.getElementById('pagination')
        const searchInput= document.getElementById('searchInput')
        const clearSearch= document.getElementById('clearSearch')
        const categoryFilter= document.querySelectorAll('.categoryFilter')
        const brandFilter= document.querySelectorAll('.brandFilter')
        const sort= document.querySelectorAll("[data-sort]")
        const priceFilter= document.querySelectorAll('.priceFilter')



        let selectedCategories=[]
        let selectedbrands=[]
        let selectedPrice=[]
        let selectedSort=''
        let search=''
        let currentPage=1   
        let totalPage=1    

        async function fetchdata(){
            try{
            const queryString=new URLSearchParams({
              search,
              category:selectedCategories.join(","),
              brand:selectedbrands.join(","),
              price:selectedPrice.join(","),
              sort:selectedSort,
              page:currentPage
            }).toString()
           const res= await fetch(`/filterproduct?${queryString}`)
            const data=await res.json()
            
            if(data.success){
              totalPage= data.totalPage
              currentPage= data.currentPage
              renderProduct(data.product)
              renderPagination()
            }
            else{
              productContainer.innerHTML = '<p class="text-center w-full py-8">No products found.</p>';
              totalPage = 1;
              currentPage = 1;
              renderPagination();
            }
        }catch(err){
            paginationContainer.innerHTML=`<p class="text-center w-full py-8 text-red-500">Failed to load products.</p>`
            totalPage=1
            currentPage=1
        }
    }

        priceFilter.forEach(price=>{
            price.addEventListener('change',()=>{
              selectedPrice=[...priceFilter]
              .filter(val=>val.checked)
              .map(x=>x.value)
              currentPage=1
              fetchdata()
            })
        })

        categoryFilter.forEach(item=>{
            item.addEventListener('change',()=>{
              selectedCategories= [...categoryFilter]
              .filter(val=>val.checked).map(x=>x.value)
              currentPage=1
              fetchdata()
            }) 
         }) 

         brandFilter.forEach(item=>{
            item.addEventListener('change',()=>{
              selectedbrands=[...brandFilter]
              .filter(val=>val.checked)
              .map(x=>x.value)
              currentPage=1
              fetchdata()
            })
         })

         sort.forEach((item)=>{
            item.addEventListener('click',()=>{
                selectedSort= item.dataset.sort
                currentPage=1
                fetchdata()
            })
         })


        function renderProduct(product){
            
  productContainer.innerHTML = product.map(data => `
  <div class="product-card bg-white rounded-lg overflow-hidden shadow-md flex flex-col h-full">
    
    <div class="w-full h-48 overflow-hidden">
      <a href="/productdetails/${data._id}">
        <img src="${data.productImage[0]}" 
        class="w-full h-full object-cover" 
        alt="${data.productName}">
      </a>
    </div>

    <div class="p-4 flex flex-col flex-1">
      <h3 class="font-semibold text-sm mb-2 truncate">
        ${data.productName}
      </h3>

      ${
        data.offer > 0
        ? `
          <!-- Price row -->
          <div class="flex items-center gap-2">

            <span class="text-lg font-bold text-600">
              ₹${data.finalPrice}
            </span>

            <span class="text-sm line-through text-gray-400">
              ₹${data.orginalPrice}
            </span>

          </div>

          <!-- Offer text -->
          <p class="text-xs text-red-500 mt-1">
            ${data.offer}% OFF
          </p>
        `
        : `
          <div class="text-lg font-bold">
            ₹${data.variants[0].price}
          </div>
        `
      }

      <!-- Actions -->
      <div class="mt-auto flex items-center gap-2 pt-4">

        <button onclick="addtocart('${data._id}',0,1)"
        class="flex-1 border border-black py-2 rounded-md text-sm hover:bg-black hover:text-white transition">
          Add to cart
        </button>

        <button onclick="addtowishlist('${data._id}', this)"
        class="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-100">

          <svg 
          class="w-5 h-5 transition
          ${data.isWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400'}"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2">

          <path stroke-linecap="round" stroke-linejoin="round"
          d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636
          l1.318-1.318a4.5 4.5 0 116.364 6.364
          L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z"/>
          </svg>

        </button>

      </div>
    </div>
  </div>
`).join("");

}

async function addtocart(productId,variantIndex,qty) {
    try {
        const response=await fetch(`/addToCart`,{
        method:"post",
        headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId,
                variantIndex,
                qty
            })
        })

if (!response.headers.get("content-type")?.includes("application/json")) {
 await Swal.fire({
    icon: "warning",
    title: "Login required",
    text: "Please login to add products to cart"
  })
  window.location.href='/signin'
  return 
}
  const data= await response.json()
  if(data.success){
      Toastify({
      text: data.message ,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor:  "#4CAF50" ,
    }).showToast();
  }else{
      Toastify({
      text: data.message ,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor:  "#d33" ,
    }).showToast();

  }
  } catch (error) {
      Swal.fire({
      icon: "error",
      title: "Oops!",
      text: error || "Something went wrong. Please try again.",
      confirmButtonColor: "#d33"
      });
  }
}

async function addtowishlist(productId, btn) {
  const icon = btn.querySelector("svg");

  if (icon.classList.contains("text-gray-400")) {
    icon.classList.remove("text-gray-400");
    icon.classList.add("text-red-500","fill-red-500");
  } else {
    icon.classList.remove("text-red-500","fill-red-500");
    icon.classList.add("text-gray-400");
  }

  try{
    const response = await fetch(`/addtowishlist/${productId}`,{
      method:"post",
    })

    const data = await response.json()
    if(!data.success){
     Swal.fire("Error", data.message ||"", "error").then(()=>window.location.href='/signin')
    }
    if(data.success){
      Toastify({
      text: data.message ,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor:  "#4CAF50" ,
    }).showToast();
    }

  }catch(error){    
    Swal.fire("Error", "You need to sign in first to continue shopping.", "error").then(()=>window.location.href='/signin')
  }
}



function renderPagination(){
    let paginationButtons="";
    for(let i=1;i<=totalPage;i++){
       paginationButtons +=` <button data-page="${i}" class="px-3 py-1 border rounded-md ${i === currentPage ? 'bg-black text-white' : 'bg-white'}">
            ${i}
        </button>`
    }

    paginationContainer.innerHTML=`
    <button id="prevBtn" class="px-3 py-1 border rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
        Prev
    </button>

    ${paginationButtons}


    <button id="nextBtn" class="px-3 py-1 border rounded-md ${currentPage === totalPage ? 'opacity-50 cursor-not-allowed' : ''}">
        Next
    </button>

    `

    document.getElementById('prevBtn').addEventListener('click',()=>{
        if(currentPage >1){
            currentPage--
            fetchdata()
        }
    })
    document.getElementById('nextBtn').addEventListener('click',()=>{
        if(currentPage<totalPage){
            currentPage++
            fetchdata() 
        }
    })
    document.querySelectorAll("[data-page]").forEach(btn=>{
        btn.addEventListener('click',()=>{
            const page=Number(btn.getAttribute('data-page'))
            if(page !== currentPage){
                currentPage=page
                fetchdata()
            }
        })
    })
}


        let searchTimer;
        searchInput.addEventListener('input',()=>{

            if(searchInput.value.trim()){
                clearSearch.classList.remove('hidden')
            }else{
                clearSearch.classList.add('hidden')
            }

            clearTimeout(searchTimer)
            searchTimer=setTimeout(()=>{
                search= searchInput.value.trim()
                fetchdata()
            },400)
            
        })

        clearSearch.addEventListener('click',()=>{
            searchInput.value=''
            clearSearch.classList.add('hidden')

            search=''
            fetchdata()
        })
        fetchdata()