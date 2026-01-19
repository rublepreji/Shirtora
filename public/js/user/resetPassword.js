 const newPass = document.getElementById('new-password');
    const confirmPass = document.getElementById('confirm-password');
    const passFeedback = document.getElementById('password-feedback');
    const matchFeedback = document.getElementById('match-feedback');
    const submitBtn = document.getElementById('submit-btn');

    function validatePassword() {
        const newPassword = newPass.value;
        const confirmPassword = confirmPass.value;
        let isValid = true;
        let feedbackMessage = '';

        // 1. Complexity Check (Min 6 chars, alphabets, numbers)
        const minLength = 6;
        const hasLetter = /[a-zA-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        
        if (newPassword.length < minLength || !hasLetter || !hasNumber) {
            isValid = false;
            let checks = [];
            if (newPassword.length < minLength) checks.push("6+ chars");
            if (!hasLetter) checks.push("Letter");
            if (!hasNumber) checks.push("Number");

            feedbackMessage = `Must contain: ${checks.join(', ')}.`;
            passFeedback.className = 'text-xs mt-2 h-4 text-red-500';
        } else {
            feedbackMessage = 'Password strength acceptable.';
            passFeedback.className = 'text-xs mt-2 h-4 text-green-600';
        }


        // 2. Match Check
        let matchMessage = '';
        if (newPassword && confirmPassword) {
            if (newPassword !== confirmPassword) {
                isValid = false;
                matchMessage = 'Passwords do not match.';
                matchFeedback.className = 'text-xs mt-2 h-4 text-red-500';
            } else {
                matchMessage = 'Passwords match!';
                matchFeedback.className = 'text-xs mt-2 h-4 text-green-600';
            }
        } else {
            matchFeedback.textContent = ''; // Clear if one or both are empty
        }


        // 3. Enable/Disable Button
        if (isValid && newPassword && confirmPassword && newPassword === confirmPassword) {
            submitBtn.disabled = false;
            submitBtn.className = 'w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition duration-200 ease-in-out mt-4';
        } else {
            submitBtn.disabled = true;
            submitBtn.className = 'w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gray-400 cursor-not-allowed transition duration-200 ease-in-out mt-4';
        }
        
        passFeedback.textContent = feedbackMessage;
        if (newPassword && confirmPassword) {
            matchFeedback.textContent = matchMessage;
        } else if (confirmPassword.length > 0) {
             matchFeedback.textContent = matchMessage;
        } else {
            matchFeedback.textContent = '';
        }

    }

function togglePassword(icon, inputId) {

  const passwordId = document.getElementById(inputId)

  if (passwordId.type === "password") {
    passwordId.type = "text"
    icon.classList.replace("fa-eye-slash", "fa-eye")
  } else {
    passwordId.type = "password"
    icon.classList.replace("fa-eye", "fa-eye-slash")
  }
}


