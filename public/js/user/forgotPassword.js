const form = document.getElementById('validateEmail');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById('emailVerify');
  const error = document.getElementById('errorDisplay');
  const emailValue = emailInput.value.trim();
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  //validation

  if (emailValue === "") {
    error.classList.remove('hidden');
    error.textContent = 'Please enter your email';
    emailInput.focus();
    return;
  }

  if (!emailPattern.test(emailValue)) {
    error.classList.remove('hidden');
    error.textContent = 'Please enter a valid email address';
    emailInput.focus();
    return;
  }

  error.classList.add('hidden');
  error.textContent = "";

  // fetch request
  const response = await fetch(`/verifyemail?email=${emailValue}`, {
    method: 'POST'
  });

  const data = await response.json();

  if (!data.success) {
    Swal.fire({
      icon: "error",
      title: data.message || "Oops...",
      text: "Something went wrong!",
    });
  } else {
    console.log("Success received");
    window.location.href = '/forgototppage';
  }
});