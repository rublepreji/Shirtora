
async function saveProductStatus(orderId, itemIndex) {
    const newStatus = document.getElementById(`productStatus-${itemIndex}`).value;

    const res = await fetch("/admin/updateItemStatus", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderId, itemIndex, newStatus })
    });

    const data = await res.json();

    if (data.success) {
        Swal.fire("Success", "Product status updated!", "success");
    } else {
        Swal.fire("Error", "Failed to update status", "error");
    }
}


async function approveReturn(orderId, itemIndex) {
    await updateReturnStatus(orderId, itemIndex, "Return-Approved");
}

async function rejectReturn(orderId, itemIndex) {
    await updateReturnStatus(orderId, itemIndex, "Return-Rejected");
}

async function updateReturnStatus(orderId, itemIndex, newStatus) {
    const res = await fetch("/admin/updateReturnStatus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, itemIndex, newStatus })
    });

    const data = await res.json();

    if (data.success) {

        document.getElementById(`productStatus-${itemIndex}`).value = newStatus;
        window.location.reload()
    } else {
        Swal.fire("Error", data.message || "Failed to update", "error");
    }
}
