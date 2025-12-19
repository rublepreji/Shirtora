let isPaymentInProgress = false;
let paymentFailureHandled = false
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

  const placeOrderBtn = document.querySelector(".place-order-btn");

  document.querySelector('.place-order-btn').addEventListener('click', async () => {
    if(isPaymentInProgress) return ;
    isPaymentInProgress=true
    placeOrderBtn.disabled=true;

  if (!selectedAddressIndexInput.value) {
    isPaymentInProgress=false
    placeOrderBtn.disabled=false
    Swal.fire("Warning!", "Please select a delivery address.", "warning");
    return;
  } 

  if (!paymentMethodInput.value) {
    isPaymentInProgress=false
    placeOrderBtn.disabled=false 
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
      isPaymentInProgress=false
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
        paymentFailureHandled = true
        const form = document.getElementById("checkoutForm");

        form.insertAdjacentHTML("beforeend", `
          <input type="hidden" name="razorpay_payment_id" value="${response.razorpay_payment_id}">
          <input type="hidden" name="razorpay_order_id" value="${response.razorpay_order_id}">
          <input type="hidden" name="razorpay_signature" value="${response.razorpay_signature}">
        `);

        form.submit();
      },
    modal:{
      ondismiss: async ()=>{
        if(paymentFailureHandled ) return
        paymentFailureHandled =true
        isPaymentInProgress=false
      }
    },

      theme: { color: "#000000" }
    };

  const rzp = new Razorpay(options);
rzp.on('payment.failed', async function (response) {
  if(paymentFailureHandled ) return;
  paymentFailureHandled =true
  sendPaymentFailed(response?.error?.description || "Paymet failed")
});

  async function sendPaymentFailed(reason) {
    try {
    await fetch("/payment_failed",{
      method:"post",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        orderId:data.orderId,
        reason,
        selectedAddressIndex:selectedAddressIndexInput.value,
        paymentMethod: paymentMethodInput.value
      })
    });
      
    // await Swal.fire({
    //   icon: "error",
    //   title: "Payment Failed",
    //   text: reason || "The transaction could not be completed.",
    // });
      
    window.location.href = "/orderfailed"; 
      
  } catch (error) {
    isPaymentInProgress=false
    console.error("Error handling payment failure:", error);
    window.location.href = "/orderfailed";
  }
  }
    rzp.open();

  } catch (error) {
    Swal.fire("Error!", data.message||"Payment failed", "error");
  }
});

  