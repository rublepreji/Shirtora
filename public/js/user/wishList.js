async function confirmRemoveProduct(productId){
        Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b" , 
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, proceed!"
        }).then(async(result)=>{
            if(result.isConfirmed){
                 const response= await fetch(`/removefromwishlist/${productId}`,{
                    method:"post"
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

    const data= await response.json()
    if(data.success){
        Swal.fire({
        icon: "success",
        title: "Success!",
        text: data.message || "Your action was completed successfully.",
        confirmButtonColor: "#3085d6"
        }).then(()=>{
          window.location.reload()
        })
    }else{
        Swal.fire({
        icon: "error",
        title: "Oops!",
        text: data.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#d33"
        });

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