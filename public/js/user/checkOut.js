let isPaymentInProgress = false;
let paymentFailureHandled = false
let paymentSuccess = false
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
      paymentMethodInput.value = radio.value;
    }
    radio.addEventListener('change', () => {
      paymentMethodInput.value = radio.value;
    });
  });

  const placeOrderBtn = document.getElementById("placeOrderTrigger");

  placeOrderBtn.addEventListener('click', async () => {
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
  if (paymentMethodInput.value === "COD") {
    document.getElementById('checkoutForm').submit();
    return;
  }

  if(paymentMethodInput.value === "WALLET"){
    return payUsingWallet()
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
        paymentSuccess=true
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
        if(paymentSuccess) return 
        if(paymentFailureHandled ) return
        paymentFailureHandled =true
        isPaymentInProgress=false
    Swal.fire({
      icon:"info",
      title:"Payment Cancelled",
      text:"You closed the payment window",
    })
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
    const res=await fetch("/payment_failed",{
      method:"post",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        orderId:data.orderId,
        reason,
        selectedAddressIndex:selectedAddressIndexInput.value,
        paymentMethod: paymentMethodInput.value
      })
    });
      
    const result= await res.json()
    // await Swal.fire({
    //   icon: "error",
    //   title: "Payment Failed",
    //   text: reason || "The transaction could not be completed.",
    // });
      
    window.location.href = `/orderfailed/${result.orderId}`; 
      
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

const applyBtn = document.getElementById("applyCouponBtn");
const couponInput = document.getElementById("couponCode");
const couponMsg = document.getElementById("couponMessage");
const grandTotalDisplay = document.getElementById("grandTotalDisplay");
const removeBtn = document.getElementById("removeCouponBtn");

applyBtn.addEventListener("click", async () => {

  const couponCode = couponInput.value.trim();

  if (!couponCode) {
    Swal.fire("Warning!", "Please enter a coupon code.", "warning");
    return;
  }

  try {

    const res = await fetch("/applycoupon", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ couponCode })
    });

    const data = await res.json();

    couponMsg.classList.remove("hidden");

    if (!data.success) {
      couponMsg.innerHTML = `<span class="text-red-500">${data.message}</span>`;
      return;
    }

    couponMsg.innerHTML = `<span class="text-green-600">${data.message}</span>`;

    grandTotalDisplay.innerText = "₹" + data.grandTotal.toLocaleString();

    toggleCOD(data.grandTotal);
  } catch (err) {
    Swal.fire("Error!", "Something went wrong.", "error");
  }
});

async function payUsingWallet(){

  try{

    const res = await fetch("/wallet/pay",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        selectedAddressIndex: selectedAddressIndexInput.value
      })
    });

    const data = await res.json();

    if(!data.success){

      isPaymentInProgress=false
      placeOrderBtn.disabled=false

      return Swal.fire({
        icon:"error",
        title:"Wallet Payment Failed",
        text:data.message || "Insufficient Wallet Balance"
      });
    }

    // SUCCESS 
    Swal.fire({
      icon:"success",
      title:"Order Placed Successfully",
      timer:2000,
      showConfirmButton:false
    }).then(()=>{
      window.location.href = `/ordersuccess/${data.message.orderId}`;
    });

  }catch(err){

    isPaymentInProgress=false
    placeOrderBtn.disabled=false

    Swal.fire("Error!","Something went wrong with wallet payment.","error");
  }
}
  // DOM Elements for Coupon
  const clearCouponBtn = document.getElementById('clearCouponBtn');

  // Toggle Clear Button visibility on input
  couponInput.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
      clearCouponBtn.classList.remove('hidden');
    } else {
      clearCouponBtn.classList.add('hidden');
    }
  });

  clearCouponBtn.addEventListener('click', async function() {
    try {
        const response = await fetch('/removeCoupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({couponCode})
        });

        const result = await response.json();

        if (response.ok) {
            couponInput.value = '';
            this.classList.add('hidden');

            if (result.grandTotal) {
                document.getElementById('grandTotalDisplay').innerText = `₹${result.grandTotal.toLocaleString()}`;
                toggleCOD(result.grandTotal);
            }

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Coupon Removed',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            console.error('Failed to remove coupon:', result.message);
        }
    } catch (error) {
        console.error('Error removing coupon:', error);
    }
  });

  function toggleCouponDrawer() {
    const drawer = document.getElementById('couponDrawer');
    const chevron = document.getElementById('couponChevron');
    
    drawer.classList.toggle('open');
    
    if (drawer.classList.contains('open')) {
      chevron.style.transform = 'rotate(180deg)';
    } else {
      chevron.style.transform = 'rotate(0deg)';
    }
  }

  function copyAndFill(code) {    
    couponInput.value=code
    couponInput.dispatchEvent(new Event('input'));
    applyBtn.click()
    
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Code Copied!',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true
    });
  }

  // SweetAlert Confirmation before placing order
  document.getElementById('placeOrderTrigger').addEventListener('click', function() {
    // Swal.fire({
    //   title: 'Confirm Order?',
    //   text: "Proceed with the selected items and address?",
    //   icon: 'question',
    //   showCancelButton: true,
    //   confirmButtonColor: '#000000',
    //   cancelButtonColor: '#d33',
    //   confirmButtonText: 'Yes, Place Order',
    //   cancelButtonText: 'Wait, go back'
    // }).then((result) => {
    //   if (result.isConfirmed) {
    //     handleOrderSubmission();
    //   }
    // });
  });



const codRadio = document.querySelector('input[name="payment"][value="COD"]');
const codLabel = codRadio.closest("label");

function toggleCOD(grandTotal){

  if(grandTotal > 1000){

    codRadio.disabled = true;
    codRadio.checked = false;
    codLabel.classList.add("opacity-50","pointer-events-none");

    Swal.fire({
      toast:true,
      position:"top-end",
      icon:"info",
      title:"COD disabled for orders above ₹1000",
      timer:2000,
      showConfirmButton:false
    })

  }else{

    codRadio.disabled = false;
    codLabel.classList.remove("opacity-50","pointer-events-none");
  }
}

window.addEventListener("DOMContentLoaded",()=>{

  const amountText = grandTotalDisplay.innerText;
  const amount = Number(amountText.replace(/[₹,]/g,""));

  toggleCOD(amount);
});
