 function validateSmoothForm() {
            const email = document.getElementById('new-email');
            const confirm = document.getElementById('confirm-email');
            const errorText = document.getElementById('error-text');

            if (email.value !== confirm.value) {
                // Show error
                errorText.classList.remove('hidden');
                // Small delay to allow the display property to apply before changing opacity for fade effect
                setTimeout(() => errorText.classList.remove('opacity-0'), 10);
                
                // Add red border to confirm input
                confirm.classList.add('border-red-500', 'text-red-900', 'focus:border-red-500', 'focus:ring-red-100');
                confirm.classList.remove('border-gray-200', 'focus:border-black');
                
                return false;
            } else {
                // Reset styles if correct
                errorText.classList.add('opacity-0');
                errorText.classList.add('hidden');
                return true;
            }
        }
        const flashError="<%=messages.error || ''%>"
        if(flashError){
            Swal.fire({
            icon: "error",
            title: "Error",
            text: flashError,
        });
        }