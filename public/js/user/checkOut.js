const addressRadios = document.querySelectorAll('input[name="address"]');
  const selectedAddressIndexInput = document.getElementById('selectedAddressIndex');

  addressRadios.forEach(radio => {
    if (radio.checked) {
      selectedAddressIndexInput.value = radio.value;
    }
    radio.addEventListener('change', () => {
      selectedAddressIndexInput.value = radio.value;
    });
  });

  const paymentRadios = document.querySelectorAll('input[name="payment"]');
  const paymentMethodInput = document.getElementById('paymentMethod');

  paymentRadios.forEach(radio => {
    if (radio.checked) {
      paymentMethodInput.value = radio.nextElementSibling.innerText.trim();
    }
    radio.addEventListener('change', () => {
      paymentMethodInput.value = radio.nextElementSibling.innerText.trim();
    });
  });

  document.querySelector('.place-order-btn').addEventListener('click', async () => {

  if (!selectedAddressIndexInput.value) {
    Swal.fire("Warning!", "Please select a delivery address.", "warning");
    return;
  }

  if (!paymentMethodInput.value) {
    Swal.fire("Warning!", "Please select a payment method.", "warning");
    return;
  }

  // COD → Normal submit
  if (paymentMethodInput.value === "Cash on Delivery") {
    document.getElementById('checkoutForm').submit();
    return;
  }

  // Razorpay Flow
  try {
    const res = await fetch("/create_order", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    if (!data.success) {
      Swal.fire("Error!","Unable to create payment order", "error");
      return;
    }

    const options = {
      key: "rzp_test_Rrt6G675QSRCo6", 
      amount: data.amount,
      currency: data.currency,
      name: "Your Store Name",
      description: "Order Payment",
      order_id: data.orderId,

      handler: async function (response) {

        // Add Razorpay data to form
        const form = document.getElementById("checkoutForm");

        form.insertAdjacentHTML("beforeend", `
          <input type="hidden" name="razorpay_payment_id" value="${response.razorpay_payment_id}">
          <input type="hidden" name="razorpay_order_id" value="${response.razorpay_order_id}">
          <input type="hidden" name="razorpay_signature" value="${response.razorpay_signature}">
        `);

        form.submit();
      },

      theme: { color: "#000000" }
    };

    const rzp = new Razorpay(options);
    // In checkOut.js
rzp.on('payment.failed', async function (response) {
    try {
      await fetch("/orderfailed");
        
      await Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: response.error.description || "The transaction could not be completed.",
      });
        
      window.location.href = "/orderfailed"; // Stay on checkout to retry
        
    } catch (error) {
      console.error("Error handling payment failure:", error);
      window.location.href = "/checkout";
    }
});
    rzp.open();

  } catch (error) {
    Swal.fire("Error!", data.message||"Payment failed", "error");
  }
});

  