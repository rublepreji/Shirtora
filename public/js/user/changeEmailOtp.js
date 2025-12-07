 document.getElementById('otpForm').addEventListener('submit', function(event) {
            

            const otpInput = document.getElementById('otp');
            const statusMessage = document.getElementById('statusMessage');
            const otp = otpInput.value.trim();

            statusMessage.textContent = '';
            if (!otp) {
                event.preventDefault();
                statusMessage.textContent = 'Please enter the OTP.';
                statusMessage.className = 'text-sm font-medium h-6 text-red-600';
                return;
            }

            if (!/^\d{6}$/.test(otp)) {
                event.preventDefault();
                statusMessage.textContent = 'OTP must be a 6-digit number.';
                statusMessage.className = 'text-sm font-medium h-6 text-red-600';
                return;
            }   
        });

    // OTP TIMER (Persistent)

    const TIMER_DURATION = 60;
    const timerDisplay = document.createElement("p");
    timerDisplay.className = "mt-4 text-sm font-medium text-red-600";
    document.querySelector(".text-center").appendChild(timerDisplay);

    const resendLink = document.querySelector("a[href='#']");

    function startTimer() {
        let expiryTime = localStorage.getItem("otpExpiry");

        if (!expiryTime) {
            expiryTime = Date.now() + TIMER_DURATION * 1000;
            localStorage.setItem("otpExpiry", expiryTime);
        }

        const countdown = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((expiryTime - now) / 1000);

            if (diff > 0) {
                timerDisplay.textContent = `Time remaining: ${diff}s`;
                resendLink.classList.add("pointer-events-none", "opacity-50");
            } else {
                clearInterval(countdown);
                timerDisplay.textContent = "OTP expired.";
                resendLink.classList.remove("pointer-events-none", "opacity-50");
                resendLink.textContent = "Resend OTP";
                localStorage.removeItem("otpExpiry"); // Timer finished
            }
        }, 1000);
    }

    startTimer();

    // ----------------------------
    // RESEND OTP CLICK HANDLER
    // ----------------------------
    resendLink.addEventListener("click", (e) => {
        e.preventDefault();

        // TODO: call your backend to resend OTP
        // fetch("/resend-otp")

        // Reset timer
        const newExpiry = Date.now() + TIMER_DURATION * 1000;
        localStorage.setItem("otpExpiry", newExpiry);
        startTimer();

        resendLink.classList.add("pointer-events-none", "opacity-50");
        resendLink.textContent = "Resending...";
        setTimeout(() => {
            resendLink.textContent = "Resend OTP";
        }, 2000);
    });
