document.getElementById("checkoutBtn").addEventListener("click", function (e) {
    const cartCount = parseInt(this.getAttribute("data-cart-count"));

    if (cartCount === 0) {
        e.preventDefault();

        Swal.fire({
            icon: "info",
            title: "Empty Cart",
            text: "Your cart is empty. Add some items before checking out!",
            confirmButtonColor: "#000000"
        });
    }
});

function removeformcart(productId, variantIndex){
        Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b", 
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, proceed!"
        }).then(async(result)=>{
            if(result.isConfirmed){
                 const response= await fetch(`/removefromcart`,{
                    method:"post",
                    headers:{"Content-Type": "application/json"},
                    body:JSON.stringify({productId,variantIndex})
                })
                const data= await response.json()
                if(data.success){
                    Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text:data.message || "Your action was completed successfully.",
                    confirmButtonColor: "#3085d6"
                    }).then(()=>{
                        window.location.reload();
                    })

                }else{
                    Swal.fire({
                    icon: "error",
                    title: "Oops!",
                    text: data.message || "Something went wrong. Please try again.",
                    confirmButtonColor: "#d33"
                    });

                }
            }
        })
        }


document.addEventListener("click", async function (e) {

   // minus button
if (e.target.classList.contains("qty-minus")) {
    const productId = e.target.dataset.product;
    const variantIndex = e.target.dataset.variant;

    const input = e.target.parentElement.querySelector(".quantity-input");
    let qty = parseInt(input.value);

    if (qty <= 1) return;

    const newQty = qty - 1;

    const res = await fetch("/updatecartqty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantIndex, qty: newQty })
    });

    const data = await res.json();

    if (data.success) {
        input.value = newQty; 
        window.location.reload();
    } else {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: data.message || "Unable to reduce quantity."
        });
    }
}

    // Plus button
   if (e.target.classList.contains("qty-plus")) {
    const productId = e.target.dataset.product;
    const variantIndex = e.target.dataset.variant;

    const input = e.target.parentElement.querySelector(".quantity-input");
    let qty = parseInt(input.value);

    if (qty >= 5) {
        Swal.fire({
            icon: "warning",
            title: "Limit Reached",
            text: "You can only add up to 5 units of this product."
        });
        return;
    }


    const newQty = qty + 1;

    const res = await fetch("/updatecartqty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantIndex, qty: newQty })
    });

    const data = await res.json();

    if (data.success) {
        input.value = newQty;  
        window.location.reload();
    } else {
        Swal.fire({
            icon: "warning",
            title: "Stock Limited",
            text: data.message
        });
    }
}
})
