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

  document.querySelector('.place-order-btn').addEventListener('click', () => {
    if (!selectedAddressIndexInput.value) {
        function showSimpleSwal() {
        Swal.fire({
          title: 'Warning!',                 
          text: 'Please select a delivery address.', 
          icon: 'warning',                    
          confirmButtonText: 'OK!'         
        });
        return;
      }     
    }
    if (!paymentMethodInput.value) {
        Swal.fire({
          title: 'Warning!',                 
          text: 'Please select a payment method.', 
          icon: 'warning',                    
          confirmButtonText: 'OK!'         
        });
        return;
    }
     if(paymentMethodInput.value!=="Cash on Delivery"){
       Swal.fire({
          title: 'Warning!',                 
          text: 'Payment method is not implemented.', 
          icon: 'warning',                    
          confirmButtonText: 'OK!'         
        });
        return;
    }

    document.getElementById('checkoutForm').submit();
  });

  