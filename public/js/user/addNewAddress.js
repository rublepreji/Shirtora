document.addEventListener("DOMContentLoaded", function () {

  const form = document.querySelector("form");

  function showError(input, message) {
    let error = input.parentElement.querySelector(".error-text");
    if (!error) {
      error = document.createElement("p");
      error.className = "error-text text-red-600 text-sm mt-1";
      input.parentElement.appendChild(error);
    }
    error.textContent = message;
    input.classList.add("ring-2", "ring-red-500");
  }

  function clearError(input) {
    let error = input.parentElement.querySelector(".error-text");
    if (error) {
      error.textContent = "";
    }
    input.classList.remove("ring-2", "ring-red-500");
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    return /^[0-9]{10}$/.test(phone);
  }

  function validatePincode(pin) {
    return /^[0-9]{6}$/.test(pin);
  }

  // ---------------- SUBMIT VALIDATION ----------------
  form.addEventListener("submit", function (event) {
    let isValid = true;

    const firstName = document.getElementById("first-name");
    const lastName = document.getElementById("last-name");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const address = document.getElementById("address-line");
    const district = document.getElementById("district");
    const state = document.getElementById("state");
    const pincode = document.getElementById("pin-code");

    if (firstName.value.trim() === "") {
      showError(firstName, "First Name is required");
      isValid = false;
    } else clearError(firstName);

    if (lastName.value.trim() === "") {
      showError(lastName, "Last Name is required");
      isValid = false;
    } else clearError(lastName);

    if (email.value.trim() === "" || !validateEmail(email.value)) {
      showError(email, "Enter a valid email address");
      isValid = false;
    } else clearError(email);

    if (!validatePhone(phone.value)) {
      showError(phone, "Enter a valid 10-digit phone number");
      isValid = false;
    } else clearError(phone);

    if (address.value.trim() === "") {
      showError(address, "Address field cannot be empty");
      isValid = false;
    } else clearError(address);

    if (district.value.trim() === "") {
      showError(district, "District/Town is required");
      isValid = false;
    } else clearError(district);

    if (state.value.trim() === "") {
      showError(state, "State is required");
      isValid = false;
    } else clearError(state);

    if (!validatePincode(pincode.value)) {
      showError(pincode, "Pin Code must be a 6-digit number");
      isValid = false;
    } else clearError(pincode);

    if (!isValid) {
      event.preventDefault();
    }
  });

  // ---------------- LIVE VALIDATION ----------------

  function liveValidate(input, validatorFn, message) {
    input.addEventListener("input", () => {
      if (!validatorFn(input.value)) {
        showError(input, message);
      } else {
        clearError(input);
      }
    });
  }

  liveValidate(
    document.getElementById("first-name"),
    v => v.trim() !== "",
    "First Name is required"
  );

  liveValidate(
    document.getElementById("last-name"),
    v => v.trim() !== "",
    "Last Name is required"
  );

  liveValidate(
    document.getElementById("email"),
    v => validateEmail(v),
    "Enter a valid email address"
  );

  liveValidate(
    document.getElementById("phone"),
    v => validatePhone(v),
    "Enter a valid 10-digit phone number"
  );

  liveValidate(
    document.getElementById("address-line"),
    v => v.trim() !== "",
    "Address field cannot be empty"
  );

  liveValidate(
    document.getElementById("district"),
    v => v.trim() !== "",
    "District/Town is required"
  );

  liveValidate(
    document.getElementById("state"),
    v => v.trim() !== "",
    "State is required"
  );

  liveValidate(
    document.getElementById("pin-code"),
    v => validatePincode(v),
    "Pin Code must be a 6-digit number"
  );

});
