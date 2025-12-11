 async function cancelOrder(orderId,newStatus){
        return Swal.fire({
        title: "Are you sure?",
        text: "Do you want to cancel the order",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Proceed",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33"
    }).then(async(arr) =>{
        if(arr.isConfirmed){
            const res = await fetch("/cancelorder", {
            method: "put",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, newStatus })
        });
        const data= await res.json()
        if(data.success){
            Swal.fire("Cancelled!", "Order cancelled", "success").then(()=>window.location.reload());
        }else{
            Swal.fire("Error", "Failed to update", "error");
        }
    }
     
});

    
}

let selectedOrderId = null;
let selectedProductIndex = null;

function openReturnModal(orderId, index) {
    selectedOrderId = orderId;
    selectedProductIndex = index;
    document.getElementById("returnModal").classList.remove("hidden");
}

function closeReturnModal() {
    document.getElementById("returnModal").classList.add("hidden");
    document.getElementById("returnReason").value = "";
}

document.getElementById("submitReturnBtn").addEventListener("click", async () => {
    const reason = document.getElementById("returnReason").value.trim();

    if (!reason) {
        Swal.fire("Error", "Please enter a reason", "warning");
        return;
    }

    const res = await fetch("/returnRequest", {
        method: "put",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            orderId: selectedOrderId,
            productIndex: selectedProductIndex,
            reason,
            newStatus: "Return Requested"
        })
    });

    const data = await res.json();

    if (data.success) {
        Swal.fire("Success!", "Return request submitted", "success")
            .then(() => window.location.reload());
    } else {
        Swal.fire("Error", "Unable to process return", "error");
    }

    closeReturnModal();
});