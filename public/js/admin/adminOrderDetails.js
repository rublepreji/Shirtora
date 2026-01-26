
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
        Swal.fire("Success", data.message||"Product status updated!", "success");
    } else {
        Swal.fire("Error", data.message||"Failed to update status", "error");
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
        Swal.fire("Success", "Status updated", "success").then(()=>{
            document.getElementById(`productStatus-${itemIndex}`).value = newStatus;
            window.location.reload()
        });
    } else {
        Swal.fire("Error", data.message || "Failed to update", "error");
    }
}

async function cancelOrder(orderId) {
  const { value: reason } = await Swal.fire({
    title: "Cancel Order",
    input: "text",
    inputLabel: "Enter cancellation reason",
    inputPlaceholder: "Reason for cancelling this order",
    showCancelButton: true,
    confirmButtonText: "Submit",
    inputValidator: (value) => {
      if (!value) return "Reason is required";
    }
  });

  if (!reason) return;

  const res = await fetch("/admin/admincancelorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, reason })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire("Order Cancelled", "Status updated successfully", "success")
      .then(() => location.reload());
  } else {
    Swal.fire("Error", data.message || "Failed to cancel order", "error");
  }
}

