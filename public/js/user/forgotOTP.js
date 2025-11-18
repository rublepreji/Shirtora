const TIMER_DURATION = 60; 
const timerText = document.getElementById("timer-text");
const resendButton = document.getElementById("resend-button");
const form = document.getElementById('form');
const otpInput = document.getElementById('otp');

let timerInterval;


function disableResendButton() {
  resendButton.disabled = true;
  resendButton.classList.add("bg-gray-400", "cursor-not-allowed");
  resendButton.classList.remove("bg-black", "hover:bg-gray-800");
}

function enableResendButton() {
  resendButton.disabled = false;
  resendButton.classList.remove("bg-gray-400", "cursor-not-allowed");
  resendButton.classList.add("bg-black", "hover:bg-gray-800");
}


function startCountdown(endTime) {
 
  disableResendButton();
  timerText.classList.add("text-red-600");
  timerText.classList.remove("text-black");

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const now = Date.now();
    const remainingMs = endTime - now;
    const remainingSec = Math.floor(remainingMs / 1000);

    if (remainingSec <= 0) {
      clearInterval(timerInterval);
      timerText.textContent = "Resend link is active.";
      timerText.classList.remove("text-red-600");
      timerText.classList.add("text-black");
      enableResendButton();
      localStorage.removeItem("otp_end_time");
      return;
    }

    const minutes = Math.floor(remainingSec / 60);
    const seconds = remainingSec % 60;
    timerText.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds} seconds remaining`;
  }, 1000);
}

function initializeTimer() {
  const savedEndTime = localStorage.getItem("otp_end_time");
  let endTime;

  if (savedEndTime && !isNaN(parseInt(savedEndTime))) {
    endTime = parseInt(savedEndTime, 10);
    
    if (Date.now() >= endTime) {
      localStorage.removeItem("otp_end_time");
      timerText.textContent = "Resend link is active.";
      timerText.classList.remove("text-red-600");
      timerText.classList.add("text-black");
      enableResendButton();
      return;
    }
  } else {
    
    endTime = Date.now() + TIMER_DURATION * 1000;
    localStorage.setItem("otp_end_time", endTime);
  }

  startCountdown(endTime);
}


resendButton.addEventListener("click", async () => {
  
  try {
    
    disableResendButton();

    const resp = await fetch('/resendOtps', { method: 'POST' }); 
    const result = await resp.json();

    if (!result.success) {
      Swal.fire({ icon: 'error', title: result.message || 'Failed to resend OTP' });
      enableResendButton();
      return;
    }

    // restart timer
    const newEndTime = Date.now() + TIMER_DURATION * 1000;
    localStorage.setItem("otp_end_time", newEndTime);
    startCountdown(newEndTime);

    Swal.fire({ icon: 'success', title: 'OTP Resent', text: 'Check your email.' });
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Try again later.' });
    enableResendButton();
  }
});

// form submit , validation , fetch
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const otp = otpInput.value.trim();

  if (otp === "") {
    return Swal.fire({ icon: "error", title: "OTP Required", text: "Please enter your OTP." });
  }

  if (!/^\d+$/.test(otp)) {
    return Swal.fire({ icon: "error", title: "Invalid OTP", text: "OTP must contain only numbers." });
  }

  if (otp.length !== 6) {
    return Swal.fire({ icon: "error", title: "Invalid OTP", text: "OTP must be exactly 6 digits." });
  }

  
  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.classList.add('opacity-60', 'cursor-not-allowed');

  try {
    
    const response = await fetch('/verifyPassOtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    });

    
    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      
      const text = await response.text();
      console.warn('Non-JSON response from /verifyPassOtp:', text);
      throw new Error('Unexpected server response');
    }

    if (data.success) {
        Swal.fire({
        icon: "success",
        title: "Success!",
        text: data.message||"Your action was completed successfully.",
        }).then(()=>{
            window.location.href = '/passreset';
        })
      
      
    } else {
      Swal.fire({ icon: "error", title: data.message || "Incorrect OTP", text: "Please try again." });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: "error", title: "Network Error", text: "Please try again." });
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
  }
});


window.addEventListener('DOMContentLoaded', () => {
  initializeTimer();
});