 const loginForm= document.getElementById('loginForm')
        const email= document.getElementById('email')
        const password= document.getElementById('password')
        const emailError= document.getElementById('emailError')
        const passwordError= document.getElementById('passwordError')

        function verifyEmail(){
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const emailVal= email.value
            if(emailVal.trim()==""){
                emailError.style.display='block'
                emailError.innerHTML='Email is required'
                return false
            }else if(!emailPattern.test(emailVal)){
                emailError.style.display='block'
                emailError.innerHTML='Email format is not proper'
                return false
            }
            return true
        }
        function verifyPassword(){
            if(password.value.trim()==""){
                passwordError.style.display='block'
                passwordError.innerHTML='Password is required'
                return false
            }
            return true
        }
        loginForm.addEventListener('submit',(e)=>{
            emailError.style.display='none'
            passwordError.style.display='none'

            const verifedEmail= verifyEmail()
            const verifedPassword= verifyPassword()
            const valid= verifedEmail && verifedPassword
            if(!valid){
                e.preventDefault()
            }
        })