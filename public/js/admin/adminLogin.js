tailwind.config = {
    theme: {
        extend: {
            colors: {
                'zion-blue': '#8b9af9',
                'zion-dark': '#333333',
            }
        }
    }
}

let form = document.getElementById('loginForm')
let email= document.getElementById('email')
let emailError= document.getElementById('emailError')
let password= document.getElementById('password')
let passwordError= document.getElementById('passwordError')



form.addEventListener('submit',(e)=>{
    let valid=true

    emailError.style.display='none'
    passwordError.style.display='none'
    if(email.value.trim()==""){
        emailError.style.display='block'
        emailError.innerHTML='Email is required'
        valid=false
    }
    if(password.value.trim()==""){
        passwordError.style.display='block'
        passwordError.innerHTML="Password is required"
        valid=false
    }
    if(!valid){
        e.preventDefault()
    }
})


const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");

togglePassword.addEventListener("click", () => {
  if (password.type === "password") {
    password.type = "text";
    eyeIcon.classList.remove("fa-eye");
    eyeIcon.classList.add("fa-eye-slash");
  } else {
    password.type = "password";
    eyeIcon.classList.remove("fa-eye-slash");
    eyeIcon.classList.add("fa-eye");
  }
});
