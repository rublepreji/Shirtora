 
 const otpInput = document.getElementById("otp");
    const timerDisplay = document.getElementById("timerValue");
    const resendButton = document.getElementById("resend-button");

    let timer = 60;
    let timerInterval;

    const storedTime = localStorage.getItem("otpExpireTime");
    const now = Date.now();

    if (storedTime && now < parseInt(storedTime)) {
      timer = Math.floor((parseInt(storedTime) - now) / 1000);
    } else {
      localStorage.setItem("otpExpireTime", Date.now() + 60000);
    }

    otpInput.focus();

    // 🕒 Start timer
    function startTimer() {
      resendButton.disabled = true;
      updateTimerDisplay();

      timerInterval = setInterval(() => {
        timer--;
        updateTimerDisplay();

        if (timer <= 0) {
          clearInterval(timerInterval);
          timerDisplay.textContent = "Expired";
          resendButton.disabled = false;
          localStorage.removeItem("otpExpireTime");
          Swal.fire({
            icon: "info",
            title: "OTP Expired",
            text: "You can now resend a new OTP.",
            confirmButtonColor: "#000",
          });
        }
      }, 1000);
    }

    function updateTimerDisplay() {
      if (timer > 0) {
        const min = Math.floor(timer / 60);
        const sec = timer % 60;
        timerDisplay.textContent = `${min}:${sec < 10 ? "0" + sec : sec}`;
      }
    }

    startTimer();

    // 📨 Verify OTP
    function validateOTPForm() {
      const otpVal = otpInput.value.trim();

      if (!otpVal) {
        Swal.fire({
          icon: "warning",
          title: "Please enter your OTP",
        });
        return false;
      }

      $.ajax({
        type: "POST",
        url: "/verifyOtp",
        contentType: "application/json",
        data: JSON.stringify({ otp: otpVal }),
        success: function (response) {
          if (response.success) {
            Swal.fire({
              title: "OTP Verified Successfully",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            }).then(() => {
              localStorage.removeItem("otpExpireTime");
              window.location.href = response.redirectUrl;
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: response.message,
            });
          }
        },
        error: function () {
          Swal.fire({
            icon: "error",
            title: "Please try again",
            text: "An error occurred during verification.",
          });
        },
      });

      return false;
    }

    // 🔁 Resend OTP
    resendButton.addEventListener("click", () => {
      resendButton.disabled = true;
      timer = 60;
      localStorage.setItem("otpExpireTime", Date.now() + 60000);
      startTimer();

      $.ajax({
        type: "POST",
        url: "/resendOtp",
        success: function () {
          Swal.fire({
            icon: "info",
            title: "OTP Resent Successfully",
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: function () {
          Swal.fire({
            icon: "error",
            title: "Failed to resend OTP",
            text: "Please try again later.",
          });
        },
      });
    });